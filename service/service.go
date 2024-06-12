package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"net/http/pprof"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"github.com/adrg/xdg"
	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
	"gopkg.in/DataDog/dd-trace-go.v1/profiler"

	"github.com/glebarez/sqlite"
	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
	"github.com/orandin/lumberjackrus"
	"gorm.io/gorm"

	alby "github.com/getAlby/nostr-wallet-connect/alby"
	"github.com/getAlby/nostr-wallet-connect/events"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/lnclient/breez"
	"github.com/getAlby/nostr-wallet-connect/lnclient/cashu"
	"github.com/getAlby/nostr-wallet-connect/lnclient/greenlight"
	"github.com/getAlby/nostr-wallet-connect/lnclient/ldk"
	"github.com/getAlby/nostr-wallet-connect/lnclient/lnd"
	"github.com/getAlby/nostr-wallet-connect/lnclient/phoenixd"
	"github.com/getAlby/nostr-wallet-connect/migrations"
	"github.com/getAlby/nostr-wallet-connect/nip47"
)

const (
	logDir      = "log"
	logFilename = "nwc.log"
)

type service struct {
	cfg            config.Config
	db             *gorm.DB
	lnClient       lnclient.LNClient
	logger         *logrus.Logger
	albyOAuthSvc   alby.AlbyOAuthService
	eventPublisher events.EventPublisher
	ctx            context.Context
	wg             *sync.WaitGroup
	nip47Service   nip47.Nip47Service
	appCancelFn    context.CancelFunc
}

func NewService(ctx context.Context) (*service, error) {
	// Load config from environment variables / .GetEnv() file
	godotenv.Load(".env")
	appConfig := &config.AppConfig{}
	err := envconfig.Process("", appConfig)
	if err != nil {
		return nil, err
	}

	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetOutput(os.Stdout)
	logLevel, err := strconv.Atoi(appConfig.LogLevel)
	if err != nil {
		logLevel = int(logrus.InfoLevel)
	}
	logger.SetLevel(logrus.Level(logLevel))

	if appConfig.Workdir == "" {
		appConfig.Workdir = filepath.Join(xdg.DataHome, "/alby-nwc")
		logger.WithField("workdir", appConfig.Workdir).Info("No workdir specified, using default")
	}
	// make sure workdir exists
	os.MkdirAll(appConfig.Workdir, os.ModePerm)

	fileLoggerHook, err := lumberjackrus.NewHook(
		&lumberjackrus.LogFile{
			Filename:   filepath.Join(appConfig.Workdir, logDir, logFilename),
			MaxAge:     3,
			MaxBackups: 3,
		},
		logrus.InfoLevel,
		&logrus.JSONFormatter{},
		nil,
	)
	if err != nil {
		return nil, err
	}
	logger.AddHook(fileLoggerHook)

	finishRestoreNode(logger, appConfig.Workdir)

	// If DATABASE_URI is a URI or a path, leave it unchanged.
	// If it only contains a filename, prepend the workdir.
	if !strings.HasPrefix(appConfig.DatabaseUri, "file:") {
		databasePath, _ := filepath.Split(appConfig.DatabaseUri)
		if databasePath == "" {
			appConfig.DatabaseUri = filepath.Join(appConfig.Workdir, appConfig.DatabaseUri)
		}
	}

	var gormDB *gorm.DB
	var sqlDb *sql.DB
	gormDB, err = gorm.Open(sqlite.Open(appConfig.DatabaseUri), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	err = gormDB.Exec("PRAGMA foreign_keys=ON;").Error
	if err != nil {
		return nil, err
	}
	err = gormDB.Exec("PRAGMA auto_vacuum=FULL;").Error
	if err != nil {
		return nil, err
	}
	sqlDb, err = gormDB.DB()
	if err != nil {
		return nil, err
	}
	sqlDb.SetMaxOpenConns(1)

	err = migrations.Migrate(gormDB, appConfig, logger)
	if err != nil {
		logger.WithError(err).Error("Failed to migrate")
		return nil, err
	}

	cfg := config.NewConfig(gormDB, appConfig, logger)

	eventPublisher := events.NewEventPublisher(logger)

	if err != nil {
		logger.WithError(err).Error("Failed to create Alby OAuth service")
		return nil, err
	}

	var wg sync.WaitGroup
	svc := &service{
		cfg:            cfg,
		db:             gormDB,
		ctx:            ctx,
		wg:             &wg,
		logger:         logger,
		eventPublisher: eventPublisher,
		albyOAuthSvc:   alby.NewAlbyOAuthService(logger, cfg, cfg.GetEnv(), db.NewDBService(gormDB, logger)),
	}

	eventPublisher.RegisterSubscriber(svc.albyOAuthSvc)

	eventPublisher.Publish(&events.Event{
		Event: "nwc_started",
	})

	if appConfig.GoProfilerAddr != "" {
		startProfiler(ctx, appConfig.GoProfilerAddr)
	}

	if appConfig.DdProfilerEnabled {
		startDataDogProfiler(ctx)
	}

	return svc, nil
}

func (svc *service) StopLNClient() error {
	if svc.lnClient != nil {
		svc.logger.Info("Shutting down LDK client")
		err := svc.lnClient.Shutdown()
		if err != nil {
			svc.logger.WithError(err).Error("Failed to stop LN backend")
			svc.eventPublisher.Publish(&events.Event{
				Event: "nwc_node_stop_failed",
				Properties: map[string]interface{}{
					"error": fmt.Sprintf("%v", err),
				},
			})
			return err
		}
		svc.logger.Info("Publishing node shutdown event")
		svc.lnClient = nil
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_node_stopped",
		})
		// TODO: move this, use contexts instead
		svc.nip47Service.Stop()
	}
	svc.logger.Info("LNClient stopped successfully")
	return nil
}

