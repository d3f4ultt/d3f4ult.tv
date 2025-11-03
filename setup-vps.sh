#!/bin/bash
#
# Crypto Live Dashboard - VPS Setup Script
# For Debian/Ubuntu servers
#
# This script installs and configures everything needed to run the dashboard
# including Node.js, FFmpeg, Nginx, SSL, and all required dependencies.
#
# Usage: sudo bash setup-vps.sh
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Crypto Live Dashboard - VPS Setup${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}" 
   exit 1
fi

# Get user input for configuration
echo -e "${YELLOW}Please provide the following information:${NC}\n"

read -p "Your domain name (e.g., crypto.yourdomain.com): " DOMAIN
read -p "Your email for SSL certificates: " EMAIL
read -p "Project directory path (default: /var/www/crypto-live): " PROJECT_DIR
PROJECT_DIR=${PROJECT_DIR:-/var/www/crypto-live}

echo -e "\n${GREEN}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Project Directory: $PROJECT_DIR"
echo ""
read -p "Continue with installation? (y/n): " CONFIRM

if [[ $CONFIRM != "y" ]]; then
    echo -e "${RED}Installation cancelled.${NC}"
    exit 0
fi

echo -e "\n${GREEN}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo -e "\n${GREEN}[2/10] Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo -e "\n${GREEN}[3/10] Installing FFmpeg (required for RTMP streaming)...${NC}"
apt-get install -y ffmpeg

echo -e "\n${GREEN}[4/10] Installing Nginx (web server & reverse proxy)...${NC}"
apt-get install -y nginx

echo -e "\n${GREEN}[5/10] Installing PM2 (process manager)...${NC}"
npm install -g pm2

echo -e "\n${GREEN}[6/10] Installing Certbot (for SSL certificates)...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "\n${GREEN}[7/10] Configuring firewall (UFW)...${NC}"
ufw --force enable
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 1935/tcp    # RTMP streaming
ufw allow 8888/tcp    # HLS video server
echo -e "${GREEN}Firewall configured. Open ports: 22, 80, 443, 1935, 8888${NC}"

echo -e "\n${GREEN}[8/10] Creating project directory...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo -e "\n${GREEN}[9/10] Configuring Nginx reverse proxy...${NC}"
cat > /etc/nginx/sites-available/crypto-live << EOF
# Main application server
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect HTTP to HTTPS (will be enabled after SSL setup)
    # return 301 https://\$server_name\$request_uri;

    # Express app (port 5000)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        
        # Standard headers
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts for long-running connections
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}

# HLS video server (port 8888)
server {
    listen 8888;
    server_name $DOMAIN;
    
    location /live {
        # CORS headers for HLS playback
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, OPTIONS';
        add_header Access-Control-Allow-Headers 'Range';
        
        # Handle OPTIONS requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods 'GET, OPTIONS';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
        
        # Proxy to node-media-server HLS output
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/crypto-live /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "\n${GREEN}[10/10] Creating environment template...${NC}"
cat > $PROJECT_DIR/.env.example << EOF
# Session secret (generate a random string)
SESSION_SECRET=change-this-to-random-string-$(openssl rand -hex 32)

# Twitter API credentials (required for tweet feed)
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret

# Restream chat token (optional, has fallback)
VITE_RESTREAM_CHAT_TOKEN=your-restream-chat-token

# Node environment
NODE_ENV=production

# Server ports (don't change these)
PORT=5000
RTMP_PORT=1935
HLS_PORT=8888
EOF

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}\n"

echo -e "${GREEN}1. Upload your code to $PROJECT_DIR${NC}"
echo "   git clone <your-repo> $PROJECT_DIR"
echo ""

echo -e "${GREEN}2. Install application dependencies${NC}"
echo "   cd $PROJECT_DIR"
echo "   npm install"
echo ""

echo -e "${GREEN}3. Configure environment variables${NC}"
echo "   cp .env.example .env"
echo "   nano .env  # Edit with your API keys"
echo ""

echo -e "${GREEN}4. Setup SSL certificate (HTTPS)${NC}"
echo "   certbot --nginx -d $DOMAIN -m $EMAIL --agree-tos --non-interactive"
echo ""

echo -e "${GREEN}5. Start the application with PM2${NC}"
echo "   cd $PROJECT_DIR"
echo "   pm2 start npm --name crypto-live -- run dev"
echo "   pm2 save"
echo "   pm2 startup"
echo ""

echo -e "${GREEN}6. Verify services are running${NC}"
echo "   pm2 status"
echo "   systemctl status nginx"
echo ""

echo -e "${YELLOW}Your dashboard will be accessible at:${NC}"
echo "   Main App:    http://$DOMAIN (https after SSL setup)"
echo "   HLS Stream:  http://$DOMAIN:8888/live/{stream-key}/index.m3u8"
echo "   RTMP Ingest: rtmp://$DOMAIN:1935/live/{stream-key}"
echo ""

echo -e "${YELLOW}Installed Versions:${NC}"
node --version | sed 's/^/   Node.js: /'
npm --version | sed 's/^/   NPM: /'
ffmpeg -version | head -n1 | sed 's/^/   /'
nginx -v 2>&1 | sed 's/^/   /'
pm2 --version | sed 's/^/   PM2: /'

echo -e "\n${GREEN}Setup complete! Follow the next steps above to deploy your app.${NC}\n"
