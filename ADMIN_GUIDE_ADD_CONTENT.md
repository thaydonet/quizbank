# Hướng dẫn thêm dạng bài và câu hỏi trong Admin

## 📚 Cấu trúc dữ liệu

Hệ thống có cấu trúc phân cấp 4 tầng:
```
Môn học (Subject) 
  └── Chương (Chapter)
      └── Bài học (Lesson)
          └── Dạng bài (QuestionType)
              └── Câu hỏi (Questions)
```

**Ví dụ**:
```
Toán học
  └── Đại số
      └── Bài 1: Phương trình bậc nhất
          └── Dạng 1: Giải phương trình cơ bản
              └── Câu hỏi: Giải phương trình 2x + 3 = 7
```

## 🛠️ Cách 1: Thêm qua Supabase Dashboard (Dễ nhất)

### Bước 1: Truy cập Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **Table Editor**

### Bước 2: Thêm Môn học (subjects)
```sql
-- Vào table "subjects" và thêm record mới:
INSERT INTO subjects (name, code, description, is_active) VALUES
('Toán học', 'TOAN', 'Môn Toán học phổ thông', true),
('Vật lý', 'LY', 'Môn Vật lý phổ thông', true),
('Hóa học', 'HOA', 'Môn Hóa học phổ thông', true);
```

### Bước 3: Thêm Chương (chapters)
```sql
-- Lấy subject_id từ bước trước, ví dụ: 'uuid-of-toan-hoc'
INSERT INTO chapters (subject_id, name, code, order_index, description, is_active) VALUES
('uuid-of-toan-hoc', 'Đại số', 'DAI-SO', 1, 'Chương về đại số', true),
('uuid-of-toan-hoc', 'Hình học', 'HINH-HOC', 2, 'Chương về hình học', true),
('uuid-of-toan-hoc', 'Giải tích', 'GIAI-TICH', 3, 'Chương về giải tích', true);
```

### Bước 4: Thêm Bài học (lessons)
```sql
-- Lấy chapter_id từ bước trước
INSERT INTO lessons (chapter_id, name, code, order_index, description, is_active) VALUES
('uuid-of-dai-so', 'Phương trình bậc nhất', 'BAI1', 1, 'Bài về phương trình bậc nhất', true),
('uuid-of-dai-so', 'Phương trình bậc hai', 'BAI2', 2, 'Bài về phương trình bậc hai', true),
('uuid-of-dai-so', 'Hệ phương trình', 'BAI3', 3, 'Bài về hệ phương trình', true);
```

### Bước 5: Thêm Dạng bài (question_types)
```sql
-- Lấy lesson_id từ bước trước
INSERT INTO question_types (lesson_id, name, code, order_index, description, difficulty_level, is_active) VALUES
('uuid-of-bai1', 'Giải phương trình cơ bản', 'DANG1', 1, 'Dạng giải phương trình cơ bản', 'easy', true),
('uuid-of-bai1', 'Phương trình có tham số', 'DANG2', 2, 'Dạng phương trình có tham số', 'medium', true),
('uuid-of-bai1', 'Phương trình chứa dấu giá trị tuyệt đối', 'DANG3', 3, 'Dạng phương trình phức tạp', 'hard', true);
```

### Bước 6: Thêm Câu hỏi (questions)
```sql
-- Lấy question_type_id từ bước trước
INSERT INTO questions (
  question_type_id, 
  type, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  option_d, 
  correct_option, 
  explanation, 
  difficulty_level, 
  approval_status, 
  is_active
) VALUES
(
  'uuid-of-dang1',
  'mcq',
  'Giải phương trình: 2x + 3 = 7',
  'x = 1',
  'x = 2', 
  'x = 3',
  'x = 4',
  'B',
  'Ta có: 2x + 3 = 7 ⟹ 2x = 4 ⟹ x = 2',
  'easy',
  'approved',
  true
);
```

## 🔧 Cách 2: Tạo Admin Interface (Khuyến nghị)

