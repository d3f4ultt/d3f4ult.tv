# Crypto Live Dashboard - Quick Reference

Fast reference for common deployment and management tasks.

## 🚀 Initial Deployment (One-Time Setup)

```bash
# 1. Run setup script on your VPS
sudo bash setup-vps.sh

# 2. Clone your code
cd /var/www/crypto-live
git clone https://github.com/your-username/crypto-live.git .

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 5. Setup SSL
sudo certbot --nginx -d crypto.yourdomain.com -m you@email.com --agree-tos

# 6. Start application
pm2 start npm --name crypto-live -- run dev
pm2 save
pm2 startup  # Run the command it outputs
```

## 🔄 Updating Your App

```bash
cd /var/www/crypto-live
git pull
npm install
pm2 restart crypto-live
```

## 📊 Monitoring

```bash
# View app status
pm2 status

# View live logs
pm2 logs crypto-live

# View last 100 lines
pm2 logs crypto-live --lines 100

# Monitor CPU/Memory
pm2 monit
```

## 🛠️ Common Commands

### Application Management
```bash
pm2 restart crypto-live    # Restart app
pm2 stop crypto-live       # Stop app
pm2 delete crypto-live     # Remove from PM2
pm2 save                   # Save process list
```

### Nginx Management
```bash
sudo systemctl status nginx      # Check status
sudo systemctl restart nginx     # Restart
sudo nginx -t                    # Test config
sudo systemctl reload nginx      # Reload config
```

### View Logs
```bash
pm2 logs crypto-live                          # App logs
sudo tail -f /var/log/nginx/access.log        # Nginx access
sudo tail -f /var/log/nginx/error.log         # Nginx errors
```

### Check Ports
```bash
sudo netstat -tlnp | grep 5000    # Express app
sudo netstat -tlnp | grep 1935    # RTMP server
sudo netstat -tlnp | grep 8888    # HLS server
```

## 🔐 SSL Certificate Renewal

```bash
# Auto-renewal is configured by certbot
# Manual renewal:
sudo certbot renew

# Test renewal process:
sudo certbot renew --dry-run
```

## 🎥 OBS Configuration

```
Service: Custom...
Server: rtmp://crypto.yourdomain.com:1935/live
Stream Key: Get from dashboard at /api/stream/config

Output Settings:
- Encoder: x264
- Rate Control: CBR
- Bitrate: 2500-6000 Kbps
- Keyframe Interval: 2
- Preset: veryfast
- Profile: main
```

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check Node version (must be 20.x)
node --version

# Check for port conflicts
sudo lsof -i :5000

# Reinstall dependencies
rm -rf node_modules
npm install
pm2 restart crypto-live
```

### RTMP Not Working
```bash
# Check FFmpeg
ffmpeg -version

# Check port is open
sudo ufw status | grep 1935
sudo netstat -tlnp | grep 1935

# Check logs
pm2 logs crypto-live | grep -i rtmp
```

### High Memory Usage
```bash
# Check memory
free -h

# Restart app
pm2 restart crypto-live

# Set memory limit
pm2 start npm --name crypto-live --max-memory-restart 1G -- run dev
```

## 📝 Environment Variables

Required in `/var/www/crypto-live/.env`:

```env
SESSION_SECRET=random-string-here
TWITTER_BEARER_TOKEN=your-token
TWITTER_API_KEY=your-key
TWITTER_API_SECRET=your-secret
NODE_ENV=production
PORT=5000
```

## 🔥 Firewall Rules

```bash
sudo ufw status
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 1935/tcp   # RTMP
sudo ufw allow 8888/tcp   # HLS
```

## 🌐 URLs After Deployment

- **Main Dashboard**: `https://crypto.yourdomain.com`
- **OBS Guide**: `https://crypto.yourdomain.com/obs-guide`
- **Stream Config API**: `https://crypto.yourdomain.com/api/stream/config`
- **RTMP Ingest**: `rtmp://crypto.yourdomain.com:1935/live/{key}`
- **HLS Playback**: `http://crypto.yourdomain.com:8888/live/{key}/index.m3u8`

## 💾 Backup Commands

```bash
# Backup entire project
tar -czf crypto-live-backup-$(date +%Y%m%d).tar.gz /var/www/crypto-live

# Backup environment file
cp /var/www/crypto-live/.env ~/env-backup-$(date +%Y%m%d).env

# Backup Nginx config
cp /etc/nginx/sites-available/crypto-live ~/nginx-backup-$(date +%Y%m%d).conf
```

## 🆘 Emergency Recovery

```bash
# If app crashes repeatedly
pm2 delete crypto-live
cd /var/www/crypto-live
rm -rf node_modules
npm install
pm2 start npm --name crypto-live -- run dev
pm2 save

# If Nginx fails
sudo nginx -t  # Check for config errors
sudo systemctl restart nginx

# If ports are blocked
sudo ufw disable
sudo ufw enable
# Re-add rules from above
```

## 📞 Getting Help

1. Check app logs: `pm2 logs crypto-live`
2. Check Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Check system: `dmesg | tail`
4. Verify DNS: `nslookup crypto.yourdomain.com`
5. Test ports: `telnet crypto.yourdomain.com 1935`

---

**Quick Test After Deployment:**

```bash
# 1. App is running
pm2 status
# Should show: crypto-live | online

# 2. Nginx is running
sudo systemctl status nginx
# Should show: active (running)

# 3. Ports are open
sudo netstat -tlnp | grep -E '5000|1935|8888'
# Should show all three ports

# 4. SSL is working
curl -I https://crypto.yourdomain.com
# Should return 200 OK

# 5. App responds
curl http://localhost:5000
# Should return HTML

# All green? You're live! 🚀
```
