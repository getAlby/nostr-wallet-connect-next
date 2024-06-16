package controllers

// TODO: split and re-enable tests

// import (
// 	"context"
// 	"encoding/json"
// 	"testing"

// 	"github.com/nbd-wtf/go-nostr"
// 	"github.com/stretchr/testify/assert"

// 	"github.com/getAlby/nostr-wallet-connect/nip47/models"
// 	"github.com/getAlby/nostr-wallet-connect/tests"
// )

// // TODO: split up this file!

// const nip47GetBalanceJson = `
// {
// 	"method": "get_balance"
// }
// `

// const nip47GetInfoJson = `
// {
// 	"method": "get_info"
// }
// `

// const nip47LookupInvoiceJson = `
// {
// 	"method": "lookup_invoice",
// 	"params": {
// 		"payment_hash": "4ad9cd27989b514d868e755178378019903a8d78767e3fceb211af9dd00e7a94"
// 	}
// }
// `

// const nip47MakeInvoiceJson = `
// {
// 	"method": "make_invoice",
// 	"params": {
// 		"amount": 1000,
// 		"description": "[[\"text/identifier\",\"hello@getalby.com\"],[\"text/plain\",\"Sats for Alby\"]]",
// 		"expiry": 3600
// 	}
// }
// `

// const nip47ListTransactionsJson = `
// {
// 	"method": "list_transactions",
// 	"params": {
// 		"from": 1693876973,
// 		"until": 1694876973,
// 		"limit": 10,
// 		"offset": 0,
// 		"type": "incoming"
// 	}
// }
// `

// const nip47KeysendJson = `
// {
// 	"method": "pay_keysend",
// 	"params": {
// 		"amount": 123000,
// 		"pubkey": "123pubkey",
// 		"tlv_records": [{
// 			"type": 5482373484,
// 			"value": "fajsn341414fq"
// 		}]
// 	}
// }
// `

// const nip47MultiPayKeysendJson = `
// {
// 	"method": "multi_pay_keysend",
// 	"params": {
// 		"keysends": [{
// 				"amount": 123000,
// 				"pubkey": "123pubkey",
// 				"tlv_records": [{
// 					"type": 5482373484,
// 					"value": "fajsn341414fq"
// 				}]
// 			},
// 			{
// 				"amount": 123000,
// 				"pubkey": "123pubkey",
// 				"tlv_records": [{
// 					"type": 5482373484,
// 					"value": "fajsn341414fq"
// 				}]
// 			}
// 		]
// 	}
// }
// `

// const nip47MultiPayKeysendOneOverflowingBudgetJson = `
// {
// 	"method": "multi_pay_keysend",
// 	"params": {
// 		"keysends": [{
// 				"amount": 123000,
// 				"pubkey": "123pubkey",
// 				"id": "customId",
// 				"tlv_records": [{
// 					"type": 5482373484,
// 					"value": "fajsn341414fq"
// 				}]
// 			},
// 			{
// 				"amount": 500000,
// 				"pubkey": "500pubkey",
// 				"tlv_records": [{
// 					"type": 5482373484,
// 					"value": "fajsn341414fq"
// 				}]
// 			}
// 		]
// 	}
// }
// `

// const nip47PayJson = `
// {
// 	"method": "pay_invoice",
// 	"params": {
// 		"invoice": "lntb1230n1pjypux0pp5xgxzcks5jtx06k784f9dndjh664wc08ucrganpqn52d0ftrh9n8sdqyw3jscqzpgxqyz5vqsp5rkx7cq252p3frx8ytjpzc55rkgyx2mfkzzraa272dqvr2j6leurs9qyyssqhutxa24r5hqxstchz5fxlslawprqjnarjujp5sm3xj7ex73s32sn54fthv2aqlhp76qmvrlvxppx9skd3r5ut5xutgrup8zuc6ay73gqmra29m"
// 	}
// }
// `

// const nip47PayWrongMethodJson = `
// {
// 	"method": "get_balance",
// 	"params": {
// 		"invoice": "lntb1230n1pjypux0pp5xgxzcks5jtx06k784f9dndjh664wc08ucrganpqn52d0ftrh9n8sdqyw3jscqzpgxqyz5vqsp5rkx7cq252p3frx8ytjpzc55rkgyx2mfkzzraa272dqvr2j6leurs9qyyssqhutxa24r5hqxstchz5fxlslawprqjnarjujp5sm3xj7ex73s32sn54fthv2aqlhp76qmvrlvxppx9skd3r5ut5xutgrup8zuc6ay73gqmra29m"
// 	}
// }
// `
// const nip47PayJsonNoInvoice = `
// {
// 	"method": "pay_invoice",
// 	"params": {
// 		"something": "else"
// 	}
// }
// `

