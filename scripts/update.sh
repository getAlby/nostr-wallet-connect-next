#!/bin/bash

echo "🔃 Updating Alby Hub..."
sudo systemctl stop albyhub

cd ~
rm -rf albyhub-backup
mv albyhub albyhub-backup
wget https://nightly.link/getalby/nostr-wallet-connect-next/workflows/package-raspberry-pi/master/nostr-wallet-connect.zip

unzip nostr-wallet-connect.zip -d albyhub
rm nostr-wallet-connect.zip

sudo systemctl start albyhub

echo "✅ Update finished! Please login again to start your wallet."