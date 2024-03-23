package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/getAlby/nostr-wallet-connect/models/lnclient"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type PayResponse struct {
	PaymentHash     string `json:"paymentHash"`
	PaymentId       string `json:"paymentId"`
	PaymentPreimage string `json:"paymentPreimage"`
	RoutingFeeSat   int64  `json:"routingFeeSat"`
}

type InvoiceResponse struct {
	AmountSat   int64  `json:"amountSat"`
	PaymentHash string `json:"paymentHash"`
	Serialized  string `json:"serialized"`
}

type InfoResponse struct {
	NodeId string `json:"nodeId"`
}

type BalanceResponse struct {
	BalanceSat   int64 `json:"balanceSat"`
	FeeCreditSat int64 `json:"feeCreditSat"`
}

type PhoenixService struct {
	Address       string
	Authorization string
	db            *gorm.DB
	Logger        *logrus.Logger
}

func NewPhoenixService(svc *Service, address string, authorization string) (result lnclient.LNClient, err error) {

	phoenixService := &PhoenixService{Logger: svc.Logger, db: svc.db, Address: address, Authorization: authorization}

	return phoenixService, nil
}

func (svc *PhoenixService) GetBalance(ctx context.Context) (balance int64, err error) {
	req, err := http.NewRequest(http.MethodGet, svc.Address+"/getbalance", nil)
	if err != nil {
		return 0, err
	}
	req.Header.Add("Authorization", "Basic "+svc.Authorization)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	defer resp.Body.Close()

	var balanceRes BalanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&balanceRes); err != nil {
		return 0, err
	}

	svc.Logger.Infof("%v", balanceRes)
	balance = balanceRes.BalanceSat + balanceRes.FeeCreditSat
	return balance * 1000, nil

}

func (svc *PhoenixService) ListTransactions(ctx context.Context, from, until, limit, offset uint64, unpaid bool, invoiceType string) (transactions []Nip47Transaction, err error) {
	transactions = []Nip47Transaction{}
	return transactions, nil
}

func (svc *PhoenixService) GetInfo(ctx context.Context) (info *lnclient.NodeInfo, err error) {
	req, err := http.NewRequest(http.MethodGet, svc.Address+"/getinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Basic "+svc.Authorization)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	defer resp.Body.Close()

	var infoRes InfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&infoRes); err != nil {
		return nil, err
	}
	return &lnclient.NodeInfo{
		Alias:       "Phoenix",
		Color:       "",
		Pubkey:      infoRes.NodeId,
		Network:     "bitcoin",
		BlockHeight: 0,
		BlockHash:   "",
	}, nil
}

func (svc *PhoenixService) ListChannels(ctx context.Context) ([]lnclient.Channel, error) {
	channels := []lnclient.Channel{}
	return channels, nil
}

func (svc *PhoenixService) MakeInvoice(ctx context.Context, amount int64, description string, descriptionHash string, expiry int64) (transaction *Nip47Transaction, err error) {
	form := url.Values{}
	form.Add("amountSat", strconv.FormatInt(amount/1000, 10))
	form.Add("description", description)
	req, err := http.NewRequest(http.MethodPost, svc.Address+"/createinvoice", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Add("Authorization", "Basic "+svc.Authorization)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	defer resp.Body.Close()

	var invoiceRes InvoiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&invoiceRes); err != nil {
		return nil, err
	}
	expiresAt := time.Now().Add(1 * time.Hour).Unix()

	tx := &Nip47Transaction{
		Type:        "incoming",
		Invoice:     invoiceRes.Serialized,
		Preimage:    "",
		PaymentHash: invoiceRes.PaymentHash,
		FeesPaid:    0,
		CreatedAt:   time.Now().Unix(),
		ExpiresAt:   &expiresAt,
		SettledAt:   nil,
		Metadata:    nil,
	}
	return tx, nil
}

func (svc *PhoenixService) LookupInvoice(ctx context.Context, paymentHash string) (transaction *Nip47Transaction, err error) {
	return nil, errors.New("not implemented")
}

func (svc *PhoenixService) SendPaymentSync(ctx context.Context, payReq string) (preimage string, err error) {
	form := url.Values{}
	form.Add("invoice", payReq)
	req, err := http.NewRequest(http.MethodPost, svc.Address+"/payinvoice", strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Add("Authorization", "Basic "+svc.Authorization)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	defer resp.Body.Close()

	var payRes PayResponse
	if err := json.NewDecoder(resp.Body).Decode(&payRes); err != nil {
		return "", err
	}

	return payRes.PaymentPreimage, nil
}

func (svc *PhoenixService) SendKeysend(ctx context.Context, amount int64, destination, preimage string, custom_records []lnclient.TLVRecord) (respPreimage string, err error) {
	return "", errors.New("not implemented")
}

func (svc *PhoenixService) RedeemOnchainFunds(ctx context.Context, toAddress string) (txId string, err error) {
	return "", errors.New("not implemented")
}

func (svc *PhoenixService) ResetRouter(ctx context.Context) error {
	return nil
}

func (svc *PhoenixService) Shutdown() error {
	return nil
}

func (svc *PhoenixService) GetNodeConnectionInfo(ctx context.Context) (nodeConnectionInfo *lnclient.NodeConnectionInfo, err error) {
	return &lnclient.NodeConnectionInfo{}, nil
}

func (svc *PhoenixService) ConnectPeer(ctx context.Context, connectPeerRequest *lnclient.ConnectPeerRequest) error {
	return nil
}
func (svc *PhoenixService) OpenChannel(ctx context.Context, openChannelRequest *lnclient.OpenChannelRequest) (*lnclient.OpenChannelResponse, error) {
	return nil, nil
}

func (svc *PhoenixService) CloseChannel(ctx context.Context, closeChannelRequest *lnclient.CloseChannelRequest) (*lnclient.CloseChannelResponse, error) {
	return nil, nil
}

func (svc *PhoenixService) GetNewOnchainAddress(ctx context.Context) (string, error) {
	return "", nil
}

func (svc *PhoenixService) GetOnchainBalance(ctx context.Context) (*lnclient.OnchainBalanceResponse, error) {
	return nil, errors.New("not implemented")
}
