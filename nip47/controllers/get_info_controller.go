package controllers

import (
	"context"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/getAlby/nostr-wallet-connect/nip47/notifications"
	permissions "github.com/getAlby/nostr-wallet-connect/nip47/permissions"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type getInfoResponse struct {
	Alias         string   `json:"alias"`
	Color         string   `json:"color"`
	Pubkey        string   `json:"pubkey"`
	Network       string   `json:"network"`
	BlockHeight   uint32   `json:"block_height"`
	BlockHash     string   `json:"block_hash"`
	Methods       []string `json:"methods"`
	Notifications []string `json:"notifications"`
}

type getInfoController struct {
	lnClient           lnclient.LNClient
	permissionsService permissions.PermissionsService
}

func NewGetInfoController(permissionsService permissions.PermissionsService, lnClient lnclient.LNClient) *getInfoController {
	return &getInfoController{
		permissionsService: permissionsService,
		lnClient:           lnClient,
	}
}

func (controller *getInfoController) HandleGetInfoEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, publishResponse publishFunc) {
	supportedNotifications := []string{}
	if controller.permissionsService.PermitsNotifications(app) {
		// TODO: this needs to be LNClient-specific
		supportedNotifications = strings.Split(notifications.NOTIFICATION_TYPES, " ")
	}

	responsePayload := &getInfoResponse{
		Methods:       controller.permissionsService.GetPermittedMethods(app),
		Notifications: supportedNotifications,
	}

	// basic permissions check
	hasPermission, _, _ := controller.permissionsService.HasPermission(app, nip47Request.Method, 0)
	if hasPermission {
		logger.Logger.WithFields(logrus.Fields{
			"request_event_id": requestEventId,
		}).Info("Getting info")

		info, err := controller.lnClient.GetInfo(ctx)
		if err != nil {
			logger.Logger.WithFields(logrus.Fields{
				"request_event_id": requestEventId,
			}).Infof("Failed to fetch node info: %v", err)

			publishResponse(&models.Response{
				ResultType: nip47Request.Method,
				Error: &models.Error{
					Code:    models.ERROR_INTERNAL,
					Message: err.Error(),
				},
			}, nostr.Tags{})
			return
		}

		network := info.Network
		// Some implementations return "bitcoin" while NIP47 expects "mainnet"
		if network == "bitcoin" {
			network = "mainnet"
		}

		responsePayload.Alias = info.Alias
		responsePayload.Color = info.Color
		responsePayload.Pubkey = info.Pubkey
		responsePayload.Network = network
		responsePayload.BlockHeight = info.BlockHeight
		responsePayload.BlockHash = info.BlockHash
	}

	publishResponse(&models.Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
