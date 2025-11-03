# Crypto Live - Real-time Market Dashboard

## Overview
Crypto Live is a professional broadcast-quality crypto streaming dashboard designed for content creators. It provides real-time price feeds, breaking news, and Twitter integration, featuring CNBC-style layouts with auto-switching capabilities for live streaming. The project aims to deliver a comprehensive dashboard experience with multiple layout modes including a full dashboard, a stream with a data sidebar, and a minimal video overlay.

## User Preferences
- Default layout: Full Dashboard
- Auto-switch enabled by default (45s intervals)
- Dark mode always enabled (optimized for streaming)

## System Architecture
The project is built with a React frontend and an Express backend, using TypeScript.

### UI/UX Decisions
- **Design Inspiration**: CNBC-inspired broadcast aesthetic.
- **Color Scheme**: Dark mode optimized with deep navy-black background, electric blue primary, vibrant green for bullish, red for bearish, and amber for warnings.
- **Typography**: Inter for primary text and JetBrains Mono for prices/numbers.
- **Animations**: Smooth animations for price updates (300ms), layout transitions (800ms), and content rotation (news 10s, tweets 8s).
- **Layout Modes**:
    - **Full Dashboard**: 3-column view (prices, news, tweets).
    - **Stream + Sidebar**: Stream area with floating chat overlay and data sidebar.
    - **Video Overlay**: Minimal overlay for OBS with ticker and logo.
    - **Ticker-Only**: Designed for lower-third OBS overlays (URL parameter access only).

### Technical Implementations & Feature Specifications
- **Real-time Data**: WebSocket integration for live price, news, and tweet updates.
- **Custom RTMP Streaming Server**: Self-hosted Node.js-based RTMP ingest server (port 1935) with FFmpeg for HLS transcoding (port 8888). Includes stream key authentication and real-time status monitoring.
- **Wallet Integration**: Phantom Wallet integration using `@solana/wallet-adapter-react` for Solana blockchain interactions.
- **Swap Widget**: Jupiter Terminal integration for token swaps with best routing.
- **Interactive Chat**: Restream chat embed with minimize/expand, 4-corner repositioning, and notification badges.
- **Layout Control**: Configurable auto-switching (15-300s) and keyboard shortcuts (1/2/3 for layout, Space for auto-switch toggle).
- **OBS Integration**: Comprehensive guide with streaming presets and URL parameter support for layout control.
- **Frontend Components**: Modular React components for prices, news, tweets, tickers, stream player, chat, and settings.
- **Backend Services**: API routes for fetching crypto prices, news, tweets, and managing stream configuration/status.

### System Design Choices
- **Frontend**: React, TypeScript, TailwindCSS, Framer Motion, Wouter.
- **Backend**: Express, WebSocket (`ws` library), Axios.
- **State Management**: TanStack Query for data fetching.
- **Deployment**: Optimized for Replit deployment with automatic scaling and SSL; self-hosting options available for VPS with specific requirements (Node.js, FFmpeg, Nginx, PM2).

## External Dependencies
- **CoinGecko API**: For real-time BTC, ETH, BNB, SOL prices.
- **CryptoPanic API**: For crypto news feeds.
- **Twitter API v2**: For fetching tweets from a curated crypto influencer list (List ID: 1731964315962417340).
- **PumpPortal API**: WebSocket for custom Pump.fun price widget with real-time trades.
- **Jupiter Terminal**: Integrated for token swapping functionality.
- **@solana/wallet-adapter-react**: For Phantom wallet integration.
- **Restream**: For live chat embedding.
- **node-media-server**: Used for the custom RTMP streaming server.
- **FFmpeg**: For HLS transcoding within the media server.
- **video.js**: For HLS video playback in the StreamPlayer component.