package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type signMessageParams struct {
	Message string `json:"message"`
}

type signMessageResponse struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}

func (svc *controllersService) HandleSignMessageEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
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

	signParams := &signMessageParams{}
	resp = decodeRequest(nip47Request, signParams)
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
	}).Info("Signing message")

	signature, err := svc.lnClient.SignMessage(ctx, signParams.Message)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
		}).WithError(err).Error("Failed to sign message")
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

	responsePayload := signMessageResponse{
		Message:   signParams.Message,
		Signature: signature,
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
