package main

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *Service) HandleGetInfoEvent(ctx context.Context, nip47Request *nip47.Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*nip47.Response, nostr.Tags)) {

	responsePayload := &nip47.GetInfoResponse{
		Methods: svc.GetMethods(app),
	}

	hasPermission, _, _ := svc.hasPermission(app, nip47Request.Method, 0)
	if !hasPermission {
		// get_info should still return request_methods even without a permission
		publishResponse(&nip47.Response{
			ResultType: nip47Request.Method,
			Result:     responsePayload,
		}, nostr.Tags{})
		return
	}

	svc.logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
	}).Info("Fetching node info")

	info, err := svc.lnClient.GetInfo(ctx)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Infof("Failed to fetch node info: %v", err)

		publishResponse(&nip47.Response{
			ResultType: nip47Request.Method,
			Error: &nip47.Error{
				Code:    nip47.ERROR_INTERNAL,
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

	publishResponse(&nip47.Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
