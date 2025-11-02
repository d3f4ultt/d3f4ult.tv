# Crypto Live - Real-time Market Dashboard

## Overview
A professional broadcast-quality crypto streaming dashboard with real-time price feeds, breaking news, and Twitter integration. Built for streamers and content creators who want CNBC-style layouts with auto-switching capabilities.

## Purpose
Create a live crypto market dashboard that can be used for streaming with multiple layout modes:
- Full Dashboard: Complete 3-column view with prices, news, and tweets
- Stream + Sidebar: Stream area with floating chat overlay (bottom-right) and data sidebar
- Video Overlay: Minimal overlay for OBS with ticker and logo

## Current State
- ✅ Complete frontend with React components
- ✅ Real-time WebSocket integration
- ✅ CoinGecko API for BTC, ETH, BNB, SOL prices
- ✅ CryptoPanic news feed integration
- ✅ Twitter List integration for curated crypto influencer tweets
- ✅ Pump.fun live stream embed in stream-sidebar layout
- ✅ Custom Pump.fun price widget with real-time trades (PumpPortal API)
- ✅ Phantom wallet integration for Solana blockchain interactions
- ✅ Jupiter swap widget for token swaps with best routing
- ✅ Restream chat integration for live viewer interaction
- ✅ Auto-switching layout system (configurable 15-300s intervals)
- ✅ Keyboard shortcuts for layout control
- ✅ OBS browser source integration guide
- ✅ Custom RTMP streaming server with HLS transcoding
- ✅ Stream key management and authentication
- ✅ CNBC-inspired broadcast design
- ✅ Responsive animations and transitions

## Recent Changes
**Date: 2025-11-02**
- **Custom RTMP Streaming Server**: Implemented self-hosted live streaming infrastructure
  - Built complete RTMP ingest server using node-media-server (v4.1.0)
  - Accepts RTMP streams from OBS Studio on port 1935
  - Automatic transcoding to HLS format using FFmpeg for browser playback
  - HLS delivery via HTTP server on port 8888
  - Stream key authentication system with validation
  - Real-time stream status monitoring (active/offline detection)
  - Created StreamPlayer component with video.js for HLS playback
  - Built StreamControls UI with stream key management and copy-to-clipboard
  - Integrated into stream-sidebar layout replacing pump.fun embed
  - Added comprehensive RTMP streaming guide to OBS Setup page
  - Stream latency: 6-10 seconds (HLS protocol standard)
  - Supports multiple concurrent streams with unique stream keys
  - Auto-reconnect handling for interrupted streams

**Date: 2025-10-29**
- **Jupiter Swap Integration**: Added official Jupiter Terminal swap widget
  - Integrated using Jupiter Terminal v2 script from terminal.jup.ag
  - Modal-based swap interface with "Swap Tokens" button in header
  - Full wallet passthrough support - reuses Phantom connection seamlessly
  - Supports all Solana tokens with Jupiter's best routing
  - Uses enableWalletPassthrough with complete wallet adapter context
  - Auto-syncs wallet state changes with Jupiter Terminal
  - Located in Dashboard header next to wallet connection
- **Phantom Wallet Integration**: Official Solana wallet adapter implementation
  - Uses official @solana/wallet-adapter-react for industry-standard integration
  - WalletProvider wraps entire app with ConnectionProvider and WalletProvider
  - PhantomWalletAdapter configured with mainnet endpoint
  - WalletButton uses useWallet() hook for all operations (connect, disconnect, select)
  - Connect/disconnect functionality with one-click authentication
  - Displays formatted wallet address (e.g., "A1b2...c3d4") when connected
  - Live connection indicator (green pulse) for active wallet
  - Proper error handling with WalletNotFoundError detection
  - Prompts users to install Phantom if not detected
  - Located in Dashboard header for easy access across all layout modes
  - Full TypeScript types and multi-wallet support built-in

**Date: 2025-10-28**
- **Custom Pump.fun Widget**: Replaced generic sidebar with real-time pump.fun price widget
  - Built custom PumpFunWidget component using PumpPortal's free WebSocket API (`wss://pumpportal.fun/api/data`)
  - Subscribes to live trades for token: `9Nj6tECrp3BG2jtMkjgkSd9Cast5nrRAQw5RBDp5pump`
  - Displays real-time price updates, 24h price change %, and 24h volume in SOL
  - Includes mini bar chart showing last 50 price points
  - Shows recent trades feed with buy/sell indicators, amounts, and timestamps
  - Widget auto-reconnects on disconnect with 5s timeout
  - Stream-sidebar layout now shows: pump.fun iframe (video) + custom price widget (sidebar)
  - Widget displays connection status indicator (green pulse when connected)
