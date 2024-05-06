cd ~
wget https://nightly.link/getAlby/nostr-wallet-connect-next/workflows/package-raspberry-pi.yaml/master
tar zxf nostr-wallet-connect-bin.tgz
rm nostr-wallet-connect-bin.tgz
mv nostr-wallet-connect-bin albyhub

### Create systemd service
cat > /etc/systemd/system/albyhub.service << EOF
[Unit]
Description=Alby Hub
After=network.target

[Service]
Type=simple
Restart=always
RestartSec=1
User=root
ExecStart=$HOME/albyhub/nostr-wallet-connect

Environment="PORT=80"
Environment="WORK_DIR=$HOME/.local/share/alby-hub/"
Environment="LDK_ESPLORA_SERVER=https://electrs.albylabs.com"
Environment="ALBY_OAUTH_CLIENT_ID=alby_internal_client"
Environment="ALBY_OAUTH_CLIENT_SECRET=zblqaACzgqUmHjLZdfXJ"
Environment="LOG_EVENTS=true"

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable albyhub
sudo systemctl start albyhub
