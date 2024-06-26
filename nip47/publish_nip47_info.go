package nip47

import (
	"context"
	"fmt"
	"strings"

	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/getAlby/nostr-wallet-connect/utils"
	"github.com/nbd-wtf/go-nostr"
)

func (svc *nip47Service) PublishNip47Info(ctx context.Context, relay *nostr.Relay, lnClient lnclient.LNClient) error {
	ev := &nostr.Event{}
	ev.Kind = models.INFO_EVENT_KIND
	ev.Content = strings.Join(nip47CapabilitiesToMethods(strings.Split(lnClient.GetSupportedNIP47Capabilities(), " ")), " ")
	ev.CreatedAt = nostr.Now()
	ev.PubKey = svc.keys.GetNostrPublicKey()
	ev.Tags = nostr.Tags{[]string{"notifications", lnClient.GetSupportedNIP47NotificationTypes()}}
	err := ev.Sign(svc.keys.GetNostrSecretKey())
	if err != nil {
		return err
	}
	err = relay.Publish(ctx, *ev)
	if err != nil {
		return fmt.Errorf("nostr publish not successful: %s", err)
	}
	return nil
}

func nip47CapabilitiesToMethods(capabilities []string) []string {
	return utils.Filter(capabilities, func(s string) bool {
		return s != "notifications"
	})
}