Tôi sẽ tạo một admin interface để dễ quản lý hơn:

### Tạo Admin Service
```typescript
// services/adminService.ts
export class AdminService {
  // Thêm môn học
  static async createSubject(data: {
    name: string;
    code: string;
    description?: string;
  }) {
    const { data: result, error } = await supabase
      .from('subjects')
      .insert({
        ...data,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Thêm chương
  static async createChapter(data: {
    subject_id: string;
    name: string;
    code: string;
    order_index: number;
    description?: string;
  }) {
    const { data: result, error } = await supabase
      .from('chapters')
      .insert({
        ...data,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Thêm bài học
  static async createLesson(data: {
    chapter_id: string;
    name: string;
    code: string;
    order_index: number;
    description?: string;
  }) {
    const { data: result, error } = await supabase
      .from('lessons')
      .insert({
        ...data,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // Thêm dạng bài
  static async createQuestionType(data: {
    lesson_id: string;
    name: string;
    code: string;
    order_index: number;
    description?: string;
    difficulty_level: 'easy' | 'medium' | 'hard';
  }) {
    const { data: result, error } = await supabase
      .from('question_types')
      .insert({
        ...data,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }
}
```

### Tạo Admin Components
```typescript
// components/admin/SubjectManager.tsx
const SubjectManager: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubject = async (data: {
    name: string;
    code: string;
    description: string;
  }) => {
    try {
      const newSubject = await AdminService.createSubject(data);
      setSubjects(prev => [...prev, newSubject]);
      setShowAddForm(false);
      alert('Thêm môn học thành công!');
    } catch (error) {
      console.error('Error adding subject:', error);
      alert('Có lỗi xảy ra khi thêm môn học');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý Môn học</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Thêm môn học
        </button>
      </div>

      {/* Danh sách môn học */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(subject => (
          <div key={subject.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{subject.name}</h3>
            <p className="text-sm text-gray-600">Code: {subject.code}</p>
            <p className="text-sm text-gray-500">{subject.description}</p>
          </div>
        ))}
      </div>

      {/* Form thêm môn học */}
      {showAddForm && (
        <AddSubjectModal
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddSubject}
        />
      )}
    </div>
  );
};
```

## 📝 Cách 3: Sử dụng SQL Scripts (Nhanh nhất)

Tạo file SQL để import hàng loạt:

