# VPS Deployment Guide for Crypto Live

Complete guide to deploy your Crypto Live dashboard to a VPS server (like d3f4ult.tv).

## 📋 Prerequisites

- Ubuntu/Debian VPS with root access
- Domain name pointing to your VPS IP address
- SSH access to your server
- Minimum 2GB RAM recommended

## 🚀 Quick Start

### 1. Upload Files to Your VPS

```bash
# On your local machine, zip the project
zip -r crypto-live.zip . -x "node_modules/*" ".git/*"

# Upload to your VPS
scp crypto-live.zip root@d3f4ult.tv:/tmp/

# SSH into your VPS
ssh root@d3f4ult.tv

# Extract files
mkdir -p /var/www/crypto-live
cd /var/www/crypto-live
unzip /tmp/crypto-live.zip
```

### 2. Run the Setup Script

```bash
# Make the script executable
chmod +x vps-setup.sh

# Run the setup script
sudo ./vps-setup.sh
```

The script will prompt you for:
- Your domain name (e.g., `d3f4ult.tv`)
- Installation directory (default: `/var/www/crypto-live`)
- SSL certificate setup confirmation

### 3. Configure API Keys

Edit the `.env` file with your API credentials:

```bash
nano /var/www/crypto-live/.env
```

Add your actual API keys:

```env
TWITTER_API_KEY=your_actual_twitter_api_key
TWITTER_API_SECRET=your_actual_twitter_api_secret
TWITTER_BEARER_TOKEN=your_actual_twitter_bearer_token
```

Save and exit (Ctrl+X, then Y, then Enter).

### 4. Restart the Application

```bash
pm2 restart crypto-live
```

### 5. Test Your Installation

Visit your domain in a browser:
```
https://d3f4ult.tv
```

## 🎥 Configure OBS for Streaming

### OBS Settings

1. **Open OBS Studio**
2. **Go to Settings → Stream**
3. **Configure:**
   ```
   Service: Custom...
   Server: rtmp://d3f4ult.tv:1935/live
   Stream Key: [Get from your dashboard's Stream Settings panel]
   ```
4. **Click OK and Start Streaming**

### Get Your Stream Key

1. Visit your dashboard: `https://d3f4ult.tv`
2. Find the "Stream Settings" panel
3. Copy the Stream Key
4. Paste it into OBS

## 🔧 What the Setup Script Does

### System Packages Installed
- **nginx** - Web server and reverse proxy
- **ffmpeg** - Media transcoding for HLS
- **ufw** - Firewall management
- **certbot** - SSL certificate management
- **Node.js 20** - JavaScript runtime
- **PM2** - Process manager

### Ports Configured

| Port | Service | Firewall | Purpose |
|------|---------|----------|---------|
| 22 | SSH | ✅ Open | Server access |
| 80 | HTTP | ✅ Open | Redirects to HTTPS |
| 443 | HTTPS | ✅ Open | Main web access |
| 1935 | RTMP | ✅ Open | **OBS streaming input** |
| 5000 | Express | ✅ Open | Application server |
| 8888 | HLS | ✅ Open | **Stream playback** |

### Nginx Configuration

The script creates a reverse proxy that:
- Redirects HTTP to HTTPS
- Proxies main app from port 5000
- Proxies HLS streams from port 8888
- Enables WebSocket support
- Adds security headers
- Configures SSL/TLS

### PM2 Process Manager

Your app runs as a managed service:
- Auto-restarts on crashes
- Starts on server boot
- Logs to `logs/` directory
- Memory limit: 500MB

## 📊 Monitoring & Management

### Check Application Status

```bash
# View running processes
pm2 status

# View logs (real-time)
pm2 logs crypto-live

# View last 100 lines
pm2 logs crypto-live --lines 100

# View only errors
pm2 logs crypto-live --err
```

### Restart Application

```bash
# Restart the app
pm2 restart crypto-live

# Reload (zero-downtime)
pm2 reload crypto-live

# Stop the app
pm2 stop crypto-live

# Start the app
pm2 start crypto-live
```

