package service

import (
	"context"
	"errors"
	"time"

	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip19"
	"github.com/sirupsen/logrus"

	"github.com/getAlby/nostr-wallet-connect/events"
	"github.com/getAlby/nostr-wallet-connect/logger"
)

func (svc *service) StartNostr(ctx context.Context, encryptionKey string) error {

	relayUrl := svc.cfg.GetRelayUrl()

	err := svc.cfg.Start(encryptionKey)
	if err != nil {
		logger.Logger.WithError(err).Fatal("Failed to start config")
	}

	npub, err := nip19.EncodePublicKey(svc.cfg.GetNostrPublicKey())
	if err != nil {
		logger.Logger.WithError(err).Fatal("Error converting nostr privkey to pubkey")
	}

	logger.Logger.WithFields(logrus.Fields{
		"npub": npub,
		"hex":  svc.cfg.GetNostrPublicKey(),
	}).Info("Starting nostr-wallet-connect")
	svc.wg.Add(1)
	go func() {
		//Start infinite loop which will be only broken by canceling ctx (SIGINT)
		var relay *nostr.Relay

		for i := 0; ; i++ {
			// wait for a delay before retrying except on first iteration
			if i > 0 {
				sleepDuration := 10
				contextCancelled := false
				logger.Logger.Infof("[Iteration %d] Retrying in %d seconds...", i, sleepDuration)

				select {
				case <-ctx.Done(): //context cancelled
					logger.Logger.Info("service context cancelled while waiting for retry")
					contextCancelled = true
				case <-time.After(time.Duration(sleepDuration) * time.Second): //timeout
				}
				if contextCancelled {
					break
				}
			}
			if relay != nil && relay.IsConnected() {
				err := relay.Close()
				if err != nil {
					logger.Logger.WithError(err).Error("Could not close relay connection")
				}
			}

			//connect to the relay
			logger.Logger.Infof("Connecting to the relay: %s", relayUrl)

			relay, err := nostr.RelayConnect(ctx, relayUrl, nostr.WithNoticeHandler(svc.noticeHandler))
			if err != nil {
				logger.Logger.WithError(err).Error("Failed to connect to relay")
				continue
			}

			//publish event with NIP-47 info
			err = svc.nip47Service.PublishNip47Info(ctx, relay)
			if err != nil {
				logger.Logger.WithError(err).Error("Could not publish NIP47 info")
			}

			logger.Logger.Info("Subscribing to events")
			sub, err := relay.Subscribe(ctx, svc.createFilters(svc.cfg.GetNostrPublicKey()))
			if err != nil {
				logger.Logger.WithError(err).Error("Failed to subscribe to events")
				continue
			}
			err = svc.StartSubscription(sub.Context, sub)
			if err != nil {
				//err being non-nil means that we have an error on the websocket error channel. In this case we just try to reconnect.
				logger.Logger.WithError(err).Error("Got an error from the relay while listening to subscription.")
				continue
			}
			//err being nil means that the context was canceled and we should exit the program.
			break
		}
		logger.Logger.Info("Disconnecting from relay...")
		if relay != nil && relay.IsConnected() {
			err := relay.Close()
			if err != nil {
				logger.Logger.WithError(err).Error("Could not close relay connection")
			}
		}
		svc.Shutdown()
		logger.Logger.Info("Relay subroutine ended")
		svc.wg.Done()
	}()
	return nil
}

func (svc *service) StartApp(encryptionKey string) error {
	if !svc.cfg.CheckUnlockPassword(encryptionKey) {
		logger.Logger.Errorf("Invalid password")
		return errors.New("invalid password")
	}

	ctx, cancelFn := context.WithCancel(svc.ctx)

	err := svc.launchLNBackend(ctx, encryptionKey)
	if err != nil {
		logger.Logger.Errorf("Failed to launch LN backend: %v", err)
		svc.eventPublisher.Publish(&events.Event{
			Event: "nwc_node_start_failed",
		})
		cancelFn()
		return err
	}

	svc.StartNostr(ctx, encryptionKey)
	svc.appCancelFn = cancelFn
	return nil
}

// TODO: remove and call StopLNClient() instead
func (svc *service) StopApp() {
	if svc.appCancelFn != nil {
		svc.appCancelFn()
		svc.wg.Wait()
	}
}

func (svc *service) Shutdown() {
	svc.StopLNClient()
	svc.eventPublisher.Publish(&events.Event{
		Event: "nwc_stopped",
	})
	// wait for any remaining events
	time.Sleep(1 * time.Second)
}
