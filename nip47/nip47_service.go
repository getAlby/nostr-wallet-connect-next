package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/nip47/notifications"
	permissions "github.com/getAlby/nostr-wallet-connect/nip47/permissions"
	"github.com/nbd-wtf/go-nostr"
	"gorm.io/gorm"
)

type nip47Service struct {
	permissionsService     permissions.PermissionsService
	nip47NotificationQueue notifications.Nip47NotificationQueue
	cfg                    config.Config
	db                     *gorm.DB
	eventPublisher         events.EventPublisher
}

type Nip47Service interface {
	StartNotifier(ctx context.Context, relay *nostr.Relay, lnClient lnclient.LNClient)
	HandleEvent(ctx context.Context, sub *nostr.Subscription, event *nostr.Event, lnClient lnclient.LNClient)
	PublishNip47Info(ctx context.Context, relay *nostr.Relay) error
	CreateResponse(initialEvent *nostr.Event, content interface{}, tags nostr.Tags, ss []byte) (result *nostr.Event, err error)
}

func NewNip47Service(db *gorm.DB, cfg config.Config, eventPublisher events.EventPublisher) *nip47Service {
	nip47NotificationQueue := notifications.NewNip47NotificationQueue()
	eventPublisher.RegisterSubscriber(nip47NotificationQueue)
	return &nip47Service{
		nip47NotificationQueue: nip47NotificationQueue,
		cfg:                    cfg,
		db:                     db,
		permissionsService:     permissions.NewPermissionsService(db, eventPublisher),
		eventPublisher:         eventPublisher,
	}
}

func (svc *nip47Service) StartNotifier(ctx context.Context, relay *nostr.Relay, lnClient lnclient.LNClient) {
	nip47Notifier := notifications.NewNip47Notifier(relay, svc.db, svc.cfg, svc.permissionsService, lnClient)
	go func() {
		for {
			select {
			case <-ctx.Done():
				// subscription ended
				return
			case event := <-svc.nip47NotificationQueue.Channel():
				nip47Notifier.ConsumeEvent(ctx, event)
			}
		}
	}()
}
