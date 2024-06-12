package db

import (
	"encoding/hex"
	"fmt"
	"time"

	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type dbService struct {
	db     *gorm.DB
	logger *logrus.Logger
}

func NewDBService(db *gorm.DB, logger *logrus.Logger) *dbService {
	return &dbService{
		db:     db,
		logger: logger,
	}
}

func (svc *dbService) CreateApp(name string, pubkey string, maxAmount int, budgetRenewal string, expiresAt *time.Time, requestMethods []string) (*App, string, error) {
	var pairingPublicKey string
	var pairingSecretKey string
	if pubkey == "" {
		pairingSecretKey = nostr.GeneratePrivateKey()
		pairingPublicKey, _ = nostr.GetPublicKey(pairingSecretKey)
	} else {
		pairingPublicKey = pubkey
		//validate public key
		decoded, err := hex.DecodeString(pairingPublicKey)
		if err != nil || len(decoded) != 32 {
			svc.logger.WithField("pairingPublicKey", pairingPublicKey).Error("Invalid public key format")
			return nil, "", fmt.Errorf("invalid public key format: %s", pairingPublicKey)
		}
	}

	app := App{Name: name, NostrPubkey: pairingPublicKey}

	err := svc.db.Transaction(func(tx *gorm.DB) error {
		err := tx.Save(&app).Error
		if err != nil {
			return err
		}

		for _, m := range requestMethods {
			appPermission := AppPermission{
				App:           app,
				RequestMethod: m,
				ExpiresAt:     expiresAt,
				//these fields are only relevant for pay_invoice
				MaxAmount:     maxAmount,
				BudgetRenewal: budgetRenewal,
			}
			err = tx.Create(&appPermission).Error
			if err != nil {
				return err
			}
		}
		// commit transaction
		return nil
	})

	if err != nil {
		svc.logger.WithError(err).Error("Failed to save app")
		return nil, "", err
	}

	return &app, pairingSecretKey, nil
}
