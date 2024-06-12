//go:build wails
// +build wails

package main

import (
	"context"
	"embed"

	"github.com/getAlby/nostr-wallet-connect/service"
	"github.com/getAlby/nostr-wallet-connect/wails"
	log "github.com/sirupsen/logrus"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed appicon.png
var appIcon []byte

// ignore this warning: we use build tags
// this function will only be executed if the wails tag is set
func main() {
	log.Info("NWC Starting in WAILS mode")
	ctx, cancel := context.WithCancel(context.Background())
	svc, _ := service.NewService(ctx)

	app := wails.NewApp(svc)
	wails.LaunchWailsApp(app, assets, appIcon)
	svc.GetLogger().Info("Wails app exited")

	svc.GetLogger().Info("Cancelling service context...")
	// cancel the service context
	cancel()
	svc.WaitShutdown()
	svc.GetLogger().Info("Service exited")
}
