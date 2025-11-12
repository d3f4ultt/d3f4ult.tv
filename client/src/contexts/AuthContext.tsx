import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from backend
  const fetchProfile = async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth/session', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);

        // Sync Discord roles if user has Discord linked
        if (data.discord_id) {
          syncDiscordRoles(accessToken);
        }
      }
    } catch (error) {
      console.error('[Auth] Error fetching profile:', error);
    }
  };

  // Sync Discord roles with backend
  const syncDiscordRoles = async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth/discord-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => prev ? { ...prev, ...data.profile } : null);
      }
    } catch (error) {
      console.error('[Auth] Error syncing Discord roles:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        fetchProfile(session.access_token);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.access_token) {
        await fetchProfile(session.access_token);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with Discord
  const signInWithDiscord = async () => {
    try {
      const redirectUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5173/'
        : 'https://d3f4ult.tv/';

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify guilds'
        }
      });

      if (error) {
        console.error('[Auth] Discord login error:', error);
        throw error;
      }
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
      }

      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('[Auth] Sign out failed:', error);
      throw error;
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (session?.access_token) {
      await fetchProfile(session.access_token);
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    signInWithDiscord,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
