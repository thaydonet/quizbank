# 🛠️ Hướng dẫn hoàn chỉnh: Thêm dạng bài và câu hỏi

## 🎯 Tóm tắt

Tôi đã tạo một hệ thống admin hoàn chỉnh để bạn dễ dàng thêm dạng bài và câu hỏi:

### 📁 Files đã tạo:
- ✅ `services/adminService.ts` - Service xử lý CRUD operations
- ✅ `components/admin/QuickAddForm.tsx` - Form tạo nhanh cấu trúc
- ✅ `components/admin/QuestionForm.tsx` - Form thêm câu hỏi
- ✅ `pages/AdminPage.tsx` - Trang admin chính
- ✅ `ADMIN_GUIDE_ADD_CONTENT.md` - Hướng dẫn chi tiết

## 🚀 Cách sử dụng nhanh nhất

### Bước 1: Truy cập Admin Panel
```typescript
// Thêm route trong router:
import AdminPage from './pages/AdminPage';

// Route: /admin
<Route path="/admin" element={<AdminPage />} />
```

### Bước 2: Tạo dữ liệu mẫu (1 click)
1. Vào `/admin`
2. Click nút **"🚀 Tạo dữ liệu mẫu"**
3. Confirm → Tạo xong!

**Kết quả**: Có ngay cấu trúc hoàn chỉnh:
```
Toán học
  └── Đại số
      └── Phương trình bậc nhất
          └── Giải phương trình cơ bản
              ├── Câu 1: Giải phương trình: 2x + 3 = 7
              ├── Câu 2: Giải phương trình: 3x - 5 = 10
              └── Câu 3: Tìm nghiệm của phương trình: 4x + 8 = 0
```

### Bước 3: Kiểm tra kết quả
1. Click **"📚 Xem Quiz Bank"**
2. Trong menu trái sẽ thấy: **Toán → Đại số → Phương trình bậc nhất → Giải phương trình cơ bản**
3. Click vào → Thấy 3 câu hỏi mẫu

## 🛠️ Tạo thêm dạng bài mới

### Cách 1: Dùng Admin Panel (Dễ nhất)

1. **Vào tab "🚀 Tạo nhanh cấu trúc"**
2. **Điền form**:
   ```
   Môn học: Vật lý          | Mã: LY
   Chương: Cơ học           | Mã: CO-HOC  
   Bài học: Chuyển động     | Mã: BAI1
   Dạng bài: Tính vận tốc   | Mã: DANG1
   Độ khó: Dễ
   ```
3. **Click "🚀 Tạo cấu trúc"**
4. **Kết quả**: Path `LY-CO-HOC-BAI1-DANG1`

### Cách 2: Dùng SQL (Nhanh cho nhiều dạng)

```sql
-- Vào Supabase Dashboard → SQL Editor, chạy:

-- 1. Tạo môn học
INSERT INTO subjects (name, code, description, is_active) VALUES
('Vật lý', 'LY', 'Môn Vật lý phổ thông', true);

-- 2. Tạo chương  
INSERT INTO chapters (subject_id, name, code, order_index, description, is_active) VALUES
((SELECT id FROM subjects WHERE code = 'LY'), 'Cơ học', 'CO-HOC', 1, 'Chương về cơ học', true);

-- 3. Tạo bài học
INSERT INTO lessons (chapter_id, name, code, order_index, description, is_active) VALUES
((SELECT id FROM chapters WHERE code = 'CO-HOC'), 'Chuyển động', 'BAI1', 1, 'Bài về chuyển động', true);

-- 4. Tạo dạng bài
INSERT INTO question_types (lesson_id, name, code, order_index, description, difficulty_level, is_active) VALUES
((SELECT id FROM lessons WHERE code = 'BAI1'), 'Tính vận tốc', 'DANG1', 1, 'Dạng tính vận tốc', 'easy', true);
```

## ➕ Thêm câu hỏi vào dạng bài

### Cách 1: Dùng Admin Panel

1. **Vào tab "➕ Thêm câu hỏi"**
2. **Chọn dạng bài** từ dropdown
3. **Điền thông tin câu hỏi**:
   ```
   Loại: Trắc nghiệm (MCQ)
   Câu hỏi: Một vật chuyển động với vận tốc 10 m/s trong 5 giây. Quãng đường đi được là?
   A: 50m
   B: 40m  
   C: 60m
   D: 30m
   Đáp án đúng: A
   Giải thích: s = v × t = 10 × 5 = 50m
   ```
