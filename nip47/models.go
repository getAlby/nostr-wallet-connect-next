package nip47

import (
	"encoding/json"

	"github.com/getAlby/nostr-wallet-connect/models/lnclient"
)

const (
	INFO_EVENT_KIND            = 13194
	REQUEST_KIND               = 23194
	RESPONSE_KIND              = 23195
	NOTIFICATION_KIND          = 23196
	PAY_INVOICE_METHOD         = "pay_invoice"
	GET_BALANCE_METHOD         = "get_balance"
	GET_INFO_METHOD            = "get_info"
	MAKE_INVOICE_METHOD        = "make_invoice"
	LOOKUP_INVOICE_METHOD      = "lookup_invoice"
	LIST_TRANSACTIONS_METHOD   = "list_transactions"
	PAY_KEYSEND_METHOD         = "pay_keysend"
	MULTI_PAY_INVOICE_METHOD   = "multi_pay_invoice"
	MULTI_PAY_KEYSEND_METHOD   = "multi_pay_keysend"
	SIGN_MESSAGE_METHOD        = "sign_message"
	ERROR_INTERNAL             = "INTERNAL"
	ERROR_NOT_IMPLEMENTED      = "NOT_IMPLEMENTED"
	ERROR_QUOTA_EXCEEDED       = "QUOTA_EXCEEDED"
	ERROR_INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE"
	ERROR_UNAUTHORIZED         = "UNAUTHORIZED"
	ERROR_EXPIRED              = "EXPIRED"
	ERROR_RESTRICTED           = "RESTRICTED"
	ERROR_BAD_REQUEST          = "BAD_REQUEST"
	OTHER                      = "OTHER"
	CAPABILITIES               = "pay_invoice pay_keysend get_balance get_info make_invoice lookup_invoice list_transactions multi_pay_invoice multi_pay_keysend sign_message notifications"
	NOTIFICATION_TYPES         = "payment_received" // same format as above e.g. "payment_received balance_updated payment_sent channel_opened channel_closed ..."
)

// TODO: move other permissions here (e.g. all payment methods use pay_invoice)
const (
	NOTIFICATIONS_PERMISSION = "notifications"
)

const (
	PAYMENT_RECEIVED_NOTIFICATION = "payment_received"
)

const (
	BUDGET_RENEWAL_DAILY   = "daily"
	BUDGET_RENEWAL_WEEKLY  = "weekly"
	BUDGET_RENEWAL_MONTHLY = "monthly"
	BUDGET_RENEWAL_YEARLY  = "yearly"
	BUDGET_RENEWAL_NEVER   = "never"
)

type Nip47Transaction = lnclient.Transaction

type PayRequest struct {
	Invoice string `json:"invoice"`
}

type Nip47Request struct {
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

type Nip47Response struct {
	Error      *Nip47Error `json:"error,omitempty"`
	Result     interface{} `json:"result,omitempty"`
	ResultType string      `json:"result_type"`
}

type Nip47Notification struct {
	Notification     interface{} `json:"notification,omitempty"`
	NotificationType string      `json:"notification_type"`
}

type Nip47Error struct {
	Code    string `json:"code,omitempty"`
	Message string `json:"message,omitempty"`
}

type Nip47PaymentReceivedNotification struct {
	Nip47Transaction
}

type Nip47PayParams struct {
	Invoice string `json:"invoice"`
}
type Nip47PayResponse struct {
	Preimage string  `json:"preimage"`
	FeesPaid *uint64 `json:"fees_paid"`
}

type Nip47MultiPayKeysendParams struct {
	Keysends []Nip47MultiPayKeysendElement `json:"keysends"`
}

type Nip47MultiPayKeysendElement struct {
	Nip47KeysendParams
	Id string `json:"id"`
}

type Nip47MultiPayInvoiceParams struct {
	Invoices []Nip47MultiPayInvoiceElement `json:"invoices"`
}

type Nip47MultiPayInvoiceElement struct {
	Nip47PayParams
	Id string `json:"id"`
}

type Nip47KeysendParams struct {
	Amount     int64                `json:"amount"`
	Pubkey     string               `json:"pubkey"`
	Preimage   string               `json:"preimage"`
	TLVRecords []lnclient.TLVRecord `json:"tlv_records"`
}

type Nip47BalanceResponse struct {
	Balance       int64  `json:"balance"`
	MaxAmount     int    `json:"max_amount"`
	BudgetRenewal string `json:"budget_renewal"`
}

type Nip47GetInfoResponse struct {
	Alias       string   `json:"alias"`
	Color       string   `json:"color"`
	Pubkey      string   `json:"pubkey"`
	Network     string   `json:"network"`
	BlockHeight uint32   `json:"block_height"`
	BlockHash   string   `json:"block_hash"`
	Methods     []string `json:"methods"`
}

type Nip47MakeInvoiceParams struct {
	Amount          int64  `json:"amount"`
	Description     string `json:"description"`
	DescriptionHash string `json:"description_hash"`
	Expiry          int64  `json:"expiry"`
}
type Nip47MakeInvoiceResponse struct {
	Nip47Transaction
}

type Nip47LookupInvoiceParams struct {
	Invoice     string `json:"invoice"`
	PaymentHash string `json:"payment_hash"`
}

type Nip47LookupInvoiceResponse struct {
	Nip47Transaction
}

type Nip47ListTransactionsParams struct {
	From   uint64 `json:"from,omitempty"`
	Until  uint64 `json:"until,omitempty"`
	Limit  uint64 `json:"limit,omitempty"`
	Offset uint64 `json:"offset,omitempty"`
	Unpaid bool   `json:"unpaid,omitempty"`
	Type   string `json:"type,omitempty"`
}

type Nip47ListTransactionsResponse struct {
	Transactions []Nip47Transaction `json:"transactions"`
}

type Nip47SignMessageParams struct {
	Message string `json:"message"`
}

type Nip47SignMessageResponse struct {
	Message   string `json:"message"`
	Signature string `json:"signature"`
}
