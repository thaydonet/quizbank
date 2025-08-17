# Hướng dẫn khắc phục sự cố đăng nhập giáo viên và tạo thi online

## 🔍 Phân tích vấn đề

Sau khi kiểm tra code, tôi phát hiện hệ thống authentication được thiết kế đúng nhưng có thể gặp một số vấn đề:

### 1. **Quy trình đăng nhập giáo viên**
```
Đăng ký → role: 'pending_teacher' → Nhập mã xác thực → role: 'teacher' + is_verified: true → Có thể tạo quiz
```

### 2. **Các vấn đề có thể gặp**
- ❌ Thiếu mã xác thực trong database
- ❌ Mã xác thực đã hết hạn hoặc hết lượt sử dụng
- ❌ User chưa được verify đúng cách
- ❌ RLS policies chặn quyền truy cập
- ❌ TypeScript types không khớp với database schema

## 🛠️ Các bước khắc phục

### Bước 1: Kiểm tra kết nối Supabase
1. Mở file `test-auth.html` trong browser
2. Click "Test Connection"
3. Kiểm tra xem có kết nối được với database không

### Bước 2: Setup dữ liệu test
1. Vào Supabase Dashboard → SQL Editor
2. Chạy script `setup-test-data.sql`
3. Kiểm tra xem có tạo được mã xác thực không

### Bước 3: Test quy trình đăng ký giáo viên
1. Trong `test-auth.html`:
   - Đăng ký với email: `teacher@test.com`
   - Password: `123456`
   - Họ tên: `Giáo viên Test`
   - Trường: `THPT Test`

2. Kiểm tra trạng thái user → phải có `role: 'pending_teacher'`

### Bước 4: Test xác thực giáo viên
1. Đăng nhập với tài khoản vừa tạo
2. Nhập mã xác thực: `DEMO2024`
3. Kiểm tra trạng thái user → phải có `role: 'teacher'` và `is_verified: true`

### Bước 5: Test tạo quiz
1. Sau khi xác thực thành công
2. Thử tạo quiz với tiêu đề: `Quiz Test`
3. Kiểm tra xem có tạo được không

## 🔧 Sửa lỗi đã thực hiện

### 1. Cập nhật Database Types
```typescript
// lib/supabase.ts - Đã thêm các field thiếu
role: 'teacher' | 'student' | 'pending_teacher'  // Thêm 'pending_teacher'
teacher_code: string | null                      // Thêm field
is_verified: boolean                             // Thêm field
// ... các field khác
```

### 2. Thêm Table Types
```typescript
// Đã thêm teacher_verification_codes table types
teacher_verification_codes: {
  Row: { /* ... */ }
  Insert: { /* ... */ }
  Update: { /* ... */ }
}
```

## 🚨 Các lỗi thường gặp và cách sửa

### Lỗi 1: "Mã xác thực không hợp lệ"
**Nguyên nhân:** Không có mã xác thực trong database hoặc mã đã hết hạn
**Giải pháp:** Chạy `setup-test-data.sql` để tạo mã test

### Lỗi 2: "Không thể tạo quiz"
**Nguyên nhân:** User chưa có `role='teacher'` hoặc `is_verified=false`
**Giải pháp:** Kiểm tra trạng thái user và thực hiện xác thực đúng cách

### Lỗi 3: "Permission denied"
**Nguyên nhân:** RLS policies chặn truy cập
**Giải pháp:** Kiểm tra user đã đăng nhập và có quyền phù hợp

### Lỗi 4: TypeScript compilation errors
**Nguyên nhân:** Types không khớp với database schema
**Giải pháp:** Đã cập nhật types trong `lib/supabase.ts`

## 📋 Checklist kiểm tra

- [ ] Supabase connection hoạt động
- [ ] Có mã xác thực hợp lệ trong database
- [ ] Đăng ký giáo viên thành công (role: pending_teacher)
- [ ] Đăng nhập thành công
- [ ] Xác thực giáo viên thành công (role: teacher, is_verified: true)
- [ ] Tạo quiz thành công
- [ ] Hiển thị quiz trong danh sách

## 🔍 Debug Tools

### 1. Browser Console
```javascript
// Kiểm tra user hiện tại
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Kiểm tra profile
const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
console.log('User profile:', profile);
```

### 2. Test Files
- `test-auth.html` - Test authentication flow
- `debug-auth.js` - Debug script
- `setup-test-data.sql` - Setup test data

### 3. Supabase Dashboard
- Auth → Users: Kiểm tra users đã đăng ký
- Table Editor → users: Kiểm tra user profiles
- Table Editor → teacher_verification_codes: Kiểm tra mã xác thực
- Table Editor → quizzes: Kiểm tra quiz đã tạo

## 📞 Hỗ trợ thêm

Nếu vẫn gặp vấn đề, hãy:
1. Chạy `test-auth.html` và ghi lại kết quả từng bước
2. Kiểm tra browser console có lỗi JavaScript không
3. Kiểm tra Supabase logs trong dashboard
4. Cung cấp thông tin chi tiết về lỗi gặp phải

## 🎯 Kết luận

Hệ thống authentication được thiết kế đúng, chỉ cần:
1. Đảm bảo có mã xác thực trong database
2. Thực hiện đúng quy trình: đăng ký → đăng nhập → xác thực → tạo quiz
3. Kiểm tra user có đúng role và verification status

Sau khi thực hiện các bước trên, tính năng đăng nhập giáo viên và tạo thi online sẽ hoạt động bình thường.
