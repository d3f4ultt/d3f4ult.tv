# Security Vulnerability: Unauthenticated Wallet API

## Issue
The `/api/wallets` endpoints in `server/routes.ts` allow unauthenticated access, enabling:
- Reading all wallets (GET /api/wallets)
- Adding spam wallets (POST /api/wallets) ← **Attack vector used**
- Deleting any wallet (DELETE /api/wallets/:id)
- Modifying any wallet label (PATCH /api/wallets/:id)

## Attack Details
- **Date**: Detected November 13, 2025
- **Method**: Automated POST requests to `/api/wallets`
- **Impact**: 521 spam wallets added with fake CIA/hacker claims
- **Label used**: "harmless loser never hacked the cia -- he was never in cwa -- https://www.diffchecker.com/DpYM5W8z/"

## Root Cause
The `/api/wallets` endpoints use in-memory storage (`MemStorage`) and lack authentication middleware, unlike the `/api/user/wallets` endpoints which properly verify user sessions.

## Recommended Fix
**Option 1 (Recommended)**: Remove `/api/wallets` endpoints entirely and use only `/api/user/wallets` with authentication

**Option 2**: Add authentication middleware to all `/api/wallets` endpoints:
```typescript
app.post("/api/wallets", async (req, res) => {
  const userId = await verifyUserSession(req.headers.authorization);
  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // ... rest of endpoint
});
```

## Cleanup Performed
1. ✅ Removed fake CIA/hacker videos from `/media/playlist/`:
   - `from-cia-hacker-to-crypto-founder.mp4` (603MB)
   - `hacking-cia-to-7-figures.mp4` (284MB)

2. ✅ Verified spam wallets not in Supabase database (likely in-memory only)

3. ⚠️ Need to restart server to clear in-memory wallet spam

## Prevention
- Implement rate limiting on public endpoints
- Add authentication to all wallet modification endpoints
- Consider moving to user-scoped wallets only (`/api/user/wallets`)
- Add CAPTCHA or other bot prevention for public endpoints
