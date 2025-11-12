#!/bin/bash
set -e

echo "======================================"
echo "Crypto Live VPS Setup Script"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Get domain name from user
read -p "Enter your domain name (e.g., d3f4ult.tv): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name is required${NC}"
    exit 1
fi

# Get application directory
read -p "Enter installation directory [/var/www/crypto-live]: " APP_DIR
APP_DIR=${APP_DIR:-/var/www/crypto-live}

echo ""
echo -e "${GREEN}Configuration:${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo "Ports: 5000 (App), 1935 (RTMP), 8888 (HLS)"
echo ""
read -p "Continue with installation? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""
echo "======================================"
echo "Step 1: Installing System Dependencies"
echo "======================================"

# Update system
apt-get update
apt-get upgrade -y

# Install required packages
apt-get install -y \
    curl \
    git \
    nginx \
    ufw \
    ffmpeg \
    certbot \
    python3-certbot-nginx

# Install Node.js 20 if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install PM2 globally
npm install -g pm2

echo ""
echo "======================================"
echo "Step 2: Configuring Firewall (UFW)"
echo "======================================"

# Configure firewall
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (important!)
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow RTMP streaming port
ufw allow 1935/tcp

# Allow HLS streaming port
ufw allow 8888/tcp

# Allow application port (for direct access if needed)
ufw allow 5000/tcp

# Enable firewall
ufw --force enable

echo ""
echo -e "${GREEN}Firewall configured:${NC}"
ufw status

echo ""
echo "======================================"
echo "Step 3: Creating Application Directory"
echo "======================================"

# Create app directory if it doesn't exist
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Set permissions
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR"

echo "Application directory created: $APP_DIR"
echo ""
echo -e "${YELLOW}Next: Upload your application files to $APP_DIR${NC}"
echo ""
read -p "Press enter when files are uploaded..." 

# Install npm dependencies
if [ -f "package.json" ]; then
    echo "Installing npm dependencies..."
    npm install --production
else
    echo -e "${YELLOW}Warning: package.json not found. Skipping npm install.${NC}"
fi

echo ""
echo "======================================"
echo "Step 4: Creating Environment Configuration"
echo "======================================"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Session Secret (generate a random one)
SESSION_SECRET=$(openssl rand -base64 32)

# Twitter API Configuration
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# RTMP Configuration (automatically enabled on VPS)
# DISABLE_RTMP=false  # Leave commented to enable RTMP
EOF
    
    echo -e "${GREEN}.env file created${NC}"
    echo -e "${YELLOW}Please edit $APP_DIR/.env and add your API keys${NC}"
    chown $SUDO_USER:$SUDO_USER .env
    chmod 600 .env
else
    echo ".env file already exists"
fi

echo ""
echo "======================================"
echo "Step 5: Configuring Nginx"
echo "======================================"

# Create nginx configuration
cat > /etc/nginx/sites-available/crypto-live << EOF
# Upstream for main application
upstream crypto_app {
    server localhost:5000;
    keepalive 64;
}

# Upstream for HLS streaming
upstream hls_stream {
    server localhost:8888;
    keepalive 32;
}

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server - Main Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates (will be configured by certbot)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client body size (for uploads)
    client_max_body_size 10M;

    # Main application proxy
    location / {
        proxy_pass http://crypto_app;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # HLS streaming proxy
    location /live/ {
        proxy_pass http://hls_stream/live/;
        proxy_http_version 1.1;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        
        # CORS headers for HLS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range" always;
        
        # Cache control for streaming
        add_header Cache-Control "no-cache" always;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/crypto-live /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo -e "${GREEN}Nginx configured successfully${NC}"

echo ""
echo "======================================"
echo "Step 6: Setting up PM2 Process Manager"
echo "======================================"

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'crypto-live',
    script: 'npm',
    args: 'run dev',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    error_file: '$APP_DIR/logs/error.log',
    out_file: '$APP_DIR/logs/output.log',
    log_file: '$APP_DIR/logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Stop any existing instance
pm2 delete crypto-live 2>/dev/null || true

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
env PATH=\$PATH:/usr/bin pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo -e "${GREEN}PM2 configured successfully${NC}"

echo ""
echo "======================================"
echo "Step 7: SSL Certificate (Let's Encrypt)"
echo "======================================"

echo ""
echo -e "${YELLOW}Ready to obtain SSL certificate for $DOMAIN${NC}"
echo "Make sure your domain DNS is pointing to this server's IP address"
echo ""
read -p "Obtain SSL certificate now? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Obtain SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --register-unsafely-without-email || {
        echo -e "${YELLOW}SSL certificate setup failed. You can run it manually later:${NC}"
        echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    }
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
else
    echo -e "${YELLOW}Skipping SSL certificate. Run manually later:${NC}"
    echo "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

echo ""
echo "======================================"
echo "Setup Complete! 🎉"
echo "======================================"
echo ""
echo -e "${GREEN}Your Crypto Live dashboard is now running!${NC}"
echo ""
echo "📋 Configuration Summary:"
echo "  • Domain: https://$DOMAIN"
echo "  • Application: Port 5000 (proxied via nginx)"
echo "  • RTMP Server: rtmp://$DOMAIN:1935/live"
echo "  • HLS Server: https://$DOMAIN/live/{stream-key}/index.m3u8"
echo ""
echo "🔧 Useful Commands:"
echo "  • View logs: pm2 logs crypto-live"
echo "  • Restart app: pm2 restart crypto-live"
echo "  • Stop app: pm2 stop crypto-live"
echo "  • Check status: pm2 status"
echo "  • Nginx reload: sudo systemctl reload nginx"
echo "  • Check firewall: sudo ufw status"
echo ""
echo "📝 Next Steps:"
echo "  1. Edit $APP_DIR/.env with your API keys"
echo "  2. Restart the app: pm2 restart crypto-live"
echo "  3. Visit https://$DOMAIN to test"
echo "  4. Configure OBS with RTMP URL: rtmp://$DOMAIN:1935/live"
echo ""
echo "🔒 Open Ports:"
echo "  • 22 (SSH)"
echo "  • 80 (HTTP)"
echo "  • 443 (HTTPS)"
echo "  • 1935 (RTMP)"
echo "  • 5000 (App - optional direct access)"
echo "  • 8888 (HLS)"
echo ""
echo -e "${YELLOW}⚠️  Important: Configure your API keys in the .env file!${NC}"
echo ""