4. **Click "➕ Thêm câu hỏi"**

### Cách 2: Dùng SQL

```sql
INSERT INTO questions (
  question_type_id, type, question_text, option_a, option_b, option_c, option_d, 
  correct_option, explanation, difficulty_level, approval_status, is_active
) VALUES (
  (SELECT id FROM question_types WHERE code = 'DANG1'),
  'mcq',
  'Một vật chuyển động với vận tốc 10 m/s trong 5 giây. Quãng đường đi được là?',
  '50m', '40m', '60m', '30m',
  'A',
  's = v × t = 10 × 5 = 50m',
  'easy',
  'approved',
  true
);
```

## 📋 Template nhanh

### Template SQL cho 1 dạng bài hoàn chỉnh:

```sql
-- Thay đổi các giá trị:
-- SUBJECT_NAME, SUBJECT_CODE
-- CHAPTER_NAME, CHAPTER_CODE  
-- LESSON_NAME, LESSON_CODE
-- QUESTION_TYPE_NAME, QT_CODE

WITH 
subject_data AS (
  INSERT INTO subjects (name, code, description, is_active) 
  VALUES ('SUBJECT_NAME', 'SUBJECT_CODE', 'Mô tả môn học', true)
  ON CONFLICT (code) DO NOTHING
  RETURNING id
),
chapter_data AS (
  INSERT INTO chapters (subject_id, name, code, order_index, description, is_active)
  SELECT id, 'CHAPTER_NAME', 'CHAPTER_CODE', 1, 'Mô tả chương', true
  FROM subject_data
  RETURNING id
),
lesson_data AS (
  INSERT INTO lessons (chapter_id, name, code, order_index, description, is_active)
  SELECT id, 'LESSON_NAME', 'LESSON_CODE', 1, 'Mô tả bài học', true
  FROM chapter_data
  RETURNING id
),
question_type_data AS (
  INSERT INTO question_types (lesson_id, name, code, order_index, description, difficulty_level, is_active)
  SELECT id, 'QUESTION_TYPE_NAME', 'QT_CODE', 1, 'Mô tả dạng bài', 'easy', true
  FROM lesson_data
  RETURNING id
)
INSERT INTO questions (
  question_type_id, type, question_text, option_a, option_b, option_c, option_d, 
  correct_option, explanation, difficulty_level, approval_status, is_active
)
SELECT 
  id, 'mcq', 'Câu hỏi mẫu?', 'Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D',
  'A', 'Giải thích đáp án', 'easy', 'approved', true
FROM question_type_data;
```

## 🎯 Kết quả mong đợi

Sau khi thực hiện, bạn sẽ có:

### Trong Quiz Bank:
```
📚 Menu trái:
├── Toán học
│   └── Đại số  
│       └── Phương trình bậc nhất
│           └── Giải phương trình cơ bản (3 câu)
└── Vật lý
    └── Cơ học
        └── Chuyển động  
            └── Tính vận tốc (1 câu)
```

### Chức năng hoạt động:
- ✅ Click dạng bài → Hiển thị câu hỏi
- ✅ Chọn câu hỏi → Xuất đề thi
- ✅ Tạo quiz online
- ✅ WordPress shortcodes

## 🚀 Quick Start (5 phút)

1. **Add route**: `/admin` → `AdminPage`
2. **Vào `/admin`** 
3. **Click "🚀 Tạo dữ liệu mẫu"**
4. **Vào `/quiz-bank`** → Thấy dạng bài mới
5. **Click dạng bài** → Thấy 3 câu hỏi mẫu
6. **Chọn câu hỏi** → Xuất đề thi thành công!

## 🔧 Troubleshooting

### Nếu không thấy dạng bài trong menu:
1. Check Supabase Dashboard → Table Editor
2. Verify data trong các table: subjects, chapters, lessons, question_types
3. Refresh trang quiz-bank

### Nếu lỗi khi tạo:
1. Check console logs
2. Verify Supabase connection
3. Check user authentication

### Nếu cần thêm nhiều dạng bài:
1. Dùng SQL scripts (nhanh hơn)
2. Hoặc dùng Admin Panel từng cái một

Bạn có thể bắt đầu ngay bằng cách thêm route `/admin` và test thử! 🎉