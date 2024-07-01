package migrations

import (
	_ "embed"

	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

var _202407012100_transactions = &gormigrate.Migration{
	ID: "202407012100_transactions",
	Migrate: func(tx *gorm.DB) error {

		// request_event_id and app_id are not FKs, as apps and request events can be deleted

		if err := tx.Exec(`
CREATE TABLE transactions(
	id integer PRIMARY_KEY,
	app_id integer,
	request_event_id integer,
	type text,
	state text,
	payment_request text,
	preimage text,
	payment_hash text,
	amount integer,
	fee integer,
	created_at datetime,
	updated_at datetime,
	settled_at datetime,
	metadata text
)`).Error; err != nil {
			return err
		}

		return nil
	},
	Rollback: func(tx *gorm.DB) error {
		return nil
	},
}