package controllers

import (
	"context"
	"fmt"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

type payInvoiceParams struct {
	Invoice string `json:"invoice"`
}

func (svc *controllersService) HandlePayInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
	tags := nostr.Tags{}
	payParams := &payInvoiceParams{}
	resp := decodeRequest(nip47Request, payParams)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &tags,
		}
		close(respChan)
		return
	}

	bolt11 := payParams.Invoice
	// Convert invoice to lowercase string
	bolt11 = strings.ToLower(bolt11)
	paymentRequest, err := decodepay.Decodepay(bolt11)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
			"app_id":           app.ID,
			"bolt11":           bolt11,
		}).WithError(err).Error("Failed to decode bolt11 invoice")

		respChan <- &models.ControllerResponse{
			Response: &models.Response{
				ResultType: nip47Request.Method,
				Error: &models.Error{
					Code:    models.ERROR_INTERNAL,
					Message: fmt.Sprintf("Failed to decode bolt11 invoice: %s", err.Error()),
				},
			},
			Tags: &tags,
		}
		close(respChan)
		return
	}

	svc.pay(ctx, bolt11, &paymentRequest, nip47Request, requestEventId, app, checkPermission, respChan, tags)
}

func (svc *controllersService) pay(ctx context.Context, bolt11 string, paymentRequest *decodepay.Bolt11, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, respChan models.ResponseChannel, tags nostr.Tags) {
	resp := checkPermission(uint64(paymentRequest.MSatoshi))
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &tags,
		}
		return
	}

	payment := db.Payment{App: *app, RequestEventId: requestEventId, PaymentRequest: bolt11, Amount: uint(paymentRequest.MSatoshi / 1000)}
	err := svc.db.Create(&payment).Error
	if err != nil {
		respChan <- &models.ControllerResponse{
			Response: &models.Response{
				ResultType: nip47Request.Method,
				Error: &models.Error{
					Code:    models.ERROR_INTERNAL,
					Message: err.Error(),
				},
			},
			Tags: &tags,
		}
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"request_event_id": requestEventId,
		"app_id":           app.ID,
		"bolt11":           bolt11,
	}).Info("Sending payment")

	response, err := svc.lnClient.SendPaymentSync(ctx, bolt11)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
			"app_id":           app.ID,
			"bolt11":           bolt11,
		}).Infof("Failed to send payment: %v", err)
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_payment_failed",
			Properties: map[string]interface{}{
				"error":   err.Error(),
				"invoice": bolt11,
				"amount":  paymentRequest.MSatoshi / 1000,
			},
		})
		respChan <- &models.ControllerResponse{
			Response: &models.Response{
				ResultType: nip47Request.Method,
				Error: &models.Error{
					Code:    models.ERROR_INTERNAL,
					Message: err.Error(),
				},
			},
			Tags: &tags,
		}
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

	respChan <- &models.ControllerResponse{
		Response: &models.Response{
			ResultType: nip47Request.Method,
			Result: PayResponse{
				Preimage: response.Preimage,
				FeesPaid: response.Fee,
			},
		},
		Tags: &tags,
	}
}
