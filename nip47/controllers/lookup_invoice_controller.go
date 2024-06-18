package controllers

import (
	"context"
	"fmt"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

type lookupInvoiceParams struct {
	Invoice     string `json:"invoice"`
	PaymentHash string `json:"payment_hash"`
}

type LookupInvoiceResponse struct {
	models.Transaction
}

func (svc *controllersService) HandleLookupInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
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

	lookupInvoiceParams := &lookupInvoiceParams{}
	resp = decodeRequest(nip47Request, lookupInvoiceParams)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &nostr.Tags{},
		}
		close(respChan)
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"invoice":          lookupInvoiceParams.Invoice,
		"payment_hash":     lookupInvoiceParams.PaymentHash,
		"request_event_id": requestEventId,
	}).Info("Looking up invoice")

	paymentHash := lookupInvoiceParams.PaymentHash

	if paymentHash == "" {
		paymentRequest, err := decodepay.Decodepay(strings.ToLower(lookupInvoiceParams.Invoice))
		if err != nil {
			logger.Logger.WithFields(logrus.Fields{
				"request_event_id": requestEventId,
				"invoice":          lookupInvoiceParams.Invoice,
			}).WithError(err).Error("Failed to decode bolt11 invoice")

			respChan <- &models.ControllerResponse{
				Response: &models.Response{
					ResultType: nip47Request.Method,
					Error: &models.Error{
						Code:    models.ERROR_INTERNAL,
						Message: fmt.Sprintf("Failed to decode bolt11 invoice: %s", err.Error()),
					},
				},
				Tags: &nostr.Tags{},
			}
			close(respChan)
			return
		}
		paymentHash = paymentRequest.PaymentHash
	}

	transaction, err := svc.lnClient.LookupInvoice(ctx, paymentHash)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
			"invoice":          lookupInvoiceParams.Invoice,
			"payment_hash":     paymentHash,
		}).Infof("Failed to lookup invoice: %v", err)

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

	responsePayload := &LookupInvoiceResponse{
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
