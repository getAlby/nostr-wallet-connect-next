package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/nbd-wtf/go-nostr"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"

	"github.com/getAlby/nostr-wallet-connect/alby"
	"github.com/getAlby/nostr-wallet-connect/backup"
	"github.com/getAlby/nostr-wallet-connect/config"
	"github.com/getAlby/nostr-wallet-connect/lsp"
	models "github.com/getAlby/nostr-wallet-connect/models/api"
	"github.com/getAlby/nostr-wallet-connect/models/lnclient"
	"github.com/getAlby/nostr-wallet-connect/nip47"
)

type API struct {
	svc       *Service
	lspSvc    lsp.LSPService
	backupSvc backup.BackupService
}

func NewAPI(svc *Service) *API {

	return &API{
		svc:       svc,
		lspSvc:    lsp.NewLSPService(svc, svc.Logger),
		backupSvc: backup.NewBackupService(svc, svc.Logger),
	}
}

func (api *API) CreateApp(createAppRequest *models.CreateAppRequest) (*models.CreateAppResponse, error) {
	name := createAppRequest.Name
	var pairingPublicKey string
	var pairingSecretKey string
	if createAppRequest.Pubkey == "" {
		pairingSecretKey = nostr.GeneratePrivateKey()
		pairingPublicKey, _ = nostr.GetPublicKey(pairingSecretKey)
	} else {
		pairingPublicKey = createAppRequest.Pubkey
		//validate public key
		decoded, err := hex.DecodeString(pairingPublicKey)
		if err != nil || len(decoded) != 32 {
			api.svc.Logger.WithField("pairingPublicKey", pairingPublicKey).Error("Invalid public key format")
			return nil, fmt.Errorf("invalid public key format: %s", pairingPublicKey)

		}
	}

	app := App{Name: name, NostrPubkey: pairingPublicKey}
	maxAmount := createAppRequest.MaxAmount
	budgetRenewal := createAppRequest.BudgetRenewal

	expiresAt, err := api.parseExpiresAt(createAppRequest.ExpiresAt)
	if err != nil {
		return nil, fmt.Errorf("invalid expiresAt: %v", err)
	}

	err = api.svc.db.Transaction(func(tx *gorm.DB) error {
		err := tx.Save(&app).Error
		if err != nil {
			return err
		}

		requestMethods := createAppRequest.RequestMethods
		if requestMethods == "" {
			return fmt.Errorf("won't create an app without request methods")
		}
		//request methods should be space separated list of known request kinds
		methodsToCreate := strings.Split(requestMethods, " ")
		for _, m := range methodsToCreate {
			//if we don't know this method, we return an error
			if !strings.Contains(nip47.CAPABILITIES, m) {
				return fmt.Errorf("did not recognize request method: %s", m)
			}
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
		return nil, err
	}

	relayUrl, _ := api.svc.cfg.Get("Relay", "")

	responseBody := &models.CreateAppResponse{}
	responseBody.Name = name
	responseBody.Pubkey = pairingPublicKey
	responseBody.PairingSecret = pairingSecretKey

	if createAppRequest.ReturnTo != "" {
		returnToUrl, err := url.Parse(createAppRequest.ReturnTo)
		if err == nil {
			query := returnToUrl.Query()
			query.Add("relay", relayUrl)
			query.Add("pubkey", api.svc.cfg.GetNostrPublicKey())
			// if user.LightningAddress != "" {
			// 	query.Add("lud16", user.LightningAddress)
			// }
			returnToUrl.RawQuery = query.Encode()
			responseBody.ReturnTo = returnToUrl.String()
		}
	}

	var lud16 string
	// if user.LightningAddress != "" {
	// 	lud16 = fmt.Sprintf("&lud16=%s", user.LightningAddress)
	// }
	responseBody.PairingUri = fmt.Sprintf("nostr+walletconnect://%s?relay=%s&secret=%s%s", api.svc.GetConfig().GetNostrPublicKey(), relayUrl, pairingSecretKey, lud16)
	return responseBody, nil
}

func (api *API) UpdateApp(userApp *App, updateAppRequest *models.UpdateAppRequest) error {
	maxAmount := updateAppRequest.MaxAmount
	budgetRenewal := updateAppRequest.BudgetRenewal

	requestMethods := updateAppRequest.RequestMethods
	if requestMethods == "" {
		return fmt.Errorf("won't update an app to have no request methods")
	}
	newRequestMethods := strings.Split(requestMethods, " ")

	expiresAt, err := api.parseExpiresAt(updateAppRequest.ExpiresAt)
	if err != nil {
		return fmt.Errorf("invalid expiresAt: %v", err)
	}

	err = api.svc.db.Transaction(func(tx *gorm.DB) error {
		// Update existing permissions with new budget and expiry
		err := tx.Model(&AppPermission{}).Where("app_id", userApp.ID).Updates(map[string]interface{}{
			"ExpiresAt":     expiresAt,
			"MaxAmount":     maxAmount,
			"BudgetRenewal": budgetRenewal,
		}).Error
		if err != nil {
			return err
		}

		var existingPermissions []AppPermission
		if err := tx.Where("app_id = ?", userApp.ID).Find(&existingPermissions).Error; err != nil {
			return err
		}

		existingMethodMap := make(map[string]bool)
		for _, perm := range existingPermissions {
			existingMethodMap[perm.RequestMethod] = true
		}

		// Add new permissions
		for _, method := range newRequestMethods {
			if !existingMethodMap[method] {
				perm := AppPermission{
					App:           *userApp,
					RequestMethod: method,
					ExpiresAt:     expiresAt,
					MaxAmount:     maxAmount,
					BudgetRenewal: budgetRenewal,
				}
				if err := tx.Create(&perm).Error; err != nil {
					return err
				}
			}
			delete(existingMethodMap, method)
		}

		// Remove old permissions
		for method := range existingMethodMap {
			if err := tx.Where("app_id = ? AND request_method = ?", userApp.ID, method).Delete(&AppPermission{}).Error; err != nil {
				return err
			}
		}

		// commit transaction
		return nil
	})

	return err
}

func (api *API) DeleteApp(userApp *App) error {
	return api.svc.db.Delete(userApp).Error
}

func (api *API) GetApp(userApp *App) *models.App {

	var lastEvent RequestEvent
	lastEventResult := api.svc.db.Where("app_id = ?", userApp.ID).Order("id desc").Limit(1).Find(&lastEvent)

	paySpecificPermission := AppPermission{}
	appPermissions := []AppPermission{}
	var expiresAt *time.Time
	api.svc.db.Where("app_id = ?", userApp.ID).Find(&appPermissions)

	requestMethods := []string{}
	for _, appPerm := range appPermissions {
		expiresAt = appPerm.ExpiresAt
		if appPerm.RequestMethod == nip47.PAY_INVOICE_METHOD {
			//find the pay_invoice-specific permissions
			paySpecificPermission = appPerm
		}
		requestMethods = append(requestMethods, appPerm.RequestMethod)
	}

	//renewsIn := ""
	budgetUsage := int64(0)
	maxAmount := paySpecificPermission.MaxAmount
	if maxAmount > 0 {
		budgetUsage = api.svc.GetBudgetUsage(&paySpecificPermission)
	}

	response := models.App{
		Name:           userApp.Name,
		Description:    userApp.Description,
		CreatedAt:      userApp.CreatedAt,
		UpdatedAt:      userApp.UpdatedAt,
		NostrPubkey:    userApp.NostrPubkey,
		ExpiresAt:      expiresAt,
		MaxAmount:      maxAmount,
		RequestMethods: requestMethods,
		BudgetUsage:    budgetUsage,
		BudgetRenewal:  paySpecificPermission.BudgetRenewal,
	}

	if lastEventResult.RowsAffected > 0 {
		response.LastEventAt = &lastEvent.CreatedAt
	}

	return &response

}

func (api *API) ListApps() ([]models.App, error) {
	// TODO: join apps and permissions
	apps := []App{}
	api.svc.db.Find(&apps)

	permissions := []AppPermission{}
	api.svc.db.Find(&permissions)

	permissionsMap := make(map[uint][]AppPermission)
	for _, perm := range permissions {
		permissionsMap[perm.AppId] = append(permissionsMap[perm.AppId], perm)
	}

	apiApps := []models.App{}
	for _, userApp := range apps {
		apiApp := models.App{
			// ID:          app.ID,
			Name:        userApp.Name,
			Description: userApp.Description,
			CreatedAt:   userApp.CreatedAt,
			UpdatedAt:   userApp.UpdatedAt,
			NostrPubkey: userApp.NostrPubkey,
		}

		for _, permission := range permissionsMap[userApp.ID] {
			apiApp.RequestMethods = append(apiApp.RequestMethods, permission.RequestMethod)
			apiApp.ExpiresAt = permission.ExpiresAt
			if permission.RequestMethod == nip47.PAY_INVOICE_METHOD {
				apiApp.BudgetRenewal = permission.BudgetRenewal
				apiApp.MaxAmount = permission.MaxAmount
				if apiApp.MaxAmount > 0 {
					apiApp.BudgetUsage = api.svc.GetBudgetUsage(&permission)
				}
			}
		}

		var lastEvent RequestEvent
		lastEventResult := api.svc.db.Where("app_id = ?", userApp.ID).Order("id desc").Limit(1).Find(&lastEvent)
		if lastEventResult.RowsAffected > 0 {
			apiApp.LastEventAt = &lastEvent.CreatedAt
		}

		apiApps = append(apiApps, apiApp)
	}
	return apiApps, nil
}

func (api *API) ListChannels(ctx context.Context) ([]lnclient.Channel, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.ListChannels(ctx)
}

func (api *API) GetChannelPeerSuggestions(ctx context.Context) ([]alby.ChannelPeerSuggestion, error) {
	return api.svc.AlbyOAuthSvc.GetChannelPeerSuggestions(ctx)
}

func (api *API) ResetRouter(key string) error {
	if api.svc.lnClient == nil {
		return errors.New("LNClient not started")
	}
	err := api.svc.lnClient.ResetRouter(key)
	if err != nil {
		return err
	}

	// Because the above method has to stop the node to reset the router,
	// We also need to stop the lnclient and ask the user to start it again
	return api.Stop()
}

func (api *API) ChangeUnlockPassword(changeUnlockPasswordRequest *models.ChangeUnlockPasswordRequest) error {
	if api.svc.lnClient == nil {
		return errors.New("LNClient not started")
	}

	err := api.svc.GetConfig().ChangeUnlockPassword(changeUnlockPasswordRequest.CurrentUnlockPassword, changeUnlockPasswordRequest.NewUnlockPassword)

	if err != nil {
		api.svc.Logger.WithError(err).Error("failed to change unlock password")
		return err
	}

	// Because all the encrypted fields have changed
	// we also need to stop the lnclient and ask the user to start it again
	return api.Stop()
}

func (api *API) Stop() error {
	api.svc.Logger.Info("Running Stop command")
	if api.svc.lnClient == nil {
		return errors.New("LNClient not started")
	}
	// stop the lnclient
	// The user will be forced to re-enter their unlock password to restart the node
	err := api.svc.StopLNClient()
	if err != nil {
		api.svc.Logger.WithError(err).Error("Failed to stop LNClient")
	}
	return err
}

func (api *API) GetNodeConnectionInfo(ctx context.Context) (*lnclient.NodeConnectionInfo, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.GetNodeConnectionInfo(ctx)
}

func (api *API) GetNodeStatus(ctx context.Context) (*lnclient.NodeStatus, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.GetNodeStatus(ctx)
}

func (api *API) ListPeers(ctx context.Context) ([]lnclient.PeerDetails, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.ListPeers(ctx)
}

func (api *API) ConnectPeer(ctx context.Context, connectPeerRequest *models.ConnectPeerRequest) error {
	if api.svc.lnClient == nil {
		return errors.New("LNClient not started")
	}
	return api.svc.lnClient.ConnectPeer(ctx, connectPeerRequest)
}

func (api *API) OpenChannel(ctx context.Context, openChannelRequest *models.OpenChannelRequest) (*models.OpenChannelResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.OpenChannel(ctx, openChannelRequest)
}

func (api *API) CloseChannel(ctx context.Context, peerId, channelId string, force bool) (*models.CloseChannelResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	api.svc.Logger.WithFields(logrus.Fields{
		"peer_id":    peerId,
		"channel_id": channelId,
		"force":      force,
	}).Info("Closing channel")
	return api.svc.lnClient.CloseChannel(ctx, &lnclient.CloseChannelRequest{
		NodeId:    peerId,
		ChannelId: channelId,
		Force:     force,
	})
}

func (api *API) GetNewOnchainAddress(ctx context.Context) (*models.NewOnchainAddressResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	address, err := api.svc.lnClient.GetNewOnchainAddress(ctx)
	if err != nil {
		return nil, err
	}
	return &models.NewOnchainAddressResponse{
		Address: address,
	}, nil
}

func (api *API) SignMessage(ctx context.Context, message string) (*models.SignMessageResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	signature, err := api.svc.lnClient.SignMessage(ctx, message)
	if err != nil {
		return nil, err
	}
	return &models.SignMessageResponse{
		Message:   message,
		Signature: signature,
	}, nil
}

func (api *API) RedeemOnchainFunds(ctx context.Context, toAddress string) (*models.RedeemOnchainFundsResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	txId, err := api.svc.lnClient.RedeemOnchainFunds(ctx, toAddress)
	if err != nil {
		return nil, err
	}
	return &models.RedeemOnchainFundsResponse{
		TxId: txId,
	}, nil
}

func (api *API) GetBalances(ctx context.Context) (*models.BalancesResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	balances, err := api.svc.lnClient.GetBalances(ctx)
	if err != nil {
		return nil, err
	}
	return balances, nil
}

func (api *API) RequestMempoolApi(endpoint string) (interface{}, error) {
	url := api.svc.GetConfig().GetEnv().MempoolApi + endpoint

	client := http.Client{
		Timeout: time.Second * 10,
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		api.svc.Logger.WithError(err).WithFields(logrus.Fields{
			"url": url,
		}).Error("Failed to create http request")
		return nil, err
	}

	res, err := client.Do(req)
	if err != nil {
		api.svc.Logger.WithError(err).WithFields(logrus.Fields{
			"url": url,
		}).Error("Failed to send request")
		return nil, err
	}

	defer res.Body.Close()

	body, readErr := io.ReadAll(res.Body)
	if readErr != nil {
		api.svc.Logger.WithError(err).WithFields(logrus.Fields{
			"url": url,
		}).Error("Failed to read response body")
		return nil, errors.New("failed to read response body")
	}

	var jsonContent interface{}
	jsonErr := json.Unmarshal(body, &jsonContent)
	if jsonErr != nil {
		api.svc.Logger.WithError(jsonErr).WithFields(logrus.Fields{
			"url": url,
		}).Error("Failed to deserialize json")
		return nil, fmt.Errorf("failed to deserialize json %s %s", url, string(body))
	}
	return jsonContent, nil
}

func (api *API) GetInfo(ctx context.Context) (*models.InfoResponse, error) {
	info := models.InfoResponse{}
	backendType, _ := api.svc.cfg.Get("LNBackendType", "")
	unlockPasswordCheck, _ := api.svc.cfg.Get("UnlockPasswordCheck", "")
	info.SetupCompleted = unlockPasswordCheck != ""
	info.Running = api.svc.lnClient != nil
	info.BackendType = backendType
	info.AlbyAuthUrl = api.svc.AlbyOAuthSvc.GetAuthUrl()
	info.OAuthRedirect = !api.svc.GetConfig().GetEnv().IsDefaultClientId()
	albyUserIdentifier, err := api.svc.AlbyOAuthSvc.GetUserIdentifier()
	if err != nil {
		api.svc.Logger.WithError(err).Error("Failed to get alby user identifier")
		return nil, err
	}
	info.AlbyUserIdentifier = albyUserIdentifier
	info.AlbyAccountConnected = api.svc.AlbyOAuthSvc.IsConnected(ctx)
	if api.svc.lnClient != nil {
		// TODO: is there a better way to do this?
		if backendType == config.BreezBackendType {
			info.OnboardingCompleted = true
		} else {
			channels, err := api.ListChannels(ctx)
			if err != nil {
				api.svc.Logger.WithError(err).WithFields(logrus.Fields{}).Error("Failed to fetch channels")
				return nil, err
			}
			info.OnboardingCompleted = len(channels) > 0
		}

		nodeInfo, err := api.svc.lnClient.GetInfo(ctx)
		if err != nil {
			api.svc.Logger.WithError(err).Error("Failed to get alby user identifier")
			return nil, err
		}

		info.Network = nodeInfo.Network
	}

	if info.BackendType != config.LNDBackendType {
		nextBackupReminder, _ := api.svc.cfg.Get("NextBackupReminder", "")
		var err error
		parsedTime := time.Time{}
		if nextBackupReminder != "" {
			parsedTime, err = time.Parse(time.RFC3339, nextBackupReminder)
			if err != nil {
				api.svc.Logger.WithError(err).WithFields(logrus.Fields{
					"nextBackupReminder": nextBackupReminder,
				}).Error("Error parsing time")
				return nil, err
			}
		}
		info.ShowBackupReminder = parsedTime.IsZero() || parsedTime.Before(time.Now())
	}

	return &info, nil
}

func (api *API) GetEncryptedMnemonic() *models.EncryptedMnemonicResponse {
	resp := models.EncryptedMnemonicResponse{}
	mnemonic, _ := api.svc.cfg.Get("Mnemonic", "")
	resp.Mnemonic = mnemonic
	return &resp
}

func (api *API) SetNextBackupReminder(backupReminderRequest *models.BackupReminderRequest) error {
	api.svc.cfg.SetUpdate("NextBackupReminder", backupReminderRequest.NextBackupReminder, "")
	return nil
}

func (api *API) Start(startRequest *models.StartRequest) error {
	return api.svc.StartApp(startRequest.UnlockPassword)
}

func (api *API) Setup(ctx context.Context, setupRequest *models.SetupRequest) error {
	info, err := api.GetInfo(ctx)
	if err != nil {
		api.svc.Logger.WithError(err).Error("Failed to get info")
		return err
	}
	if info.SetupCompleted {
		api.svc.Logger.Error("Cannot re-setup node")
		return errors.New("setup already completed")
	}

	api.svc.cfg.Setup(setupRequest.UnlockPassword)

	// TODO: move all below code to cfg.Setup()

	// update next backup reminder
	api.svc.cfg.SetUpdate("NextBackupReminder", setupRequest.NextBackupReminder, "")
	// only update non-empty values
	if setupRequest.LNBackendType != "" {
		api.svc.cfg.SetUpdate("LNBackendType", setupRequest.LNBackendType, "")
	}
	if setupRequest.BreezAPIKey != "" {
		api.svc.cfg.SetUpdate("BreezAPIKey", setupRequest.BreezAPIKey, setupRequest.UnlockPassword)
	}
	if setupRequest.Mnemonic != "" {
		api.svc.cfg.SetUpdate("Mnemonic", setupRequest.Mnemonic, setupRequest.UnlockPassword)
	}
	if setupRequest.GreenlightInviteCode != "" {
		api.svc.cfg.SetUpdate("GreenlightInviteCode", setupRequest.GreenlightInviteCode, setupRequest.UnlockPassword)
	}
	if setupRequest.LNDAddress != "" {
		api.svc.cfg.SetUpdate("LNDAddress", setupRequest.LNDAddress, setupRequest.UnlockPassword)
	}
	if setupRequest.LNDCertHex != "" {
		api.svc.cfg.SetUpdate("LNDCertHex", setupRequest.LNDCertHex, setupRequest.UnlockPassword)
	}
	if setupRequest.LNDMacaroonHex != "" {
		api.svc.cfg.SetUpdate("LNDMacaroonHex", setupRequest.LNDMacaroonHex, setupRequest.UnlockPassword)
	}

	return nil
}

func (api *API) SendPaymentProbes(ctx context.Context, sendPaymentProbesRequest *models.SendPaymentProbesRequest) (*models.SendPaymentProbesResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}

	var errMessage string
	err := api.svc.lnClient.SendPaymentProbes(ctx, sendPaymentProbesRequest.Invoice)
	if err != nil {
		errMessage = err.Error()
	}

	return &models.SendPaymentProbesResponse{Error: errMessage}, nil
}

func (api *API) SendSpontaneousPaymentProbes(ctx context.Context, sendSpontaneousPaymentProbesRequest *models.SendSpontaneousPaymentProbesRequest) (*models.SendSpontaneousPaymentProbesResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}

	var errMessage string
	err := api.svc.lnClient.SendSpontaneousPaymentProbes(ctx, sendSpontaneousPaymentProbesRequest.Amount, sendSpontaneousPaymentProbesRequest.NodeId)
	if err != nil {
		errMessage = err.Error()
	}

	return &models.SendSpontaneousPaymentProbesResponse{Error: errMessage}, nil
}

