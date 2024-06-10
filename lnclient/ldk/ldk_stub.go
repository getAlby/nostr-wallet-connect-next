//go:build skip_ldk

package ldk

import (
	"context"

	"github.com/sirupsen/logrus"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
)

func NewLDKService(ctx context.Context, logger *logrus.Logger, cfg config.Config, eventPublisher events.EventPublisher, mnemonic, workDir string, network string, esploraServer string, gossipSource string) (result lnclient.LNClient, err error) {
	panic("not implemented")
	return nil, nil
}
