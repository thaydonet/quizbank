import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: 'teacher' | 'student' | 'pending_teacher';
  full_name: string | null;
  school: string | null;
  is_verified: boolean;
  teacher_code?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { role: 'teacher' | 'student'; full_name: string; school?: string }) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isInitialized = false;

    // Check if supabase is available
    if (!supabase) {
      console.error('Supabase client not initialized');
      setLoading(false);
      return;
    }

    // Timeout để tránh loading vô hạn - giảm xuống 3 giây
    const loadingTimeout = setTimeout(() => {
      if (mounted && !isInitialized) {
        console.warn('Auth loading timeout, setting loading to false');
        setLoading(false);
      }
    }, 3000); // 3 seconds timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        isInitialized = true;
        clearTimeout(loadingTimeout);

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes - với debounce
    let authChangeTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || !isInitialized) return;

        // Debounce để tránh multiple calls
        clearTimeout(authChangeTimeout);
        authChangeTimeout = setTimeout(async () => {
          console.log('Auth state change:', event, session?.user?.email);

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }, 100); // 100ms debounce
      }
    );

    return () => {
      mounted = false;
      isInitialized = false;
      clearTimeout(loadingTimeout);
      clearTimeout(authChangeTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Add retry logic for profile fetching
      let retries = 3;
      let data = null;
      let error = null;

      while (retries > 0 && !data) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: { role: 'teacher' | 'student'; full_name: string; school?: string }
        const result = await supabase
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
        data = result.data;
        error = result.error;

        if (error && retries > 1) {
          console.warn(`Profile fetch attempt failed, retrying... (${retries - 1} attempts left)`, error);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          retries--;
        } else {
          break;
        }
      }

      if (error) {
        console.error('Error fetching user profile after retries:', error);
        // If it's a permission error, try to sign out and clear state
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission denied, clearing auth state');
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setSession(null);
        }
        setProfile(null);
      } else {
        setProfile(data);
      }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Clear local state first to prevent UI issues
      setUser(null);
      setProfile(null);
      setSession(null);

      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Navigate to home
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear state and reload even if signOut fails
      setUser(null);
      setProfile(null);
      setSession(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};