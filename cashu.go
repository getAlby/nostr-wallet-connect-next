package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/elnosh/gonuts/wallet"
	"github.com/getAlby/nostr-wallet-connect/models/config"
	"github.com/getAlby/nostr-wallet-connect/models/lnclient"
	decodepay "github.com/nbd-wtf/ln-decodepay"
	"github.com/sirupsen/logrus"
)

type CashuService struct {
	logger  *logrus.Logger
	wallet  *wallet.Wallet
	kvStore config.ConfigKVStore
}

func NewCashuService(logger *logrus.Logger, workDir string, mintUrl string, kvStore config.ConfigKVStore) (result lnclient.LNClient, err error) {
	if workDir == "" {
		return nil, errors.New("one or more required cashu configuration are missing")
	}
	if mintUrl == "" {
		mintUrl = "https://8333.space:3338"
	}

	//create dir if not exists
	newpath := filepath.Join(workDir)
	err = os.MkdirAll(newpath, os.ModePerm)
	if err != nil {
		log.Printf("Failed to create cashu working dir: %v", err)
		return nil, err
	}

	logger.WithField("mintUrl", mintUrl).Info("Setting up cashu wallet")
	// TODO: can mnemonic be used?
	config := wallet.Config{WalletPath: newpath, CurrentMintURL: mintUrl, DomainSeparation: false}

	wallet, err := wallet.LoadWallet(config)
	if err != nil {
		logger.WithError(err).Error("Failed to load cashu wallet")
		return nil, err
	}

	cs := CashuService{
		logger:  logger,
		wallet:  wallet,
		kvStore: kvStore,
	}

	return &cs, nil
}

func (cs *CashuService) Shutdown() error {
	return nil
}

func (cs *CashuService) SendPaymentSync(ctx context.Context, invoice string) (preimage string, err error) {
	meltResponse, err := cs.wallet.Melt(invoice, cs.wallet.CurrentMint())
	if err != nil {
		cs.logger.WithError(err).Error("Failed to melt invoice")
		return "", err
	}

	if meltResponse == nil || meltResponse.Preimage == "" {
		return "", errors.New("no preimage in mint response")
	}

	return meltResponse.Preimage, nil
}

func (cs *CashuService) SendKeysend(ctx context.Context, amount int64, destination, preimage string, custom_records []lnclient.TLVRecord) (preImage string, err error) {
	return "", nil
}

func (cs *CashuService) GetBalance(ctx context.Context) (balance int64, err error) {
	balanceByMints := cs.wallet.GetBalanceByMints()
	totalBalance := uint64(0)

	for _, balance := range balanceByMints {
		totalBalance += balance
	}

	return int64(totalBalance * 1000), nil
}

func (cs *CashuService) MakeInvoice(ctx context.Context, amount int64, description string, descriptionHash string, expiry int64) (transaction *Nip47Transaction, err error) {
	mintResponse, err := cs.wallet.RequestMint(uint64(amount / 1000))
	if err != nil {
		cs.logger.WithError(err).Error("Failed to mint")
		return nil, err
	}

	// TODO: why is payment hash nil?
	// invoice := cs.wallet.GetInvoice(mintResponse.Request)
	// if invoice == nil {
	// 	return nil, errors.New("could not get invoice from payment request")
	// }

	paymentRequest, err := decodepay.Decodepay(mintResponse.Request)
	if err != nil {
		cs.logger.WithFields(logrus.Fields{
			"invoice": mintResponse.Request,
		}).WithError(err).Error("Failed to decode bolt11 invoice")
		return nil, err
	}

	// hack because cannot currently fetch invoice by payment hash from wallet DB
	cs.kvStore.SetUpdate(fmt.Sprintf("cashu_invoice_%s", paymentRequest.PaymentHash), mintResponse.Request, "")

	return cs.LookupInvoice(ctx, paymentRequest.PaymentHash)
}

