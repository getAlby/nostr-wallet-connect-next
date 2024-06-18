package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type payKeysendParams struct {
	Amount     uint64               `json:"amount"`
	Pubkey     string               `json:"pubkey"`
	Preimage   string               `json:"preimage"`
	TLVRecords []lnclient.TLVRecord `json:"tlv_records"`
}

func (svc *controllersService) HandlePayKeysendEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, publishResponse publishFunc, tags nostr.Tags) {
	payKeysendParams := &payKeysendParams{}
	resp := decodeRequest(nip47Request, payKeysendParams)
	if resp != nil {
		publishResponse(resp, tags)
		return
	}
	svc.payKeysend(ctx, payKeysendParams, nip47Request, requestEventId, app, checkPermission, publishResponse, tags)
}

func (svc *controllersService) payKeysend(ctx context.Context, payKeysendParams *payKeysendParams, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, publishResponse publishFunc, tags nostr.Tags) {
	resp := checkPermission(payKeysendParams.Amount)
	if resp != nil {
		publishResponse(resp, tags)
		return
	}

	payment := db.Payment{App: *app, RequestEventId: requestEventId, Amount: uint(payKeysendParams.Amount / 1000)}
	err := svc.db.Create(&payment).Error
	if err != nil {
		publishResponse(&models.Response{
			ResultType: nip47Request.Method,
			Error: &models.Error{
				Code:    models.ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, tags)
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"request_event_id": requestEventId,
		"appId":            app.ID,
		"senderPubkey":     payKeysendParams.Pubkey,
	}).Info("Sending keysend payment")

	preimage, err := svc.lnClient.SendKeysend(ctx, payKeysendParams.Amount, payKeysendParams.Pubkey, payKeysendParams.Preimage, payKeysendParams.TLVRecords)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
			"appId":            app.ID,
			"recipientPubkey":  payKeysendParams.Pubkey,
		}).Infof("Failed to send keysend payment: %v", err)
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_payment_failed",
			Properties: map[string]interface{}{
				"error":   err.Error(),
				"keysend": true,
				"amount":  payKeysendParams.Amount / 1000,
			},
		})
		publishResponse(&models.Response{
			ResultType: nip47Request.Method,
			Error: &models.Error{
				Code:    models.ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, tags)
		return
	}
	payment.Preimage = &preimage
	svc.db.Save(&payment)
	svc.eventPublisher.Publish(&events.Event{
		Event: "nwc_payment_succeeded",
		Properties: map[string]interface{}{
			"keysend": true,
			"amount":  payKeysendParams.Amount / 1000,
		},
	})
	publishResponse(&models.Response{
		ResultType: nip47Request.Method,
		Result: PayResponse{
			Preimage: preimage,
		},
	}, tags)
}
