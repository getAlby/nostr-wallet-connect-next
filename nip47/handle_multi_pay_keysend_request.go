package nip47

import (
	"context"
	"sync"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandleMultiPayKeysendEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	multiPayParams := &MultiPayKeysendParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, multiPayParams)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	for _, keysendInfo := range multiPayParams.Keysends {
		wg.Add(1)
		go func(keysendInfo MultiPayKeysendElement) {
			defer wg.Done()

			keysendDTagValue := keysendInfo.Id
			if keysendDTagValue == "" {
				keysendDTagValue = keysendInfo.Pubkey
			}
			dTag := []string{"d", keysendDTagValue}

			resp := svc.checkPermission(nip47Request, requestEvent.NostrId, app, keysendInfo.Amount)
			if resp != nil {
				publishResponse(resp, nostr.Tags{dTag})
				return
			}

			payment := db.Payment{App: *app, RequestEvent: *requestEvent, Amount: uint(keysendInfo.Amount / 1000)}
			mu.Lock()
			insertPaymentResult := svc.db.Create(&payment)
			mu.Unlock()
			if insertPaymentResult.Error != nil {
				logger.Logger.WithFields(logrus.Fields{
					"requestEventNostrId": requestEvent.NostrId,
					"recipientPubkey":     keysendInfo.Pubkey,
					"keysendId":           keysendInfo.Id,
				}).Errorf("Failed to process event: %v", insertPaymentResult.Error)
				return
			}

			logger.Logger.WithFields(logrus.Fields{
				"requestEventNostrId": requestEvent.NostrId,
				"appId":               app.ID,
				"recipientPubkey":     keysendInfo.Pubkey,
			}).Info("Sending payment")

			preimage, err := svc.lnClient.SendKeysend(ctx, keysendInfo.Amount, keysendInfo.Pubkey, keysendInfo.Preimage, keysendInfo.TLVRecords)
			if err != nil {
				logger.Logger.WithFields(logrus.Fields{
					"requestEventNostrId": requestEvent.NostrId,
					"appId":               app.ID,
					"recipientPubkey":     keysendInfo.Pubkey,
				}).Infof("Failed to send payment: %v", err)
				svc.eventPublisher.Publish(&events.Event{
					Event: "nwc_payment_failed",
					Properties: map[string]interface{}{
						"error":   err.Error(),
						"keysend": true,
						"multi":   true,
						"amount":  keysendInfo.Amount / 1000,
					},
				})

				publishResponse(&Response{
					ResultType: nip47Request.Method,
					Error: &Error{
						Code:    ERROR_INTERNAL,
						Message: err.Error(),
					},
				}, nostr.Tags{dTag})
				return
			}
			payment.Preimage = &preimage
			mu.Lock()
			svc.db.Save(&payment)
			mu.Unlock()
			svc.eventPublisher.Publish(&events.Event{
				Event: "nwc_payment_succeeded",
				Properties: map[string]interface{}{
					"keysend": true,
					"multi":   true,
					"amount":  keysendInfo.Amount / 1000,
				},
			})
			publishResponse(&Response{
				ResultType: nip47Request.Method,
				Result: PayResponse{
					Preimage: preimage,
				},
			}, nostr.Tags{dTag})
		}(keysendInfo)
	}

	wg.Wait()
}
