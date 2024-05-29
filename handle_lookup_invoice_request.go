package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/nbd-wtf/go-nostr"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

func (svc *Service) HandleLookupInvoiceEvent(ctx context.Context, nip47Request *nip47.Nip47Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*nip47.Nip47Response, nostr.Tags)) {

	lookupInvoiceParams := &nip47.Nip47LookupInvoiceParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, lookupInvoiceParams)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	resp = svc.checkPermission(nip47Request, requestEvent.NostrId, app, 0)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	svc.Logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
		"invoice":             lookupInvoiceParams.Invoice,
		"paymentHash":         lookupInvoiceParams.PaymentHash,
	}).Info("Looking up invoice")

	paymentHash := lookupInvoiceParams.PaymentHash

	if paymentHash == "" {
		paymentRequest, err := decodepay.Decodepay(strings.ToLower(lookupInvoiceParams.Invoice))
		if err != nil {
			svc.Logger.WithFields(logrus.Fields{
				"requestEventNostrId": requestEvent.NostrId,
				"appId":               app.ID,
				"invoice":             lookupInvoiceParams.Invoice,
			}).Errorf("Failed to decode bolt11 invoice: %v", err)

			publishResponse(&nip47.Nip47Response{
				ResultType: nip47Request.Method,
				Error: &nip47.Nip47Error{
					Code:    nip47.ERROR_INTERNAL,
					Message: fmt.Sprintf("Failed to decode bolt11 invoice: %s", err.Error()),
				},
			}, nostr.Tags{})
			return
		}
		paymentHash = paymentRequest.PaymentHash
	}

	transaction, err := svc.lnClient.LookupInvoice(ctx, paymentHash)
	if err != nil {
		svc.Logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
			"invoice":             lookupInvoiceParams.Invoice,
			"paymentHash":         lookupInvoiceParams.PaymentHash,
		}).Infof("Failed to lookup invoice: %v", err)

		publishResponse(&nip47.Nip47Response{
			ResultType: nip47Request.Method,
			Error: &nip47.Nip47Error{
				Code:    nip47.ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := &nip47.Nip47LookupInvoiceResponse{
		Nip47Transaction: *transaction,
	}

	publishResponse(&nip47.Nip47Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
