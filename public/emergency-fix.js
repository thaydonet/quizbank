// Emergency fix script - chạy khi app bị crash
// Paste vào browser console

(function emergencyFix() {
    console.log('🚨 EMERGENCY FIX SCRIPT');
    console.log('========================');
    
    try {
        // 1. Clear all storage
        console.log('1. Clearing localStorage...');
        localStorage.clear();
        
        console.log('2. Clearing sessionStorage...');
        sessionStorage.clear();
        
        // 2. Clear IndexedDB
        console.log('3. Clearing IndexedDB...');
        if ('indexedDB' in window) {
            indexedDB.databases().then(databases => {
                databases.forEach(db => {
                    if (db.name) {
                        indexedDB.deleteDatabase(db.name);
                        console.log(`   - Deleted ${db.name}`);
                    }
                });
            });
        }
        
        // 3. Clear service workers
        console.log('4. Clearing service workers...');
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                    console.log('   - Unregistered service worker');
                });
            });
        }
        
        // 4. Clear cookies
        console.log('5. Clearing cookies...');
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // 5. Force hard reload
        console.log('6. Force reloading...');
        setTimeout(() => {
            window.location.href = window.location.origin + '/#/';
        }, 1000);
        
        console.log('✅ Emergency fix completed!');
        
    } catch (error) {
        console.error('❌ Emergency fix failed:', error);
        console.log('🔄 Trying simple reload...');
        window.location.reload(true);
    }
})();

// Make it available globally
window.emergencyFix = function() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + '/#/';
};

console.log('💡 Quick fix: emergencyFix() or window.emergencyFix()');
