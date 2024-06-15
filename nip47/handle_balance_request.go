package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

const (
	MSAT_PER_SAT = 1000
)

func (svc *nip47Service) HandleGetBalanceEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	resp := svc.checkPermission(nip47Request, requestEvent.NostrId, app, 0)
	if resp != nil {
		publishResponse(resp, nostr.Tags{})
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
	}).Info("Fetching balance")

	balance, err := svc.lnClient.GetBalance(ctx)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Infof("Failed to fetch balance: %v", err)
		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := &BalanceResponse{
		Balance: balance,
	}

	appPermission := db.AppPermission{}
	svc.db.Where("app_id = ? AND request_method = ?", app.ID, PAY_INVOICE_METHOD).First(&appPermission)

	maxAmount := appPermission.MaxAmount
	if maxAmount > 0 {
		responsePayload.MaxAmount = maxAmount * MSAT_PER_SAT
		responsePayload.BudgetRenewal = appPermission.BudgetRenewal
	}

	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
