package controllers

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"github.com/getAlby/nostr-wallet-connect/db"
	"github.com/getAlby/nostr-wallet-connect/logger"
	"github.com/getAlby/nostr-wallet-connect/nip47/models"
	"github.com/nbd-wtf/go-nostr"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

type multiPayInvoiceElement struct {
	payInvoiceParams
	Id string `json:"id"`
}

type multiPayInvoiceParams struct {
	Invoices []multiPayInvoiceElement `json:"invoices"`
}

func (svc *controllersService) HandleMultiPayInvoiceEvent(ctx context.Context, nip47Request *models.Request, requestEventId uint, app *db.App, checkPermission checkPermissionFunc, respChan models.ResponseChannel) {
	multiPayParams := &multiPayInvoiceParams{}
	resp := decodeRequest(nip47Request, multiPayParams)
	if resp != nil {
		respChan <- &models.ControllerResponse{
			Response: resp,
			Tags:     &nostr.Tags{},
		}
		close(respChan)
		return
	}

	var wg sync.WaitGroup
	for _, invoiceInfo := range multiPayParams.Invoices {
		wg.Add(1)
		go func(invoiceInfo multiPayInvoiceElement) {
			defer wg.Done()
			bolt11 := invoiceInfo.Invoice
			// Convert invoice to lowercase string
			bolt11 = strings.ToLower(bolt11)
			paymentRequest, err := decodepay.Decodepay(bolt11)
			if err != nil {
				logger.Logger.WithFields(logrus.Fields{
					"request_event_id": requestEventId,
					"appId":            app.ID,
					"bolt11":           bolt11,
				}).Errorf("Failed to decode bolt11 invoice: %v", err)

				// TODO: Decide what to do if id is empty
				dTag := []string{"d", invoiceInfo.Id}
				respChan <- &models.ControllerResponse{
					Response: &models.Response{
						ResultType: nip47Request.Method,
						Error: &models.Error{
							Code:    models.ERROR_INTERNAL,
							Message: fmt.Sprintf("Failed to decode bolt11 invoice: %s", err.Error()),
						},
					},
					Tags: &nostr.Tags{dTag},
				}
				return
			}

			invoiceDTagValue := invoiceInfo.Id
			if invoiceDTagValue == "" {
				invoiceDTagValue = paymentRequest.PaymentHash
			}
			dTag := []string{"d", invoiceDTagValue}

			svc.pay(ctx, bolt11, &paymentRequest, nip47Request, requestEventId, app, checkPermission, respChan, nostr.Tags{dTag})
		}(invoiceInfo)
	}

	wg.Wait()
	close(respChan)
}
