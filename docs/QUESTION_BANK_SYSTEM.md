# Hệ thống Ngân hàng Câu hỏi Online

## Tổng quan

Hệ thống ngân hàng câu hỏi mới thay thế việc lưu trữ câu hỏi trong file JSON bằng database Supabase, mang lại nhiều tính năng nâng cao và khả năng quản lý tốt hơn.

## Kiến trúc Database

### Cấu trúc phân cấp:
```
Subjects (Môn học)
├── Chapters (Chương)
    ├── Lessons (Bài học)
        ├── Question Types (Dạng câu hỏi)
            ├── Questions (Câu hỏi)
```

### Các bảng chính:

1. **subjects** - Môn học (Toán 10, 11, 12)
2. **chapters** - Chương học
3. **lessons** - Bài học
4. **question_types** - Dạng câu hỏi
5. **questions** - Câu hỏi chính
6. **question_usage_stats** - Thống kê sử dụng
7. **question_collections** - Bộ sưu tập câu hỏi

## Tính năng chính

### 1. Quản lý câu hỏi phân cấp
- Tổ chức câu hỏi theo cấu trúc môn học > chương > bài > dạng
- Dễ dàng tìm kiếm và phân loại
- Hỗ trợ tags để gắn nhãn

### 2. Quản lý câu hỏi tự động
- Tất cả câu hỏi được tạo/import đều sử dụng được ngay
- Không cần quy trình duyệt, tăng tốc độ làm việc
- Theo dõi người tạo và thời gian tạo

### 3. Câu hỏi động (Dynamic Questions)
- Hỗ trợ biến số ngẫu nhiên: `!a!`, `!b:1:10!`, `!c(2,4,6)!`
- Tính toán biểu thức: `{tinh: 2*!a! + !b!}`
- Điều kiện logic: `iff(!a! > 5, "lớn", "nhỏ")`

### 4. Hỗ trợ LaTeX
- Render công thức toán học với MathJax
- Hỗ trợ trong câu hỏi, đáp án và lời giải

### 5. Thống kê và phân tích
- Theo dõi số lần sử dụng câu hỏi
- Tỷ lệ trả lời đúng/sai
- Đánh giá độ khó thực tế

## Cách sử dụng

### Cho Admin:

1. **Chạy Migration:**
   ```typescript
   // Trong browser console
   await migrateQuestions();
   ```

2. **Quản lý câu hỏi:**
   - Truy cập Admin Panel > Ngân hàng câu hỏi
   - Sử dụng giao diện quản lý để tạo/duyệt câu hỏi

### Cho Giáo viên:

1. **Tạo câu hỏi:**
   - Chọn môn học > chương > bài > dạng
   - Nhập nội dung câu hỏi với LaTeX
   - Câu hỏi sẽ chờ admin duyệt

2. **Sử dụng trong Quiz:**
   - Chọn nguồn "Database" thay vì "JSON"
   - Duyệt và chọn câu hỏi theo cấu trúc phân cấp

## API Service

### QuestionBankService

```typescript
// Lấy cấu trúc phân cấp
const hierarchy = await QuestionBankService.getQuestionHierarchy();

// Tìm kiếm câu hỏi
const questions = await QuestionBankService.searchQuestions("đạo hàm", {
  difficulty: 'medium',
  type: 'mcq'
});

// Tạo câu hỏi mới
const newQuestion = await QuestionBankService.createQuestion({
  question_type_id: "uuid",
  type: 'mcq',
  question_text: "Tìm đạo hàm của $f(x) = x^2$",
  option_a: "$f'(x) = 2x$",
  option_b: "$f'(x) = x$",
  option_c: "$f'(x) = 2$",
  option_d: "$f'(x) = x^2$",
  correct_option: "A",
  explanation: "Áp dụng quy tắc $(x^n)' = nx^{n-1}$"
});
```

### Hook useQuestionBank

```typescript
const {
  subjects,
  chapters,
  lessons,
  questionTypes,
  questions,
  selectedSubject,
  setSelectedSubject,
  getQuestionsForQuiz,
  searchQuestions
} = useQuestionBank();
```

## Components

### QuestionBankBrowser
- Giao diện duyệt và chọn câu hỏi
- Hỗ trợ tìm kiếm và lọc
- Tích hợp với QuizBankPage

### QuestionBankAdmin
- Giao diện quản lý cho admin
- Tạo, duyệt, xóa câu hỏi
- Quản lý cấu trúc phân cấp

### QuestionSourceSelector
- Cho phép chọn nguồn câu hỏi (Database/JSON)
- Tích hợp với hệ thống hiện tại

## Migration từ JSON

### Bước 1: Chạy Migration Script
```bash
# Trong browser console hoặc admin panel
await migrateQuestions();
```

### Bước 2: Import câu hỏi từ JSON
```typescript
// Nếu có file JSON câu hỏi
const questions = loadQuestionsFromJSON();
await QuestionBankService.batchImportQuestions(
  questions, 
  questionTypeId, 
  'medium'
);
```

### Bước 3: Cập nhật UI
- Thay thế component cũ bằng QuestionSourceSelector
- Cấu hình để ưu tiên Database

## Bảo mật

### Row Level Security (RLS)
- Chỉ câu hỏi đã duyệt mới hiển thị cho học sinh
- Giáo viên chỉ chỉnh sửa câu hỏi của mình
- Admin có quyền duyệt tất cả câu hỏi

### Phân quyền
```sql
-- Học sinh chỉ xem câu hỏi đã duyệt
CREATE POLICY "Students can read approved questions" 
ON questions FOR SELECT 
USING (approval_status = 'approved' AND is_active = true);

-- Giáo viên tạo và chỉnh sửa câu hỏi của mình
CREATE POLICY "Teachers can manage their questions" 
ON questions FOR ALL 
USING (created_by = auth.uid() AND role = 'teacher');
```

## Performance

### Indexing
- Index trên các trường tìm kiếm thường xuyên
- GIN index cho tags array
- Composite index cho queries phức tạp

### Caching
- Cache hierarchy structure
- Cache frequently used questions
- Lazy loading cho danh sách dài

## Troubleshooting

### Lỗi thường gặp:

1. **Migration thất bại:**
   - Kiểm tra kết nối Supabase
   - Đảm bảo user có quyền admin
   - Xem log console để debug

2. **Không load được câu hỏi:**
   - Kiểm tra RLS policies
   - Verify approval_status
   - Check network requests

3. **LaTeX không render:**
   - Đảm bảo MathJax được load
   - Kiểm tra syntax LaTeX
   - Xem MathContent component

### Debug Commands:
```javascript
// Trong browser console
console.log(await QuestionBankService.getSubjects());
console.log(await supabase.from('questions').select('count'));
```

## Roadmap

### Phase 1 (Hiện tại)
- ✅ Database structure
- ✅ Basic CRUD operations
- ✅ Admin interface
- ✅ Migration tools

### Phase 2 (Tiếp theo)
- 🔄 Advanced search with filters
- 🔄 Question analytics dashboard
- 🔄 Bulk import/export tools
- 🔄 Question versioning

### Phase 3 (Tương lai)
- 📋 AI-powered question generation
- 📋 Collaborative editing
- 📋 Question difficulty auto-adjustment
- 📋 Integration with learning analytics

## Liên hệ

Nếu có vấn đề hoặc đề xuất, vui lòng tạo issue hoặc liên hệ team phát triển.