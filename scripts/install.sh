echo ""
echo ""
echo "⚡️ Welcome to Alby Hub"
echo "-----------------------------------------"
echo "Installing..."


sudo mkdir -p /opt/albyhub
sudo chown -R $USER:$USER /opt/albyhub
cd /opt/albyhub
wget https://nightly.link/getalby/nostr-wallet-connect-next/workflows/package-raspberry-pi/master/nostr-wallet-connect.zip

unzip nostr-wallet-connect.zip -d app
chmod +x app/nostr-wallet-connect
rm nostr-wallet-connect.zip

### Create systemd service
sudo tee -a /etc/systemd/system/albyhub.service > /dev/null << EOF
[Unit]
Description=Alby Hub
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Restart=always
RestartSec=1
User=root
ExecStart=/opt/albyhub/app/nostr-wallet-connect

# Limit CPU: https://unix.stackexchange.com/a/495013
# This prevents the RPI from overheating and ensures the RPI is still accessible via ssh
CPUWeight=20
CPUQuota=90%
IOWeight=20
# MemorySwapMax=0 # not needed? see https://github.com/getAlby/nostr-wallet-connect-next/pull/364

Environment="PORT=80"
Environment="WORK_DIR=/opt/albyhub/data"
Environment="LDK_ESPLORA_SERVER=https://electrs.albylabs.com"
Environment="LOG_EVENTS=true"
Environment="LDK_GOSSIP_SOURCE="
# RPI workaround - 4 threads is not enough to avoid LDK deadlock (on shutdown and sometimes on sync)
Environment="TOKIO_WORKER_THREADS=8"

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable albyhub
sudo systemctl start albyhub

echo ""
echo ""
echo "✅ Installation finished! Please visit http://$HOSTNAME.local to configure your new Alby Hub."
echo ""
