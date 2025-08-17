// Script để clear cache nhanh - chạy trong console
// Paste vào browser console và chạy

(function() {
    console.log('🧹 Clearing all cache and storage...');
    
    // 1. Clear localStorage
    try {
        localStorage.clear();
        console.log('✅ localStorage cleared');
    } catch (e) {
        console.log('❌ localStorage error:', e);
    }
    
    // 2. Clear sessionStorage
    try {
        sessionStorage.clear();
        console.log('✅ sessionStorage cleared');
    } catch (e) {
        console.log('❌ sessionStorage error:', e);
    }
    
    // 3. Clear IndexedDB
    if ('indexedDB' in window) {
        try {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    if (db.name) {
                        indexedDB.deleteDatabase(db.name);
                        console.log(`✅ IndexedDB ${db.name} cleared`);
                    }
                });
            });
        } catch (e) {
            console.log('❌ IndexedDB error:', e);
        }
    }
    
    // 4. Clear service worker cache
    if ('serviceWorker' in navigator) {
        try {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                    console.log('✅ Service worker unregistered');
                });
            });
        } catch (e) {
            console.log('❌ Service worker error:', e);
        }
    }
    
    // 5. Clear cookies (same domain only)
    try {
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        console.log('✅ Cookies cleared');
    } catch (e) {
        console.log('❌ Cookies error:', e);
    }
    
    // 6. Force reload
    console.log('🔄 Reloading page in 2 seconds...');
    setTimeout(() => {
        window.location.reload(true);
    }, 2000);
    
    console.log('🎉 Cache clearing completed!');
})();

// Thêm vào window để dễ gọi
window.clearAllCache = function() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload(true);
};

console.log('💡 Quick clear: window.clearAllCache()');
