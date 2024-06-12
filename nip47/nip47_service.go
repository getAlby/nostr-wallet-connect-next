package nip47

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type nip47Service struct {
	db                     *gorm.DB
	logger                 *logrus.Logger
	nip47NotificationQueue Nip47NotificationQueue
	eventPublisher         events.EventPublisher
	cfg                    config.Config
	lnClient               lnclient.LNClient
}

func NewNip47Service(db *gorm.DB, logger *logrus.Logger, eventPublisher events.EventPublisher, cfg config.Config, lnClient lnclient.LNClient) *nip47Service {
	nip47NotificationQueue := NewNip47NotificationQueue(logger)
	eventPublisher.RegisterSubscriber(nip47NotificationQueue)
	return &nip47Service{
		nip47NotificationQueue: nip47NotificationQueue,
		db:                     db,
		logger:                 logger,
		eventPublisher:         eventPublisher,
		cfg:                    cfg,
		lnClient:               lnClient,
	}
}

func (svc *nip47Service) Stop() {
	svc.eventPublisher.RemoveSubscriber(svc.nip47NotificationQueue)
}

func (svc *nip47Service) StartNotifier(ctx context.Context, relay *nostr.Relay, lnClient lnclient.LNClient) {
	nip47Notifier := NewNip47Notifier(svc, relay, svc.logger, svc.cfg, svc.db, lnClient)
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
