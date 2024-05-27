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
