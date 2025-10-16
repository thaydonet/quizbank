# Quiz Services - Chuẩn hóa và Hướng dẫn sử dụng

## Tổng quan

Dự án đã được chuẩn hóa để sử dụng một dịch vụ quiz thống nhất thay vì nhiều dịch vụ riêng biệt. Điều này giúp:

- Giảm trùng lặp code
- Dễ bảo trì và mở rộng
- Sử dụng helper slug chung từ `utils/slug.ts`
- Hỗ trợ cả local storage và Supabase một cách linh hoạt

## Cấu trúc mới

### 1. QuizManagementService (Dịch vụ chính)
- **File**: `services/quizManagementService.ts`
- **Mục đích**: Dịch vụ chính để quản lý quiz, hỗ trợ cả local storage và Supabase
- **Tính năng**:
  - Tự động chọn giữa local storage và Supabase
  - Sử dụng helper slug chung từ `utils/slug.ts`
  - Hỗ trợ tạo, đọc, cập nhật, xóa quiz
  - Kiểm tra trùng lặp title và slug
  - Thống kê quiz

### 2. UnifiedQuizService (Wrapper)
- **File**: `services/unifiedQuizService.ts`
- **Mục đích**: Wrapper xung quanh QuizManagementService để tương thích ngược
- **Trạng thái**: Deprecated, khuyến khích sử dụng QuizManagementService trực tiếp

### 3. Migration Helper
- **File**: `services/quizServiceMigration.ts`
- **Mục đích**: Hỗ trợ chuyển đổi từ các dịch vụ cũ sang dịch vụ mới
- **Tính năng**: Cung cấp wrapper tương thích ngược cho QuizService và SupabaseQuizService cũ

### 4. Slug Utilities
- **File**: `utils/slug.ts`
- **Mục đích**: Helper chung để tạo slug URL-friendly
- **Tính năng**:
  - Hỗ trợ tiếng Việt
  - Tạo slug unique
  - Nhiều preset cấu hình
  - Validation slug

## Cách sử dụng

### Sử dụng QuizManagementService (Khuyến khích)

```typescript
import { QuizManagementService, type QuizCreationData, type QuizServiceOptions } from '../services/quizManagementService';

// Tạo quiz mới
const quizData: QuizCreationData = {
  title: 'Bài kiểm tra Toán học',
  max_attempts: 3,
  questions: [...],
  created_by: 'user123'
};

// Lưu vào Supabase
const result = await QuizManagementService.saveQuiz(quizData, { 
  useSupabase: true, 
  userId: 'user123' 
});

// Lưu vào local storage
const localResult = await QuizManagementService.saveQuiz(quizData, { 
  useSupabase: false 
});

// Lấy tất cả quiz
const allQuizzes = await QuizManagementService.getAllQuizzes({ 
  useSupabase: true 
});

// Lấy quiz theo ID
const quiz = await QuizManagementService.getQuizById('quiz-id', { 
  useSupabase: true 
});

// Lấy quiz theo slug
const quizBySlug = await QuizManagementService.getQuizBySlug('bai-kiem-tra-toan-hoc', { 
  useSupabase: true 
});

// Cập nhật quiz
const updateResult = await QuizManagementService.updateQuiz('quiz-id', {
  title: 'Bài kiểm tra Toán học - Cập nhật'
}, { useSupabase: true });

// Xóa quiz
const deleteResult = await QuizManagementService.deleteQuiz('quiz-id', { 
  useSupabase: true, 
  userId: 'user123' 
});
```

### Sử dụng Slug Utilities

```typescript
import { generateSlug, generateUniqueSlug, SlugPresets } from '../utils/slug';

// Tạo slug cơ bản
const slug = generateSlug('Bài kiểm tra Toán học');
// Result: 'bai-kiem-tra-toan-hoc'

// Tạo slug với preset
const urlSlug = generateSlug('Bài kiểm tra Toán học', SlugPresets.url);

// Tạo slug unique
const uniqueSlug = await generateUniqueSlug(
  'Bài kiểm tra Toán học',
  async (slug) => {
    // Kiểm tra slug đã tồn tại chưa
    const result = await QuizManagementService.getQuizBySlug(slug);
    return result.success;
  },
  SlugPresets.url
);
```

### Migration từ dịch vụ cũ

```typescript
// Thay vì sử dụng QuizService cũ
import { QuizService } from '../services/quizService'; // ❌ Cũ

// Sử dụng migration helper
import { QuizService } from '../services/quizServiceMigration'; // ✅ Tương thích ngược

// Hoặc tốt hơn, sử dụng trực tiếp
import { QuizManagementService } from '../services/quizManagementService'; // ✅ Khuyến khích
```

## Interface và Types

### QuizServiceOptions
```typescript
interface QuizServiceOptions {
  useSupabase?: boolean; // true = Supabase, false = local storage
  userId?: string;       // ID người dùng (bắt buộc cho Supabase)
}
```

### QuizCreationData
```typescript
interface QuizCreationData {
  title: string;
  max_attempts: number;
  questions: Question[];
  created_by: string;
}
```

### QuizMetadata (Supabase)
```typescript
interface QuizMetadata {
  id?: string;
  title: string;
  slug?: string;
  max_attempts: number;
  created_by: string;
  created_at?: string;
  questions?: Question[];
  question_count?: number;
  mcq_count?: number;
  msq_count?: number;
  sa_count?: number;
  is_active?: boolean;
  creator_name?: string;
}
```

### LocalQuiz (Local Storage)
```typescript
interface LocalQuiz {
  id: string;
  title: string;
  slug: string;
  questions: Question[];
  createdAt: string;
  questionCount: number;
  mcqCount: number;
  msqCount: number;
  saCount: number;
}
```

## Migration Plan

### Phase 1: ✅ Hoàn thành
- Tạo QuizManagementService thống nhất
- Tích hợp utils/slug.ts
- Tạo migration helper

### Phase 2: Đang thực hiện
- Cập nhật các component sử dụng dịch vụ cũ
- Test tương thích ngược

### Phase 3: Tương lai
- Loại bỏ các dịch vụ cũ
- Cleanup code không sử dụng

## Best Practices

1. **Sử dụng QuizManagementService trực tiếp** cho code mới
2. **Luôn kiểm tra result.success** trước khi sử dụng data
3. **Sử dụng TypeScript interfaces** để đảm bảo type safety
4. **Xử lý lỗi** một cách graceful
5. **Sử dụng slug utilities** thay vì tự tạo slug

## Troubleshooting

### Lỗi thường gặp

1. **"Cannot read property of undefined"**
   - Kiểm tra result.success trước khi truy cập result.data

2. **"Slug already exists"**
   - Sử dụng generateUniqueSlug thay vì generateSlug

3. **"User ID required for Supabase operations"**
   - Đảm bảo truyền userId trong options khi useSupabase: true

### Debug

```typescript
// Bật debug logging
const result = await QuizManagementService.saveQuiz(data, options);
if (!result.success) {
  console.error('Quiz save failed:', result.error);
}
```