package nip47

import (
	"context"
	"fmt"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/nbd-wtf/go-nostr"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandlePayInvoiceEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	payParams := &PayParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, payParams)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	bolt11 := payParams.Invoice
	// Convert invoice to lowercase string
	bolt11 = strings.ToLower(bolt11)
	paymentRequest, err := decodepay.Decodepay(bolt11)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
			"bolt11":              bolt11,
		}).Errorf("Failed to decode bolt11 invoice: %v", err)

		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: fmt.Sprintf("Failed to decode bolt11 invoice: %s", err.Error()),
			},
		}, nostr.Tags{})
		return
	}

	resp = svc.checkPermission(nip47Request, requestEvent.NostrId, app, paymentRequest.MSatoshi)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	payment := db.Payment{App: *app, RequestEvent: *requestEvent, PaymentRequest: bolt11, Amount: uint(paymentRequest.MSatoshi / 1000)}
	err = svc.db.Create(&payment).Error
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
		"bolt11":              bolt11,
	}).Info("Sending payment")

	response, err := svc.lnClient.SendPaymentSync(ctx, bolt11)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
			"bolt11":              bolt11,
		}).Infof("Failed to send payment: %v", err)
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_payment_failed",
			Properties: map[string]interface{}{
				// "error":   fmt.Sprintf("%v", err),
				"invoice": bolt11,
				"amount":  paymentRequest.MSatoshi / 1000,
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
	payment.Preimage = &response.Preimage
	// TODO: save payment fee
	svc.db.Save(&payment)

	svc.eventPublisher.Publish(&events.Event{
		Event: "nwc_payment_succeeded",
		Properties: map[string]interface{}{
			"bolt11": bolt11,
			"amount": paymentRequest.MSatoshi / 1000,
		},
	})

	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result: PayResponse{
			Preimage: response.Preimage,
			FeesPaid: response.Fee,
		},
	}, nostr.Tags{})
}
