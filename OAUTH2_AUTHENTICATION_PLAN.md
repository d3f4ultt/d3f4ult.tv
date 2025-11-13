# OAuth2 Authentication System - Implementation Plan

**Project:** d3f4ult.tv Crypto Stream Dashboard
**Feature:** User Authentication with OAuth2
**Date:** 2025-11-12
**Status:** Planning Phase

---

## 1. Executive Summary

### Goal
Implement OAuth2 authentication system allowing users to:
- Sign in with Twitter/X or Discord
- Persistently save wallets across sessions
- Access premium features (trading history, price alerts, watchlists)
- Get special badges/permissions for Discord server members (role: 1435799986423205951)

### Technology Stack
- **Frontend:** React + Wouter routing + shadcn/ui
- **Backend:** Express.js + Passport.js
- **Database:** PostgreSQL with Prisma ORM
- **Session:** express-session with PostgreSQL store
- **OAuth2 Providers:** Twitter/X, Discord

### Timeline
- **MVP (Auth + Persistent Wallets):** 8-10 hours
- **Full System:** 15-20 hours

---

## 2. System Architecture

### 2.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks "Login with Twitter/Discord"                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend redirects to:                                      │
│  /api/auth/twitter or /api/auth/discord                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Passport.js OAuth2 strategy initiates                       │
│  Redirects to Twitter/Discord authorization page            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  User authorizes on Twitter/Discord                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Callback to: /api/auth/twitter/callback                    │
│  Backend receives: access_token, profile data               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend logic:                                              │
│  1. Check if user exists (by provider_id)                   │
│  2. If not, create new user record                          │
│  3. If Discord: verify server membership & role             │
│  4. Create session, store user in req.session               │
│  5. Redirect to frontend dashboard                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend fetches /api/auth/user                             │
│  Receives: { id, username, avatar, provider, badge }        │
│  Stores in React context/state                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Tables Design (PostgreSQL)

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,           -- 'twitter' | 'discord'
  provider_id VARCHAR(255) NOT NULL,        -- OAuth provider user ID
  username VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  avatar_url TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,

  UNIQUE(provider, provider_id)
);

CREATE INDEX idx_users_provider_id ON users(provider, provider_id);
```

#### user_badges
```sql
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,         -- 'discord_member', 'discord_vip'
  discord_guild_id VARCHAR(255),           -- 935376916377137232
  discord_role_id VARCHAR(255),            -- 1435799986423205951
  verified_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                    -- Optional expiration

  UNIQUE(user_id, badge_type)
);
```

#### wallets
```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  address VARCHAR(500) NOT NULL,
  label VARCHAR(255) DEFAULT 'Unnamed Wallet',
  blockchain VARCHAR(20) NOT NULL,         -- 'solana' | 'bsc'
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, address, blockchain)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
```

#### watchlists
```sql
CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL DEFAULT 'My Watchlist',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE watchlist_tokens (
  id SERIAL PRIMARY KEY,
  watchlist_id INTEGER REFERENCES watchlists(id) ON DELETE CASCADE,
  token_symbol VARCHAR(50) NOT NULL,
  token_name VARCHAR(255),
  blockchain VARCHAR(20),
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(watchlist_id, token_symbol, blockchain)
);
```

#### price_alerts
```sql
CREATE TABLE price_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_symbol VARCHAR(50) NOT NULL,
  blockchain VARCHAR(20),
  target_price DECIMAL(20, 8) NOT NULL,
  condition VARCHAR(10) NOT NULL,          -- 'above' | 'below'
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),

  CHECK (condition IN ('above', 'below'))
);

CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(user_id, triggered) WHERE triggered = FALSE;
```

#### trading_history
```sql
CREATE TABLE trading_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(500) NOT NULL,
  blockchain VARCHAR(20) NOT NULL,
  transaction_hash VARCHAR(255) NOT NULL,
  token_in VARCHAR(50),
  token_out VARCHAR(50),
  amount_in DECIMAL(30, 10),
  amount_out DECIMAL(30, 10),
  price_usd DECIMAL(20, 8),
  transaction_type VARCHAR(20),            -- 'swap' | 'transfer' | 'buy' | 'sell'
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(transaction_hash)
);

CREATE INDEX idx_trading_history_user_id ON trading_history(user_id);
CREATE INDEX idx_trading_history_wallet ON trading_history(wallet_address);
```

#### sessions (express-session storage)
```sql
CREATE TABLE "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,

  PRIMARY KEY ("sid")
);

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

