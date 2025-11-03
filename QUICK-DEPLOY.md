# Quick Deploy to d3f4ult.tv

## 🚀 30-Second Deployment

### Step 1: Upload to Server
```bash
# From your local machine
scp -r . root@d3f4ult.tv:/var/www/crypto-live/
```

### Step 2: Run Setup Script
```bash
# SSH into server
ssh root@d3f4ult.tv

# Navigate to app directory
cd /var/www/crypto-live

# Run setup (one command!)
sudo ./vps-setup.sh
```

The script will ask you:
1. **Domain**: Enter `d3f4ult.tv`
2. **Directory**: Press Enter (uses default)
3. **Continue**: Type `y`
4. **SSL Certificate**: Type `y`

### Step 3: Add API Keys
```bash
nano .env
```

Update these lines:
```env
TWITTER_API_KEY=your_actual_key
TWITTER_API_SECRET=your_actual_secret
TWITTER_BEARER_TOKEN=your_actual_token
```

Save: `Ctrl+X`, `Y`, `Enter`

### Step 4: Restart
```bash
pm2 restart crypto-live
```

### Step 5: Test
Open browser: `https://d3f4ult.tv`

## ✅ What Gets Configured

- ✅ **Nginx**: Reverse proxy with HTTPS
- ✅ **Firewall**: Ports 80, 443, 1935, 8888, 5000
- ✅ **SSL**: Free Let's Encrypt certificate
- ✅ **PM2**: Process manager with auto-restart
- ✅ **RTMP**: Port 1935 for OBS streaming
- ✅ **HLS**: Port 8888 for stream playback

## 🎥 OBS Configuration

```
Service: Custom...
Server: rtmp://d3f4ult.tv:1935/live
Stream Key: [Get from dashboard]
```

## 🔧 Useful Commands

```bash
# View logs
pm2 logs crypto-live

# Restart app
pm2 restart crypto-live

# Check status
pm2 status

# Test RTMP port
telnet d3f4ult.tv 1935
```

## 🎯 URL Reference

| Service | URL |
|---------|-----|
| Dashboard | `https://d3f4ult.tv` |
| RTMP Input | `rtmp://d3f4ult.tv:1935/live/{key}` |
| HLS Output | `https://d3f4ult.tv/live/{key}/index.m3u8` |

## ❓ Troubleshooting

**App won't start?**
```bash
pm2 logs crypto-live --lines 50
```

**RTMP not working?**
```bash
sudo netstat -tulpn | grep 1935
sudo ufw status | grep 1935
```

**SSL issues?**
```bash
sudo certbot renew --dry-run
```

---

**That's it!** Your crypto dashboard is now live with full RTMP streaming support. 🎉
