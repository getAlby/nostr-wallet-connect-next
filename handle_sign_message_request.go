package main

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *Service) HandleSignMessageEvent(ctx context.Context, nip47Request *Nip47Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Nip47Response, nostr.Tags)) {
	signParams := &Nip47SignMessageParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, signParams)
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
	}).Info("Signing message")

	signature, err := svc.lnClient.SignMessage(ctx, signParams.Message)
	if err != nil {
		svc.Logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Infof("Failed to sign message: %v", err)
		publishResponse(&Nip47Response{
			ResultType: nip47Request.Method,
			Error: &Nip47Error{
				Code:    nip47.ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := Nip47SignMessageResponse{
		Message:   signParams.Message,
		Signature: signature,
	}

	publishResponse(&Nip47Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
