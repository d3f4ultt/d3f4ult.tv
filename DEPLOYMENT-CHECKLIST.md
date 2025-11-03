# VPS Deployment Checklist

Complete this checklist to successfully deploy Crypto Live Dashboard to your VPS.

## Pre-Deployment

- [ ] **VPS Purchased** (Recommended: DigitalOcean $12/month, 2GB RAM)
- [ ] **Domain Name** registered and pointing to VPS IP
  - DNS A record: `crypto.yourdomain.com → YOUR.VPS.IP.ADDRESS`
  - Wait 5-10 minutes for DNS propagation
- [ ] **SSH Access** confirmed (`ssh root@YOUR.VPS.IP.ADDRESS`)
- [ ] **API Keys Ready**:
  - [ ] Twitter Bearer Token
  - [ ] Twitter API Key
  - [ ] Twitter API Secret
  - [ ] Restream Chat Token (optional)

## Step 1: Initial Server Setup

- [ ] Connect via SSH: `ssh root@YOUR.VPS.IP.ADDRESS`
- [ ] Download setup script:
  ```bash
  wget https://raw.githubusercontent.com/YOUR-USERNAME/crypto-live/main/setup-vps.sh
  chmod +x setup-vps.sh
  ```
- [ ] Run setup script: `sudo bash setup-vps.sh`
- [ ] Enter your domain name when prompted
- [ ] Enter your email for SSL certificates
- [ ] Wait for installation (5-10 minutes)
- [ ] Verify completion (no errors in output)

## Step 2: Deploy Application Code

- [ ] Navigate to project directory: `cd /var/www/crypto-live`
- [ ] Clone repository:
  ```bash
  git clone https://github.com/YOUR-USERNAME/crypto-live.git .
  ```
  OR upload via SFTP to `/var/www/crypto-live`
- [ ] Install dependencies: `npm install`
- [ ] Verify no errors during installation

## Step 3: Configure Environment

- [ ] Copy environment template: `cp .env.example .env`
- [ ] Edit environment file: `nano .env`
- [ ] Add your API keys:
  ```env
  SESSION_SECRET=RANDOM-STRING-HERE
  TWITTER_BEARER_TOKEN=YOUR-TOKEN
  TWITTER_API_KEY=YOUR-KEY
  TWITTER_API_SECRET=YOUR-SECRET
  NODE_ENV=production
  ```
- [ ] Save file (Ctrl+X, then Y, then Enter)
- [ ] Verify: `cat .env` (check all values are set)

## Step 4: SSL Certificate Setup

- [ ] Run Certbot:
  ```bash
  sudo certbot --nginx -d crypto.yourdomain.com -m you@email.com --agree-tos
  ```
- [ ] Wait for certificate installation
- [ ] Test HTTPS: `curl -I https://crypto.yourdomain.com`
- [ ] Should see "200 OK" or "502 Bad Gateway" (normal, app not started yet)

## Step 5: Start Application

- [ ] Start with PM2: `pm2 start npm --name crypto-live -- run dev`
- [ ] Verify status: `pm2 status` (should show "online")
- [ ] Save process list: `pm2 save`
- [ ] Enable auto-start: `pm2 startup`
- [ ] Copy and run the command it outputs
- [ ] View logs: `pm2 logs crypto-live --lines 50`
- [ ] Look for "Server listening on port 5000"

## Step 6: Verify Services

- [ ] Check PM2 status: `pm2 status` → Should show "online"
- [ ] Check Nginx: `sudo systemctl status nginx` → Should show "active (running)"
- [ ] Check firewall: `sudo ufw status` → Ports 22, 80, 443, 1935, 8888 allowed
- [ ] Test local app: `curl http://localhost:5000` → Should return HTML
- [ ] Test public URL: Visit `https://crypto.yourdomain.com` in browser
- [ ] Dashboard should load with crypto prices

## Step 7: Test RTMP Streaming

- [ ] Visit dashboard: `https://crypto.yourdomain.com`
- [ ] Click layout mode 2 (Stream + Sidebar)
- [ ] Scroll to "Stream Controls" section
- [ ] Copy stream key
- [ ] Configure OBS:
  - Service: `Custom...`
  - Server: `rtmp://crypto.yourdomain.com:1935/live`
  - Stream Key: [paste from dashboard]
