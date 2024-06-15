package nip47

import (
	"fmt"
	"time"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/sirupsen/logrus"
)

func (svc *nip47Service) HasPermission(app *db.App, requestMethod string, amount int64) (result bool, code string, message string) {
	switch requestMethod {
	case PAY_INVOICE_METHOD, PAY_KEYSEND_METHOD, MULTI_PAY_INVOICE_METHOD, MULTI_PAY_KEYSEND_METHOD:
		requestMethod = PAY_INVOICE_METHOD
	}

	appPermission := db.AppPermission{}
	findPermissionResult := svc.db.Find(&appPermission, &db.AppPermission{
		AppId:         app.ID,
		RequestMethod: requestMethod,
	})
	if findPermissionResult.RowsAffected == 0 {
		// No permission for this request method
		return false, ERROR_RESTRICTED, fmt.Sprintf("This app does not have permission to request %s", requestMethod)
	}
	expiresAt := appPermission.ExpiresAt
	if expiresAt != nil && expiresAt.Before(time.Now()) {
		logger.Logger.WithFields(logrus.Fields{
			"requestMethod": requestMethod,
			"expiresAt":     expiresAt.Unix(),
			"appId":         app.ID,
			"pubkey":        app.NostrPubkey,
		}).Info("This pubkey is expired")

		return false, ERROR_EXPIRED, "This app has expired"
	}

	if requestMethod == PAY_INVOICE_METHOD {
		maxAmount := appPermission.MaxAmount
		if maxAmount != 0 {
			budgetUsage := svc.GetBudgetUsage(&appPermission)

			if budgetUsage+amount/1000 > int64(maxAmount) {
				return false, ERROR_QUOTA_EXCEEDED, "Insufficient budget remaining to make payment"
			}
		}
	}
	return true, "", ""
}

func (svc *nip47Service) checkPermission(nip47Request *Request, requestNostrEventId string, app *db.App, amount int64) *Response {
	hasPermission, code, message := svc.HasPermission(app, nip47Request.Method, amount)
	if !hasPermission {
		logger.Logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestNostrEventId,
			"appId":               app.ID,
			"code":                code,
			"message":             message,
		}).Error("App does not have permission")

		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_permission_denied",
			Properties: map[string]interface{}{
				"request_method": nip47Request.Method,
				"app_name":       app.Name,
				// "app_pubkey":     app.NostrPubkey,
				"code":    code,
				"message": message,
			},
		})

		return &Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    code,
				Message: message,
			},
		}
	}
	return nil
}
