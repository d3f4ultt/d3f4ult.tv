# Supabase Setup Walkthrough for d3f4ult.tv

**Goal:** Set up Supabase for OAuth2 authentication (Twitter + Discord)
**Time:** 10-15 minutes
**Date:** 2025-11-12

---

## Step 1: Create Supabase Account (2 minutes)

1. **Go to:** https://supabase.com
2. **Click:** "Start your project" (green button)
3. **Sign up with GitHub** (recommended) or email
   - If GitHub: Authorize Supabase to access your GitHub account
   - If email: Enter email, create password, verify email
4. **You'll be redirected to the Supabase Dashboard**

---

## Step 2: Create New Project (3 minutes)

1. **Click:** "New project" button (green button on dashboard)

2. **Select Organization:**
   - If first time: Click "Create a new organization"
   - Name: `d3f4ult` (or your preferred name)
   - Click "Create organization"

3. **Fill Project Details:**
   ```
   Name: d3f4ult-dashboard
   Database Password: [Click "Generate a password" or create your own]
   Region: [Choose closest to your VPS server location]
   Pricing Plan: Free (default)
   ```

4. **Click:** "Create new project" (green button)

5. **Wait 2-3 minutes** for project provisioning (you'll see a progress spinner)

---

## Step 3: Copy API Credentials (1 minute)

Once project is ready:

1. **Click:** "Settings" icon (⚙️) in the left sidebar
2. **Click:** "API" in the settings menu
3. **You'll see a page with credentials. Copy these 3 values:**

### ✅ Copy These Values (you'll need them in a moment):

```
Project URL:
[https://xxxxxxxxxxxxx.supabase.co]

anon public:
[eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...]

service_role (secret):
[eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...]
```

**⚠️ IMPORTANT:** Keep the `service_role` key SECRET! Never commit to Git or share publicly.

---

## Step 4: Set Up Database Schema (2 minutes)

1. **Click:** "SQL Editor" icon (</>) in the left sidebar
2. **Click:** "New query" button
3. **Copy and paste this entire SQL script:**

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  discord_id TEXT UNIQUE,
  twitter_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discord badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  discord_guild_id TEXT,
  discord_role_id TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, badge_type)
);

-- Saved wallets (linked to user)
CREATE TABLE public.saved_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT DEFAULT 'Unnamed Wallet',
  blockchain TEXT NOT NULL CHECK (blockchain IN ('solana', 'bsc')),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, address, blockchain)
);

