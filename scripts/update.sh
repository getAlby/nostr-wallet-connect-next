#!/bin/bash

echo "🔃 Updating Alby Hub..."
sudo systemctl stop albyhub

# Download new artifacts
cd /opt/albyhub
rm -rf albyhub-backup
mkdir albyhub-backup
mv app albyhub-backup
cp -r data albyhub-backup
wget https://nightly.link/getalby/nostr-wallet-connect-next/workflows/http/master/albyhub-Server-Linux-armv6.tar.gz.zip

# Extract archives
unzip albyhub-Server-Linux-armv6.tar.gz.zip
tar -xvf albyhub-Server-Linux-armv6.tar.gz

# Cleanup
rm albyhub-Server-Linux-armv6.tar.gz
rm albyhub-Server-Linux-armv6.tar.gz.zip

sudo systemctl start albyhub

echo "✅ Update finished! Please login again to start your wallet."