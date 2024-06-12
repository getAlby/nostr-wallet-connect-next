package nip47

import (
	"context"
	"fmt"

	"github.com/nbd-wtf/go-nostr"
)

func (svc *nip47Service) PublishNip47Info(ctx context.Context, relay *nostr.Relay) error {
	ev := &nostr.Event{}
	ev.Kind = INFO_EVENT_KIND
	ev.Content = CAPABILITIES
	ev.CreatedAt = nostr.Now()
	ev.PubKey = svc.cfg.GetNostrPublicKey()
	ev.Tags = nostr.Tags{[]string{"notifications", NOTIFICATION_TYPES}}
	err := ev.Sign(svc.cfg.GetNostrSecretKey())
	if err != nil {
		return err
	}
	err = relay.Publish(ctx, *ev)
	if err != nil {
		return fmt.Errorf("nostr publish not successful: %s", err)
	}
	return nil
}
