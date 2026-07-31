#!/usr/bin/env bash

# ==============================================================================
# 🚀 LEMO OTT - Hostinger VPS Automated Deployment Script
# Project: LEMO OTT Platform (Enterprise Scalable Backend)
# Components: Node.js (PM2 Cluster), Nginx Load Balancer, Redis, MongoDB Indexes
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "  🚀 LEMO OTT - HOSTINGER VPS SCALABLE BACKEND AUTO-DEPLOYMENT"
echo "======================================================================"
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run this script as root or with sudo: sudo bash deploy_hostinger.sh${NC}"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="/var/www/lemo-app"

# 2. System Packages Update & Installation
echo -e "${YELLOW}Step 1/6: Updating System Packages & Installing Prerequisites...${NC}"
apt-get update -y
apt-get install -y curl git build-essential nginx redis-server software-properties-common certbot python3-certbot-nginx

# Install Node.js 20 LTS if not installed
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
    echo -e "${YELLOW}Installing Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2 Process Manager globally...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✅ System packages ready. Node.js version: $(node -v), PM2 version: $(pm2 -v)${NC}"

# 3. Setup Project Directory Structure
echo -e "\n${YELLOW}Step 2/6: Setting up project directory at ${APP_DIR}...${NC}"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
    mkdir -p /var/www
    if [ ! -d "$APP_DIR" ]; then
        echo -e "${CYAN}Copying application files to ${APP_DIR}...${NC}"
        cp -r "$SCRIPT_DIR" "$APP_DIR"
    fi
fi

cd "$APP_DIR/server"

# 4. Environment File Verification
echo -e "\n${YELLOW}Step 3/6: Verifying Production Environment Configuration (.env)...${NC}"
if [ ! -f "$APP_DIR/server/.env" ]; then
    if [ -f "$APP_DIR/server/.env.production.example" ]; then
        echo -e "${YELLOW}Creating server/.env from template .env.production.example...${NC}"
        cp "$APP_DIR/server/.env.production.example" "$APP_DIR/server/.env"
        echo -e "${RED}⚠️  IMPORTANT: Please update ${APP_DIR}/server/.env with your production MongoDB URI and Secret keys!${NC}"
    else
        echo -e "${RED}❌ server/.env missing! Please create server/.env before continuing.${NC}"
    fi
fi

# Install NPM Production Dependencies
echo -e "${CYAN}Installing Server Node modules...${NC}"
npm install --production

# Build MongoDB Performance Indexes
echo -e "\n${YELLOW}Step 4/6: Building MongoDB Indexes for Query Acceleration...${NC}"
if [ -f "$APP_DIR/server/ensure_indexes.js" ]; then
    node "$APP_DIR/server/ensure_indexes.js" || echo -e "${YELLOW}⚠️ Index creation skipped or MongoDB not reachable during script run.${NC}"
fi

# 5. Configure Nginx Load Balancer
echo -e "\n${YELLOW}Step 5/6: Configuring Nginx Load Balancer (Ports 5001-5004)...${NC}"

NGINX_CONF_DEST="/etc/nginx/sites-available/lemo-ott"

cat << 'EOF' > "$NGINX_CONF_DEST"
# ==============================================================================
# LEMO OTT - Nginx Load Balancer Configuration for Hostinger VPS
# ==============================================================================

upstream backend_nodes {
    least_conn;
    server 127.0.0.1:5001 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:5002 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:5003 max_fails=3 fail_timeout=10s;
    server 127.0.0.1:5004 max_fails=3 fail_timeout=10s;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 10G;
    client_body_timeout 3600s;
    client_header_timeout 3600s;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/vnd.apple.mpegurl;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Health Check Endpoint
    location /health {
        proxy_pass http://backend_nodes/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # API Proxy Traffic
    location /api/ {
        proxy_pass http://backend_nodes;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 15s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # HLS Video Stream Caching
    location /hls/ {
        proxy_pass http://backend_nodes;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 1d;
        add_header Cache-Control "public, no-transform";
        add_header Access-Control-Allow-Origin "*";
    }

    # WebSockets / Live Stream Chat
    location /socket.io/ {
        proxy_pass http://backend_nodes;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Default Fallback
    location / {
        proxy_pass http://backend_nodes;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable Nginx Site
ln -sf "$NGINX_CONF_DEST" /etc/nginx/sites-enabled/lemo-ott
rm -f /etc/nginx/sites-enabled/default

# Test Nginx Syntax and Reload
nginx -t
systemctl restart nginx
systemctl enable nginx
systemctl restart redis-server
systemctl enable redis-server

# 6. PM2 Cluster Deployment
echo -e "\n${YELLOW}Step 6/6: Starting PM2 Process Cluster (4 API Nodes + 1 Worker)...${NC}"
cd "$APP_DIR"
pm2 start ecosystem.config.js || pm2 reload ecosystem.config.js
pm2 save

# Enable PM2 Startup on System Reboot
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root || true

echo -e "\n${GREEN}${BOLD}"
echo "======================================================================"
echo "  🎉 LEMO OTT BACKEND DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "======================================================================"
echo -e "${NC}"
echo -e "${CYAN}PM2 Process Cluster Status:${NC}"
pm2 status

echo -e "\n${YELLOW}Next Steps for SSL (Domain HTTPS):${NC}"
echo -e "Run: ${BOLD}sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com${BOLD}"
echo "======================================================================"
