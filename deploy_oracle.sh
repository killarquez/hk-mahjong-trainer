#!/usr/bin/env bash
# ==============================================================================
# 🚀 Automated 1-Click Deployment Script for Oracle Cloud VM & Cloudflare
# Target: mahjong.au-tomato.com
# ==============================================================================
set -e

echo "🀄 [1/5] Updating system packages and installing Python 3 dependencies..."
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv git nginx curl

# Determine target directory
APP_DIR="/var/www/hk-mahjong-trainer"
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www

echo "📥 [2/5] Cloning or updating repository from GitHub..."
if [ -d "$APP_DIR/.git" ]; then
    echo "Updating existing installation in $APP_DIR..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "Cloning new installation into $APP_DIR..."
    git clone https://github.com/killarquez/hk-mahjong-trainer.git "$APP_DIR"
    cd "$APP_DIR"
fi

echo "🐍 [3/5] Setting up Python virtual environment and dependencies..."
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/requirements.txt"

echo "⚙️ [4/5] Creating background systemd service (mahjong.service)..."
sudo tee /etc/systemd/system/mahjong.service > /dev/null << EOF
[Unit]
Description=Hong Kong Mahjong Efficiency Trainer (TVB 2026 Rules)
After=network.target

[Service]
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable mahjong
sudo systemctl restart mahjong

echo "🌐 [5/5] Configuring Nginx reverse proxy for mahjong.au-tomato.com..."
sudo tee /etc/nginx/sites-available/mahjong.au-tomato.com > /dev/null << 'EOF'
server {
    listen 80;
    server_name mahjong.au-tomato.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/mahjong.au-tomato.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=========================================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Service Status: Active (Running on 127.0.0.1:8000 via systemd)"
echo "Subdomain: https://mahjong.au-tomato.com"
echo "=========================================================================="
