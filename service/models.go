package service

import (
	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/models/lnclient"
)

type Service interface {
	GetLNClient() lnclient.LNClient
	GetConfig() config.Config
	StopApp()
	StopDb() error
}