// func TestHandleMultiPayKeysendEvent(t *testing.T) {

// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47MultiPayKeysendJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47MultiPayKeysendJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "multi_pay_keysend_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}
// 	dTags := []nostr.Tags{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 		dTags = append(dTags, tags)
// 	}

// 	svc.nip47Svc.HandleMultiPayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, 2, len(responses))
// 	for i := 0; i < len(responses); i++ {
// 		assert.Equal(t, models.ERROR_RESTRICTED, responses[i].Error.Code)
// 	}

// 	// with permission
// 	maxAmount := 1000
// 	budgetRenewal := "never"
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	// because we need the same permission for keysend although
// 	// it works even with models.PAY_KEYSEND_METHOD, see
// 	// https://github.com/getAlby/nostr-wallet-connect/issues/189
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.PAY_INVOICE_METHOD,
// 		MaxAmount:     maxAmount,
// 		BudgetRenewal: budgetRenewal,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "multi_pay_keysend_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	dTags = []nostr.Tags{}
// 	svc.nip47Svc.HandleMultiPayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, 2, len(responses))
// 	for i := 0; i < len(responses); i++ {
// 		assert.Equal(t, responses[i].Result.(payResponse).Preimage, "12345preimage")
// 		assert.Equal(t, "123pubkey", dTags[i].GetFirst([]string{"d"}).Value())
// 	}

// 	// we've spent 246 till here in two payments

// 	// budget overflow
// 	newMaxAmount := 500
// 	err = svc.DB.Model(&db.AppPermission{}).Where("app_id = ?", app.ID).Update("max_amount", newMaxAmount).Error
// 	assert.NoError(t, err)

// 	err = json.Unmarshal([]byte(nip47MultiPayKeysendOneOverflowingBudgetJson), request)
// 	assert.NoError(t, err)

// 	payload, err = nip04.Encrypt(nip47MultiPayKeysendOneOverflowingBudgetJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent.Content = payload

// 	reqEvent.ID = "multi_pay_keysend_with_budget_overflow"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	dTags = []nostr.Tags{}
// 	svc.nip47Svc.HandleMultiPayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Error.Code, models.ERROR_QUOTA_EXCEEDED)
// 	assert.Equal(t, "500pubkey", dTags[0].GetFirst([]string{"d"}).Value())
// 	assert.Equal(t, responses[1].Result.(payResponse).Preimage, "12345preimage")
// 	assert.Equal(t, "customId", dTags[1].GetFirst([]string{"d"}).Value())
// }

// func TestHandleGetBalanceEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47GetBalanceJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47GetBalanceJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "test_get_balance_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	err = svc.DB.Create(&requestEvent).Error
// 	assert.NoError(t, err)

// 	svc.nip47Svc.HandleGetBalanceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Error.Code, models.ERROR_RESTRICTED)

// 	// with permission
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.GET_BALANCE_METHOD,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_get_balance_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleGetBalanceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Result.(*getBalanceResponse).Balance, int64(21000))

// 	// create pay_invoice permission
// 	maxAmount := 1000
// 	budgetRenewal := "never"
// 	appPermission = &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.PAY_INVOICE_METHOD,
// 		MaxAmount:     maxAmount,
// 		BudgetRenewal: budgetRenewal,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_get_balance_with_budget"
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleGetBalanceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, int64(21000), responses[0].Result.(*getBalanceResponse).Balance)
// 	// assert.Equal(t, 1000000, responses[0].Result.(*getBalanceResponse).MaxAmount)
// 	// assert.Equal(t, "never", responses[0].Result.(*getBalanceResponse).BudgetRenewal)
// }

// func TestHandlePayInvoiceEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47PayJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47PayJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "pay_invoice_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// with permission
// 	maxAmount := 1000
// 	budgetRenewal := "never"
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.PAY_INVOICE_METHOD,
// 		MaxAmount:     maxAmount,
// 		BudgetRenewal: budgetRenewal,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "pay_invoice_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Result.(payResponse).Preimage, "123preimage")

// 	// malformed invoice
// 	err = json.Unmarshal([]byte(nip47PayJsonNoInvoice), request)
// 	assert.NoError(t, err)

