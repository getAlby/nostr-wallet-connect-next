package tests

import (
	"os"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/migrations"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/glebarez/sqlite"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

const testDB = "test.db"

func createTestService() (svc *TestService, err error) {
	gormDb, err := gorm.Open(sqlite.Open(testDB), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	mockLn, err := NewMockLn()
	if err != nil {
		return nil, err
	}

	logger.Logger = logrus.New()
	logger.Logger.SetFormatter(&logrus.JSONFormatter{})
	logger.Logger.SetOutput(os.Stdout)
	logger.Logger.SetLevel(logrus.InfoLevel)

	appConfig := &config.AppConfig{
		Workdir: ".test",
	}

	err = migrations.Migrate(gormDb, appConfig)
	if err != nil {
		return nil, err
	}

	cfg := config.NewConfig(
		gormDb,
		appConfig,
	)

	cfg.Start("")

	eventPublisher := events.NewEventPublisher()

	return &TestService{
		cfg:            cfg,
		db:             gormDb,
		lnClient:       mockLn,
		eventPublisher: eventPublisher,
		nip47Svc:       nip47.NewNip47Service(gormDb, eventPublisher, cfg, mockLn),
	}, nil
}

type TestService struct {
	cfg            config.Config
	db             *gorm.DB
	lnClient       lnclient.LNClient
	eventPublisher events.EventPublisher
	nip47Svc       nip47.Nip47Service
}

func removeTestService() {
	os.Remove(testDB)
}
