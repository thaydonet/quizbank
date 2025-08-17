// Script để debug authentication system
// Chạy trong browser console hoặc Node.js

const DEBUG_CONFIG = {
    supabaseUrl: 'https://tvpyhzatqmfhluhvvnoj.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2cHloemF0cW1maGx1aHZ2bm9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2NDksImV4cCI6MjA3MDkyMDY0OX0.vknJ9SUt4OVyG76PCn80oKI1lE-fjcLxOIQQBqNB2Xs'
};

// Test functions
async function debugAuth() {
    console.log('🔍 Bắt đầu debug authentication system...\n');
    
    // 1. Test connection
    console.log('1️⃣ Testing Supabase connection...');
    try {
        const response = await fetch(`${DEBUG_CONFIG.supabaseUrl}/rest/v1/teacher_verification_codes?select=*&limit=1`, {
            headers: {
                'apikey': DEBUG_CONFIG.supabaseKey,
                'Authorization': `Bearer ${DEBUG_CONFIG.supabaseKey}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Connection successful');
            console.log(`📊 Found ${data.length} verification codes`);
        } else {
            console.log('❌ Connection failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Connection error:', error.message);
    }
    
    // 2. Check verification codes
    console.log('\n2️⃣ Checking verification codes...');
    try {
        const response = await fetch(`${DEBUG_CONFIG.supabaseUrl}/rest/v1/teacher_verification_codes?select=*`, {
            headers: {
                'apikey': DEBUG_CONFIG.supabaseKey,
                'Authorization': `Bearer ${DEBUG_CONFIG.supabaseKey}`
            }
        });
        
        if (response.ok) {
            const codes = await response.json();
            console.log(`📋 Total verification codes: ${codes.length}`);
            
            codes.forEach(code => {
                const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
                const isUsedUp = code.current_uses >= code.max_uses;
                const status = !code.is_active ? 'INACTIVE' : 
                              isExpired ? 'EXPIRED' : 
                              isUsedUp ? 'USED_UP' : 'ACTIVE';
                
                console.log(`  📝 ${code.code} (${code.school}) - ${status}`);
                console.log(`     Uses: ${code.current_uses}/${code.max_uses}`);
                if (code.expires_at) {
                    console.log(`     Expires: ${new Date(code.expires_at).toLocaleString()}`);
                }
            });
        }
    } catch (error) {
        console.log('❌ Error checking codes:', error.message);
    }
    
    // 3. Check users table structure
    console.log('\n3️⃣ Checking users table...');
    try {
        const response = await fetch(`${DEBUG_CONFIG.supabaseUrl}/rest/v1/users?select=*&limit=5`, {
            headers: {
                'apikey': DEBUG_CONFIG.supabaseKey,
                'Authorization': `Bearer ${DEBUG_CONFIG.supabaseKey}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            console.log(`👥 Found ${users.length} users (showing first 5)`);
            
            users.forEach(user => {
                console.log(`  👤 ${user.email} - ${user.role} (verified: ${user.is_verified})`);
                if (user.school) console.log(`     School: ${user.school}`);
                if (user.teacher_code) console.log(`     Teacher code: ${user.teacher_code}`);
            });
        }
    } catch (error) {
        console.log('❌ Error checking users:', error.message);
    }
    
    // 4. Check RLS policies
    console.log('\n4️⃣ Testing RLS policies...');
    console.log('ℹ️  RLS policies can only be fully tested with authenticated user');
    
    // 5. Test quiz creation (without auth)
    console.log('\n5️⃣ Testing quiz table access...');
    try {
        const response = await fetch(`${DEBUG_CONFIG.supabaseUrl}/rest/v1/quizzes?select=*&limit=3`, {
            headers: {
                'apikey': DEBUG_CONFIG.supabaseKey,
                'Authorization': `Bearer ${DEBUG_CONFIG.supabaseKey}`
            }
        });
        
        if (response.ok) {
            const quizzes = await response.json();
            console.log(`📚 Found ${quizzes.length} quizzes (showing first 3)`);
            
            quizzes.forEach(quiz => {
                console.log(`  📖 "${quiz.title}" by ${quiz.created_by}`);
                console.log(`     Public: ${quiz.is_public}, Questions: ${quiz.questions?.length || 0}`);
            });
        }
    } catch (error) {
        console.log('❌ Error checking quizzes:', error.message);
    }
    
    console.log('\n🏁 Debug completed!');
    console.log('\n💡 Next steps:');
    console.log('1. Use the test-auth.html file to test full authentication flow');
    console.log('2. Check browser console for any JavaScript errors');
    console.log('3. Verify that verification codes exist and are active');
    console.log('4. Test teacher registration → verification → quiz creation flow');
}

// Common issues and solutions
const COMMON_ISSUES = {
    'No verification codes': 'Run the sample_verification_codes.sql script in Supabase',
    'RLS blocking access': 'Check that user is properly authenticated and has correct role',
    'TypeScript errors': 'Make sure Database types in supabase.ts match actual schema',
    'Quiz creation fails': 'Ensure user has role="teacher" AND is_verified=true',
    'Login fails': 'Check email/password and verify user exists in auth.users table'
};

console.log('🔧 Common issues and solutions:');
Object.entries(COMMON_ISSUES).forEach(([issue, solution]) => {
    console.log(`❓ ${issue}: ${solution}`);
});

console.log('\n🚀 Run debugAuth() to start debugging');

// Auto-run if in browser
if (typeof window !== 'undefined') {
    debugAuth();
}