func (api *API) GetNetworkGraph(nodeIds []string) (models.NetworkGraphResponse, error) {
	if api.svc.lnClient == nil {
		return nil, errors.New("LNClient not started")
	}
	return api.svc.lnClient.GetNetworkGraph(nodeIds)
}

func (api *API) SyncWallet() {
	api.svc.lastWalletSyncRequest = time.Now()
}

func (api *API) GetLogOutput(ctx context.Context, logType string, getLogRequest *models.GetLogOutputRequest) (*models.GetLogOutputResponse, error) {
	var err error
	var logData []byte

	if logType == models.LogTypeNode {
		if api.svc.lnClient == nil {
			return nil, errors.New("LNClient not started")
		}

		logData, err = api.svc.lnClient.GetLogOutput(ctx, getLogRequest.MaxLen)
		if err != nil {
			return nil, err
		}
	} else if logType == models.LogTypeApp {
		logFileName := api.svc.LogFilePath()

		logData, err = ReadFileTail(logFileName, getLogRequest.MaxLen)
		if err != nil {
			return nil, err
		}
	} else {
		return nil, fmt.Errorf("invalid log type: '%s'", logType)
	}

	return &models.GetLogOutputResponse{Log: string(logData)}, nil
}

func (api *API) parseExpiresAt(expiresAtString string) (*time.Time, error) {
	var expiresAt *time.Time
	if expiresAtString != "" {
		var err error
		expiresAtValue, err := time.Parse(time.RFC3339, expiresAtString)
		if err != nil {
			api.svc.Logger.WithField("expiresAt", expiresAtString).Error("Invalid expiresAt")
			return nil, fmt.Errorf("invalid expiresAt: %v", err)
		}
		expiresAtValue = time.Date(expiresAtValue.Year(), expiresAtValue.Month(), expiresAtValue.Day(), 23, 59, 59, 0, expiresAtValue.Location())
		expiresAt = &expiresAtValue
	}
	return expiresAt, nil
}