func (cs *CashuService) LookupInvoice(ctx context.Context, paymentHash string) (transaction *Nip47Transaction, err error) {
	invoice, err := cs.kvStore.Get(fmt.Sprintf("cashu_invoice_%s", paymentHash), "")

	if err != nil {
		cs.logger.WithField("paymentHash", paymentHash).WithError(err).Error("Failed to lookup invoice from kv store")
		return nil, err
	}

	if invoice == "" {
		cs.logger.WithField("paymentHash", paymentHash).Error("Failed to lookup payment request by payment hash")
		return nil, errors.New("failed to lookup payment request by payment hash")
	}

	paymentRequest, err := decodepay.Decodepay(invoice)
	if err != nil {
		cs.logger.WithFields(logrus.Fields{
			"invoice": invoice,
		}).WithError(err).Error("Failed to decode bolt11 invoice")
		return nil, err
	}

	cashuInvoice := cs.wallet.GetInvoice(invoice)
	if cashuInvoice == nil {
		cs.logger.WithField("paymentHash", paymentHash).Error("Failed to get invoice from cashu db")
		return nil, errors.New("invoice not found in cashu db")
	}

	if !cashuInvoice.Redeemed {
		proofs, err := cs.wallet.MintTokens(cashuInvoice.Id)
		if err != nil {
			cs.logger.WithFields(logrus.Fields{
				"paymentHash": paymentHash,
			}).WithError(err).Warn("failed to mint")
		}

		if proofs != nil {
			cs.logger.WithFields(logrus.Fields{
				"paymentHash": paymentHash,
				"amount":      proofs.Amount(),
			}).Info("sats successfully minted")

			// hack because cannot currently fetch settle date from cashu db
			cs.kvStore.SetUpdate(fmt.Sprintf("cashu_invoice_%s_settled", paymentRequest.PaymentHash), fmt.Sprintf("%d", time.Now().Unix()), "")
		}
	}

	var settledAt *int64
	invoiceSettled, err := cs.kvStore.Get(fmt.Sprintf("cashu_invoice_%s_settled", paymentHash), "")
	if err != nil {
		cs.logger.WithField("paymentHash", paymentHash).WithError(err).Error("Failed to lookup invoice settle date from kv store")
		return nil, err
	}
	if invoiceSettled != "" {
		settledAtValue, err := strconv.ParseInt(invoiceSettled, 10, 64)
		if err != nil {
			cs.logger.WithFields(logrus.Fields{"paymentHash": paymentHash, "invoiceSettled": invoiceSettled}).WithError(err).Error("Failed to parse invoice settle date")
			return nil, err
		}
		settledAt = &settledAtValue
	}

	var expiresAt *int64

	expiresAtUnix := time.UnixMilli(int64(paymentRequest.CreatedAt) * 1000).Add(time.Duration(paymentRequest.Expiry) * time.Second).Unix()
	expiresAt = &expiresAtUnix
	description := paymentRequest.Description
	descriptionHash := paymentRequest.DescriptionHash

	transaction = &Nip47Transaction{
		Type:            "incoming",
		Invoice:         invoice,
		PaymentHash:     paymentRequest.PaymentHash,
		Amount:          paymentRequest.MSatoshi,
		CreatedAt:       int64(paymentRequest.CreatedAt),
		ExpiresAt:       expiresAt,
		Description:     description,
		DescriptionHash: descriptionHash,
		//Preimage: cashuInvoice.,
		SettledAt: settledAt,
	}

	return transaction, nil
}

func (cs *CashuService) ListTransactions(ctx context.Context, from, until, limit, offset uint64, unpaid bool, invoiceType string) (transactions []Nip47Transaction, err error) {
	transactions = []Nip47Transaction{}

	return transactions, nil
}

func (cs *CashuService) GetInfo(ctx context.Context) (info *lnclient.NodeInfo, err error) {
	// TODO: should alias, color be configured in LDK-node? or can we manage them in NWC?
	// an alias is only needed if the user has public channels and wants their node to be publicly visible?
	return &lnclient.NodeInfo{
		Alias:       "NWC",
		Color:       "#897FFF",
		Pubkey:      "",
		Network:     "bitcoin",
		BlockHeight: 0,
		BlockHash:   "",
	}, nil
}

func (cs *CashuService) ListChannels(ctx context.Context) ([]lnclient.Channel, error) {
	return nil, nil
}

func (cs *CashuService) GetNodeConnectionInfo(ctx context.Context) (nodeConnectionInfo *lnclient.NodeConnectionInfo, err error) {
	return nil, nil
}

func (cs *CashuService) ConnectPeer(ctx context.Context, connectPeerRequest *lnclient.ConnectPeerRequest) error {
	return nil
}

func (cs *CashuService) OpenChannel(ctx context.Context, openChannelRequest *lnclient.OpenChannelRequest) (*lnclient.OpenChannelResponse, error) {
	return nil, nil
}

func (cs *CashuService) CloseChannel(ctx context.Context, closeChannelRequest *lnclient.CloseChannelRequest) (*lnclient.CloseChannelResponse, error) {
	return nil, nil
}

func (cs *CashuService) GetNewOnchainAddress(ctx context.Context) (string, error) {
	return "", nil
}

func (cs *CashuService) GetOnchainBalance(ctx context.Context) (*lnclient.OnchainBalanceResponse, error) {
	return &lnclient.OnchainBalanceResponse{
		Spendable: 0,
		Total:     0,
	}, nil
}

func (cs *CashuService) RedeemOnchainFunds(ctx context.Context, toAddress string) (string, error) {
	return "", nil
}

func (cs *CashuService) ResetRouter(ctx context.Context) error {
	return nil
}

func (cs *CashuService) SignMessage(ctx context.Context, message string) (string, error) {
	return "", nil
}

func (cs *CashuService) GetBalances(ctx context.Context) (*lnclient.BalancesResponse, error) {

	return &lnclient.BalancesResponse{
		Onchain: lnclient.OnchainBalanceResponse{
			Spendable: 0,
			Total:     0,
		},
		Lightning: lnclient.LightningBalanceResponse{
			TotalSpendable:       0,
			TotalReceivable:      0,
			NextMaxSpendable:     0,
			NextMaxReceivable:    0,
			NextMaxSpendableMPP:  0,
			NextMaxReceivableMPP: 0,
		},
	}, nil
}
