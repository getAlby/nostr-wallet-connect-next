package controllers

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	"gorm.io/gorm"
)

type checkPermissionFunc = func(amountMsat uint64) *models.Response
type publishFunc = func(*models.Response, nostr.Tags)

type PayResponse struct {
	Preimage string  `json:"preimage"`
	FeesPaid *uint64 `json:"fees_paid"`
}

type controllersService struct {
	lnClient       lnclient.LNClient
	db             *gorm.DB
	eventPublisher events.EventPublisher
}

type ControllersService interface {
	HasLNClient() bool
	SetLNClient(lnClient lnclient.LNClient)
	HasPermission(app *db.App, requestMethod string, amount uint64) (result bool, code string, message string)
	GetBudgetUsage(appPermission *db.AppPermission) uint64
	GetPermittedMethods(app *db.App) []string

	HandleGetBalanceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleGetInfoEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleListTransactionsEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleLookupInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleMakeInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleMultiPayInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandleMultiPayKeysendEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
	HandlePayInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags), tags nostr.Tags)
	HandlePayKeysendEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags), tags nostr.Tags)
	HandleSignMessageEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, checkPermission func(amountMsat uint64) *models.Response, publishResponse func(*models.Response, nostr.Tags))
}

func NewControllersService(db *gorm.DB, eventPublisher events.EventPublisher, lnClient lnclient.LNClient) *controllersService {
	return &controllersService{
		db:             db,
		eventPublisher: eventPublisher,
		lnClient:       lnClient,
	}
}

func (svc *controllersService) HasLNClient() bool {
	return svc.lnClient != nil
}

func (svc *controllersService) SetLNClient(lnClient lnclient.LNClient) {
	svc.lnClient = lnClient
}
