#!/bin/bash

echo "🔃 Updating Alby Hub"
sudo systemctl stop albyhub

cd ~
rm -rf albyhub-backup
mv albyhub albyhub-backup
wget https://nightly.link/getalby/nostr-wallet-connect-next/workflows/package-raspberry-pi/master/nostr-wallet-connect.zip

# it's double ziped
unzip nostr-wallet-connect.zip -d albyhub-tmp
unzip albyhub-tmp/nostr-wallet-connect.zip -d albyhub

rm -rf albyhub-tmp
rm nostr-wallet-connect.zip

sudo systemctl start albyhub

echo "✅ Update finished! Please login again to start your wallet"