- [ ] Start streaming in OBS
- [ ] Verify stream appears in dashboard (may take 10-15 seconds)
- [ ] Stop streaming in OBS

## Step 8: Final Verification

- [ ] Test all layout modes (1, 2, 3 keys)
- [ ] Verify WebSocket connection (green "LIVE" indicator)
- [ ] Check crypto prices update
- [ ] Verify news rotation works
- [ ] Test Jupiter swap button (if Phantom wallet installed)
- [ ] Check chat overlay (if Restream configured)
- [ ] Test OBS guide page: `/obs-guide`

## Post-Deployment

- [ ] **Setup Monitoring**:
  - [ ] Add uptimerobot.com (free) to monitor uptime
  - [ ] Configure email alerts for downtime
- [ ] **Backup Configuration**:
  ```bash
  tar -czf crypto-backup.tar.gz /var/www/crypto-live
  cp /var/www/crypto-live/.env ~/env-backup.env
  ```
- [ ] **Document Credentials**:
  - [ ] Save SSH login details
  - [ ] Save VPS provider credentials
  - [ ] Save stream keys
  - [ ] Keep `.env` backup in safe location
- [ ] **Share Your Dashboard**:
  - [ ] Test from different devices
  - [ ] Share URL with friends/viewers
  - [ ] Configure OBS scenes for streaming

## Maintenance Tasks

### Weekly
- [ ] Check logs: `pm2 logs crypto-live`
- [ ] Monitor disk space: `df -h`
- [ ] Check memory: `free -h`

### Monthly
- [ ] Update system: `sudo apt-get update && sudo apt-get upgrade -y`
- [ ] Review SSL cert: `sudo certbot certificates`
- [ ] Restart app: `pm2 restart crypto-live`
- [ ] Create backup

## Troubleshooting Checklist

If dashboard doesn't load:
- [ ] Check PM2: `pm2 status`
- [ ] Check Nginx: `sudo systemctl status nginx`
- [ ] View app logs: `pm2 logs crypto-live`
- [ ] View Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] Restart services:
  ```bash
  pm2 restart crypto-live
  sudo systemctl restart nginx
  ```

If streaming doesn't work:
- [ ] Check FFmpeg: `ffmpeg -version`
- [ ] Check port 1935: `sudo netstat -tlnp | grep 1935`
- [ ] Verify firewall: `sudo ufw status | grep 1935`
- [ ] Test RTMP connection: `telnet crypto.yourdomain.com 1935`
- [ ] Check stream key is correct
- [ ] View RTMP logs in PM2: `pm2 logs crypto-live | grep -i rtmp`

## Success Criteria ✅

Your deployment is successful when:
- ✅ Dashboard loads at `https://crypto.yourdomain.com`
- ✅ Crypto prices display and update
- ✅ News articles rotate
- ✅ WebSocket shows "LIVE" (green indicator)
- ✅ All 3 layout modes work
- ✅ OBS can stream to RTMP server
- ✅ Stream appears in dashboard
- ✅ SSL certificate is valid (HTTPS)
- ✅ PM2 shows app "online"
- ✅ No errors in logs

## Next Steps After Deployment

1. **Customize Branding**: Add your logo, colors, custom domain
2. **Optimize Performance**: Enable Nginx caching, Gzip compression
3. **Add Analytics**: Google Analytics, Plausible, or similar
4. **Setup Backups**: Automated daily backups to cloud storage
5. **Scale Up**: Upgrade server resources as traffic grows
6. **Add Features**: Custom alerts, more coins, additional data sources

---

**Need Help?**

1. Review `DEPLOYMENT.md` for detailed instructions
2. Check `QUICK-REFERENCE.md` for common commands
3. Review logs: `pm2 logs crypto-live`
4. Test each component individually
5. Verify DNS with: `nslookup crypto.yourdomain.com`

**Estimated Time:** 30-60 minutes for first-time deployment

Good luck! 🚀
