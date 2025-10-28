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
- ✅ Restream chat integration for live viewer interaction
- ✅ Auto-switching layout system (configurable 15-300s intervals)
- ✅ Keyboard shortcuts for layout control
- ✅ OBS browser source integration guide
- ✅ CNBC-inspired broadcast design
- ✅ Responsive animations and transitions

## Recent Changes
**Date: 2025-10-28**
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
- `WebSocket /ws` - Real-time updates for all data types

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
4. **Interactive Chat Overlay** - Restream chat with minimize/expand, 4-corner repositioning, and notification badges
5. **Layout Auto-Switching** - TV news network style transitions with configurable intervals (15-300s)
6. **Keyboard Shortcuts** - Quick layout switching (1/2/3 keys) and auto-switch control (Space key)
7. **OBS Integration** - Complete browser source setup guide with streaming presets
8. **Streaming Optimized** - Multiple layouts for OBS/Streamlabs including ticker-only mode
9. **Professional Design** - CNBC-inspired broadcast aesthetic
10. **Responsive Animations** - Smooth transitions and micro-interactions

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
