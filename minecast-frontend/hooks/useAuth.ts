import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import type { User } from '@supabase/supabase-js';

interface Profile {
  username?: string;
  email?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    // Check initial auth state
    const checkUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        if (currentUser) {
          // Fetch profile from public.profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, email')
            .eq('id', currentUser.id)
            .single();
          
          setProfile(profileData || { email: currentUser.email || undefined });
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);

        if (currentUser) {
          try {
            // Fetch profile from public.profiles table
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, email')
              .eq('id', currentUser.id)
              .single();
            
            setProfile(profileData || { email: currentUser.email || undefined });
          } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile({ email: currentUser.email || undefined });
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    signOut,
  };
}