func (svc *service) launchLNBackend(ctx context.Context, encryptionKey string) error {
	err := svc.StopLNClient()
	if err != nil {
		return err
	}

	lnBackend, _ := svc.cfg.Get("LNBackendType", "")
	if lnBackend == "" {
		return errors.New("no LNBackendType specified")
	}

	svc.logger.Infof("Launching LN Backend: %s", lnBackend)
	var lnClient lnclient.LNClient
	switch lnBackend {
	case config.LNDBackendType:
		LNDAddress, _ := svc.cfg.Get("LNDAddress", encryptionKey)
		LNDCertHex, _ := svc.cfg.Get("LNDCertHex", encryptionKey)
		LNDMacaroonHex, _ := svc.cfg.Get("LNDMacaroonHex", encryptionKey)
		lnClient, err = lnd.NewLNDService(ctx, svc.logger, LNDAddress, LNDCertHex, LNDMacaroonHex)
	case config.LDKBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		LDKWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "ldk")

		lnClient, err = ldk.NewLDKService(ctx, svc.logger, svc.cfg, svc.eventPublisher, Mnemonic, LDKWorkdir, svc.cfg.GetEnv().LDKNetwork, svc.cfg.GetEnv().LDKEsploraServer, svc.cfg.GetEnv().LDKGossipSource)
	case config.GreenlightBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		GreenlightInviteCode, _ := svc.cfg.Get("GreenlightInviteCode", encryptionKey)
		GreenlightWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "greenlight")

		lnClient, err = greenlight.NewGreenlightService(svc.cfg, svc.logger, Mnemonic, GreenlightInviteCode, GreenlightWorkdir, encryptionKey)
	case config.BreezBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		BreezAPIKey, _ := svc.cfg.Get("BreezAPIKey", encryptionKey)
		GreenlightInviteCode, _ := svc.cfg.Get("GreenlightInviteCode", encryptionKey)
		BreezWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "breez")

		lnClient, err = breez.NewBreezService(svc.logger, Mnemonic, BreezAPIKey, GreenlightInviteCode, BreezWorkdir)
	case config.PhoenixBackendType:
		PhoenixdAddress, _ := svc.cfg.Get("PhoenixdAddress", encryptionKey)
		PhoenixdAuthorization, _ := svc.cfg.Get("PhoenixdAuthorization", encryptionKey)

		lnClient, err = phoenixd.NewPhoenixService(svc.logger, PhoenixdAddress, PhoenixdAuthorization)
	case config.CashuBackendType:
		cashuMintUrl, _ := svc.cfg.Get("CashuMintUrl", encryptionKey)
		cashuWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "cashu")

		lnClient, err = cashu.NewCashuService(svc.logger, cashuWorkdir, cashuMintUrl)
	default:
		svc.logger.Fatalf("Unsupported LNBackendType: %v", lnBackend)
	}
	if err != nil {
		svc.logger.WithError(err).Error("Failed to launch LN backend")
		return err
	}

	info, err := lnClient.GetInfo(ctx)
	if err != nil {
		svc.logger.WithError(err).Error("Failed to fetch node info")
	}
	if info != nil && info.Pubkey != "" {
		svc.eventPublisher.SetGlobalProperty("node_id", info.Pubkey)
	}

	svc.eventPublisher.Publish(&events.Event{
		Event: "nwc_node_started",
		Properties: map[string]interface{}{
			"node_type": lnBackend,
		},
	})
	svc.lnClient = lnClient
	return nil
}

func (svc *service) createFilters(identityPubkey string) nostr.Filters {
	filter := nostr.Filter{
		Tags:  nostr.TagMap{"p": []string{identityPubkey}},
		Kinds: []int{nip47.REQUEST_KIND},
	}
	return []nostr.Filter{filter}
}

