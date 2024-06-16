package wails

import (
	"context"
	"embed"
	"log"

	"github.com/getAlby/nostr-wallet-connect/api"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/service"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"gorm.io/gorm"
)

type WailsApp struct {
	ctx context.Context
	svc service.Service
	api api.API
	db  *gorm.DB
}

func NewApp(svc service.Service) *WailsApp {
	return &WailsApp{
		svc: svc,
		api: api.NewAPI(svc, svc.GetDB(), svc.GetConfig(), svc.GetKeys(), svc.GetAlbyOAuthSvc(), svc.GetEventPublisher()),
		db:  svc.GetDB(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (app *WailsApp) startup(ctx context.Context) {
	app.ctx = ctx
}

func LaunchWailsApp(app *WailsApp, assets embed.FS, appIcon []byte) {
	err := wails.Run(&options.App{
		Title:  "AlbyHub",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Logger: NewWailsLogger(),
		// HideWindowOnClose: true, // with this on, there is no way to close the app - wait for v3

		//BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title: "AlbyHub",
				Icon:  appIcon,
			},
		},
		Linux: &linux.Options{
			Icon: appIcon,
		},
	})

	if err != nil {
		log.Fatalf("Error %v", err)
	}
}

func NewWailsLogger() WailsLogger {
	return WailsLogger{}
}

type WailsLogger struct {
}

func (wailsLogger WailsLogger) Print(message string) {
	logger.Logger.Print(message)
}

func (wailsLogger WailsLogger) Trace(message string) {
	logger.Logger.Trace(message)
}

func (wailsLogger WailsLogger) Debug(message string) {
	logger.Logger.Debug(message)
}

func (wailsLogger WailsLogger) Info(message string) {
	logger.Logger.Info(message)
}

func (wailsLogger WailsLogger) Warning(message string) {
	logger.Logger.Warning(message)
}

func (wailsLogger WailsLogger) Error(message string) {
	logger.Logger.Error(message)
}

func (wailsLogger WailsLogger) Fatal(message string) {
	logger.Logger.Fatal(message)
}
