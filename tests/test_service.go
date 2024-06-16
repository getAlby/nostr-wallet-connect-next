package tests

import (
	"os"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"gorm.io/gorm"
)

const testDB = "test.db"

func CreateTestService() (svc *TestService, err error) {
	gormDb, err := db.NewDB(testDB)
	if err != nil {
		return nil, err
	}

	mockLn, err := NewMockLn()
	if err != nil {
		return nil, err
	}

	logger.Init("")

	appConfig := &config.AppConfig{
		Workdir: ".test",
	}

	cfg := config.NewConfig(
		appConfig,
		gormDb,
	)

	cfg.Start("")

	eventPublisher := events.NewEventPublisher()

	return &TestService{
		Cfg:            cfg,
		LNClient:       mockLn,
		EventPublisher: eventPublisher,
		DB:             gormDb,
	}, nil
}

type TestService struct {
	Cfg            config.Config
	LNClient       lnclient.LNClient
	EventPublisher events.EventPublisher
	DB             *gorm.DB
}

func RemoveTestService() {
	os.Remove(testDB)
}
