package service

import (
	"context"

	"errors"
	"fmt"
	"net/http"
	"net/http/pprof"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"

	"github.com/adrg/xdg"
	"github.com/nbd-wtf/go-nostr"
	"gopkg.in/DataDog/dd-trace-go.v1/profiler"
	"gorm.io/gorm"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"

	"github.com/getAlby/nostr-wallet-connect/alby"
	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/logger"

	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/lnclient"
	"github.com/getAlby/nostr-wallet-connect/lnclient/breez"
	"github.com/getAlby/nostr-wallet-connect/lnclient/cashu"
	"github.com/getAlby/nostr-wallet-connect/lnclient/greenlight"
	"github.com/getAlby/nostr-wallet-connect/lnclient/ldk"
	"github.com/getAlby/nostr-wallet-connect/lnclient/lnd"
	"github.com/getAlby/nostr-wallet-connect/lnclient/phoenixd"
	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
)

type service struct {
	cfg config.Config

	db             *gorm.DB
	lnClient       lnclient.LNClient
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

	logger.Init(appConfig.LogLevel)

	if appConfig.Workdir == "" {
		appConfig.Workdir = filepath.Join(xdg.DataHome, "/alby-nwc")
		logger.Logger.WithField("workdir", appConfig.Workdir).Info("No workdir specified, using default")
	}
	// make sure workdir exists
	os.MkdirAll(appConfig.Workdir, os.ModePerm)

	err = logger.AddFileLogger(appConfig.Workdir)
	if err != nil {
		return nil, err
	}

	finishRestoreNode(appConfig.Workdir)

	// If DATABASE_URI is a URI or a path, leave it unchanged.
	// If it only contains a filename, prepend the workdir.
	if !strings.HasPrefix(appConfig.DatabaseUri, "file:") {
		databasePath, _ := filepath.Split(appConfig.DatabaseUri)
		if databasePath == "" {
			appConfig.DatabaseUri = filepath.Join(appConfig.Workdir, appConfig.DatabaseUri)
		}
	}

	gormDB, err := db.NewDB(appConfig.DatabaseUri)
	if err != nil {
		return nil, err
	}

	cfg := config.NewConfig(appConfig, gormDB)

	eventPublisher := events.NewEventPublisher()

	if err != nil {
		logger.Logger.WithError(err).Error("Failed to create Alby OAuth service")
		return nil, err
	}

	var wg sync.WaitGroup
	svc := &service{
		cfg:            cfg,
		ctx:            ctx,
		wg:             &wg,
		eventPublisher: eventPublisher,
		albyOAuthSvc:   alby.NewAlbyOAuthService(gormDB, cfg),
		nip47Service:   nip47.NewNip47Service(gormDB, cfg, eventPublisher),
		db:             gormDB,
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
		logger.Logger.Info("Shutting down LDK client")
		err := svc.lnClient.Shutdown()
		if err != nil {
			logger.Logger.WithError(err).Error("Failed to stop LN backend")
			svc.eventPublisher.Publish(&events.Event{
				Event: "nwc_node_stop_failed",
				Properties: map[string]interface{}{
					"error": fmt.Sprintf("%v", err),
				},
			})
			return err
		}
		logger.Logger.Info("Publishing node shutdown event")
		svc.lnClient = nil
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_node_stopped",
		})
	}
	logger.Logger.Info("LNClient stopped successfully")
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

	logger.Logger.Infof("Launching LN Backend: %s", lnBackend)
	var lnClient lnclient.LNClient
	switch lnBackend {
	case config.LNDBackendType:
		LNDAddress, _ := svc.cfg.Get("LNDAddress", encryptionKey)
		LNDCertHex, _ := svc.cfg.Get("LNDCertHex", encryptionKey)
		LNDMacaroonHex, _ := svc.cfg.Get("LNDMacaroonHex", encryptionKey)
		lnClient, err = lnd.NewLNDService(ctx, LNDAddress, LNDCertHex, LNDMacaroonHex)
	case config.LDKBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		LDKWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "ldk")

		lnClient, err = ldk.NewLDKService(ctx, svc.cfg, svc.eventPublisher, Mnemonic, LDKWorkdir, svc.cfg.GetEnv().LDKNetwork, svc.cfg.GetEnv().LDKEsploraServer, svc.cfg.GetEnv().LDKGossipSource)
	case config.GreenlightBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		GreenlightInviteCode, _ := svc.cfg.Get("GreenlightInviteCode", encryptionKey)
		GreenlightWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "greenlight")

		lnClient, err = greenlight.NewGreenlightService(svc.cfg, Mnemonic, GreenlightInviteCode, GreenlightWorkdir, encryptionKey)
	case config.BreezBackendType:
		Mnemonic, _ := svc.cfg.Get("Mnemonic", encryptionKey)
		BreezAPIKey, _ := svc.cfg.Get("BreezAPIKey", encryptionKey)
		GreenlightInviteCode, _ := svc.cfg.Get("GreenlightInviteCode", encryptionKey)
		BreezWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "breez")

		lnClient, err = breez.NewBreezService(Mnemonic, BreezAPIKey, GreenlightInviteCode, BreezWorkdir)
	case config.PhoenixBackendType:
		PhoenixdAddress, _ := svc.cfg.Get("PhoenixdAddress", encryptionKey)
		PhoenixdAuthorization, _ := svc.cfg.Get("PhoenixdAuthorization", encryptionKey)

		lnClient, err = phoenixd.NewPhoenixService(PhoenixdAddress, PhoenixdAuthorization)
	case config.CashuBackendType:
		cashuMintUrl, _ := svc.cfg.Get("CashuMintUrl", encryptionKey)
		cashuWorkdir := path.Join(svc.cfg.GetEnv().Workdir, "cashu")

		lnClient, err = cashu.NewCashuService(cashuWorkdir, cashuMintUrl)
	default:
		logger.Logger.Fatalf("Unsupported LNBackendType: %v", lnBackend)
	}
	if err != nil {
		logger.Logger.WithError(err).Error("Failed to launch LN backend")
		return err
	}

	info, err := lnClient.GetInfo(ctx)
	if err != nil {
		logger.Logger.WithError(err).Error("Failed to fetch node info")
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
		Kinds: []int{models.REQUEST_KIND},
	}
	return []nostr.Filter{filter}
}

