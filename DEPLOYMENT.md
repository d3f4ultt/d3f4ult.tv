# Crypto Live Dashboard - VPS Deployment Guide

Complete guide for deploying the Crypto Live dashboard to your own Debian/Ubuntu VPS server.

## 📋 Requirements

### Server Specifications
- **OS**: Debian 11+ or Ubuntu 20.04+
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2+ cores
- **Storage**: 20GB+ SSD
- **Bandwidth**: Unmetered (for streaming)

### Required Ports
Your firewall must allow these ports:
- **22** - SSH access
- **80** - HTTP (web traffic)
- **443** - HTTPS (secure web traffic)
- **1935** - RTMP streaming (OBS ingest)
- **8888** - HLS video delivery

### DNS Configuration
Point your domain to your VPS IP address:
```
A record: crypto.yourdomain.com → 123.45.67.89
```

## 🚀 Quick Start

### 1. Run the Setup Script

SSH into your server and run:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/your-repo/crypto-live/main/setup-vps.sh

# Make it executable
chmod +x setup-vps.sh

# Run as root
sudo bash setup-vps.sh
```

The script will prompt you for:
- Your domain name
- Your email (for SSL certificates)
- Project directory (default: `/var/www/crypto-live`)

### 2. Deploy Your Code

```bash
# Navigate to project directory
cd /var/www/crypto-live

# Clone your repository (or upload via SFTP)
git clone https://github.com/your-username/crypto-live.git .

# Install dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy the environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

Required environment variables:
```env
SESSION_SECRET=your-random-secret-key
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
NODE_ENV=production
```

### 4. Setup SSL (HTTPS)

```bash
# Get free SSL certificate from Let's Encrypt
sudo certbot --nginx -d crypto.yourdomain.com -m you@email.com --agree-tos --non-interactive

# Certbot will automatically configure Nginx for HTTPS
```

### 5. Start the Application

```bash
# Start with PM2 (process manager)
pm2 start npm --name crypto-live -- run dev

# Save the process list
pm2 save

# Enable auto-start on server reboot
pm2 startup
# Copy and run the command it outputs
```

### 6. Verify Everything Works

```bash
# Check app is running
pm2 status

# Check Nginx is running
sudo systemctl status nginx

# View app logs
pm2 logs crypto-live

# Test URLs
curl http://localhost:5000  # Should return HTML
```

## 🎥 OBS Streaming Configuration

### RTMP Settings
```
Service: Custom...
Server: rtmp://crypto.yourdomain.com:1935/live
Stream Key: (get from dashboard /api/stream/config)
```

### Output Settings
- **Video Bitrate**: 2500-6000 Kbps
- **Audio Bitrate**: 128 Kbps
- **Encoder**: x264 or NVENC H.264
- **Keyframe Interval**: 2 seconds

## 🔧 Management Commands

### Application Management
```bash
# View status
pm2 status

# View logs
pm2 logs crypto-live

# Restart app
pm2 restart crypto-live

# Stop app
pm2 stop crypto-live

# Update after code changes
cd /var/www/crypto-live
git pull
npm install
pm2 restart crypto-live
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check open ports
sudo netstat -tlnp
```

## 🛡️ Security Best Practices

### 1. Firewall Configuration
```bash
# Only allow necessary ports
sudo ufw status
sudo ufw enable
```

### 2. SSH Hardening
```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config

# Set: PasswordAuthentication no
# Set: PermitRootLogin no

sudo systemctl restart sshd
```

### 3. Keep System Updated
```bash
# Update packages regularly
sudo apt-get update
sudo apt-get upgrade -y

# Auto-renew SSL certificates (certbot handles this automatically)
```

### 4. Secure Environment Variables
```bash
# Restrict .env file permissions
chmod 600 /var/www/crypto-live/.env
```

## 📊 Monitoring & Logs

### Application Logs
```bash
# Real-time logs
pm2 logs crypto-live --lines 100

# Error logs only
pm2 logs crypto-live --err

# Save logs to file
pm2 logs crypto-live > app.log
```

### RTMP Server Logs
Check the node-media-server logs in PM2 output for RTMP connection info.

### Nginx Access Logs
```bash
# View recent requests
sudo tail -f /var/log/nginx/access.log

# View errors
sudo tail -f /var/log/nginx/error.log
```

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check for port conflicts
sudo lsof -i :5000

# Check Node.js version
node --version  # Should be 20.x

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### RTMP Streaming Not Working
```bash
# Check FFmpeg is installed
ffmpeg -version

# Verify port 1935 is open
sudo netstat -tlnp | grep 1935

# Check firewall
sudo ufw status | grep 1935

# Test RTMP connection
telnet your-domain.com 1935
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Test renewal process
sudo certbot renew --dry-run

# Check certificate expiration
sudo certbot certificates
```

### High CPU/Memory Usage
```bash
# Check processes
pm2 monit

# Restart app
pm2 restart crypto-live

# Increase server resources if needed
```

## 🔄 Updates & Maintenance

### Updating the Application
```bash
cd /var/www/crypto-live
git pull origin main
npm install
pm2 restart crypto-live
```

### Database Backups (if using PostgreSQL)
```bash
# Backup database
pg_dump -U postgres crypto_live > backup.sql

# Restore database
psql -U postgres crypto_live < backup.sql
```

### System Backups
Consider using:
- **DigitalOcean Snapshots** (automated server images)
- **Backblaze B2** (file backups)
- **rsync** (incremental backups)

## 💰 Recommended VPS Providers

### Budget Options ($5-12/month)
- **DigitalOcean** - $12/month (2GB RAM, 2 vCPUs)
- **Linode** - $12/month (2GB RAM, 1 vCPU)
- **Vultr** - $10/month (2GB RAM, 1 vCPU)
- **Hetzner** - $5/month (2GB RAM, 1 vCPU) - EU only

### Premium Options ($20+/month)
- **AWS Lightsail** - $20/month (4GB RAM, 2 vCPUs)
- **Google Cloud** - Pay-as-you-go
- **Azure** - Pay-as-you-go

## 📞 Support

If you encounter issues:

1. Check application logs: `pm2 logs crypto-live`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all ports are open: `sudo ufw status`
4. Ensure environment variables are set correctly
5. Restart services: `pm2 restart crypto-live && sudo systemctl restart nginx`

## 🎯 Performance Optimization

### Enable Gzip Compression
Add to your Nginx config:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### Enable Nginx Caching
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

### PM2 Cluster Mode (use multiple CPU cores)
```bash
pm2 start npm --name crypto-live -i max -- run dev
```

## ✅ Post-Deployment Checklist

- [ ] Domain DNS pointing to server IP
- [ ] SSL certificate installed and auto-renewing
- [ ] Firewall configured (ports 22, 80, 443, 1935, 8888)
- [ ] Application running via PM2
- [ ] PM2 auto-start enabled
- [ ] Environment variables configured
- [ ] RTMP streaming tested with OBS
- [ ] WebSocket connections working
- [ ] Logs accessible and monitored
- [ ] Backup strategy in place

---

**Note**: This dashboard requires a full Node.js server environment. It cannot run on static hosting platforms like GitHub Pages, Netlify, or Vercel's free tier.