---

## 4. Backend Implementation

### 4.1 Dependencies to Install

```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-twitter": "^1.0.4",
    "passport-discord": "^0.1.4",
    "express-session": "^1.18.0",
    "connect-pg-simple": "^9.0.1",
    "@prisma/client": "^5.8.0",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "prisma": "^5.8.0"
  }
}
```

### 4.2 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/d3f4ult_db"

# Session Secret
SESSION_SECRET="your-super-secret-session-key-change-in-production"

# Twitter OAuth2
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
TWITTER_CALLBACK_URL="https://d3f4ult.tv/api/auth/twitter/callback"

# Discord OAuth2
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
DISCORD_CALLBACK_URL="https://d3f4ult.tv/api/auth/discord/callback"
DISCORD_BOT_TOKEN="your-discord-bot-token"  # For role verification
DISCORD_GUILD_ID="935376916377137232"
DISCORD_VIP_ROLE_ID="1435799986423205951"
```

### 4.3 File Structure

```
server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Auto-generated migrations
├── config/
│   └── passport.ts            # Passport strategies configuration
├── middleware/
│   ├── auth.ts                # Authentication middleware
│   └── session.ts             # Session configuration
├── services/
│   ├── discordService.ts      # Discord API for role verification
│   ├── userService.ts         # User CRUD operations
│   └── walletService.ts       # Wallet operations (updated)
└── routes/
    ├── auth.ts                # OAuth routes
    └── api.ts                 # Protected API routes

client/src/
├── contexts/
│   └── AuthContext.tsx        # User authentication context
├── components/
│   ├── AuthButtons.tsx        # Login/Signup buttons
│   ├── UserDropdown.tsx       # User menu dropdown
│   └── ProtectedRoute.tsx     # Route guard component
└── hooks/
    └── useAuth.ts             # Authentication hook
```

---

## 5. Frontend Implementation

### 5.1 Components to Create

#### AuthButtons.tsx
```tsx
// Login/Signup buttons in top right of Dashboard
- "Login with Twitter" button
- "Login with Discord" button
- Icons from lucide-react (Twitter, MessageSquare)
- Redirects to /api/auth/{provider}
```

#### UserDropdown.tsx
```tsx
// User menu when logged in
- Avatar image
- Username
- Badge indicator (if Discord VIP)
- Dropdown menu:
  - Profile
  - My Wallets
  - Watchlists
  - Price Alerts
  - Trading History
  - Logout
```

#### AuthContext.tsx
```tsx
// Global authentication state
- User data: { id, username, avatar, provider, badge }
- isAuthenticated boolean
- login() / logout() functions
- Fetch user on mount
```

### 5.2 UI Layout Changes

**Dashboard Header (Full Dashboard):**
```
[Crypto Live Title]                    [AuthButtons/UserDropdown]
[PortfolioDialog] [JupiterSwap] ...    [Settings] [LiveIndicator]
```

**Dashboard Header (Stream Sidebar):**
```
[Live Stream Title]                    [Settings]
[AuthButtons/UserDropdown]
[PortfolioDialog] [JupiterSwap]
```

---

## 6. OAuth2 Provider Setup

### 6.1 Twitter OAuth2 Setup

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create new App
3. Enable OAuth 2.0
4. Add callback URL: `https://d3f4ult.tv/api/auth/twitter/callback`
5. Request scopes: `users.read`, `tweet.read`
6. Copy Client ID and Client Secret

### 6.2 Discord OAuth2 Setup

1. Go to https://discord.com/developers/applications
2. Create new Application
3. Go to OAuth2 section
4. Add redirect URL: `https://d3f4ult.tv/api/auth/discord/callback`
5. Request scopes: `identify`, `email`, `guilds`, `guilds.members.read`
6. Copy Client ID and Client Secret

### 6.3 Discord Bot for Role Verification

1. In Discord Application, go to Bot section
2. Create Bot, copy Bot Token
3. Invite bot to server (Guild ID: 935376916377137232)
4. Grant permissions: Read Members, Read Roles
5. Use Discord API to verify user has role 1435799986423205951

---

## 7. MVP Scope (Phase 1)

### 7.1 What's Included in MVP

✅ **Must Have:**
1. Twitter OAuth2 login
2. Discord OAuth2 login
3. PostgreSQL database setup
4. User session management
5. Login/Signup UI buttons
6. User dropdown menu
7. Persistent wallet storage (linked to user_id)
8. Discord role verification + badge display
9. Logout functionality
10. Basic user profile display

