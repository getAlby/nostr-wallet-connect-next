package service

import (
	"github.com/getAlby/nostr-wallet-connect/alby"
	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type Service interface {
	GetLNClient() lnclient.LNClient
	GetConfig() config.Config
	StartApp(encryptionKey string) error
	StopApp()
	StopLNClient() error
	StopDb() error
	GetLogFilePath() string
	GetAlbyOAuthSvc() alby.AlbyOAuthService
	GetNip47Service() nip47.Nip47Service
	GetLogger() *logrus.Logger
	GetDB() *gorm.DB
	WaitShutdown()
	GetEventPublisher() events.EventPublisher
}
