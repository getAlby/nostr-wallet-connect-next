package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
)

type listTransactionsParams struct {
	From   uint64 `json:"from,omitempty"`
	Until  uint64 `json:"until,omitempty"`
	Limit  uint64 `json:"limit,omitempty"`
	Offset uint64 `json:"offset,omitempty"`
	Unpaid bool   `json:"unpaid,omitempty"`
	Type   string `json:"type,omitempty"`
}

type ListTransactionsResponse struct {
	Transactions []models.Transaction `json:"transactions"`
}

func (svc *controllersService) HandleListTransactionsEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
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

	listParams := &listTransactionsParams{}
	resp = decodeRequest(nip47Request, listParams)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &nostr.Tags{},
		}
		close(respChan)
		return
	}

	logger.Logger.WithFields(logrus.Fields{
		"params":           listParams,
		"request_event_id": requestEventId,
	}).Info("Fetching transactions")

	limit := listParams.Limit
	maxLimit := uint64(50)
	if limit == 0 || limit > maxLimit {
		// make sure a sensible limit is passed
		limit = maxLimit
	}
	transactions, err := svc.lnClient.ListTransactions(ctx, listParams.From, listParams.Until, limit, listParams.Offset, listParams.Unpaid, listParams.Type)
	if err != nil {
		logger.Logger.WithFields(logrus.Fields{
			"params":           listParams,
			"request_event_id": requestEventId,
		}).WithError(err).Error("Failed to fetch transactions")

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

	responsePayload := &ListTransactionsResponse{
		Transactions: transactions,
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