// 	payload, err = nip04.Encrypt(nip47PayJsonNoInvoice, ss)
// 	assert.NoError(t, err)
// 	reqEvent.Content = payload

// 	reqEvent.ID = "pay_invoice_with_malformed_invoice"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_INTERNAL, responses[0].Error.Code)

// 	// wrong method
// 	err = json.Unmarshal([]byte(nip47PayWrongMethodJson), request)
// 	assert.NoError(t, err)

// 	payload, err = nip04.Encrypt(nip47PayWrongMethodJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent.Content = payload

// 	reqEvent.ID = "pay_invoice_with_wrong_request_method"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// budget overflow
// 	newMaxAmount := 100
// 	err = svc.DB.Model(&db.AppPermission{}).Where("app_id = ?", app.ID).Update("max_amount", newMaxAmount).Error
// 	assert.NoError(t, err)

// 	err = json.Unmarshal([]byte(nip47PayJson), request)
// 	assert.NoError(t, err)

// 	payload, err = nip04.Encrypt(nip47PayJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent.Content = payload

// 	reqEvent.ID = "pay_invoice_with_budget_overflow"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_QUOTA_EXCEEDED, responses[0].Error.Code)

// 	// budget expiry
// 	newExpiry := time.Now().Add(-24 * time.Hour)
// 	err = svc.DB.Model(&db.AppPermission{}).Where("app_id = ?", app.ID).Update("max_amount", maxAmount).Update("expires_at", newExpiry).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "pay_invoice_with_budget_expiry"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_EXPIRED, responses[0].Error.Code)

// 	// check again
// 	err = svc.DB.Model(&db.AppPermission{}).Where("app_id = ?", app.ID).Update("expires_at", nil).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "pay_invoice_after_change"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Result.(payResponse).Preimage, "123preimage")
// }

// func TestHandlePayKeysendEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47KeysendJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47KeysendJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "pay_keysend_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandlePayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// with permission
// 	maxAmount := 1000
// 	budgetRenewal := "never"
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	// because we need the same permission for keysend although
// 	// it works even with models.PAY_KEYSEND_METHOD, see
// 	// https://github.com/getAlby/nostr-wallet-connect/issues/189
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.PAY_INVOICE_METHOD,
// 		MaxAmount:     maxAmount,
// 		BudgetRenewal: budgetRenewal,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "pay_keysend_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, responses[0].Result.(payResponse).Preimage, "12345preimage")

// 	// budget overflow
// 	newMaxAmount := 100
// 	err = svc.DB.Model(&db.AppPermission{}).Where("app_id = ?", app.ID).Update("max_amount", newMaxAmount).Error
// 	assert.NoError(t, err)

// 	err = json.Unmarshal([]byte(nip47KeysendJson), request)
// 	assert.NoError(t, err)

// 	payload, err = nip04.Encrypt(nip47KeysendJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent.Content = payload

// 	reqEvent.ID = "pay_keysend_with_budget_overflow"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandlePayKeysendEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_QUOTA_EXCEEDED, responses[0].Error.Code)
// }

// func TestHandleLookupInvoiceEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47LookupInvoiceJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47LookupInvoiceJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "test_lookup_invoice_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandleLookupInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// with permission
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.LOOKUP_INVOICE_METHOD,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_lookup_invoice_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleLookupInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	transaction := responses[0].Result.(*lookupInvoiceResponse)
// 	assert.Equal(t, tests.MockTransaction.Type, transaction.Type)
// 	assert.Equal(t, tests.MockTransaction.Invoice, transaction.Invoice)
// 	assert.Equal(t, tests.MockTransaction.Description, transaction.Description)
// 	assert.Equal(t, tests.MockTransaction.DescriptionHash, transaction.DescriptionHash)
// 	assert.Equal(t, tests.MockTransaction.Preimage, transaction.Preimage)
// 	assert.Equal(t, tests.MockTransaction.PaymentHash, transaction.PaymentHash)
// 	assert.Equal(t, tests.MockTransaction.Amount, transaction.Amount)
// 	assert.Equal(t, tests.MockTransaction.FeesPaid, transaction.FeesPaid)
// 	assert.Equal(t, tests.MockTransaction.SettledAt, transaction.SettledAt)
// }

// func TestHandleMakeInvoiceEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47MakeInvoiceJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47MakeInvoiceJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "test_make_invoice_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandleMakeInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// with permission
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.MAKE_INVOICE_METHOD,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_make_invoice_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleMakeInvoiceEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, tests.MockTransaction.Preimage, responses[0].Result.(*makeInvoiceResponse).Preimage)
// }

// func TestHandleListTransactionsEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47ListTransactionsJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47ListTransactionsJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "test_list_transactions_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandleListTransactionsEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	// with permission
// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.LIST_TRANSACTIONS_METHOD,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_list_transactions_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleListTransactionsEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, 2, len(responses[0].Result.(*listTransactionsResponse).Transactions))
// 	transaction := responses[0].Result.(*listTransactionsResponse).Transactions[0]
// 	assert.Equal(t, tests.MockTransactions[0].Type, transaction.Type)
// 	assert.Equal(t, tests.MockTransactions[0].Invoice, transaction.Invoice)
// 	assert.Equal(t, tests.MockTransactions[0].Description, transaction.Description)
// 	assert.Equal(t, tests.MockTransactions[0].DescriptionHash, transaction.DescriptionHash)
// 	assert.Equal(t, tests.MockTransactions[0].Preimage, transaction.Preimage)
// 	assert.Equal(t, tests.MockTransactions[0].PaymentHash, transaction.PaymentHash)
// 	assert.Equal(t, tests.MockTransactions[0].Amount, transaction.Amount)
// 	assert.Equal(t, tests.MockTransactions[0].FeesPaid, transaction.FeesPaid)
// 	assert.Equal(t, tests.MockTransactions[0].SettledAt, transaction.SettledAt)
// }

// func TestHandleGetInfoEvent(t *testing.T) {
// 	ctx := context.TODO()
// 	defer tests.RemoveTestService()
// 	svc, err := tests.CreateTestService()
// 	assert.NoError(t, err)

// 	app, ss, err := tests.CreateApp(svc)
// 	assert.NoError(t, err)

// 	request := &models.Request{}
// 	err = json.Unmarshal([]byte(nip47GetInfoJson), request)
// 	assert.NoError(t, err)

// 	// without permission
// 	payload, err := nip04.Encrypt(nip47GetInfoJson, ss)
// 	assert.NoError(t, err)
// 	reqEvent := &nostr.Event{
// 		Kind:    models.REQUEST_KIND,
// 		PubKey:  app.NostrPubkey,
// 		Content: payload,
// 	}

// 	reqEvent.ID = "test_get_info_without_permission"
// 	requestEvent := &db.RequestEvent{
// 		NostrId: reqEvent.ID,
// 	}

// 	responses := []*models.Response{}

// 	publishResponse := func(response *models.Response, tags nostr.Tags) {
// 		responses = append(responses, response)
// 	}

// 	svc.nip47Svc.HandleGetInfoEvent(ctx, request, requestEvent, app, publishResponse)

// 	assert.Equal(t, models.ERROR_RESTRICTED, responses[0].Error.Code)

// 	expiresAt := time.Now().Add(24 * time.Hour)
// 	appPermission := &db.AppPermission{
// 		AppId:         app.ID,
// 		App:           *app,
// 		RequestMethod: models.GET_INFO_METHOD,
// 		ExpiresAt:     &expiresAt,
// 	}
// 	err = svc.DB.Create(appPermission).Error
// 	assert.NoError(t, err)

// 	reqEvent.ID = "test_get_info_with_permission"
// 	requestEvent.NostrId = reqEvent.ID
// 	responses = []*models.Response{}
// 	svc.nip47Svc.HandleGetInfoEvent(ctx, request, requestEvent, app, publishResponse)

// 	nodeInfo := responses[0].Result.(*getInfoResponse)
// 	assert.Equal(t, tests.MockNodeInfo.Alias, nodeInfo.Alias)
// 	assert.Equal(t, tests.MockNodeInfo.Color, nodeInfo.Color)
// 	assert.Equal(t, tests.MockNodeInfo.Pubkey, nodeInfo.Pubkey)
// 	assert.Equal(t, tests.MockNodeInfo.Network, nodeInfo.Network)
// 	assert.Equal(t, tests.MockNodeInfo.BlockHeight, nodeInfo.BlockHeight)
// 	assert.Equal(t, tests.MockNodeInfo.BlockHash, nodeInfo.BlockHash)
// 	assert.Equal(t, []string{"get_info"}, nodeInfo.Methods)
// }