- **Pump.fun Stream Integration**: Added live stream embed in stream-sidebar layout
  - Integrated pump.fun coin page: https://pump.fun/coin/9Nj6tECrp3BG2jtMkjgkSd9Cast5nrRAQw5RBDp5pump
  - Stream appears as full-screen iframe in main stream area
  - Floating chat overlay remains functional over the embedded stream
  - OBS streaming credentials configured (RTMPS to LiveKit backend)
  - Perfect for broadcasting crypto content with live market data sidebar

**Date: 2025-10-22**
- **Twitter List Integration**: Updated backend to fetch tweets from curated Twitter List
  - Now using Twitter API v2 List endpoint: `/2/lists/1731964315962417340/tweets`
  - Replaced generic hashtag search with curated list of crypto influencers
  - List URL: https://x.com/i/lists/1731964315962417340
  - Provides higher quality, hand-picked crypto tweets instead of broad search results
- **Task 4 Complete**: Added interactive chat controls with minimize/expand and repositioning
  - Implemented minimize/expand toggle button in chat header
  - Created minimized state as compact circular button (h-14 w-14) with MessageSquare icon
  - Added notification badge system showing unread message count when minimized
  - Simulated notification system: adds 1-3 messages every 8-15 seconds when minimized
  - Unread count resets to 0 when chat is expanded
  - Implemented 4-corner positioning system (top-left, top-right, bottom-left, bottom-right)
  - Position selector dropdown in chat header with Move icon
  - Chat positions correctly within stream area container (not viewport)
  - Removed framer-motion components to prevent React hook errors
  - E2E testing confirms minimize/expand, repositioning, and notification badges all working
- **Task 3 Complete**: Integrated Restream chat embed for live stream interaction
  - Created ChatEmbed component with Restream chat iframe
  - Chat appears as floating overlay in stream-sidebar layout (320x384px)
  - Semi-transparent background (80% opacity with backdrop blur) conserves space
  - Chat displays with "Live Chat" header and LIVE indicator
  - Uses VITE_RESTREAM_CHAT_TOKEN environment variable with fallback
  - Maintains full layout switching and keyboard shortcut functionality
- **Task 2 Complete**: Implemented custom layout timing controls and keyboard shortcuts
  - Added SettingsPanel with configurable auto-switch interval (15-300s slider)
  - Implemented smart keyboard shortcuts: 1/2/3 for manual layout selection, Space for auto-switch toggle
  - Manual layout changes (1/2/3) pause auto-switch for 3s then auto-resume
  - Space key cancels pending auto-resume when active (manual override)
  - Keyboard shortcuts disabled when settings dialog open (prevents accidental toggles)
  - Proper timeout management with cleanup on unmount and manual overrides
- **Task 1 Complete**: Added comprehensive OBS Browser Source Integration Guide at `/obs-guide`
  - Created 4 streaming presets with copy-to-clipboard URLs
  - Implemented `ticker-only` layout mode for lower-third OBS overlays (URL-only, not in switcher)
  - Added URL parameter support: `?layout={mode}` sets initial layout and disables auto-switch
  - Fixed auto-switch logic to only disable for valid layout parameters
  - Added OBS Setup Guide button to Dashboard header

**Date: 2025-10-21**
- Created complete schema for crypto prices, news, and tweets
- Implemented all frontend components with exceptional visual quality
- Built WebSocket server for real-time data updates
- Integrated CoinGecko API for live crypto prices
- Added CryptoPanic news feed with rotation
- Implemented Twitter API v2 integration
- Created 3 distinct layout modes for streaming (full-dashboard, stream-sidebar, video-overlay)
- Added auto-switching system with countdown timer

## Project Architecture

### Frontend (`client/`)
**Key Components:**
- `PriceTickerCard.tsx` - Animated crypto price cards with sparklines
- `NewsCard.tsx` - Breaking news cards with rotation
- `TweetCard.tsx` - Twitter feed cards with verified badges
- `TickerBar.tsx` - Scrolling ticker bar for bottom overlay
- `LayoutSwitcher.tsx` - Layout mode switcher with auto-switch toggle
- `StreamPlayer.tsx` - HLS video player with video.js for live streams
- `StreamControls.tsx` - Stream key management and status indicator
- `SettingsPanel.tsx` - Configurable auto-switch interval with slider control
- `ChatEmbed.tsx` - Restream chat iframe embed for live stream interaction
- `LiveIndicator.tsx` - WebSocket connection status
- `LoadingState.tsx` - Beautiful loading skeletons
- `OBSGuide.tsx` - Complete OBS integration documentation page

