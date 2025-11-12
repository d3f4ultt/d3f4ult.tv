import { createClient } from '@supabase/supabase-js';

// Supabase client for frontend (uses anon key - respects RLS)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ethjwdkwpevcfrdbifci.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aGp3ZGt3cGV2Y2ZyZGJpZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc0MTcsImV4cCI6MjA3ODQ5MzQxN30.YU5b6bi-3pk4T8cwZmZl5-DxwgkCHsxK9qPb5sVdRQc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true
  }
});

// User profile type (matching backend)
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
  discord_roles: Array<{ guild_id: string; role_id: string; role_name?: string }>;
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