func (svc *service) noticeHandler(notice string) {
	logger.Logger.Infof("Received a notice %s", notice)
}

func (svc *service) GetLNClient() lnclient.LNClient {
	return svc.lnClient
}

func (svc *service) StartSubscription(ctx context.Context, sub *nostr.Subscription) error {
	svc.nip47Service.StartNotifier(ctx, sub.Relay, svc.lnClient)

	go func() {
		// block till EOS is received
		<-sub.EndOfStoredEvents
		logger.Logger.Info("Received EOS")

		// loop through incoming events
		for event := range sub.Events {
			go svc.nip47Service.HandleEvent(ctx, sub, event, svc.lnClient)
		}
		logger.Logger.Info("Relay subscription events channel ended")
	}()

	<-ctx.Done()

	if sub.Relay.ConnectionError != nil {
		logger.Logger.WithField("connectionError", sub.Relay.ConnectionError).Error("Relay error")
		return sub.Relay.ConnectionError
	}
	logger.Logger.Info("Exiting subscription...")
	return nil
}

func finishRestoreNode(workDir string) {
	restoreDir := filepath.Join(workDir, "restore")
	if restoreDirStat, err := os.Stat(restoreDir); err == nil && restoreDirStat.IsDir() {
		logger.Logger.WithField("restoreDir", restoreDir).Infof("Restore directory found. Finishing Node restore")

		existingFiles, err := os.ReadDir(restoreDir)
		if err != nil {
			logger.Logger.WithError(err).Fatal("Failed to read WORK_DIR")
		}

		for _, file := range existingFiles {
			if file.Name() != "restore" {
				err = os.RemoveAll(filepath.Join(workDir, file.Name()))
				if err != nil {
					logger.Logger.WithField("filename", file.Name()).WithError(err).Fatal("Failed to remove file")
				}
				logger.Logger.WithField("filename", file.Name()).Info("removed file")
			}
		}

		files, err := os.ReadDir(restoreDir)
		if err != nil {
			logger.Logger.WithError(err).Fatal("Failed to read restore directory")
		}
		for _, file := range files {
			err = os.Rename(filepath.Join(restoreDir, file.Name()), filepath.Join(workDir, file.Name()))
			if err != nil {
				logger.Logger.WithField("filename", file.Name()).WithError(err).Fatal("Failed to move file")
			}
			logger.Logger.WithField("filename", file.Name()).Info("copied file from restore directory")
		}
		err = os.RemoveAll(restoreDir)
		if err != nil {
			logger.Logger.WithError(err).Fatal("Failed to remove restore directory")
		}
		logger.Logger.WithField("restoreDir", restoreDir).Info("removed restore directory")
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

func (svc *service) GetDB() *gorm.DB {
	return svc.db
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

func (svc *service) GetEventPublisher() events.EventPublisher {
	return svc.eventPublisher
}

func (svc *service) WaitShutdown() {
	logger.Logger.Info("Waiting for service to exit...")
	svc.wg.Wait()
}