func (svc *service) noticeHandler(notice string) {
	svc.logger.Infof("Received a notice %s", notice)
}

func (svc *service) GetLNClient() lnclient.LNClient {
	return svc.lnClient
}

func (svc *service) StartSubscription(ctx context.Context, sub *nostr.Subscription) error {
	svc.nip47Service.StartNotifier(ctx, sub.Relay, svc.lnClient)

	go func() {
		// block till EOS is received
		<-sub.EndOfStoredEvents
		svc.logger.Info("Received EOS")

		// loop through incoming events
		for event := range sub.Events {
			go svc.nip47Service.HandleEvent(ctx, sub, event)
		}
		svc.logger.Info("Relay subscription events channel ended")
	}()

	<-ctx.Done()

	if sub.Relay.ConnectionError != nil {
		svc.logger.WithField("connectionError", sub.Relay.ConnectionError).Error("Relay error")
		return sub.Relay.ConnectionError
	}
	svc.logger.Info("Exiting subscription...")
	return nil
}

func (svc *service) GetLogFilePath() string {
	return filepath.Join(svc.cfg.GetEnv().Workdir, logDir, logFilename)
}

func finishRestoreNode(logger *logrus.Logger, workDir string) {
	restoreDir := filepath.Join(workDir, "restore")
	if restoreDirStat, err := os.Stat(restoreDir); err == nil && restoreDirStat.IsDir() {
		logger.WithField("restoreDir", restoreDir).Infof("Restore directory found. Finishing Node restore")

		existingFiles, err := os.ReadDir(restoreDir)
		if err != nil {
			logger.WithError(err).Fatal("Failed to read WORK_DIR")
		}

		for _, file := range existingFiles {
			if file.Name() != "restore" {
				err = os.RemoveAll(filepath.Join(workDir, file.Name()))
				if err != nil {
					logger.WithField("filename", file.Name()).WithError(err).Fatal("Failed to remove file")
				}
				logger.WithField("filename", file.Name()).Info("removed file")
			}
		}

		files, err := os.ReadDir(restoreDir)
		if err != nil {
			logger.WithError(err).Fatal("Failed to read restore directory")
		}
		for _, file := range files {
			err = os.Rename(filepath.Join(restoreDir, file.Name()), filepath.Join(workDir, file.Name()))
			if err != nil {
				logger.WithField("filename", file.Name()).WithError(err).Fatal("Failed to move file")
			}
			logger.WithField("filename", file.Name()).Info("copied file from restore directory")
		}
		err = os.RemoveAll(restoreDir)
		if err != nil {
			logger.WithError(err).Fatal("Failed to remove restore directory")
		}
		logger.WithField("restoreDir", restoreDir).Info("removed restore directory")
	}
}

func startProfiler(ctx context.Context, addr string) {
	mux := http.NewServeMux()
	mux.HandleFunc("/debug/pprof/", pprof.Index)
	mux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
	mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	mux.HandleFunc("/debug/pprof/trace", pprof.Trace)

	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		err := server.Shutdown(context.Background())
		if err != nil {
			panic("pprof server shutdown failed: " + err.Error())
		}
	}()

	go func() {
		err := server.ListenAndServe()
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			panic("pprof server failed: " + err.Error())
		}
	}()
}

func startDataDogProfiler(ctx context.Context) {
	opts := make([]profiler.Option, 0)

	opts = append(opts, profiler.WithProfileTypes(
		profiler.CPUProfile,
		profiler.HeapProfile,
		// higher overhead
		profiler.BlockProfile,
		profiler.MutexProfile,
		profiler.GoroutineProfile,
	))

	err := profiler.Start(opts...)
	if err != nil {
		panic("failed to start DataDog profiler: " + err.Error())
	}

	go func() {
		<-ctx.Done()
		profiler.Stop()
	}()
}

func (svc *service) StopDb() error {
	db, err := svc.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	err = db.Close()
	if err != nil {
		return fmt.Errorf("failed to close database connection: %w", err)
	}
	return nil
}

func (svc *service) GetConfig() config.Config {
	return svc.cfg
}

func (svc *service) GetAlbyOAuthSvc() alby.AlbyOAuthService {
	return svc.albyOAuthSvc
}

func (svc *service) GetNip47Service() nip47.Nip47Service {
	return svc.nip47Service
}

func (svc *service) GetDB() *gorm.DB {
	return svc.db
}

func (svc *service) GetLogger() *logrus.Logger {
	return svc.logger
}

func (svc *service) GetEventPublisher() events.EventPublisher {
	return svc.eventPublisher
}

func (svc *service) WaitShutdown() {
	svc.logger.Info("Waiting for service to exit...")
	svc.wg.Wait()
}
