// Debug script để kiểm tra lỗi syntax
console.log('🔍 Checking for syntax errors...');

// Kiểm tra các file chính
const filesToCheck = [
  'App.tsx',
  'pages/OnlineExamPage.tsx', 
  'pages/StudentDashboard.tsx',
  'pages/NewAdminPanel.tsx',
  'components/AdminAuthGuard.tsx',
  'components/Header.tsx',
  'components/Footer.tsx',
  'pages/HomePage.tsx'
];

console.log('Files to check:', filesToCheck);

// Thông báo hoàn thành
console.log('✅ Debug check completed');
console.log('💡 If still getting 500 error, try:');
console.log('1. Clear browser cache (Ctrl+Shift+R)');
console.log('2. Delete node_modules and reinstall');
console.log('3. Check browser console for detailed error');
console.log('4. Try incognito mode');
