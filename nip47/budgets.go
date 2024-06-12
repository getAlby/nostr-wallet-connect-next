package nip47

import (
	"time"

	"github.com/getAlby/nostr-wallet-connect/db"
)

func (svc *nip47Service) GetStartOfBudget(budget_type string, createdAt time.Time) time.Time {
	now := time.Now()
	switch budget_type {
	case BUDGET_RENEWAL_DAILY:
		// TODO: Use the location of the user, instead of the server
		return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case BUDGET_RENEWAL_WEEKLY:
		weekday := now.Weekday()
		var startOfWeek time.Time
		if weekday == 0 {
			startOfWeek = now.AddDate(0, 0, -6)
		} else {
			startOfWeek = now.AddDate(0, 0, -int(weekday)+1)
		}
		return time.Date(startOfWeek.Year(), startOfWeek.Month(), startOfWeek.Day(), 0, 0, 0, 0, startOfWeek.Location())
	case BUDGET_RENEWAL_MONTHLY:
		return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	case BUDGET_RENEWAL_YEARLY:
		return time.Date(now.Year(), time.January, 1, 0, 0, 0, 0, now.Location())
	default: //"never"
		return createdAt
	}
}

func (svc *nip47Service) GetBudgetUsage(appPermission *db.AppPermission) int64 {
	var result struct {
		Sum uint
	}
	// TODO: discard failed payments from this check instead of checking payments that have a preimage
	svc.db.Table("payments").Select("SUM(amount) as sum").Where("app_id = ? AND preimage IS NOT NULL AND created_at > ?", appPermission.AppId, svc.GetStartOfBudget(appPermission.BudgetRenewal, appPermission.App.CreatedAt)).Scan(&result)
	return int64(result.Sum)
}
