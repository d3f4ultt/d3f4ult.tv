import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase admin client (uses service role key - bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// User profile type matching Supabase schema
export interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  twitter_id: string | null;
  twitter_username: string | null;
  twitter_avatar: string | null;
  discord_roles: Array<{ guild_id: string; role_id: string }>;
  has_special_badge: boolean;
  created_at: string;
  updated_at: string;
}

// Saved wallet type
export interface SavedWallet {
  id: string;
  user_id: string;
  address: string;
  blockchain: 'solana' | 'bsc';
  label: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// User settings type
export interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  theme: string;
  connected_accounts: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile by Supabase user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user profile with Discord data
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error updating user profile:', error);
    return null;
  }

  return data;
}

/**
 * Get user's saved wallets
 */
export async function getUserWallets(userId: string): Promise<SavedWallet[]> {
  const { data, error } = await supabaseAdmin
    .from('saved_wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching user wallets:', error);
    return [];
  }

  return data || [];
}

/**
 * Add a new wallet for user
 */
export async function addUserWallet(
  userId: string,
  address: string,
  blockchain: 'solana' | 'bsc',
  label: string | null = null
): Promise<SavedWallet | null> {
  const { data, error } = await supabaseAdmin
    .from('saved_wallets')
    .insert({
      user_id: userId,
      address,
      blockchain,
      label,
      is_verified: false
    })
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Error adding wallet:', error);
    return null;
  }

  return data;
}

/**
 * Delete a wallet
 */
export async function deleteUserWallet(walletId: string, userId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('saved_wallets')
    .delete()
    .eq('id', walletId)
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase] Error deleting wallet:', error);
    return false;
  }

  return true;
}

/**
 * Verify user session from Authorization header
 */
export async function verifyUserSession(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    console.error('[Supabase] Invalid auth token:', error);
    return null;
  }

  return data.user.id;
}
