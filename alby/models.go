package alby

import (
	"context"

	"github.com/getAlby/nostr-wallet-connect/events"
)

type AlbyOAuthService interface {
	events.EventSubscriber
	GetChannelPeerSuggestions(ctx context.Context) ([]ChannelPeerSuggestion, error)
	GetAuthUrl() string
	GetUserIdentifier() (string, error)
	IsConnected(ctx context.Context) bool
	LinkAccount(ctx context.Context) error
	CallbackHandler(ctx context.Context, code string) error
	GetBalance(ctx context.Context) (*AlbyBalance, error)
	GetMe(ctx context.Context) (*AlbyMe, error)
	SendPayment(ctx context.Context, invoice string) error
}

type AlbyBalanceResponse struct {
	Sats int64 `json:"sats"`
}

type AlbyPayRequest struct {
	Invoice string `json:"invoice"`
}

type AlbyMe struct {
	Identifier       string `json:"identifier"`
	NPub             string `json:"nostr_pubkey"`
	LightningAddress string `json:"lightning_address"`
	Email            string `json:"email"`
	Name             string `json:"name"`
	Avatar           string `json:"avatar"`
	KeysendPubkey    string `json:"keysend_pubkey"`
	SharedNode       bool   `json:"shared_node"`
}

type AlbyTopup struct {
	Url string `json:"url"`
}

type AlbyBalance struct {
	Balance  int64  `json:"balance"`
	Unit     string `json:"unit"`
	Currency string `json:"currency"`
}

type AlbyTopupRequest struct {
	Amount  int64  `json:"amount"`
	Address string `json:"address"`
}

type ChannelPeerSuggestion struct {
	Network            string `json:"network"`
	PaymentMethod      string `json:"paymentMethod"`
	Pubkey             string `json:"pubkey"`
	Host               string `json:"host"`
	MinimumChannelSize uint64 `json:"minimumChannelSize"`
	Name               string `json:"name"`
	Image              string `json:"image"`
	Lsp                string `json:"lsp"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}
