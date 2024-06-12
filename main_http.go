//go:build !wails || http
// +build !wails http

// (http tag above is simply to fix go language server issue and is not needed to build the app)

package main

import (
	"context"
	"fmt"
	nethttp "net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	echologrus "github.com/davrux/echo-logrus/v4"
	"github.com/getAlby/nostr-wallet-connect/http"
	"github.com/getAlby/nostr-wallet-connect/service"
	"github.com/labstack/echo/v4"
	log "github.com/sirupsen/logrus"
)

// ignore this warning: we use build tags
// this function will only be executed if no wails tag is set
func main() {
	log.Info("NWC Starting in HTTP mode")
	ctx, _ := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM, os.Kill)
	svc, _ := service.NewService(ctx)

	echologrus.Logger = svc.GetLogger()
	e := echo.New()

	//register shared routes
	httpSvc := http.NewHttpService(svc, svc.GetLogger(), svc.GetDB(), svc.GetEventPublisher())
	httpSvc.RegisterSharedRoutes(e)
	//start Echo server
	go func() {
		if err := e.Start(fmt.Sprintf(":%v", svc.GetConfig().GetEnv().Port)); err != nil && err != nethttp.ErrServerClosed {
			svc.GetLogger().Fatalf("shutting down the server: %v", err)
		}
	}()
	//handle graceful shutdown
	<-ctx.Done()
	svc.GetLogger().Infof("Shutting down echo server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	e.Shutdown(ctx)
	svc.GetLogger().Info("Echo server exited")
	svc.WaitShutdown()
	svc.GetLogger().Info("Service exited")
}
