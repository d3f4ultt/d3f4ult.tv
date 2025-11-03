# 🚀 VPS Deployment Package

Complete self-hosting solution for the Crypto Live Dashboard. This package includes everything you need to deploy to your own Debian/Ubuntu VPS server.

## 📦 What's Included

This deployment package contains all configuration files and documentation needed for production deployment:

### Core Deployment Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **setup-vps.sh** | Automated installation script | Run this FIRST on your fresh VPS |
| **DEPLOYMENT.md** | Complete deployment guide | Reference for detailed instructions |
| **DEPLOYMENT-CHECKLIST.md** | Step-by-step checklist | Follow this to track your progress |
| **QUICK-REFERENCE.md** | Command reference | Quick lookup for daily operations |

### Configuration Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **nginx.conf.example** | Production Nginx config | Reference for manual Nginx setup |
| **pm2.ecosystem.config.js** | PM2 process management | Advanced process configuration |
| **.env.example** | Environment template | Copy and fill with your API keys |

## 🎯 Quick Start (5 Steps)

### 1. Get a VPS Server
Choose a provider:
- **DigitalOcean**: $12/month (2GB RAM) - Recommended
- **Linode**: $12/month (2GB RAM)
- **Vultr**: $10/month (2GB RAM)
- **Hetzner**: $5/month (2GB RAM) - EU only

### 2. Point Your Domain
Add DNS A record:
```
crypto.yourdomain.com → 123.45.67.89 (your VPS IP)
```

### 3. Run Setup Script
SSH into your server and run:
```bash
wget https://raw.githubusercontent.com/YOUR-USERNAME/crypto-live/main/setup-vps.sh
chmod +x setup-vps.sh
sudo bash setup-vps.sh
```

### 4. Deploy Your Code
```bash
cd /var/www/crypto-live
git clone https://github.com/YOUR-USERNAME/crypto-live.git .
npm install
```

### 5. Configure & Start
```bash
# Add your API keys
cp .env.example .env
nano .env

# Setup SSL
sudo certbot --nginx -d crypto.yourdomain.com -m you@email.com --agree-tos

# Start the app
pm2 start npm --name crypto-live -- run dev
pm2 save
pm2 startup
```

**Done!** Visit `https://crypto.yourdomain.com` 🎉

## 📚 Documentation Guide

### For First-Time Deployment
Start here, in this order:
1. Read this README (you are here)
2. Review **DEPLOYMENT-CHECKLIST.md** - Your step-by-step guide
3. Reference **DEPLOYMENT.md** for detailed explanations
4. Keep **QUICK-REFERENCE.md** open for commands

### For Daily Operations
- **QUICK-REFERENCE.md** - Common commands and troubleshooting
- **PM2 Commands**: `pm2 status`, `pm2 logs`, `pm2 restart`
- **Update App**: `git pull && npm install && pm2 restart crypto-live`

### For Advanced Configuration
- **nginx.conf.example** - Customize reverse proxy settings
- **pm2.ecosystem.config.js** - Advanced process management

## ⚙️ What the Setup Script Does

The `setup-vps.sh` script automatically installs and configures:

1. ✅ **Node.js 20.x** - JavaScript runtime
2. ✅ **FFmpeg** - Video transcoding for RTMP
3. ✅ **Nginx** - Web server and reverse proxy
4. ✅ **PM2** - Process manager
5. ✅ **Certbot** - SSL certificate manager
6. ✅ **UFW Firewall** - Configured with required ports
7. ✅ **System Updates** - Latest security patches

**Estimated time**: 5-10 minutes

## 🔌 Required Ports

The dashboard requires these ports to be open:

| Port | Service | Purpose |
|------|---------|---------|
| 22 | SSH | Server management |
| 80 | HTTP | Web traffic (redirects to HTTPS) |
| 443 | HTTPS | Secure web traffic |
| 1935 | RTMP | OBS streaming ingest |
| 8888 | HLS | Video playback |

The setup script configures these automatically.

## 🔑 Environment Variables

You'll need these API credentials (create at respective platforms):

```env
SESSION_SECRET=random-string-here
TWITTER_BEARER_TOKEN=get-from-twitter-developer-portal
TWITTER_API_KEY=get-from-twitter-developer-portal
TWITTER_API_SECRET=get-from-twitter-developer-portal
VITE_RESTREAM_CHAT_TOKEN=optional-from-restream
```

### Where to Get API Keys

- **Twitter API**: https://developer.twitter.com/en/portal/dashboard
  - Apply for Essential access (free)
  - Create a new app
  - Generate Bearer Token and API keys

- **Restream** (optional): https://restream.io/
  - Sign up for free account
  - Get embed token from dashboard

## 🆚 Replit vs Self-Hosted

