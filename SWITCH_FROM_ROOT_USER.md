# Migrate Server from Root User to Dedicated Service Account

**CRITICAL SECURITY ISSUE**: Currently running as `root`
**Risk**: If server is compromised, attacker gains full system access

---

## Why Running as Root is Dangerous

1. **Full System Access**: Root can read/write/delete ANY file
2. **No Containment**: Exploits have unrestricted access
3. **Accidental Damage**: Simple bugs can destroy the system
4. **Compliance**: Violates security best practices
5. **Privilege Escalation**: Already at highest privilege level

---

## Migration Steps

### 1. Create Dedicated Service User

```bash
# Create user without shell access (more secure)
sudo useradd -r -s /bin/false d3f4ult

# OR: Create user with shell (for debugging)
sudo useradd -m -s /bin/bash d3f4ult

# Add to necessary groups
sudo usermod -a -G www-data d3f4ult
```

### 2. Transfer Ownership of Application Files

```bash
# Change ownership of application directory
sudo chown -R d3f4ult:d3f4ult /var/www/d3f4ult.tv

# Set correct permissions
sudo chmod 750 /var/www/d3f4ult.tv
sudo chmod 750 /var/www/d3f4ult.tv/app

# Fix .env file permissions (already owner-only readable)
sudo chown d3f4ult:d3f4ult /var/www/d3f4ult.tv/app/.env
sudo chmod 600 /var/www/d3f4ult.tv/app/.env

# Fix client .env
sudo chown d3f4ult:d3f4ult /var/www/d3f4ult.tv/app/client/.env
sudo chmod 600 /var/www/d3f4ult.tv/app/client/.env
```

### 3. Update Media Directory Permissions

```bash
# Allow write access to media directory for recording
sudo chown -R d3f4ult:d3f4ult /var/www/d3f4ult.tv/app/media
sudo chmod 770 /var/www/d3f4ult.tv/app/media

# Create subdirectories if needed
sudo mkdir -p /var/www/d3f4ult.tv/app/media/{playlist,recordings,live}
sudo chown -R d3f4ult:d3f4ult /var/www/d3f4ult.tv/app/media/*
sudo chmod 770 /var/www/d3f4ult.tv/app/media/*
```

### 4. Update Node.js Process Manager (PM2)

If using PM2 as root:

```bash
# Stop current PM2 processes
sudo pm2 stop all
sudo pm2 delete all

# Save PM2 configuration
sudo pm2 save

# Switch to new user
sudo su - d3f4ult

# Reinstall PM2 for new user
npm install -g pm2

# Start application as new user
cd /var/www/d3f4ult.tv/app
pm2 start npm --name "d3f4ult-tv" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot (as new user)
pm2 startup
# Follow the command it outputs

# Exit back to root to run the startup command
exit
# Run the command PM2 gave you (starts with sudo)
```

### 5. Update Systemd Service (Alternative to PM2)

If using systemd instead:

```bash
# Create systemd service file
sudo tee /etc/systemd/system/d3f4ult-tv.service > /dev/null <<EOF
[Unit]
Description=D3F4ULT.TV Crypto Dashboard
After=network.target

[Service]
Type=simple
User=d3f4ult
Group=d3f4ult
WorkingDirectory=/var/www/d3f4ult.tv/app
Environment="NODE_ENV=production"
Environment="PORT=5000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=d3f4ult-tv

# Security hardening
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/d3f4ult.tv/app/media

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable d3f4ult-tv

# Start service
sudo systemctl start d3f4ult-tv

# Check status
sudo systemctl status d3f4ult-tv
```

### 6. Update NGINX Configuration

If using NGINX as reverse proxy:

```bash
# Edit NGINX config
sudo nano /etc/nginx/sites-available/d3f4ult.tv

# Ensure proxy_pass points to correct port
location / {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

### 7. Update RTMP/Streaming Services

If running RTMP streaming:

```bash
# Update nginx-rtmp or media server config
sudo nano /etc/nginx/nginx.conf

# Change user directive
user d3f4ult;

# Restart RTMP server
sudo systemctl restart nginx
```

### 8. Update Log File Permissions

```bash
# Create log directory
sudo mkdir -p /var/log/d3f4ult-tv
sudo chown d3f4ult:d3f4ult /var/log/d3f4ult-tv
sudo chmod 750 /var/log/d3f4ult-tv

# Update application logging configuration if needed
# Edit your logging config to write to /var/log/d3f4ult-tv/
```

---

## Verification Steps

### 1. Check Process Owner

```bash
# Check what user is running the process
ps aux | grep node

# Should show:
# d3f4ult    <PID>  ...  node ...
# NOT root!
```

### 2. Verify File Permissions

```bash
# Check .env is owned by d3f4ult
ls -la /var/www/d3f4ult.tv/app/.env
# Should show: -rw------- 1 d3f4ult d3f4ult

