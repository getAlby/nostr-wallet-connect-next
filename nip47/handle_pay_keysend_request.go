package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandlePayKeysendEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	payParams := &KeysendParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, payParams)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	resp = svc.checkPermission(nip47Request, requestEvent.NostrId, app, payParams.Amount)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	payment := db.Payment{App: *app, RequestEvent: *requestEvent, Amount: uint(payParams.Amount / 1000)}
	err := svc.db.Create(&payment).Error
	if err != nil {
		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	svc.logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
		"senderPubkey":        payParams.Pubkey,
	}).Info("Sending payment")

	preimage, err := svc.lnClient.SendKeysend(ctx, payParams.Amount, payParams.Pubkey, payParams.Preimage, payParams.TLVRecords)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
			"recipientPubkey":     payParams.Pubkey,
		}).Infof("Failed to send payment: %v", err)
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_payment_failed",
			Properties: map[string]interface{}{
				"error":   err.Error(),
				"keysend": true,
				"amount":  payParams.Amount / 1000,
			},
		})
		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}
	payment.Preimage = &preimage
	svc.db.Save(&payment)
	svc.eventPublisher.Publish(&events.Event{
		Event: "nwc_payment_succeeded",
		Properties: map[string]interface{}{
			"keysend": true,
			"amount":  payParams.Amount / 1000,
		},
	})
	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result: PayResponse{
			Preimage: preimage,
		},
	}, nostr.Tags{})
}
