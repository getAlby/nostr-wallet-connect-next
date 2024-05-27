package backup

import (
	"io"

	"github.com/getAlby/nostr-wallet-connect/models/api"
)

type BackupService interface {
	CreateBackup(basicBackupRequest *api.BasicBackupRequest, w io.Writer) error
	RestoreBackup(password string, r io.Reader) error
}