-- Indexes
CREATE INDEX idx_saved_wallets_user_id ON public.saved_wallets(user_id);
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for badges
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallets" ON public.saved_wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallets" ON public.saved_wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallets" ON public.saved_wallets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own wallets" ON public.saved_wallets
  FOR DELETE USING (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, discord_id, twitter_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_name', NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.raw_user_meta_data->>'provider' = 'discord'
      THEN NEW.raw_user_meta_data->>'provider_id'
      ELSE NULL
    END,
    CASE WHEN NEW.raw_user_meta_data->>'provider' = 'twitter'
      THEN NEW.raw_user_meta_data->>'provider_id'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. **Click:** "Run" button (▶️ icon) or press `Ctrl+Enter`
5. **You should see:** "Success. No rows returned" message
6. **Verify:** Click "Table Editor" in sidebar → you should see `profiles`, `user_badges`, `saved_wallets` tables

---

## Step 5: Configure Twitter OAuth2 (Optional - can skip for now)

**Note:** You need a Twitter Developer account. If you don't have one, skip to Discord setup.

1. **In Supabase Dashboard:**
   - Click "Authentication" in left sidebar
   - Click "Providers" tab
   - Scroll to "Twitter" section
   - Toggle "Enable Sign in with Twitter"

2. **Get Twitter Credentials:**
   - Go to https://developer.twitter.com/en/portal/dashboard
   - Click your app (or create new app)
   - Go to "Keys and tokens" tab
   - Copy "API Key" and "API Secret Key"

3. **Back in Supabase:**
   - Paste "API Key" into "Twitter Client ID" field
   - Paste "API Secret Key" into "Twitter Client Secret" field
   - Click "Save"

4. **Copy Callback URL:**
   - Supabase shows: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copy this URL

5. **Add Callback to Twitter:**
   - Back in Twitter Developer Portal
   - Go to app settings → "Authentication settings"
   - Add callback URL you copied
   - Save changes

---

## Step 6: Configure Discord OAuth2 (Recommended)

1. **In Supabase Dashboard:**
   - Click "Authentication" in left sidebar
   - Click "Providers" tab
   - Scroll to "Discord" section
   - Toggle "Enable Sign in with Discord"

2. **Get Discord Credentials:**
   - Go to https://discord.com/developers/applications
   - Click "New Application" button
   - Name: `d3f4ult Dashboard`
   - Check "I agree to Terms of Service"
   - Click "Create"

3. **Copy Discord Credentials:**
   - In Discord app page, click "OAuth2" in left sidebar
   - Click "General" under OAuth2
   - Copy "CLIENT ID"
   - Copy "CLIENT SECRET" (click "Reset Secret" if needed)

4. **Back in Supabase:**
   - Paste "CLIENT ID" into "Discord Client ID" field
   - Paste "CLIENT SECRET" into "Discord Client Secret" field
   - **Additional Scopes:** Add `guilds guilds.members.read`
   - Click "Save"

5. **Copy Callback URL:**
   - Supabase shows: `https://xxxxx.supabase.co/auth/v1/callback`
   - Copy this URL

6. **Add Callback to Discord:**
   - Back in Discord Developer Portal
   - Click "OAuth2" → "General"
   - Under "Redirects", click "Add Redirect"
   - Paste the Supabase callback URL
   - Click "Save Changes"

---

## Step 7: Discord Bot Setup (For Role Verification)

This allows checking if users have the special Discord role.

1. **In Discord Application (same app from Step 6):**
   - Click "Bot" in left sidebar
   - Click "Add Bot" button
   - Click "Reset Token" and copy the token (starts with `MTQz...`)
   - **Save this token** - you'll add it to `.env` file

2. **Enable Privileged Gateway Intents:**
   - Scroll down to "Privileged Gateway Intents"
   - Enable "SERVER MEMBERS INTENT"
   - Click "Save Changes"

3. **Invite Bot to Your Discord Server:**
   - Click "OAuth2" → "URL Generator"
   - Select scopes: `bot`
   - Select bot permissions: `Read Messages/View Channels`
   - Copy the generated URL at bottom
   - Paste URL in browser and add bot to your server (935376916377137232)

---

## Step 8: Summary - Copy All Your Credentials

You now have everything! Copy these values and send them to me:

```
✅ Supabase Project URL:
[Your URL here]

✅ Supabase Anon Key:
[Your anon key here]

✅ Supabase Service Role Key:
[Your service role key here - KEEP SECRET]

✅ Discord Client ID:
[Your Discord client ID]

✅ Discord Client Secret:
[Your Discord client secret]

✅ Discord Bot Token:
[Your Discord bot token]

🔹 Discord Guild ID: 935376916377137232 (already known)
🔹 Discord VIP Role ID: 1435799986423205951 (already known)

❌ Twitter OAuth (Optional - can add later):
[Skip for now if you don't have Twitter developer account]
```

---

## Troubleshooting

### "Failed to create project"
- Check if you're on Free tier (max 2 projects)
- Try different region
- Wait a few minutes and retry

### "SQL Error" when running schema
- Make sure you copied the ENTIRE SQL script
- Check if tables already exist (go to Table Editor)
- Try running each CREATE TABLE separately

### Discord OAuth not working
- Verify callback URL matches exactly (including https://)
- Check Discord app has correct scopes
- Make sure bot is in your Discord server

---

**Once you have all credentials, paste them in chat and I'll implement the authentication system!**
