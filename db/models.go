package db

import "time"

type UserConfig struct {
	ID        uint
	Key       string
	Value     string
	Encrypted bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type App struct {
	ID          uint
	Name        string `validate:"required"`
	Description string
	NostrPubkey string `validate:"required"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type AppPermission struct {
	ID            uint
	AppId         uint `validate:"required"`
	App           App
	RequestMethod string `validate:"required"`
	MaxAmount     int
	BudgetRenewal string
	ExpiresAt     *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type RequestEvent struct {
	ID        uint
	AppId     *uint
	App       App
	NostrId   string `validate:"required"`
	Content   string
	State     string
	CreatedAt time.Time
	UpdatedAt time.Time
}

type ResponseEvent struct {
	ID        uint
	NostrId   string `validate:"required"`
	RequestId uint   `validate:"required"`
	Content   string
	State     string
	RepliedAt time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

type Payment struct {
	ID             uint
	AppId          uint `validate:"required"`
	App            App
	RequestEventId uint `validate:"required"`
	RequestEvent   RequestEvent
	Amount         uint // in sats
	PaymentRequest string
	Preimage       *string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

type DBService interface {
	CreateApp(name string, pubkey string, maxAmount int, budgetRenewal string, expiresAt *time.Time, requestMethods []string) (*App, string, error)
}