### Check Nginx

```bash
# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Firewall

```bash
# View firewall status
sudo ufw status verbose

# Check specific port
sudo ufw status | grep 1935
```

### Check RTMP Server

```bash
# Check if RTMP is listening
sudo netstat -tulpn | grep 1935

# Check HLS server
sudo netstat -tulpn | grep 8888

# Test RTMP connection
telnet localhost 1935
```

## 🔒 Security Checklist

- ✅ Firewall configured (UFW)
- ✅ HTTPS with Let's Encrypt SSL
- ✅ Security headers added
- ✅ Session secrets randomized
- ✅ Environment variables secured (600 permissions)
- ✅ Auto-renewal for SSL certificates

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs crypto-live --lines 50

# Check if port 5000 is available
sudo netstat -tulpn | grep 5000

# Restart the app
pm2 restart crypto-live
```

### RTMP Stream Not Working

```bash
# Check if RTMP server is running
sudo netstat -tulpn | grep 1935

# Check logs for RTMP errors
pm2 logs crypto-live | grep RTMP

# Verify firewall allows port 1935
sudo ufw status | grep 1935

# Test RTMP port
telnet d3f4ult.tv 1935
```

### Nginx Errors

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

### HLS Playback Not Working

```bash
# Check if HLS server is running
sudo netstat -tulpn | grep 8888

# Check if stream file exists (while streaming)
ls -la /tmp/node_media_server/live/*/

# Test HLS URL directly
curl -I http://localhost:8888/live/your-stream-key/index.m3u8
```

## 🔄 Updating the Application

```bash
# Stop the app
pm2 stop crypto-live

# Pull latest code (if using git)
cd /var/www/crypto-live
git pull

# Or upload new files
# scp -r ./dist root@d3f4ult.tv:/var/www/crypto-live/

# Install new dependencies
npm install --production

# Restart the app
pm2 restart crypto-live
```

## 📁 Important Files & Directories

```
/var/www/crypto-live/           # Application root
├── .env                        # Environment variables (API keys)
├── ecosystem.config.js         # PM2 configuration
├── logs/                       # Application logs
│   ├── error.log              # Error logs
│   ├── output.log             # Standard output
│   └── combined.log           # All logs
├── server/                     # Backend code
└── client/                     # Frontend code

/etc/nginx/
├── sites-available/crypto-live # Nginx configuration
└── sites-enabled/crypto-live   # Active site

/etc/letsencrypt/
└── live/d3f4ult.tv/           # SSL certificates

/tmp/node_media_server/         # RTMP temporary files
└── live/                       # Active streams
```

## 🎯 Performance Optimization

### Enable Nginx Caching (Optional)

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/crypto-live

# Add caching for static assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Increase PM2 Instances (Optional)

```bash
# Edit ecosystem.config.js
nano /var/www/crypto-live/ecosystem.config.js

# Change instances from 1 to number of CPU cores
instances: 2,  # or 'max' for all cores

# Restart
pm2 restart crypto-live
```

## 💡 Tips

1. **Monitor Logs**: Always check logs after deployment
   ```bash
   pm2 logs crypto-live
   ```

2. **Test Before Going Live**: Test RTMP locally first
   ```bash
   rtmp://localhost:1935/live
   ```

3. **Backup Config**: Save your `.env` file securely
   ```bash
   cp .env .env.backup
   ```

4. **DNS Propagation**: Wait 5-10 minutes after changing DNS

5. **Firewall**: Double-check all required ports are open
   ```bash
   sudo ufw status verbose
   ```

## 🆘 Getting Help

If you encounter issues:

1. **Check logs first**: `pm2 logs crypto-live`
2. **Verify ports are open**: `sudo netstat -tulpn`
3. **Test nginx config**: `sudo nginx -t`
4. **Check firewall**: `sudo ufw status`

## 📞 Support

For additional help:
- Check application logs: `pm2 logs crypto-live`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify environment variables: `pm2 env 0`

---

**Ready to deploy?** Run `sudo ./vps-setup.sh` and follow the prompts! 🚀
