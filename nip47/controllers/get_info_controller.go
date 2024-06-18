package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type GetInfoResponse struct {
	Alias       string   `json:"alias"`
	Color       string   `json:"color"`
	Pubkey      string   `json:"pubkey"`
	Network     string   `json:"network"`
	BlockHeight uint32   `json:"block_height"`
	BlockHash   string   `json:"block_hash"`
	Methods     []string `json:"methods"`
}

func (svc *controllersService) HandleGetInfoEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
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

	logger.Logger.WithFields(logrus.Fields{
		"request_event_id": requestEventId,
	}).Info("Getting info")

	info, err := svc.lnClient.GetInfo(ctx)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
		}).Infof("Failed to fetch node info: %v", err)

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

	network := info.Network
	// Some implementations return "bitcoin" while NIP47 expects "mainnet"
	if network == "bitcoin" {
		network = "mainnet"
	}

	responsePayload := &GetInfoResponse{
		Alias:       info.Alias,
		Color:       info.Color,
		Pubkey:      info.Pubkey,
		Network:     network,
		BlockHeight: info.BlockHeight,
		BlockHash:   info.BlockHash,
		Methods:     svc.GetPermittedMethods(app),
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