**Main Page:**
- `Dashboard.tsx` - Main dashboard with 3 layout modes and WebSocket handling

### Backend (`server/`)
**API Routes:**
- `GET /api/crypto/prices` - Fetch BTC, ETH, BNB, SOL prices from CoinGecko
- `GET /api/news` - Fetch crypto news from CryptoPanic
- `GET /api/tweets` - Fetch crypto tweets from Twitter API v2
- `GET /api/stream/config` - Get RTMP server configuration and stream key
- `GET /api/stream/status` - Check if stream is currently active
- `POST /api/stream/generate-key` - Generate new stream key
- `WebSocket /ws` - Real-time updates for all data types

**RTMP Media Server (`server/mediaServer.ts`):**
- RTMP ingest on port 1935 (`rtmp://host:1935/live/{stream-key}`)
- HLS output on port 8888 (`http://host:8888/live/{stream-key}/index.m3u8`)
- Stream key authentication and validation
- Real-time stream monitoring and status updates
- FFmpeg-powered HLS transcoding with configurable settings

**Data Sources:**
- CoinGecko API (free tier) - Crypto market data
- CryptoPanic API (public feed) - Crypto news
- Twitter API v2 List endpoint - Curated tweets from crypto influencers (List ID: 1731964315962417340)

### Shared Types (`shared/schema.ts`)
- `CryptoPrice` - Crypto price data with sparklines
- `NewsArticle` - News article with source and votes
- `Tweet` - Twitter data with author info and metrics
- `LayoutMode` - Dashboard layout modes (full-dashboard, stream-sidebar, video-overlay, ticker-only)
  - Note: `ticker-only` is designed for OBS overlays only (accessed via URL parameter, not in UI switcher)
- `WSMessage` - WebSocket message types

## Design System

### Colors (Dark Mode Optimized)
- Background: Deep navy-black (220 25% 8%)
- Primary: Electric blue (210 100% 55%)
- Success/Bullish: Vibrant green (145 65% 45%)
- Danger/Bearish: Red (0 75% 58%)
- Warning: Amber (35 90% 60%)

### Typography
- Primary: Inter (400-800 weights)
- Monospace: JetBrains Mono (prices, numbers)

### Animations
- Price updates: 300ms smooth counting
- Layout transitions: 800ms ease-in-out
- News rotation: 10 seconds per article
- Tweet rotation: 8 seconds per tweet
- Ticker scroll: 60s continuous loop

## User Preferences
- Default layout: Full Dashboard
- Auto-switch enabled by default (45s intervals)
- Dark mode always enabled (optimized for streaming)

## Environment Variables
- `TWITTER_BEARER_TOKEN` - Twitter API Bearer Token
- `TWITTER_API_KEY` - Twitter API Key
- `TWITTER_API_SECRET` - Twitter API Secret
- `VITE_RESTREAM_CHAT_TOKEN` - Restream chat embed token (optional, has fallback)

## Key Features
1. **Real-time Price Feeds** - WebSocket updates every 30s
2. **Breaking News Rotation** - Auto-rotates every 10s
3. **Twitter Integration** - Live crypto tweets with rotation
4. **Custom RTMP Streaming** - Self-hosted live streaming server with HLS delivery
5. **Stream Key Management** - Secure authentication with copy-to-clipboard controls
6. **Interactive Chat Overlay** - Restream chat with minimize/expand, 4-corner repositioning, and notification badges
7. **Layout Auto-Switching** - TV news network style transitions with configurable intervals (15-300s)
8. **Keyboard Shortcuts** - Quick layout switching (1/2/3 keys) and auto-switch control (Space key)
9. **OBS Integration** - Complete browser source setup guide with RTMP streaming instructions
10. **Streaming Optimized** - Multiple layouts for OBS/Streamlabs including ticker-only mode
11. **Professional Design** - CNBC-inspired broadcast aesthetic
12. **Responsive Animations** - Smooth transitions and micro-interactions

## Technical Stack
- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion, Wouter
- **Backend**: Express, WebSocket (ws), Axios
- **APIs**: CoinGecko, CryptoPanic, Twitter API v2
- **Real-time**: WebSocket for live data streaming
- **State Management**: TanStack Query for data fetching

## Development Notes
- WebSocket reconnects automatically after 5s disconnect
- API calls are cached to reduce rate limiting
- Fallback data provided when APIs are unavailable
- All components have proper loading and error states
- Design follows universal design guidelines for consistency
