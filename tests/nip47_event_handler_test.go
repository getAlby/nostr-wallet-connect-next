package tests

import (
	"encoding/json"
	"testing"

	"github.com/getAlby/nostr-wallet-connect/nip47"
	"github.com/nbd-wtf/go-nostr"
	"github.com/nbd-wtf/go-nostr/nip04"
	"github.com/stretchr/testify/assert"
)

func TestCreateResponse(t *testing.T) {
	defer removeTestService()
	svc, err := createTestService()
	assert.NoError(t, err)

	reqPrivateKey := nostr.GeneratePrivateKey()
	reqPubkey, err := nostr.GetPublicKey(reqPrivateKey)
	assert.NoError(t, err)

	reqEvent := &nostr.Event{
		Kind:    nip47.REQUEST_KIND,
		PubKey:  reqPubkey,
		Content: "1",
	}

	reqEvent.ID = "12345"

	ss, err := nip04.ComputeSharedSecret(reqPubkey, svc.cfg.GetNostrSecretKey())
	assert.NoError(t, err)

	nip47Response := &nip47.Response{
		ResultType: nip47.GET_BALANCE_METHOD,
		Result: nip47.BalanceResponse{
			Balance: 1000,
		},
	}
	res, err := svc.nip47Svc.CreateResponse(reqEvent, nip47Response, nostr.Tags{}, ss)
	assert.NoError(t, err)
	assert.Equal(t, reqPubkey, res.Tags.GetFirst([]string{"p"}).Value())
	assert.Equal(t, reqEvent.ID, res.Tags.GetFirst([]string{"e"}).Value())
	assert.Equal(t, svc.cfg.GetNostrPublicKey(), res.PubKey)

	decrypted, err := nip04.Decrypt(res.Content, ss)
	assert.NoError(t, err)
	unmarshalledResponse := nip47.Response{
		Result: &nip47.BalanceResponse{},
	}

	err = json.Unmarshal([]byte(decrypted), &unmarshalledResponse)
	assert.NoError(t, err)
	assert.Equal(t, nip47Response.ResultType, unmarshalledResponse.ResultType)
	assert.Equal(t, nip47Response.Result, *unmarshalledResponse.Result.(*nip47.BalanceResponse))
}
