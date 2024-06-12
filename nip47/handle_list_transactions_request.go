package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HandleListTransactionsEvent(ctx context.Context, nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, publishResponse func(*Response, nostr.Tags)) {

	listParams := &ListTransactionsParams{}
	resp := svc.decodeNip47Request(nip47Request, requestEvent, app, listParams)
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
		// TODO: log request fields from listParams
		"requestEventNostrId": requestEvent.NostrId,
		"appId":               app.ID,
	}).Info("Fetching transactions")

	limit := listParams.Limit
	maxLimit := uint64(50)
	if limit == 0 || limit > maxLimit {
		// make sure a sensible limit is passed
		limit = maxLimit
	}
	transactions, err := svc.lnClient.ListTransactions(ctx, listParams.From, listParams.Until, limit, listParams.Offset, listParams.Unpaid, listParams.Type)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			// TODO: log request fields from listParams
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Infof("Failed to fetch transactions: %v", err)

		publishResponse(&Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: err.Error(),
			},
		}, nostr.Tags{})
		return
	}

	responsePayload := &ListTransactionsResponse{
		Transactions: transactions,
	}

	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Result:     responsePayload,
	}, nostr.Tags{})
}
