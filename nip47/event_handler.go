package nip47

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip04"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

func (svc *nip47Service) HandleEvent(ctx context.Context, sub *nostr.Subscription, event *nostr.Event) {
	var nip47Response *Response
	svc.logger.WithFields(logrus.Fields{
		"requestEventNostrId": event.ID,
		"eventKind":           event.Kind,
	}).Info("Processing Event")

	ss, err := nip04.ComputeSharedSecret(event.PubKey, svc.cfg.GetNostrSecretKey())
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
		}).Errorf("Failed to compute shared secret: %v", err)
		return
	}

	// store request event
	requestEvent := db.RequestEvent{AppId: nil, NostrId: event.ID, State: db.REQUEST_EVENT_STATE_HANDLER_EXECUTING}
	err = svc.db.Create(&requestEvent).Error
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			svc.logger.WithFields(logrus.Fields{
				"requestEventNostrId": event.ID,
			}).Warn("Event already processed")
			return
		}
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
		}).Errorf("Failed to save nostr event: %v", err)
		nip47Response = &Response{
			Error: &Error{
				Code:    ERROR_INTERNAL,
				Message: fmt.Sprintf("Failed to save nostr event: %s", err.Error()),
			},
		}
		resp, err := svc.CreateResponse(event, nip47Response, nostr.Tags{}, ss)
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"requestEventNostrId": event.ID,
				"eventKind":           event.Kind,
			}).Errorf("Failed to process event: %v", err)
		}
		svc.PublishResponseEvent(ctx, sub, &requestEvent, resp, nil)
		return
	}

	app := db.App{}
	err = svc.db.First(&app, &db.App{
		NostrPubkey: event.PubKey,
	}).Error
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"nostrPubkey": event.PubKey,
		}).Errorf("Failed to find app for nostr pubkey: %v", err)

		nip47Response = &Response{
			Error: &Error{
				Code:    ERROR_UNAUTHORIZED,
				Message: "The public key does not have a wallet connected.",
			},
		}
		resp, err := svc.CreateResponse(event, nip47Response, nostr.Tags{}, ss)
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"requestEventNostrId": event.ID,
				"eventKind":           event.Kind,
			}).Errorf("Failed to process event: %v", err)
		}
		svc.PublishResponseEvent(ctx, sub, &requestEvent, resp, &app)

		requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}
		return
	}

	requestEvent.AppId = &app.ID
	err = svc.db.Save(&requestEvent).Error
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"nostrPubkey": event.PubKey,
		}).Errorf("Failed to save app to nostr event: %v", err)

		nip47Response = &Response{
			Error: &Error{
				Code:    ERROR_UNAUTHORIZED,
				Message: fmt.Sprintf("Failed to save app to nostr event: %s", err.Error()),
			},
		}
		resp, err := svc.CreateResponse(event, nip47Response, nostr.Tags{}, ss)
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"requestEventNostrId": event.ID,
				"eventKind":           event.Kind,
			}).Errorf("Failed to process event: %v", err)
		}
		svc.PublishResponseEvent(ctx, sub, &requestEvent, resp, &app)

		requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}

		return
	}

	svc.logger.WithFields(logrus.Fields{
		"requestEventNostrId": event.ID,
		"eventKind":           event.Kind,
		"appId":               app.ID,
	}).Info("App found for nostr event")

	//to be extra safe, decrypt using the key found from the app
	ss, err = nip04.ComputeSharedSecret(app.NostrPubkey, svc.cfg.GetNostrSecretKey())
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
		}).Errorf("Failed to process event: %v", err)

		requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}

		return
	}
	payload, err := nip04.Decrypt(event.Content, ss)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
			"appId":               app.ID,
		}).Errorf("Failed to decrypt content: %v", err)
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
		}).Errorf("Failed to process event: %v", err)

		requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}

		return
	}
	nip47Request := &Request{}
	err = json.Unmarshal([]byte(payload), nip47Request)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": event.ID,
			"eventKind":           event.Kind,
		}).Errorf("Failed to process event: %v", err)

		requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}

		return
	}

	requestEvent.Method = nip47Request.Method
	requestEvent.ContentData = payload
	svc.db.Save(&requestEvent) // we ignore potential DB errors here as this only saves the method and content data

	// TODO: replace with a channel
	// TODO: update all previous occurences of svc.PublishResponseEvent to also use the channel
	publishResponse := func(nip47Response *Response, tags nostr.Tags) {
		resp, err := svc.CreateResponse(event, nip47Response, tags, ss)
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"requestEventNostrId": event.ID,
				"eventKind":           event.Kind,
			}).Errorf("Failed to create response: %v", err)
			requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
		} else {
			err = svc.PublishResponseEvent(ctx, sub, &requestEvent, resp, &app)
			if err != nil {
				svc.logger.WithFields(logrus.Fields{
					"requestEventNostrId": event.ID,
					"eventKind":           event.Kind,
				}).Errorf("Failed to publish event: %v", err)
				requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_ERROR
			} else {
				requestEvent.State = db.REQUEST_EVENT_STATE_HANDLER_EXECUTED
			}
		}
		err = svc.db.Save(&requestEvent).Error
		if err != nil {
			svc.logger.WithFields(logrus.Fields{
				"nostrPubkey": event.PubKey,
			}).Errorf("Failed to save state to nostr event: %v", err)
		}
	}

	switch nip47Request.Method {
	case MULTI_PAY_INVOICE_METHOD:
		svc.HandleMultiPayInvoiceEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case MULTI_PAY_KEYSEND_METHOD:
		svc.HandleMultiPayKeysendEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case PAY_INVOICE_METHOD:
		svc.HandlePayInvoiceEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case PAY_KEYSEND_METHOD:
		svc.HandlePayKeysendEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case GET_BALANCE_METHOD:
		svc.HandleGetBalanceEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case MAKE_INVOICE_METHOD:
		svc.HandleMakeInvoiceEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case LOOKUP_INVOICE_METHOD:
		svc.HandleLookupInvoiceEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case LIST_TRANSACTIONS_METHOD:
		svc.HandleListTransactionsEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case GET_INFO_METHOD:
		svc.HandleGetInfoEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	case SIGN_MESSAGE_METHOD:
		svc.HandleSignMessageEvent(ctx, nip47Request, &requestEvent, &app, publishResponse)
	default:
		svc.HandleUnknownMethod(ctx, nip47Request, publishResponse)
	}
}

