# Crypto Live Dashboard

A real-time cryptocurrency dashboard with live price tracking, news feeds, social media integration, and RTMP streaming capabilities. Built with React, TypeScript, Node.js, and Express.

## Features

- **Real-time Crypto Prices** - Live tracking for Bitcoin, Ethereum, Binance Coin, and Solana via CoinGecko API
- **News Feed** - Latest crypto news from CryptoPanic
- **Social Integration** - Twitter/X feed from notable crypto voices
- **Multiple Layouts** - Full dashboard, stream sidebar, video overlay, and ticker-only modes
- **Keyboard Shortcuts** - Quick layout switching (1, 2, 3, spacebar)
- **WebSocket Updates** - Real-time data without page refreshes
- **RTMP Streaming** - Built-in streaming server for OBS integration
- **HLS Playback** - Live video stream playback
- **Solana Wallet Integration** - Connect Phantom and other Solana wallets
- **Jupiter Swap** - Integrated DEX for token swaps
- **Pump.fun Widget** - Market data integration

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for blazing-fast builds
- Tailwind CSS with animations
- React Query for data fetching
- Radix UI components
- Framer Motion for animations

**Backend:**
- Node.js with Express
- TypeScript
- WebSocket (ws) for real-time updates
- Drizzle ORM with PostgreSQL
- Node Media Server for RTMP/HLS streaming

**APIs & Services:**
- CoinGecko API (crypto prices)
- CryptoPanic API (news)
- Twitter API v2 (social feed)
- Solana Web3.js (blockchain integration)

## Quick Start

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- PostgreSQL database (Neon recommended)
- Twitter API credentials (for social feed)

### Local Development

```bash
# Clone the repository
git clone https://github.com/d3f4ultt/d3f4ult.tv.git
cd d3f4ult.tv

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Twitter API (for social feed)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Session
SESSION_SECRET=your_random_session_secret

# Server Configuration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Streaming Ports (defaults)
RTMP_PORT=1935
HLS_PORT=8888
```

## VPS Deployment

Deploy to your own Ubuntu/Debian VPS server in minutes.

### 1. Prepare Your Server

Requirements:
- Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM
- Root or sudo access
- Domain name pointing to your server IP

### 2. Clone Repository

```bash
# SSH into your server
ssh root@your-server-ip

# Create directory and clone
mkdir -p /var/www
cd /var/www
git clone https://github.com/d3f4ultt/d3f4ult.tv.git
cd d3f4ult.tv
```

### 3. Run Setup Script

```bash
# Make script executable
chmod +x vps-setup.sh

# Run the automated setup
sudo ./vps-setup.sh
```

The script will:
- Install Node.js 20.x
- Install and configure Nginx
- Install FFmpeg for streaming
- Configure UFW firewall
- Install PM2 process manager
- Setup SSL with Let's Encrypt
- Create systemd services
- Configure RTMP and HLS servers

### 4. Configure Environment

```bash
# Edit environment variables
nano .env

# Add your API credentials
# Save: Ctrl+X, Y, Enter
```

### 5. Build and Start

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start with PM2
pm2 start npm --name crypto-live -- start
pm2 save
pm2 startup
```

### 6. Verify Installation

Visit your domain: `https://your-domain.com`

## OBS Streaming Setup

Configure OBS Studio to stream to your dashboard:

1. Open OBS → Settings → Stream
2. Configure:
   ```
   Service: Custom...
   Server: rtmp://your-domain.com:1935/live
   Stream Key: [Get from dashboard settings]
   ```
3. Start Streaming

Your stream will appear in the dashboard at:
`https://your-domain.com` (when layout is set to stream mode)

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build client and server
npm start            # Start production server

# Database
npm run db:push      # Push schema changes to database

# Type Checking
npm run check        # Run TypeScript type checker
```

## Useful Commands

### PM2 Process Management

```bash
pm2 status                    # Check app status
pm2 logs crypto-live          # View logs
pm2 restart crypto-live       # Restart app
pm2 stop crypto-live          # Stop app
pm2 delete crypto-live        # Remove from PM2
```

### Nginx

```bash
sudo nginx -t                 # Test configuration
sudo systemctl reload nginx   # Reload configuration
sudo systemctl status nginx   # Check status
```

### Firewall

```bash
sudo ufw status               # Check firewall status
sudo ufw allow 80/tcp         # Open HTTP port
sudo ufw allow 443/tcp        # Open HTTPS port
```

### SSL Certificate

```bash
sudo certbot renew            # Renew SSL certificate
sudo certbot renew --dry-run  # Test renewal process
```

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                 # Node.js backend
│   ├── index.ts           # Express server
│   ├── routes.ts          # API routes
│   └── mediaServer.ts     # RTMP/HLS server
├── shared/                 # Shared types
│   └── schema.ts          # TypeScript types & Zod schemas
├── vps-setup.sh           # VPS deployment script
├── pm2.ecosystem.config.js # PM2 configuration
├── nginx.conf.example     # Nginx configuration template
├── package.json
└── README.md
```

## API Endpoints

```
GET  /api/crypto/prices      # Get cryptocurrency prices
GET  /api/news               # Get latest crypto news
GET  /api/tweets             # Get Twitter feed
GET  /api/stream/config      # Get streaming configuration
GET  /api/stream/status      # Check stream status
POST /api/stream/generate-key # Generate new stream key
WS   /ws                     # WebSocket for real-time updates
```

## Configuration Files

### PM2 Ecosystem

Located at `pm2.ecosystem.config.js`, configures:
- Process name and script
- Memory limits (1GB auto-restart)
- Environment variables
- Log file locations
- Port configuration (5000, 1935, 8888)

### Nginx Configuration

Example at `nginx.conf.example`, includes:
- Reverse proxy for Express app
- WebSocket support
- SSL/TLS configuration
- CORS headers for HLS
- Security headers

## Troubleshooting

### App Won't Start

```bash
# Check PM2 logs
pm2 logs crypto-live --lines 50

# Check if ports are in use
sudo lsof -i :5000
sudo lsof -i :1935
sudo lsof -i :8888
```

### RTMP Streaming Not Working

```bash
# Check if RTMP port is open
sudo netstat -tulpn | grep 1935
sudo ufw status | grep 1935

# Test RTMP connection
telnet your-domain.com 1935
```

### WebSocket Connection Fails

```bash
# Check Nginx WebSocket configuration
sudo nginx -T | grep -A 10 "Upgrade"

# Verify proxy settings include:
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
```

### Database Connection Error

```bash
# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test database connection
npm run db:push
```

## Security

- SSL/TLS encryption via Let's Encrypt
- Environment variables for sensitive data
- Firewall configured via UFW
- Security headers in Nginx
- Session secrets for authentication
- CORS configured for streaming

## Performance

- Vite for optimized production builds
- WebSocket for efficient real-time updates
- API response caching (30s for prices, 2m for news)
- Gzip compression via Nginx
- PM2 cluster mode capable
- HLS streaming with adaptive bitrate

## License

ISC

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ for the crypto community
