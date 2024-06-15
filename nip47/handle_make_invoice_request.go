package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandleMakeInvoiceEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	makeInvoiceParams := &MakeInvoiceParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, makeInvoiceParams)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	resp = svc.checkPermission(nip47Request, requestEvent.NostrId, app, 0)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
		"amount":              makeInvoiceParams.Amount,
		"description":         makeInvoiceParams.Description,
		"descriptionHash":     makeInvoiceParams.DescriptionHash,
		"expiry":              makeInvoiceParams.Expiry,
	}).Info("Making invoice")

	expiry := makeInvoiceParams.Expiry
	if expiry == 0 {
		expiry = 86400
	}

	transaction, err := svc.lnClient.MakeInvoice(ctx, makeInvoiceParams.Amount, makeInvoiceParams.Description, makeInvoiceParams.DescriptionHash, expiry)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
			"amount":              makeInvoiceParams.Amount,
			"description":         makeInvoiceParams.Description,
			"descriptionHash":     makeInvoiceParams.DescriptionHash,
			"expiry":              makeInvoiceParams.Expiry,
		}).Infof("Failed to make invoice: %v", err)

		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := &MakeInvoiceResponse{
		Transaction: *transaction,
	}

	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
