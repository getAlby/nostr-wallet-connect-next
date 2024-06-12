package tests

import (
	"testing"
	"time"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/stretchr/testify/assert"
)

func TestHasPermission_NoPermission(t *testing.T) {
	defer removeTestService()
	svc, err := createTestService()
	assert.NoError(t, err)

	app, _, err := createApp(svc)
	assert.NoError(t, err)

	result, code, message := svc.nip47Svc.HasPermission(app, nip47.PAY_INVOICE_METHOD, 100)
	assert.False(t, result)
	assert.Equal(t, nip47.ERROR_RESTRICTED, code)
	assert.Equal(t, "This app does not have permission to request pay_invoice", message)
}

func TestHasPermission_Expired(t *testing.T) {
	defer removeTestService()
	svc, err := createTestService()
	assert.NoError(t, err)

	app, _, err := createApp(svc)
	assert.NoError(t, err)

	budgetRenewal := "never"
	expiresAt := time.Now().Add(-24 * time.Hour)
	appPermission := &db.AppPermission{
		AppId:         app.ID,
		App:           *app,
		RequestMethod: nip47.PAY_INVOICE_METHOD,
		MaxAmount:     100,
		BudgetRenewal: budgetRenewal,
		ExpiresAt:     &expiresAt,
	}
	err = svc.db.Create(appPermission).Error
	assert.NoError(t, err)

	result, code, message := svc.nip47Svc.HasPermission(app, nip47.PAY_INVOICE_METHOD, 100)
	assert.False(t, result)
	assert.Equal(t, nip47.ERROR_EXPIRED, code)
	assert.Equal(t, "This app has expired", message)
}

func TestHasPermission_Exceeded(t *testing.T) {
	defer removeTestService()
	svc, err := createTestService()
	assert.NoError(t, err)

	app, _, err := createApp(svc)
	assert.NoError(t, err)

	budgetRenewal := "never"
	expiresAt := time.Now().Add(24 * time.Hour)
	appPermission := &db.AppPermission{
		AppId:         app.ID,
		App:           *app,
		RequestMethod: nip47.PAY_INVOICE_METHOD,
		MaxAmount:     10,
		BudgetRenewal: budgetRenewal,
		ExpiresAt:     &expiresAt,
	}
	err = svc.db.Create(appPermission).Error
	assert.NoError(t, err)

	result, code, message := svc.nip47Svc.HasPermission(app, nip47.PAY_INVOICE_METHOD, 100*1000)
	assert.False(t, result)
	assert.Equal(t, nip47.ERROR_QUOTA_EXCEEDED, code)
	assert.Equal(t, "Insufficient budget remaining to make payment", message)
}

func TestHasPermission_OK(t *testing.T) {
	defer removeTestService()
	svc, err := createTestService()
	assert.NoError(t, err)

	app, _, err := createApp(svc)
	assert.NoError(t, err)

	budgetRenewal := "never"
	expiresAt := time.Now().Add(24 * time.Hour)
	appPermission := &db.AppPermission{
		AppId:         app.ID,
		App:           *app,
		RequestMethod: nip47.PAY_INVOICE_METHOD,
		MaxAmount:     10,
		BudgetRenewal: budgetRenewal,
		ExpiresAt:     &expiresAt,
	}
	err = svc.db.Create(appPermission).Error
	assert.NoError(t, err)

	result, code, message := svc.nip47Svc.HasPermission(app, nip47.PAY_INVOICE_METHOD, 10*1000)
	assert.True(t, result)
	assert.Empty(t, code)
	assert.Empty(t, message)
}