| Feature | Replit | Self-Hosted VPS |
|---------|--------|-----------------|
| **Setup Time** | 0 minutes | 30-60 minutes |
| **Monthly Cost** | Free tier / $20+ | $5-20 |
| **Maintenance** | Automatic | You manage |
| **SSL/HTTPS** | Automatic | Setup required |
| **Ports** | Auto-configured | Manual config |
| **Scaling** | Automatic | Manual |
| **Control** | Limited | Full control |
| **Best For** | Quick deployment | Production use |

## 🎥 OBS Configuration

After deployment, configure OBS to stream:

```
Service: Custom...
Server: rtmp://crypto.yourdomain.com:1935/live
Stream Key: Get from dashboard

Recommended Settings:
- Output Mode: Advanced
- Encoder: x264
- Rate Control: CBR
- Bitrate: 2500-6000 Kbps
- Keyframe Interval: 2
- CPU Preset: veryfast
- Profile: main
```

## 🐛 Common Issues & Solutions

### "Connection Refused" Error
```bash
# Check if app is running
pm2 status

# Check Nginx
sudo systemctl status nginx

# Restart services
pm2 restart crypto-live
sudo systemctl restart nginx
```

### RTMP Streaming Not Working
```bash
# Verify FFmpeg installed
ffmpeg -version

# Check port 1935 is open
sudo ufw status | grep 1935
sudo netstat -tlnp | grep 1935
```

### SSL Certificate Fails
```bash
# Ensure DNS is propagated
nslookup crypto.yourdomain.com

# Try manual certificate
sudo certbot certonly --nginx -d crypto.yourdomain.com
```

## 📊 Monitoring Your Dashboard

### Check Health
```bash
pm2 status          # App status
pm2 logs crypto-live # View logs
pm2 monit           # Real-time monitoring
```

### View Metrics
```bash
free -h             # Memory usage
df -h               # Disk usage
sudo netstat -tlnp  # Open ports
```

### Setup Uptime Monitoring
- Sign up at https://uptimerobot.com (free)
- Add monitor for `https://crypto.yourdomain.com`
- Configure email alerts

## 🔄 Updating Your Dashboard

When you make changes to your code:

```bash
cd /var/www/crypto-live
git pull                    # Get latest code
npm install                 # Update dependencies
pm2 restart crypto-live     # Restart app
```

## 💾 Backup Strategy

### Quick Backup
```bash
# Backup entire project
tar -czf ~/crypto-backup-$(date +%Y%m%d).tar.gz /var/www/crypto-live

# Backup environment file
cp /var/www/crypto-live/.env ~/env-backup.env
```

### Automated Backups
Consider using:
- VPS provider snapshots (DigitalOcean, Linode)
- Cron jobs for daily backups
- Cloud storage (S3, Backblaze B2)

## 🆘 Getting Help

1. **Check logs first**: `pm2 logs crypto-live`
2. **Review documentation**: See DEPLOYMENT.md
3. **Test components**: Verify each service individually
4. **Community support**: GitHub issues or discussions

## ✅ Success Checklist

Your deployment is successful when:

- [ ] Dashboard loads at `https://crypto.yourdomain.com`
- [ ] SSL certificate is valid (green padlock)
- [ ] Crypto prices display and update
- [ ] All 3 layout modes work (press 1, 2, 3 keys)
- [ ] OBS can connect to RTMP server
- [ ] Stream appears in dashboard when streaming
- [ ] WebSocket shows "LIVE" indicator
- [ ] No errors in: `pm2 logs crypto-live`

## 📝 Next Steps After Deployment

1. **Test thoroughly** - Try all features
2. **Setup monitoring** - Use UptimeRobot
3. **Configure backups** - Automate daily backups
4. **Customize branding** - Add your logo, colors
5. **Share your stream** - Go live!

## 🎓 Learning Resources

- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Guide**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/
- **DigitalOcean Tutorials**: https://www.digitalocean.com/community/tutorials

## 📄 File Structure

```
crypto-live/
├── setup-vps.sh                  # Automated installation script
├── DEPLOYMENT.md                 # Detailed deployment guide
├── DEPLOYMENT-CHECKLIST.md       # Step-by-step checklist
├── QUICK-REFERENCE.md            # Command reference
├── VPS-DEPLOYMENT-README.md      # This file
├── nginx.conf.example            # Nginx configuration
├── pm2.ecosystem.config.js       # PM2 configuration
├── .env.example                  # Environment template
└── [your application files]
```

---

## 🚀 Ready to Deploy?

1. **Read**: DEPLOYMENT-CHECKLIST.md
2. **Run**: setup-vps.sh on your VPS
3. **Deploy**: Your code
4. **Configure**: Environment variables
5. **Go Live**: pm2 start

**Questions?** Check DEPLOYMENT.md for detailed explanations!

**Estimated Total Time**: 30-60 minutes for first deployment

Good luck! 🎉
