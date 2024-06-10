//go:build skip_greenlight

package greenlight

import (
	"github.com/sirupsen/logrus"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
)

func NewGreenlightService(cfg config.Config, logger *logrus.Logger, mnemonic, inviteCode, workDir, encryptionKey string) (result lnclient.LNClient, err error) {
	panic("not implemented")
	return nil, nil
}
