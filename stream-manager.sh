#!/bin/bash

# Stream Manager - Automatically switches between live stream and playlist
# This script monitors the RTMP stream and ensures HLS output is always available

RTMP_HOST="127.0.0.1"
RTMP_PORT="1935"
STREAM_KEY="live"
MEDIA_ROOT="/var/www/d3f4ult.tv/app/media"
PLAYLIST_DIR="$MEDIA_ROOT/playlist"
HLS_OUTPUT_DIR="$MEDIA_ROOT/live/$STREAM_KEY"
HLS_OUTPUT="$HLS_OUTPUT_DIR/index.m3u8"
PID_FILE="/var/run/stream-manager.pid"
LOG_FILE="/var/log/stream-manager.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if live stream is active
is_live_stream_active() {
    # Check if there's an active RTMP connection
    # We look for ffmpeg processes that are reading from the RTMP stream
    if pgrep -f "rtmp://127.0.0.1:1935/live/$STREAM_KEY" > /dev/null; then
        return 0  # Stream is active
    fi

    # Alternative: Check if HLS segments are being updated (modified in last 10 seconds)
    if [ -f "$HLS_OUTPUT" ]; then
        local last_modified=$(stat -c %Y "$HLS_OUTPUT" 2>/dev/null || echo 0)
        local current_time=$(date +%s)
        local diff=$((current_time - last_modified))

        if [ $diff -lt 10 ]; then
            return 0  # Stream is active (HLS updated recently)
        fi
    fi

    return 1  # Stream is inactive
}

# Start playlist stream
start_playlist() {
    log "Starting playlist playback..."

    # Check if playlist directory has videos
    local video_count=$(find "$PLAYLIST_DIR" -type f \( -name "*.mp4" -o -name "*.mkv" -o -name "*.avi" -o -name "*.mov" \) | wc -l)

    if [ $video_count -eq 0 ]; then
        log "WARNING: No videos found in $PLAYLIST_DIR"
        log "Please add video files to the playlist directory"
        return 1
    fi

    # Create playlist file for FFmpeg
    local playlist_file="/tmp/playlist.txt"
    > "$playlist_file"  # Clear existing file
    find "$PLAYLIST_DIR" -type f \( -name "*.mp4" -o -name "*.mkv" -o -name "*.avi" -o -name "*.mov" \) | sort | while read video; do
        echo "file '$video'" >> "$playlist_file"
    done

    # Create HLS output directory if it doesn't exist
    mkdir -p "$HLS_OUTPUT_DIR"

    # Start FFmpeg to stream playlist as HLS
    # Use concat demuxer to loop through videos
    /usr/bin/ffmpeg \
        -re \
        -f concat \
        -safe 0 \
        -stream_loop -1 \
        -i "$playlist_file" \
        -c:v libx264 \
        -preset veryfast \
        -b:v 2500k \
        -maxrate 2500k \
        -bufsize 5000k \
        -c:a aac \
        -b:a 128k \
        -f hls \
        -hls_time 2 \
        -hls_list_size 3 \
        -hls_flags delete_segments+append_list \
        -hls_segment_filename "$HLS_OUTPUT_DIR/segment_%03d.ts" \
        "$HLS_OUTPUT" \
        > /dev/null 2>&1 &

    local ffmpeg_pid=$!
    echo $ffmpeg_pid > "$PID_FILE.playlist"
    log "Playlist stream started (PID: $ffmpeg_pid)"
}

# Stop playlist stream
stop_playlist() {
    if [ -f "$PID_FILE.playlist" ]; then
        local pid=$(cat "$PID_FILE.playlist")
        if kill -0 $pid 2>/dev/null; then
            log "Stopping playlist stream (PID: $pid)..."
            kill -TERM $pid
            sleep 2
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid
            fi
        fi
        rm -f "$PID_FILE.playlist"
    fi

    # Also kill any orphaned FFmpeg playlist processes
    pkill -f "concat.*$PLAYLIST_DIR"
}

# Main monitoring loop
main() {
    log "Stream Manager started"
    log "Monitoring live stream and managing playlist fallback"

    local playlist_active=false

    while true; do
        if is_live_stream_active; then
            # Live stream is active
            if [ "$playlist_active" = true ]; then
                log "Live stream detected! Stopping playlist..."
                stop_playlist
                playlist_active=false
            fi
        else
            # Live stream is not active
            if [ "$playlist_active" = false ]; then
                log "Live stream offline. Starting playlist..."
                stop_playlist  # Ensure no playlist is running
                start_playlist
                playlist_active=true
            fi
        fi

        # Check every 5 seconds
        sleep 5
    done
}

# Handle script termination
cleanup() {
    log "Stream Manager stopping..."
    stop_playlist
    rm -f "$PID_FILE"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Store main process PID
echo $$ > "$PID_FILE"

# Run main loop
main