```sql
-- scripts/sample_data.sql

-- 1. Thêm môn học
INSERT INTO subjects (name, code, description, is_active) VALUES
('Toán học', 'TOAN', 'Môn Toán học phổ thông', true),
('Vật lý', 'LY', 'Môn Vật lý phổ thông', true),
('Hóa học', 'HOA', 'Môn Hóa học phổ thông', true);

-- 2. Thêm chương (sử dụng subject_id thực tế)
INSERT INTO chapters (subject_id, name, code, order_index, description, is_active) VALUES
-- Toán học
((SELECT id FROM subjects WHERE code = 'TOAN'), 'Đại số', 'DAI-SO', 1, 'Chương về đại số', true),
((SELECT id FROM subjects WHERE code = 'TOAN'), 'Hình học', 'HINH-HOC', 2, 'Chương về hình học', true),
((SELECT id FROM subjects WHERE code = 'TOAN'), 'Giải tích', 'GIAI-TICH', 3, 'Chương về giải tích', true);

-- 3. Thêm bài học
INSERT INTO lessons (chapter_id, name, code, order_index, description, is_active) VALUES
-- Đại số
((SELECT id FROM chapters WHERE code = 'DAI-SO'), 'Phương trình bậc nhất', 'BAI1', 1, 'Bài về phương trình bậc nhất', true),
((SELECT id FROM chapters WHERE code = 'DAI-SO'), 'Phương trình bậc hai', 'BAI2', 2, 'Bài về phương trình bậc hai', true),
((SELECT id FROM chapters WHERE code = 'DAI-SO'), 'Hệ phương trình', 'BAI3', 3, 'Bài về hệ phương trình', true);

-- 4. Thêm dạng bài
INSERT INTO question_types (lesson_id, name, code, order_index, description, difficulty_level, is_active) VALUES
-- Phương trình bậc nhất
((SELECT id FROM lessons WHERE code = 'BAI1'), 'Giải phương trình cơ bản', 'DANG1', 1, 'Dạng giải phương trình cơ bản', 'easy', true),
((SELECT id FROM lessons WHERE code = 'BAI1'), 'Phương trình có tham số', 'DANG2', 2, 'Dạng phương trình có tham số', 'medium', true),
((SELECT id FROM lessons WHERE code = 'BAI1'), 'Phương trình chứa dấu giá trị tuyệt đối', 'DANG3', 3, 'Dạng phương trình phức tạp', 'hard', true);

-- 5. Thêm câu hỏi mẫu
INSERT INTO questions (
  question_type_id, 
  type, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  option_d, 
  correct_option, 
  explanation, 
  difficulty_level, 
  approval_status, 
  is_active
) VALUES
-- Dạng 1: Giải phương trình cơ bản
(
  (SELECT id FROM question_types WHERE code = 'DANG1'),
  'mcq',
  'Giải phương trình: 2x + 3 = 7',
  'x = 1',
  'x = 2', 
  'x = 3',
  'x = 4',
  'B',
  'Ta có: 2x + 3 = 7 ⟹ 2x = 4 ⟹ x = 2',
  'easy',
  'approved',
  true
),
(
  (SELECT id FROM question_types WHERE code = 'DANG1'),
  'mcq',
  'Giải phương trình: 3x - 5 = 10',
  'x = 3',
  'x = 4', 
  'x = 5',
  'x = 6',
  'C',
  'Ta có: 3x - 5 = 10 ⟹ 3x = 15 ⟹ x = 5',
  'easy',
  'approved',
  true
),
(
  (SELECT id FROM question_types WHERE code = 'DANG1'),
  'sa',
  'Tìm nghiệm của phương trình: 4x + 8 = 0',
  '',
  '', 
  '',
  '',
  'x = -2',
  'Ta có: 4x + 8 = 0 ⟹ 4x = -8 ⟹ x = -2',
  'easy',
  'approved',
  true
);
```

## 🚀 Cách thực hiện nhanh

### Bước 1: Chạy SQL Script
1. Vào Supabase Dashboard → SQL Editor
2. Copy paste script trên
3. Click "Run" để tạo dữ liệu mẫu

### Bước 2: Kiểm tra kết quả
1. Vào Table Editor
2. Kiểm tra các table: subjects, chapters, lessons, question_types, questions
3. Verify dữ liệu đã được tạo

### Bước 3: Test trong ứng dụng
1. Refresh trang quiz-bank
2. Kiểm tra menu trái có hiển thị dạng bài mới
3. Click vào dạng bài → xem câu hỏi

## 📋 Template để thêm nhanh

### Template SQL cho một dạng bài hoàn chỉnh:
```sql
-- Thay đổi các giá trị này:
-- SUBJECT_NAME: 'Toán học'
-- CHAPTER_NAME: 'Đại số' 
-- LESSON_NAME: 'Phương trình bậc nhất'
-- QUESTION_TYPE_NAME: 'Giải phương trình cơ bản'

WITH 
subject_data AS (
  INSERT INTO subjects (name, code, description, is_active) 
  VALUES ('SUBJECT_NAME', 'SUBJECT_CODE', 'Mô tả môn học', true)
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
1. ✅ Menu trái hiển thị cấu trúc phân cấp
2. ✅ Click vào dạng bài → hiển thị câu hỏi
3. ✅ Có thể chọn và xuất câu hỏi
4. ✅ Dữ liệu được tổ chức khoa học

Bạn muốn tôi tạo thêm admin interface để quản lý dễ hơn không?