❌ **Not in MVP (Future Phases):**
- Watchlists
- Price alerts
- Trading history
- Advanced profile page
- Email notifications
- Password reset (OAuth only for now)

### 7.2 MVP User Flow

```
1. Anonymous user visits dashboard
   → Can view public data
   → Cannot save wallets permanently

2. User clicks "Login with Twitter"
   → Redirects to Twitter authorization
   → Returns to dashboard, now logged in
   → Avatar + username in top right

3. User adds wallet to portfolio
   → Wallet saved to database with user_id
   → Persists across sessions and devices

4. User clicks "Login with Discord"
   → Redirects to Discord authorization
   → Backend checks guild membership + role
   → If role 1435799986423205951 found: badge added
   → Badge shown in user dropdown

5. User logs out
   → Session destroyed
   → Redirects to dashboard as anonymous
```

---

## 8. Implementation Phases

### Phase 1: MVP (8-10 hours)
- **Step 1:** Database setup (Prisma + PostgreSQL) - 2h
- **Step 2:** Passport.js + OAuth strategies - 2h
- **Step 3:** Session management - 1h
- **Step 4:** Backend auth routes - 1h
- **Step 5:** Frontend AuthContext + UI - 2h
- **Step 6:** Update wallet storage to use DB - 1h
- **Step 7:** Testing + debugging - 1-2h

### Phase 2: Watchlists (3-4 hours)
- Watchlist CRUD API
- Watchlist UI components
- Token search/autocomplete

### Phase 3: Price Alerts (3-4 hours)
- Price alert CRUD API
- Alert creation UI
- Background job to check prices
- Notification system (toast/email)

### Phase 4: Trading History (4-5 hours)
- Blockchain transaction parser
- History sync job
- Trading history UI table
- Performance charts (P&L)

---

## 9. Security Considerations

### 9.1 Session Security
- Use strong session secret (min 32 chars, random)
- Set secure cookie flags: `httpOnly: true`, `sameSite: 'lax'`
- Production: `secure: true` (HTTPS only)
- Session expiration: 7 days
- PostgreSQL session store (persistent)

### 9.2 CSRF Protection
- Enable CSRF tokens for state-changing requests
- Use `csurf` middleware

### 9.3 Rate Limiting
- Limit OAuth callback attempts
- Protect API endpoints (max 100 req/min per user)

### 9.4 Data Validation
- Validate all user inputs with Zod
- Sanitize database queries (Prisma prevents SQL injection)

---

## 10. Testing Strategy

### 10.1 Manual Testing Checklist
- [ ] Twitter OAuth login flow
- [ ] Discord OAuth login flow
- [ ] Session persistence after refresh
- [ ] Logout clears session
- [ ] Wallet CRUD for authenticated users
- [ ] Wallet access denied for anonymous users
- [ ] Discord badge shows for VIP role members
- [ ] Discord badge hidden for non-VIP members
- [ ] Multiple device login (same user)
- [ ] Concurrent user sessions

### 10.2 Edge Cases
- [ ] OAuth fails midway (user cancels)
- [ ] OAuth provider returns error
- [ ] User already exists (Twitter), tries Discord login
- [ ] Session expires while user active
- [ ] Database connection lost
- [ ] Discord role removed after login

---

## 11. Deployment Notes

### 11.1 Pre-Deployment
1. Set up PostgreSQL database on production server
2. Run Prisma migrations: `npx prisma migrate deploy`
3. Add environment variables to production
4. Test OAuth callbacks work with production URLs
5. Verify Discord bot is in server with correct permissions

### 11.2 Post-Deployment
1. Monitor session store size
2. Set up session cleanup cron job (delete expired sessions)
3. Monitor OAuth error rates
4. Set up database backups

---

## 12. Future Enhancements

### 12.1 Additional Features
- Email/password authentication (fallback)
- Two-factor authentication (2FA)
- API keys for programmatic access
- Webhook notifications for price alerts
- Portfolio performance analytics
- Social features (follow other traders)
- Leaderboards

### 12.2 Additional OAuth Providers
- Google OAuth
- GitHub OAuth
- Metamask wallet authentication
- Phantom wallet authentication

---

**End of Plan Document**

*This plan will be executed in phases, starting with MVP (Phase 1).*
