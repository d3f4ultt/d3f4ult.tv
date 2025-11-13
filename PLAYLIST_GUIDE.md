# Automatic Playlist Playback System

## Overview

This system automatically plays a playlist of videos when your live stream is offline, ensuring viewers always have content to watch.

## How It Works

1. **Stream Manager** (`stream-manager.sh`) runs as a background service
2. Every 5 seconds, it checks if your live stream is active
3. When stream is **LIVE**: Shows your live broadcast
4. When stream is **OFFLINE**: Automatically plays playlist videos in loop

## Setup Instructions

### 1. Add Videos to Playlist

**Option A: Download from URL (YouTube, etc.)**
```bash
sudo /var/www/d3f4ult.tv/app/add-playlist-video.sh "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Option B: Copy from Local File**
```bash
sudo /var/www/d3f4ult.tv/app/add-playlist-video.sh /path/to/video.mp4
```

**Option C: Manual Copy**
```bash
sudo cp your-video.mp4 /var/www/d3f4ult.tv/app/media/playlist/
sudo chown www-data:www-data /var/www/d3f4ult.tv/app/media/playlist/*
sudo chmod 644 /var/www/d3f4ult.tv/app/media/playlist/*
```

### 2. Start the Stream Manager

```bash
# Start the service
sudo systemctl start stream-manager

# Check status
sudo systemctl status stream-manager

# View logs
sudo tail -f /var/log/stream-manager.log
```

### 3. Test the System

1. **With no live stream active:**
   - Wait 5-10 seconds after starting the service
   - Check your stream at: https://d3f4ult.tv/dashboard
   - You should see playlist videos playing

2. **Start your live stream:**
   - Begin streaming via OBS to `rtmp://YOUR_SERVER_IP/live/live`
   - Within 5-10 seconds, the playlist should stop
   - Your live stream should take over

3. **Stop your live stream:**
   - End your OBS broadcast
   - Within 5-10 seconds, playlist should resume

## Managing the Service

```bash
# Start
sudo systemctl start stream-manager

# Stop
sudo systemctl stop stream-manager

# Restart (use after adding new videos)
sudo systemctl restart stream-manager

# Enable auto-start on boot (already done)
sudo systemctl enable stream-manager

# Disable auto-start
sudo systemctl disable stream-manager

# View logs
sudo journalctl -u stream-manager -f

# View detailed logs
sudo tail -f /var/log/stream-manager.log
```

## Troubleshooting

### Playlist Not Playing

1. **Check if videos exist:**
   ```bash
   ls -lh /var/www/d3f4ult.tv/app/media/playlist/
   ```

2. **Check service status:**
   ```bash
   sudo systemctl status stream-manager
   ```

3. **Check logs:**
   ```bash
   sudo tail -50 /var/log/stream-manager.log
   ```

4. **Check FFmpeg processes:**
   ```bash
   ps aux | grep ffmpeg
   ```

### Stream Not Switching

1. **Check HLS output:**
   ```bash
   ls -la /var/www/d3f4ult.tv/app/media/live/live/
   stat /var/www/d3f4ult.tv/app/media/live/live/index.m3u8
   ```

2. **Restart the service:**
   ```bash
   sudo systemctl restart stream-manager
   ```

### Permission Issues

```bash
sudo chown -R www-data:www-data /var/www/d3f4ult.tv/app/media/
sudo chmod -R 755 /var/www/d3f4ult.tv/app/media/
```

## Video Recommendations

- **Format:** MP4 (H.264 video, AAC audio)
- **Resolution:** 1920x1080 (1080p) or 1280x720 (720p)
- **Bitrate:** 2000-5000 kbps
- **Duration:** Any length (will loop automatically)

## Advanced Configuration

### Change Check Interval

Edit `/var/www/d3f4ult.tv/app/stream-manager.sh`:
```bash
# Change "sleep 5" to desired interval (in seconds)
sleep 10  # Check every 10 seconds
```

### Change Video Quality

Edit the FFmpeg command in `stream-manager.sh`:
```bash
-b:v 2500k    # Video bitrate
-maxrate 2500k
-bufsize 5000k
```

### Customize Playlist Order

Videos play in alphabetical order. Rename files to control order:
```bash
cd /var/www/d3f4ult.tv/app/media/playlist/
sudo mv video1.mp4 01-intro.mp4
sudo mv video2.mp4 02-gameplay.mp4
sudo mv video3.mp4 03-outro.mp4
```

## Files Created

- `/var/www/d3f4ult.tv/app/stream-manager.sh` - Main monitoring script
- `/var/www/d3f4ult.tv/app/add-playlist-video.sh` - Video management helper
- `/etc/systemd/system/stream-manager.service` - Systemd service
- `/var/log/stream-manager.log` - Activity log
- `/var/www/d3f4ult.tv/app/media/playlist/` - Video storage directory

## Support

Check logs for detailed information:
```bash
# Service logs
sudo journalctl -u stream-manager --since "1 hour ago"

# Application logs
sudo tail -100 /var/log/stream-manager.log
```
