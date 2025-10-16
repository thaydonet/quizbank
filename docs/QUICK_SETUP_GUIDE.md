# Hướng dẫn Setup nhanh - Ngân hàng Câu hỏi

## Tổng quan
Hướng dẫn này sẽ giúp bạn setup hệ thống ngân hàng câu hỏi từ đầu trong 5 phút.

## Bước 1: Chạy SQL Migration

### 1.1. Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** (biểu tượng 📝 ở sidebar)

### 1.2. Chạy Migration Script
1. Copy nội dung file `supabase/migration_question_bank.sql`
2. Paste vào SQL Editor
3. Click **Run** để thực thi

**Kết quả:** Tạo 8 bảng chính cho hệ thống câu hỏi.

## Bước 2: Tạo dữ liệu mẫu

### 2.1. Truy cập Admin Panel
1. Đăng nhập với tài khoản admin (`lvdoqt@gmail.com`)
2. Vào **Admin Panel** > **Ngân hàng câu hỏi**

### 2.2. Tạo cấu trúc môn học
1. Click nút **📚 Tạo dữ liệu mẫu**
2. Confirm để tạo dữ liệu
3. Chờ thông báo thành công

**Kết quả:** Tạo 3 môn học, 2 chương, 3 bài học, 3 dạng câu hỏi.

## Bước 3: Import câu hỏi

### 3.1. Mở Import Tool
1. Click **📝 Quản lý câu hỏi**
2. Chọn tab **📥 Import câu hỏi**
3. Click **📥 Mở Import Tool**

### 3.2. Chọn vị trí lưu
1. **Môn học:** Toán 12
2. **Chương:** Chương 1: Ứng dụng đạo hàm
3. **Bài học:** Bài 1: Sự đồng biến, nghịch biến
4. **Dạng câu hỏi:** Dạng 1: Xét tính đơn điệu

### 3.3. Import câu hỏi mẫu
1. Chọn tab **📋 Mẫu**
2. Click **Sử dụng mẫu Text** hoặc **Sử dụng mẫu JSON**
3. Click **Xem trước** để kiểm tra
4. Click **Import** để lưu

**Kết quả:** Import thành công 3-7 câu hỏi mẫu.

## Bước 4: Duyệt câu hỏi

### 4.1. Truy cập tab Duyệt
1. Trong **Quản lý câu hỏi**
2. Chọn tab **Duyệt câu hỏi**
3. Xem danh sách câu hỏi chờ duyệt

### 4.2. Approve câu hỏi
1. Đọc nội dung câu hỏi
2. Click **Duyệt** để approve
3. Hoặc **Từ chối** nếu không phù hợp

**Kết quả:** Câu hỏi được duyệt và có thể sử dụng trong quiz.

## Bước 5: Sử dụng trong Quiz

### 5.1. Truy cập Quiz Bank
1. Đăng nhập với tài khoản teacher
2. Vào **Ngân hàng Quiz Toán**

### 5.2. Chọn nguồn Database
1. Chọn **📚 Database (Supabase)** thay vì JSON
2. Duyệt cấu trúc phân cấp
3. Chọn câu hỏi từ database

### 5.3. Tạo Quiz
1. Chọn câu hỏi muốn sử dụng
2. Click **Thi Online** hoặc **In đề**
3. Tạo quiz với câu hỏi đã chọn

## Troubleshooting

### Lỗi thường gặp:

#### 1. "No subjects found"
```
❌ Nguyên nhân: Chưa chạy migration hoặc tạo dữ liệu mẫu
✅ Giải pháp: Chạy lại Bước 1 và 2
```

#### 2. "User not authenticated"
```
❌ Nguyên nhân: Chưa đăng nhập hoặc không có quyền admin
✅ Giải pháp: Đăng nhập với tài khoản admin
```

#### 3. "Permission denied"
```
❌ Nguyên nhân: RLS policies chưa được setup đúng
✅ Giải pháp: Click "🔧 Sửa RLS Policies" trong Admin Panel
```

#### 4. "Import failed"
```
❌ Nguyên nhân: Định dạng câu hỏi không đúng
✅ Giải pháp: Kiểm tra format theo mẫu, sử dụng template
```

### Debug Commands:
```javascript
// Trong browser console
console.log(await QuestionBankService.getSubjects());
console.log(await supabase.from('subjects').select('count'));
```

## Kiểm tra Setup thành công

### Checklist:
- [ ] Database có 8 bảng chính
- [ ] Có ít nhất 1 môn học trong `subjects`
- [ ] Có ít nhất 1 dạng câu hỏi trong `question_types`
- [ ] Import được câu hỏi mẫu
- [ ] Duyệt được câu hỏi
- [ ] Tạo được quiz từ database

### Test nhanh:
1. Vào **Admin Panel** > **Ngân hàng câu hỏi**
2. Click **📝 Quản lý câu hỏi**
3. Tab **Duyệt câu hỏi** - kiểm tra có dropdown đầy đủ
4. Chọn được môn học → chương → bài → dạng
5. Hiển thị được danh sách câu hỏi

## Mở rộng

### Thêm môn học mới:
1. Vào **Quản lý câu hỏi** > **Tạo câu hỏi**
2. Hoặc chỉnh sửa trực tiếp trong Supabase

### Import số lượng lớn:
1. Chuẩn bị file JSON theo format mẫu
2. Chia nhỏ thành batch 20-50 câu
3. Import từng batch một

### Backup dữ liệu:
1. Export từ Supabase Dashboard
2. Hoặc sử dụng API để backup

## Liên hệ hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console log (F12)
2. Thử với dữ liệu mẫu trước
3. Liên hệ admin để được hỗ trợ
4. Tạo issue trên GitHub

---

**Chúc mừng! 🎉** Bạn đã setup thành công hệ thống ngân hàng câu hỏi. Giờ có thể bắt đầu tạo và quản lý câu hỏi một cách chuyên nghiệp!