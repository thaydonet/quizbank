/**
 * Cache Management Service
 * Handles browser cache issues, Supabase cache conflicts, and session management
 */

export class CacheManager {
  private static readonly CACHE_KEYS = {
    SUPABASE_AUTH: 'sb-auth-token',
    SUPABASE_SESSION: 'supabase.auth.token',
    TEMP_PREFIX: 'temp_',
    APP_STATE: 'app_state',
  };

  /**
   * Clear all Supabase-related cache
   */
  static clearSupabaseCache(): void {
    try {
      console.log('Clearing Supabase cache...');
      
      // Clear sessionStorage
      const sessionKeys = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('sb-') ||
          key.includes('auth') ||
          key.includes('session')
        )) {
          sessionKeys.push(key);
        }
      }
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`Removed sessionStorage: ${key}`);
      });

      // Clear localStorage
      const localKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') ||
          key.includes('sb-') ||
          key.startsWith('auth')
        )) {
          localKeys.push(key);
        }
      }
      
      localKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed localStorage: ${key}`);
      });

      console.log('Supabase cache cleared successfully');
    } catch (error) {
      console.error('Error clearing Supabase cache:', error);
    }
  }

  /**
   * Clear browser navigation cache
   */
  static clearNavigationCache(): void {
    try {
      // Clear URL hash if it contains auth tokens
      if (window.location.hash && (
        window.location.hash.includes('access_token') ||
        window.location.hash.includes('refresh_token') ||
        window.location.hash.includes('error')
      )) {
        console.log('Clearing auth hash from URL');
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Clear any cached navigation state
      if ('navigation' in window && 'clearAppBadge' in window.navigator) {
        // Clear PWA badge if exists
        (window.navigator as any).clearAppBadge?.();
      }

      console.log('Navigation cache cleared');
    } catch (error) {
      console.error('Error clearing navigation cache:', error);
    }
  }

  /**
   * Clear temporary cache entries
   */
  static clearTemporaryCache(): void {
    try {
      const tempKeys = [];
      
      // Clear temporary sessionStorage entries
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (
          key.startsWith(this.CACHE_KEYS.TEMP_PREFIX) ||
          key.includes('temp_') ||
          key.includes('loading_') ||
          key.includes('state_')
        )) {
          tempKeys.push({ storage: 'session', key });
        }
      }

      // Clear temporary localStorage entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_KEYS.TEMP_PREFIX)) {
          // Check if it's expired (older than 1 hour)
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const data = JSON.parse(value);
              if (data.timestamp && Date.now() - data.timestamp > 3600000) {
                tempKeys.push({ storage: 'local', key });
              }
            }
          } catch {
            // If can't parse, remove it
            tempKeys.push({ storage: 'local', key });
          }
        }
      }

      tempKeys.forEach(({ storage, key }) => {
        if (storage === 'session') {
          sessionStorage.removeItem(key);
        } else {
          localStorage.removeItem(key);
        }
        console.log(`Removed temp ${storage}Storage: ${key}`);
      });

      console.log(`Cleared ${tempKeys.length} temporary cache entries`);
    } catch (error) {
      console.error('Error clearing temporary cache:', error);
    }
  }

  /**
   * Force refresh application state
   */
  static forceRefresh(): void {
    try {
      console.log('Force refreshing application...');
      
      // Clear all caches
      this.clearSupabaseCache();
      this.clearNavigationCache();
      this.clearTemporaryCache();
      
      // Set refresh flag
      sessionStorage.setItem('force_refresh', 'true');
      
      // Reload the page
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error forcing refresh:', error);
      // Fallback to simple reload
      window.location.reload();
    }
  }

  /**
   * Check if cache needs clearing
   */
  static needsCacheClear(): boolean {
    try {
      // Check for stuck auth states
      const hasStuckAuth = sessionStorage.getItem('auth_stuck') === 'true';
      
      // Check for multiple auth tokens
      let authTokenCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('auth') || key.includes('token'))) {
          authTokenCount++;
        }
      }
      
      // Check for expired sessions
      const lastActivity = localStorage.getItem('last_activity');
      const isExpired = lastActivity && Date.now() - parseInt(lastActivity) > 86400000; // 24 hours
      
      return hasStuckAuth || authTokenCount > 3 || !!isExpired;
    } catch (error) {
      console.error('Error checking cache status:', error);
      return false;
    }
  }

  /**
   * Set up automatic cache cleanup
   */
  static setupAutoCleanup(): () => void {
    const cleanupInterval = setInterval(() => {
      this.clearTemporaryCache();
      
      // Update last activity
      localStorage.setItem('last_activity', Date.now().toString());
      
      // Check if cache needs clearing
      if (this.needsCacheClear()) {
        console.warn('Cache issues detected, performing cleanup...');
        this.clearSupabaseCache();
        this.clearNavigationCache();
      }
    }, 300000); // 5 minutes

    // Return cleanup function
    return () => {
      clearInterval(cleanupInterval);
    };
  }

  /**
   * Emergency cache clear (for user-triggered actions)
   */
  static emergencyClear(): void {
    try {
      console.log('Performing emergency cache clear...');
      
      // Clear everything
      sessionStorage.clear();
      
      // Keep only essential localStorage items
      const essentialKeys = ['saved_quizzes', 'user_preferences'];
      const essentialData: { [key: string]: string } = {};
      
      essentialKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          essentialData[key] = value;
        }
      });
      
      localStorage.clear();
      
      // Restore essential data
      Object.entries(essentialData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('Emergency cache clear completed');
      
      // Set flag and reload
      sessionStorage.setItem('emergency_cleared', 'true');
      setTimeout(() => {
        window.location.href = window.location.origin + window.location.pathname;
      }, 500);
    } catch (error) {
      console.error('Emergency cache clear failed:', error);
      // Ultimate fallback
      window.location.reload();
    }
  }
}

// Global access for emergency situations
if (typeof window !== 'undefined') {
  (window as any).clearCache = CacheManager.emergencyClear;
  (window as any).refreshApp = CacheManager.forceRefresh;
}