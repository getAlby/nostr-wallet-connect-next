package tests

import (
	"os"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
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

	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logger.SetLevel(logrus.InfoLevel)

	appConfig := &config.AppConfig{
		Workdir: ".test",
	}

	err = migrations.Migrate(gormDb, appConfig, logger)
	if err != nil {
		return nil, err
	}

	cfg := config.NewConfig(
		gormDb,
		appConfig,
		logger,
	)

	cfg.Start("")

	eventPublisher := events.NewEventPublisher(logger)

	return &TestService{
		cfg:            cfg,
		db:             gormDb,
		lnClient:       mockLn,
		logger:         logger,
		eventPublisher: eventPublisher,
		nip47Svc:       nip47.NewNip47Service(gormDb, logger, eventPublisher, cfg, mockLn),
	}, nil
}

type TestService struct {
	cfg            config.Config
	db             *gorm.DB
	lnClient       lnclient.LNClient
	logger         *logrus.Logger
	eventPublisher events.EventPublisher
	nip47Svc       nip47.Nip47Service
}

func removeTestService() {
	os.Remove(testDB)
}