# Check app directory
ls -la /var/www/d3f4ult.tv/
# Should show: drwxr-x--- d3f4ult d3f4ult
```

### 3. Test Application Functionality

```bash
# Check if app is running
curl http://localhost:5000

# Test authentication
# Test wallet operations
# Test file uploads (if applicable)
# Test media streaming
```

### 4. Review Logs

```bash
# PM2 logs
pm2 logs d3f4ult-tv

# Systemd logs
sudo journalctl -u d3f4ult-tv -f

# Check for permission errors
grep -i "permission denied" /var/log/d3f4ult-tv/*
```

---

## Port Binding Considerations

### Ports < 1024 Require Root or Capabilities

If you need to bind to ports < 1024 (e.g., port 80, 443):

**Option 1**: Use NGINX/Apache as reverse proxy (RECOMMENDED)
```bash
# App runs on port 5000+ as d3f4ult user
# NGINX runs as root and forwards to port 5000
# This is already configured and best practice
```

**Option 2**: Grant CAP_NET_BIND_SERVICE capability
```bash
# Allow Node.js to bind to privileged ports without root
sudo setcap 'cap_net_bind_service=+ep' $(which node)

# Verify
getcap $(which node)
```

**Option 3**: Use authbind
```bash
# Install authbind
sudo apt-get install authbind

# Configure port
sudo touch /etc/authbind/byport/80
sudo chmod 500 /etc/authbind/byport/80
sudo chown d3f4ult /etc/authbind/byport/80

# Start with authbind
authbind --deep npm start
```

---

## Troubleshooting

### Permission Denied Errors

```bash
# If app can't read files
sudo chown -R d3f4ult:d3f4ult /var/www/d3f4ult.tv

# If app can't write to media
sudo chmod 770 /var/www/d3f4ult.tv/app/media
```

### Process Won't Start

```bash
# Check user exists
id d3f4ult

# Check user can read .env
sudo -u d3f4ult cat /var/www/d3f4ult.tv/app/.env

# Check node_modules ownership
ls -la /var/www/d3f4ult.tv/app/node_modules
sudo chown -R d3f4ult:d3f4ult /var/www/d3f4ult.tv/app/node_modules
```

### Can't Access Logs

```bash
# Add your user to d3f4ult group
sudo usermod -a -G d3f4ult $(whoami)

# Or use sudo
sudo tail -f /var/log/d3f4ult-tv/error.log
```

---

## Security Hardening (Additional)

### AppArmor Profile (Advanced)

```bash
# Create AppArmor profile for additional containment
sudo nano /etc/apparmor.d/d3f4ult-tv

# Example profile:
#include <tunables/global>

/usr/bin/node {
  #include <abstractions/base>
  #include <abstractions/nameservice>

  # Read access to app
  /var/www/d3f4ult.tv/app/** r,

  # Write access to media only
  /var/www/d3f4ult.tv/app/media/** rw,

  # Network access
  network inet stream,
  network inet dgram,

  # Deny everything else
  deny /** w,
}

# Load profile
sudo apparmor_parser -r /etc/apparmor.d/d3f4ult-tv
```

### Systemd Security Options

Add to systemd service file:

```ini
[Service]
# Prevent privilege escalation
NoNewPrivileges=true

# Restrict file system access
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/d3f4ult.tv/app/media

# Restrict network access
RestrictAddressFamilies=AF_INET AF_INET6

# Restrict system calls
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

# Private /tmp
PrivateTmp=true

# Restrict device access
PrivateDevices=true

# Protect kernel
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
```

---

## Rollback Plan

If migration causes issues:

```bash
# Stop new service
pm2 stop all
# OR
sudo systemctl stop d3f4ult-tv

# Change back to root
sudo chown -R root:root /var/www/d3f4ult.tv

# Restart as root (TEMPORARY!)
cd /var/www/d3f4ult.tv/app
sudo npm start

# Fix issues, then re-attempt migration
```

---

## Post-Migration Checklist

- [ ] Application runs as `d3f4ult` user (not root)
- [ ] All file permissions correct
- [ ] .env files owned by d3f4ult with 600 permissions
- [ ] Media directory writable by d3f4ult
- [ ] Logs accessible and writing correctly
- [ ] Application starts on boot
- [ ] NGINX reverse proxy working
- [ ] Authentication functional
- [ ] File uploads working (if applicable)
- [ ] Streaming functional (if applicable)
- [ ] No errors in logs
- [ ] Performance normal

---

**Priority**: CRITICAL - Do before production
**Estimated Time**: 30-60 minutes
**Risk**: Medium (with rollback plan)
**Impact**: High security improvement

---

**Last Updated**: 2025-11-13
**Status**: PENDING IMPLEMENTATION
