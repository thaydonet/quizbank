# Debug: Vấn đề Quiz Bank - Click dạng toán không hiện câu hỏi

## 🐛 Vấn đề được báo cáo

1. **Click vào các dạng toán không hiện ra câu hỏi**
2. **Lỗi**: `onSelectQuestionType is not a function` trong DatabaseSidebar.tsx:134

## 🔍 Nguyên nhân đã tìm thấy

### 1. Prop Name Inconsistency
- **DatabaseSidebar** expect: `onSelectQuestionType`
- **Một số file** sử dụng: `onQuestionTypeSelect`
- **Kết quả**: Function không được truyền đúng → undefined → TypeError

### 2. Missing Props
- **DatabaseSidebar** expect: `activeQuestionTypePath`
- **Một số file** truyền: `activeQuestionTypeId`
- **Kết quả**: Props không match interface

## ✅ Giải pháp đã thực hiện

### 1. Sửa DatabaseSidebar.tsx
```typescript
// Hỗ trợ cả hai prop names để backward compatibility
interface DatabaseSidebarProps {
  onSelectQuestionType?: (questionTypeId: string, path: string) => void;
  onQuestionTypeSelect?: (questionTypeId: string, path: string) => void;
  activeQuestionTypePath?: string | null;
  activeQuestionTypeId?: string;
  onClose?: () => void;
}

const handleQuestionTypeClick = (questionType: QuestionType, subject: Subject, chapter: Chapter, lesson: Lesson) => {
  const path = `${subject.code}-${chapter.code}-${lesson.code}-${questionType.code}`;
  
  // Support both prop names
  if (onSelectQuestionType) {
    onSelectQuestionType(questionType.id, path);
  } else if (onQuestionTypeSelect) {
    onQuestionTypeSelect(questionType.id, path);
  }
  
  // Close sidebar on mobile
  if (onClose) {
    onClose();
  }
};
```

### 2. Tạo QuizBankPageDebug.tsx
- **Extensive logging** để track tất cả function calls
- **Debug UI** hiển thị state real-time
- **Error handling** tốt hơn
- **Force refresh** button để test

### 3. Sửa QuizBankPageFixed.tsx
```typescript
// Sử dụng đúng prop names
<DatabaseSidebar
  onSelectQuestionType={fetchDatabaseQuestions}  // ✅ Đúng
  activeQuestionTypePath={activeQuestionTypePath} // ✅ Đúng
  onClose={() => setSidebarOpen(false)}
/>
```

## 🧪 Cách test và debug

### Bước 1: Sử dụng QuizBankPageDebug
```typescript
// Trong router hoặc app, thay thế:
import QuizBankPageDebug from './pages/QuizBankPageDebug';

// Thay vì:
import QuizBankPage from './pages/QuizBankPage';
```

### Bước 2: Mở Developer Tools
1. **F12** → **Console** tab
2. **Network** tab để xem API calls
3. **React DevTools** (nếu có) để xem props

### Bước 3: Test flow
1. **Click vào dạng toán** trong sidebar
2. **Xem console logs**:
   ```
   🔄 fetchDatabaseQuestions called: {questionTypeId: "...", path: "..."}
   📡 Loading questions from database...
   ✅ Loaded questions: 5
   🔄 Restoring selections for type: ... []
   ```
3. **Kiểm tra Debug UI** màu vàng
4. **Xem có câu hỏi hiển thị không**

### Bước 4: Nếu vẫn lỗi
1. **Check Network tab** - có API call không?
2. **Check Console** - có error khác không?
3. **Click "🔄 Tải lại"** button
4. **Try different question types**

## 📊 Debug Information

### Console Logs sẽ hiển thị:
```
QuizBankPageDebug render: {
  activeQuestionTypeId: "...",
  activeQuestionTypePath: "...", 
  selectedQuestionIds: 0,
  databaseQuestions: 0,
  isLoading: false,
  error: null
}

🔄 fetchDatabaseQuestions called: {questionTypeId: "123", path: "TOAN-DAI-SO-BAI1"}
📡 Loading questions from database...
✅ Loaded questions: 5
🔄 Restoring selections for type: 123 []
📊 State changed - databaseQuestions: 5
```

### Debug UI sẽ hiển thị:
- **Question Type ID**: 123
- **Path**: TOAN-DAI-SO-BAI1  
- **Total Questions**: 5
- **Filtered Questions**: 5
- **Selected (Current)**: 0
- **Selected (Total)**: 0

## 🔧 Troubleshooting Steps

### Nếu không có console logs khi click:
```javascript
// Test trực tiếp trong console:
console.log('Testing DatabaseSidebar props:', {
  onSelectQuestionType: typeof window.onSelectQuestionType,
  onQuestionTypeSelect: typeof window.onQuestionTypeSelect
});
```

### Nếu có logs nhưng không load questions:
1. **Check QuestionBankService**:
   ```javascript
   // Test API trực tiếp:
   import { QuestionBankService } from './services/questionBankService';
   QuestionBankService.getQuestionsByType('123', { approvedOnly: true })
     .then(console.log)
     .catch(console.error);
   ```

2. **Check database connection**
3. **Check user permissions**

### Nếu load được questions nhưng không hiển thị:
1. **Check filteredQuestions** trong debug UI
2. **Check activeTab** state
3. **Check question format** conversion

## 🎯 Expected Behavior

### Khi click vào dạng toán:
1. ✅ Console log: `fetchDatabaseQuestions called`
2. ✅ Loading spinner hiển thị
3. ✅ API call trong Network tab
4. ✅ Console log: `Loaded questions: X`
5. ✅ Debug UI cập nhật numbers
6. ✅ Questions hiển thị trong list
7. ✅ Có thể click checkbox để chọn

### Khi click checkbox:
1. ✅ Console log: `Checkbox changed for question`
2. ✅ Console log: `Toggle question`
3. ✅ Debug UI cập nhật Selected count
4. ✅ Visual feedback (checkbox checked, badge "Đã chọn")

## 🚀 Khi đã fix xong

1. **Xác nhận tất cả hoạt động** với QuizBankPageDebug
2. **Remove debug logs** và debug UI
3. **Update QuizBankPage.tsx** với fixes
4. **Test trên production build**
5. **Update documentation**

## 📝 Files cần check/update

- ✅ `components/DatabaseSidebar.tsx` - Fixed prop compatibility
- ✅ `pages/QuizBankPageDebug.tsx` - Debug version
- ✅ `pages/QuizBankPageFixed.tsx` - Fixed version  
- ⏳ `pages/QuizBankPage.tsx` - Original (cần update)
- ⏳ `pages/QuizBankPageOptimized.tsx` - Cần update props
- ⏳ `pages/QuizBankPageEnhanced.tsx` - Cần update props

## 🔗 Related Issues

- Checkbox selection không hoạt động → Fixed in QuestionCardFixed.tsx
- State persistence khi switch question types → Implemented
- Mobile sidebar không đóng sau select → Fixed với onClose prop