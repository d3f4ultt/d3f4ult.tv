# Credential Rotation Guide - Pre-Production Deployment

**IMPORTANT**: Rotate ALL credentials before final production launch!

---

## 1. Supabase Credentials

### Service Role Key Rotation
1. **Login to Supabase Dashboard**:
   - Go to: https://supabase.com/dashboard
   - Select project: `ethjwdkwpevcfrdbifci`

2. **Generate New Service Role Key**:
   - Navigate to: Settings → API
   - Click "Reset service_role key"
   - **IMPORTANT**: Save the new key immediately (shown only once)

3. **Update .env File**:
   ```bash
   # Edit /var/www/d3f4ult.tv/app/.env
   SUPABASE_SERVICE_ROLE_KEY=<new_key_here>
   ```

4. **Restart Server**:
   ```bash
   pm2 restart d3f4ult-tv
   # or
   systemctl restart d3f4ult-tv
   ```

5. **Verify**:
   - Test authentication endpoints
   - Check Discord role sync works
   - Verify wallet operations

### Anon Key (Optional - Low Priority)
- Anon keys are public-facing and protected by RLS
- Only rotate if compromised
- Update both `client/.env` and `client/src/lib/supabase.ts` fallback

---

## 2. Discord Credentials

### Bot Token Rotation
1. **Login to Discord Developer Portal**:
   - Go to: https://discord.com/developers/applications
   - Select application: `1228289787249561610`

2. **Regenerate Bot Token**:
   - Navigate to: Bot section
   - Click "Reset Token"
   - Confirm and copy new token

3. **Update .env File**:
   ```bash
   DISCORD_BOT_TOKEN=<new_token_here>
   ```

4. **Restart Server** (bot reconnects automatically)

### OAuth2 Client Secret Rotation
1. **In Discord Developer Portal**:
   - Navigate to: OAuth2 → General
   - Click "Reset Secret"
   - Copy new client secret

2. **Update .env File**:
   ```bash
   DISCORD_CLIENT_SECRET=<new_secret_here>
   ```

3. **Update OAuth2 Callback**:
   - Verify redirect URI: `https://d3f4ult.tv/api/auth/discord/callback`
   - Update if domain changed

4. **Test OAuth Flow**:
   - Log out of application
   - Click "Login with Discord"
   - Verify authentication works

---

## 3. Twitter API Credentials

### Bearer Token Rotation
1. **Login to Twitter Developer Portal**:
   - Go to: https://developer.twitter.com/en/portal/dashboard
   - Select your app

2. **Regenerate Access Token**:
   - Navigate to: Keys and tokens
   - Click "Regenerate" under Bearer Token
   - Save new token

3. **Update .env File**:
   ```bash
   TWITTER_BEARER_TOKEN=<new_bearer_token>
   TWITTER_API_KEY=<new_api_key>
   TWITTER_API_SECRET=<new_api_secret>
   ```

4. **Restart Server and Test**:
   - Check Twitter feed widget
   - Verify tweets are loading

---

## 4. Session Secret Rotation

### Generate New Session Secret
1. **Generate Random String**:
   ```bash
   openssl rand -base64 32
   ```

2. **Update .env File**:
   ```bash
   SESSION_SECRET=<generated_secret>
   ```

3. **Impact**: All existing sessions will be invalidated
   - Users will need to log in again
   - Plan rotation during low-traffic period

---

## 5. Database Credentials (If Applicable)

### PostgreSQL / Neon Database
- Currently using Supabase (covered above)
- If migrating to separate PostgreSQL:
  ```bash
  # Generate new password in database
  ALTER USER youruser WITH PASSWORD 'new_secure_password';

  # Update connection string
  DATABASE_URL=postgresql://user:new_password@host:port/db
  ```

---

## Post-Rotation Checklist

### Immediate Verification (5-10 minutes after rotation)
- [ ] Server starts without errors
- [ ] Discord OAuth login works
- [ ] User sessions authenticate correctly
- [ ] Wallet operations function properly
- [ ] Discord bot connects successfully
- [ ] Twitter feed loads
- [ ] No errors in server logs

### Extended Testing (30 minutes)
- [ ] Create new user account
- [ ] Connect Discord
- [ ] Add/remove wallets
- [ ] Check Discord role sync
- [ ] Test all authenticated endpoints
- [ ] Monitor error logs for issues

### Security Verification
- [ ] Old credentials no longer work
- [ ] New .env file has 600 permissions
- [ ] .env is in .gitignore
- [ ] No credentials in git history
- [ ] Server logs don't expose secrets

---

## Emergency Rollback

If rotation causes issues:

1. **Quick Rollback**:
   ```bash
   # Restore from backup
   cp .env.backup .env
   pm2 restart d3f4ult-tv
   ```

2. **Identify Issue**:
   - Check server logs: `pm2 logs d3f4ult-tv`
   - Verify each service independently
   - Test credentials manually

3. **Fix and Re-rotate**:
   - Resolve underlying issue
   - Re-attempt rotation with monitoring
   - Document any problems encountered

---

## Best Practices for Credential Management

### Ongoing Security
1. **Never commit credentials to git**
   - .env files are now in .gitignore
   - Use git secrets scanner

2. **Use environment-specific credentials**
   - Development: Separate Supabase project
   - Staging: Separate credentials
   - Production: Unique credentials

3. **Implement secrets management** (recommended)
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Cloud Secret Manager

4. **Automated rotation** (future enhancement)
   - Schedule quarterly rotations
   - Automate with scripts
   - Test in staging first

5. **Access control**
   - Limit who can view/edit .env
   - Use service accounts where possible
   - Audit credential access

6. **Monitoring**
   - Alert on authentication failures
   - Monitor for unusual API usage
   - Track credential usage patterns

---

## Rotation Schedule

### Recommended Frequency
- **Production Launch**: ✅ Rotate ALL credentials
- **Regular Interval**: Every 90 days
- **After Incident**: Immediately
- **Personnel Change**: When team members leave

### Next Rotation Due
- **Initial Rotation**: BEFORE production launch
- **Next Regular Rotation**: [Date + 90 days after launch]

---

## Support & Resources

### Troubleshooting
- Supabase Docs: https://supabase.com/docs
- Discord Developer: https://discord.com/developers/docs
- Twitter API: https://developer.twitter.com/en/docs

### Contact for Issues
- Security concerns: [your-security-email]
- Technical support: [your-support-email]

---

**Last Updated**: 2025-11-13
**Next Review**: Before Production Launch
**Status**: PENDING ROTATION
