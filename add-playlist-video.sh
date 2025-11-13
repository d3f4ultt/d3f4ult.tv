#!/bin/bash

# Helper script to add videos to the playlist directory
# Usage: ./add-playlist-video.sh <video-url-or-path>

PLAYLIST_DIR="/var/www/d3f4ult.tv/app/media/playlist"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Playlist Video Manager ===${NC}"
echo

# Check if argument provided
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 <video-url>          # Download from URL (YouTube, etc.)"
    echo "  $0 <local-file-path>    # Copy from local file"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    echo "  $0 /tmp/myvideo.mp4"
    echo
    exit 1
fi

INPUT="$1"

# Check if input is a URL or local file
if [[ "$INPUT" =~ ^https?:// ]]; then
    # It's a URL - download it
    echo -e "${GREEN}Downloading video from URL...${NC}"

    # Check if yt-dlp is installed
    if ! command -v yt-dlp &> /dev/null; then
        echo -e "${RED}Error: yt-dlp is not installed${NC}"
        echo "Install it with: pip install yt-dlp"
        exit 1
    fi

    # Download with yt-dlp
    cd "$PLAYLIST_DIR"
    yt-dlp \
        -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" \
        --merge-output-format mp4 \
        -o "%(title)s.%(ext)s" \
        "$INPUT"

    if [ $? -eq 0 ]; then
        # Set proper permissions
        chown -R www-data:www-data "$PLAYLIST_DIR"/*
        chmod 644 "$PLAYLIST_DIR"/*.mp4

        echo -e "${GREEN}✓ Video downloaded successfully!${NC}"
        echo -e "Video saved to: $PLAYLIST_DIR"
    else
        echo -e "${RED}✗ Download failed${NC}"
        exit 1
    fi

elif [ -f "$INPUT" ]; then
    # It's a local file - copy it
    echo -e "${GREEN}Copying video from local file...${NC}"

    FILENAME=$(basename "$INPUT")
    DEST="$PLAYLIST_DIR/$FILENAME"

    cp "$INPUT" "$DEST"

    if [ $? -eq 0 ]; then
        # Set proper permissions
        chown www-data:www-data "$DEST"
        chmod 644 "$DEST"

        echo -e "${GREEN}✓ Video copied successfully!${NC}"
        echo -e "Video saved to: $DEST"
    else
        echo -e "${RED}✗ Copy failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: Invalid input${NC}"
    echo "Input must be either a URL or path to an existing file"
    exit 1
fi

echo
echo -e "${GREEN}Current playlist videos:${NC}"
ls -lh "$PLAYLIST_DIR" | grep -E '\.(mp4|mkv|avi|mov)$' || echo "  (no videos yet)"

echo
echo -e "${YELLOW}Note:${NC} Restart stream-manager service to apply changes:"
echo "  sudo systemctl restart stream-manager"
