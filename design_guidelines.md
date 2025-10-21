# Design Guidelines: Live Crypto Streaming Dashboard

## Design Approach
**System:** Fluent Design + Financial News Broadcast Aesthetic (CNBC-inspired)
**Rationale:** Information-dense, real-time data display requiring professional credibility, excellent readability, and optimized performance for streaming overlays.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary (Streaming Optimized):**
- Background Base: 220 25% 8% (deep navy-black)
- Surface: 220 20% 12% (elevated surfaces)
- Surface Elevated: 220 18% 16% (cards, panels)
- Border: 220 15% 25% (subtle separators)

**Accent & Data Visualization:**
- Primary Brand: 210 100% 55% (electric blue - similar to CNBC)
- Success/Bullish: 145 65% 45% (vibrant green for price increases)
- Danger/Bearish: 0 75% 58% (red for price decreases)
- Warning: 35 90% 60% (amber for alerts)
- Neutral Data: 220 10% 70% (text, labels)

**Broadcast Overlays:**
- Overlay Background: 220 25% 8% with 95% opacity
- Ticker Bar: 220 20% 10% with subtle gradient
- Breaking News: 0 75% 45% (red accent for urgency)

### B. Typography
**Fonts:**
- Primary: 'Inter' (600, 500, 400) - excellent legibility for data
- Monospace: 'JetBrains Mono' (500) - price displays, crypto addresses
- Display: 'Inter' (700, 800) - section headers, breaking news

**Hierarchy:**
- Crypto Prices (Large): 3xl to 5xl, weight 700, monospace
- Price Changes: xl, weight 600, colored by direction
- News Headlines: lg to xl, weight 600
- Tweet Text: base, weight 400
- Ticker Text: sm, weight 500, uppercase tracking-wide
- Timestamps: xs, weight 400, opacity 70%

### C. Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: gap-4 to gap-8
- Major sections: py-8 to py-12

**Grid System:**
- Full Dashboard: 12-column grid with flexible regions
- Stream + Sidebar: 8-column main / 4-column sidebar split
- Video Overlay: Minimal fixed positioning (bottom ticker, corner logo)

**Layout Modes:**
1. **Full Dashboard:** 3-column grid (Prices left, News center, Tweets right)
2. **Stream Integration:** 2-column (Stream 66% / Data sidebar 33%)
3. **Broadcast Overlay:** Transparent overlay with bottom ticker and logo watermark

### D. Component Library

**Price Ticker Cards:**
- Rounded corners (rounded-xl)
- Subtle glow effect on price change
- Animated number transitions (smooth counting)
- Sparkline micro-charts (24h trend)
- Large crypto symbol icons (3rem)
- Percentage change badges with directional arrows

**Breaking News Feed:**
- Horizontal scrolling ticker bar (top)
- Vertical rotating cards (center region)
- Red "BREAKING" tag for urgent news
- Auto-rotation every 8-10 seconds
- Smooth fade transitions between stories
- Timestamp and source attribution

**Twitter/X Feed:**
- Card-based tweets with profile images
- Auto-scroll with 6-8 second intervals
- Verified badge indicators
- Tweet text truncation with expand option
- Engagement metrics (likes, retweets) optional
- Smooth vertical carousel animation

**Broadcast Controls:**
- Layout switcher (subtle, top-right corner)
- Auto-cycle timer indicator
- Transition countdown (5s, 4s, 3s...)
- Logo placement (bottom-left or top-right, 120-150px)

**Data Visualization:**
- Micro sparklines for 24h price trends
- Simple bar indicators for volume
- Percentage change with directional icons (▲▼)
- Color-coded backgrounds (subtle, 10% opacity)

### E. Animations
**Minimal, Purpose-Driven:**
- Price updates: 300ms smooth number counting
- Layout transitions: 800ms ease-in-out slide/fade
- News rotation: 600ms crossfade
- Ticker scroll: Continuous 40-60s loop
- Breaking news pulse: Subtle 2s glow on entry
- Tweet cards: 400ms slide-up on rotation

**Transition Timings:**
- Layout auto-switch: Every 45-60 seconds
- News rotation: Every 8-10 seconds  
- Tweet scroll: Every 6-8 seconds
- Price updates: Real-time (WebSocket driven)

## Streaming-Specific Considerations

**Overlay Optimization:**
- High contrast ratios (4.5:1 minimum)
- No pure white (#fff) - use 95% white for text
- Semi-transparent backgrounds with blur (backdrop-filter)
- Logo with subtle drop shadow for visibility over video
- Ticker bar: Fixed bottom positioning, 80-100px height

**Viewport Management:**
- Full dashboard: Natural height, scrollable if needed
- Stream layouts: Fixed 100vh, no scroll
- Responsive breakpoints: 1920px, 1280px, 1024px (common streaming resolutions)

**Performance:**
- Limit simultaneous animations
- Optimize WebSocket connections
- Lazy load Twitter images
- Throttle price update renders to 1s intervals
- Reduce motion option for accessibility

## Professional Broadcast Aesthetic

**Visual Identity:**
- Sharp, angular design language
- Subtle gradients on surfaces (5-10% variation)
- Professional sans-serif typography throughout
- Consistent 2px borders with accent colors
- Depth through layering (3 levels max)

**Information Hierarchy:**
- Primary: Live crypto prices (largest, most prominent)
- Secondary: Breaking news (medium emphasis, rotation)
- Tertiary: Tweet feed (supporting context, smaller)
- Ambient: Ticker bar, timestamp, metadata

**Credibility Markers:**
- Data source attribution (CoinGecko, CryptoPanic)
- "LIVE" indicator badges
- Last updated timestamps
- Real-time pulse indicators (animated dots)

## Images
No hero images required. This is a data-focused dashboard. Use:
- Crypto logo icons (64x64px) for each coin
- Profile images for Twitter feed (48x48px rounded-full)
- Optional: Brand logo watermark (SVG, 150x50px)
- Breaking news thumbnails (120x120px, optional)