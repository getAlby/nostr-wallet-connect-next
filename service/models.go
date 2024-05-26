package service

import (
	"github.com/getAlby/nostr-wallet-connect/models/lnclient"
)

type Service interface {
	GetLNClient() lnclient.LNClient
}
