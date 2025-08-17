// Script debug cho localhost
// Chạy trong browser console để debug các vấn đề

console.log('🔧 Debug Script for Localhost');

// 1. Clear all cache and storage
function clearAllCache() {
    console.log('🧹 Clearing all cache and storage...');
    
    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
    
    // Clear IndexedDB
    if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
            databases.forEach(db => {
                if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`✅ IndexedDB ${db.name} cleared`);
                }
            });
        });
    }
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
                console.log('✅ Service worker unregistered');
            });
        });
    }
    
    console.log('🎉 All cache cleared! Reload page to see effect.');
}

// 2. Check Supabase connection
async function checkSupabaseConnection() {
    console.log('🔍 Checking Supabase connection...');
    
    try {
        const supabaseUrl = 'https://tvpyhzatqmfhluhvvnoj.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cHloemF0cW1maGx1aHZ2bm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2NDksImV4cCI6MjA3MDkyMDY0OX0.vknJ9SUt4OVyG76PCn80oKI1lE-fjcLxOIQQBqNB2Xs';
        
        const response = await fetch(`${supabaseUrl}/rest/v1/users?select=*&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Supabase connection OK');
            const data = await response.json();
            console.log(`📊 Found ${data.length} users`);
        } else {
            console.log('❌ Supabase connection failed:', response.status);
        }
    } catch (error) {
        console.log('❌ Supabase connection error:', error);
    }
}

// 3. Check current auth state
function checkAuthState() {
    console.log('👤 Checking auth state...');
    
    // Check if Supabase client exists
    if (typeof window.supabase !== 'undefined') {
        window.supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                console.log('❌ Auth error:', error);
            } else if (session) {
                console.log('✅ User logged in:', session.user.email);
                console.log('📋 Session:', session);
            } else {
                console.log('ℹ️ No active session');
            }
        });
    } else {
        console.log('❌ Supabase client not found');
    }
}

// 4. Force reload with cache bypass
function forceReload() {
    console.log('🔄 Force reloading with cache bypass...');
    window.location.reload(true);
}

// 5. Check network connectivity
async function checkNetwork() {
    console.log('🌐 Checking network connectivity...');
    
    try {
        const response = await fetch('https://www.google.com/favicon.ico', {
            mode: 'no-cors',
            cache: 'no-cache'
        });
        console.log('✅ Network connection OK');
    } catch (error) {
        console.log('❌ Network connection failed:', error);
    }
}

// 6. Debug React state
function debugReactState() {
    console.log('⚛️ Debugging React state...');
    
    // Check if React DevTools is available
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools available');
    } else {
        console.log('❌ React DevTools not found');
    }
    
    // Check for common React errors
    const reactErrors = [];
    
    // Check for memory leaks
    if (window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        console.log('💾 Memory usage:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
        });
    }
}

// 7. Run all checks
async function runAllChecks() {
    console.log('🚀 Running all debug checks...');
    console.log('=====================================');
    
    await checkNetwork();
    console.log('-------------------------------------');
    
    await checkSupabaseConnection();
    console.log('-------------------------------------');
    
    checkAuthState();
    console.log('-------------------------------------');
    
    debugReactState();
    console.log('-------------------------------------');
    
    console.log('🎯 Debug complete! Available commands:');
    console.log('- clearAllCache() - Clear all cache and storage');
    console.log('- forceReload() - Force reload with cache bypass');
    console.log('- checkSupabaseConnection() - Test Supabase API');
    console.log('- checkAuthState() - Check current auth state');
}

// Auto-run checks
runAllChecks();

// Make functions available globally
window.debugLocalhost = {
    clearAllCache,
    checkSupabaseConnection,
    checkAuthState,
    forceReload,
    checkNetwork,
    debugReactState,
    runAllChecks
};

console.log('💡 Use window.debugLocalhost.functionName() to run specific checks');
