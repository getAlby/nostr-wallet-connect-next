package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type makeInvoiceParams struct {
	Amount          int64  `json:"amount"`
	Description     string `json:"description"`
	DescriptionHash string `json:"description_hash"`
	Expiry          int64  `json:"expiry"`
}
type MakeInvoiceResponse struct {
	models.Transaction
}

func (svc *controllersService) HandleMakeInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
	// basic permissions check
	resp := checkPermission(0)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &nostr.Tags{},
		}
		close(respChan)
		return
	}

	makeInvoiceParams := &makeInvoiceParams{}
	resp = decodeRequest(nip47Request, makeInvoiceParams)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &nostr.Tags{},
		}
		close(respChan)
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"request_event_id": requestEventId,
		"amount":           makeInvoiceParams.Amount,
		"description":      makeInvoiceParams.Description,
		"description_hash": makeInvoiceParams.DescriptionHash,
		"expiry":           makeInvoiceParams.Expiry,
	}).Info("Making invoice")

	expiry := makeInvoiceParams.Expiry
	if expiry == 0 {
		expiry = 86400
	}

	transaction, err := svc.lnClient.MakeInvoice(ctx, makeInvoiceParams.Amount, makeInvoiceParams.Description, makeInvoiceParams.DescriptionHash, expiry)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
			"amount":           makeInvoiceParams.Amount,
			"description":      makeInvoiceParams.Description,
			"descriptionHash":  makeInvoiceParams.DescriptionHash,
			"expiry":           makeInvoiceParams.Expiry,
		}).Infof("Failed to make invoice: %v", err)

		respChan <- &models.ControllerResponse{
			Response: &models.Response{
				ResultType: nip47Request.Method,
				Error: &models.Error{
					Code:    models.ERROR_INTERNAL,
					Message: err.Error(),
				},
			},
			Tags: &nostr.Tags{},
		}
		close(respChan)
		return
	}

	responsePayload := &MakeInvoiceResponse{
		Transaction: *transaction,
	}

	respChan <- &models.ControllerResponse{
		Response: &models.Response{
			ResultType: nip47Request.Method,
			Result:     responsePayload,
		},
		Tags: &nostr.Tags{},
	}
	close(respChan)
}
