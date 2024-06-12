package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandleSignMessageEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {
	signParams := &SignMessageParams{}
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

	svc.logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
	}).Info("Signing message")

	signature, err := svc.lnClient.SignMessage(ctx, signParams.Message)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Infof("Failed to sign message: %v", err)
		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := SignMessageResponse{
		Message:   signParams.Message,
		Signature: signature,
	}

	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