func (svc *nip47Service) HandleUnknownMethod(ctx context.Context, nip47Request *Request, publishResponse func(*Response, nostr.Tags)) {
	publishResponse(&Response{
		ResultType: nip47Request.Method,
		Error: &Error{
			Code:    ERROR_NOT_IMPLEMENTED,
			Message: fmt.Sprintf("Unknown method: %s", nip47Request.Method),
		},
	}, nostr.Tags{})
}

func (svc *nip47Service) CreateResponse(initialEvent *nostr.Event, content interface{}, tags nostr.Tags, ss []byte) (result *nostr.Event, err error) {
	payloadBytes, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}
	msg, err := nip04.Encrypt(string(payloadBytes), ss)
	if err != nil {
		return nil, err
	}

	allTags := nostr.Tags{[]string{"p", initialEvent.PubKey}, []string{"e", initialEvent.ID}}
	allTags = append(allTags, tags...)

	resp := &nostr.Event{
		PubKey:    svc.cfg.GetNostrPublicKey(),
		CreatedAt: nostr.Now(),
		Kind:      RESPONSE_KIND,
		Tags:      allTags,
		Content:   msg,
	}
	err = resp.Sign(svc.cfg.GetNostrSecretKey())
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (svc *nip47Service) GetMethods(app *db.App) []string {
	appPermissions := []db.AppPermission{}
	svc.db.Find(&appPermissions, &db.AppPermission{
		AppId: app.ID,
	})
	requestMethods := make([]string, 0, len(appPermissions))
	for _, appPermission := range appPermissions {
		requestMethods = append(requestMethods, appPermission.RequestMethod)
	}
	if slices.Contains(requestMethods, PAY_INVOICE_METHOD) {
		// all payment methods are tied to the pay_invoice permission
		requestMethods = append(requestMethods, PAY_KEYSEND_METHOD, MULTI_PAY_INVOICE_METHOD, MULTI_PAY_KEYSEND_METHOD)
	}

	return requestMethods
}

func (svc *nip47Service) decodeNip47Request(nip47Request *Request, requestEvent *db.RequestEvent, app *db.App, methodParams interface{}) *Response {
	err := json.Unmarshal(nip47Request.Params, methodParams)
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               app.ID,
		}).Errorf("Failed to decode nostr event: %v", err)
		return &Response{
			ResultType: nip47Request.Method,
			Error: &Error{
				Code:    ERROR_BAD_REQUEST,
				Message: err.Error(),
			}}
	}
	return nil
}

func (svc *nip47Service) PublishResponseEvent(ctx context.Context, sub *nostr.Subscription, requestEvent *db.RequestEvent, resp *nostr.Event, app *db.App) error {
	var appId *uint
	if app != nil {
		appId = &app.ID
	}
	responseEvent := db.ResponseEvent{NostrId: resp.ID, RequestId: requestEvent.ID, State: "received"}
	err := svc.db.Create(&responseEvent).Error
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventNostrId": requestEvent.NostrId,
			"appId":               appId,
			"replyEventId":        resp.ID,
		}).Errorf("Failed to save response/reply event: %v", err)
		return err
	}

	err = sub.Relay.Publish(ctx, *resp)
	if err != nil {
		responseEvent.State = db.RESPONSE_EVENT_STATE_PUBLISH_FAILED
		svc.logger.WithFields(logrus.Fields{
			"requestEventId":       requestEvent.ID,
			"requestNostrEventId":  requestEvent.NostrId,
			"appId":                appId,
			"responseEventId":      responseEvent.ID,
			"responseNostrEventId": resp.ID,
		}).Errorf("Failed to publish reply: %v", err)
	} else {
		responseEvent.State = db.RESPONSE_EVENT_STATE_PUBLISH_CONFIRMED
		responseEvent.RepliedAt = time.Now()
		svc.logger.WithFields(logrus.Fields{
			"requestEventId":       requestEvent.ID,
			"requestNostrEventId":  requestEvent.NostrId,
			"appId":                appId,
			"responseEventId":      responseEvent.ID,
			"responseNostrEventId": resp.ID,
		}).Info("Published reply")
	}

	err = svc.db.Save(&responseEvent).Error
	if err != nil {
		svc.logger.WithFields(logrus.Fields{
			"requestEventId":       requestEvent.ID,
			"requestNostrEventId":  requestEvent.NostrId,
			"appId":                appId,
			"responseEventId":      responseEvent.ID,
			"responseNostrEventId": resp.ID,
		}).Errorf("Failed to update response/reply event: %v", err)
		return err
	}

	return nil
}
