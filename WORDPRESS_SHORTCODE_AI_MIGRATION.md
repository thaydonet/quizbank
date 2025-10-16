# 🔄 WordPress Shortcode & AI Migration

## 📋 Yêu cầu đã thực hiện
1. ❌ **Bỏ "AI tạo câu hỏi"** trong #/quiz-bank
2. ✅ **Chuyển "AI tạo câu hỏi"** vào Admin Panel
3. ✅ **Thay thế bằng "Tạo shortcode WP"** với format chuẩn WordPress

## 🔄 Thay đổi đã thực hiện

### **1. QuizBankPage - Thay AI bằng WordPress Shortcode**

#### **❌ Đã xóa:**
```typescript
// Removed AI-related imports
import SparklesIcon from '../components/icons/SparklesIcon';
import DynamicQuestionEditor from '../components/DynamicQuestionEditor';
import { DynamicQuestionTemplateService } from '../services/dynamicQuestionTemplateService';

// Removed AI states
const [showDynamicEditor, setShowDynamicEditor] = useState(false);

// Removed AI functions
const handleDynamicQuestionGenerated = useCallback(async (generatedQuestion: Question) => {...});

// Removed AI button
<button onClick={() => setShowDynamicEditor(true)}>
  <SparklesIcon className="w-4 h-4" />
  <span>AI Tạo câu hỏi</span>
</button>
```

#### **✅ Thay thế bằng:**
```typescript
// New WordPress-related imports
import WordPressShortcodeModal from '../components/WordPressShortcodeModal';

// New WordPress states
const [showWordPressModal, setShowWordPressModal] = useState(false);

// New WordPress function
const generateWordPressShortcodes = useCallback(async () => {
  const selectedQuestions = await getSelectedQuestionsForQuiz();
  
  const shortcodes = selectedQuestions.map((question) => {
    const cleanText = (text: string) => text.replace(/"/g, '&quot;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
    
    switch (question.type) {
      case 'mcq':
        return `[quiz_question question="${cleanText(question.question)}" option_a="${cleanText(question.option_a)}" option_b="${cleanText(question.option_b)}" option_c="${cleanText(question.option_c)}" option_d="${cleanText(question.option_d)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`;
      
      case 'msq':
        return `[quiz_question_T_F question="${cleanText(question.question)}" option_a="${cleanText(question.option_a)}" option_b="${cleanText(question.option_b)}" option_c="${cleanText(question.option_c)}" option_d="${cleanText(question.option_d)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`;
      
      case 'sa':
        return `[quiz_question_TLN question="${cleanText(question.question)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`;
    }
  });

  return shortcodes.join('\n\n');
}, [getSelectedQuestionsForQuiz]);

// New WordPress button
<button onClick={() => setShowWordPressModal(true)}>
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175..."/>
  </svg>
  <span>Tạo shortcode WP</span>
</button>
```

### **2. WordPressShortcodeModal Component**

#### **✅ Tính năng mới:**
```typescript
interface WordPressShortcodeModalProps {
  onClose: () => void;
  generateShortcodes: () => Promise<string>;
}
```

#### **📋 WordPress Shortcode Formats:**

**MCQ (Multiple Choice Question):**
```
[quiz_question question="Câu hỏi 1?" option_a="A1" option_b="B1" option_c="C1" option_d="D1" correct="A" explanation="lời giải"]
```

**MSQ (True/False - Multiple Select):**
```
[quiz_question_T_F question="Mệnh đề nào đúng?" option_a="Mệnh đề A" option_b="Mệnh đề B" option_c="Mệnh đề C" option_d="Mệnh đề D" correct="A,B" explanation="lời giải"]
```

**SA (Short Answer):**
```
[quiz_question_TLN question="Bài toán có đáp số là" correct="1234" explanation="lời giải"]
```

#### **🎨 Modal Features:**
```typescript
// Auto-generate shortcodes on open
useEffect(() => {
  handleGenerateShortcodes();
}, []);

// Copy to clipboard
const handleCopyToClipboard = async () => {
  await navigator.clipboard.writeText(shortcodes);
  setCopied(true);
};

// Download as file
const handleDownloadFile = () => {
  const blob = new Blob([shortcodes], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'wordpress-quiz-shortcodes.txt';
  link.click();
};
```

### **3. Admin Panel - AI Tab Added**

#### **✅ QuestionBankAdmin Enhancement:**
```typescript
// Updated tab type
const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'import' | 'ai'>('browse');

// New AI states
const [showAIEditor, setShowAIEditor] = useState(false);

// New AI tab
<button onClick={() => setActiveTab('ai')}>
  ✨ AI tạo câu hỏi
</button>

// AI tab content
{activeTab === 'ai' && renderAITab()}
```

#### **🤖 AI Tab Features:**
```typescript
const renderAITab = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">AI Tạo câu hỏi động</h3>
      <button onClick={() => setShowAIEditor(true)}>
        ✨ Mở AI Editor
      </button>
    </div>

    {/* AI Features Info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4>🤖 AI Question Generator</h4>
        <ul>
          <li>• Tạo câu hỏi từ prompt text</li>
          <li>• Hỗ trợ LaTeX cho công thức toán</li>
          <li>• Tạo câu hỏi động với biến số</li>
          <li>• Tự động tạo lời giải chi tiết</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4>⚡ Dynamic Questions</h4>
        <ul>
          <li>• Biến số ngẫu nhiên: !a!, !b:1:10!</li>
          <li>• Tính toán tự động: {tinh: 2*!a!}</li>
          <li>• Câu hỏi không trùng lặp</li>
          <li>• Preview real-time</li>
        </ul>
      </div>
    </div>
  </div>
);
```

#### **💾 AI Question Saving:**
```typescript
const handleAIQuestionGenerated = async (generatedQuestion: any) => {
  if (!generatedQuestion) {
    alert('Không có câu hỏi nào được tạo.');
    return;
  }

  try {
    // Save to database if question type is selected
    if (selectedQuestionType) {
      await QuestionBankService.createQuestion({
        ...generatedQuestion,
        question_type_id: selectedQuestionType
      });
      
      alert('Đã tạo và lưu câu hỏi AI thành công!');
      loadQuestions(selectedQuestionType); // Reload questions
    } else {
      alert('Vui lòng chọn dạng câu hỏi trước khi tạo câu hỏi AI.');
    }
    
    setShowAIEditor(false);
  } catch (error) {
    console.error('Error saving AI question:', error);
    alert('Có lỗi xảy ra khi lưu câu hỏi AI.');
  }
};
```

## 🎯 User Experience

### **📱 QuizBankPage - New Workflow:**
```
1. Chọn câu hỏi từ database (5 câu)
2. Click "Tạo shortcode WP" (thay vì "AI Tạo câu hỏi")
3. Modal mở ra với shortcodes đã generate
4. Copy hoặc download file .txt
5. Paste vào WordPress site
```

### **🎮 WordPress Shortcode Modal:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WordPress Quiz Shortcodes                                              ✕   │
│ Shortcodes cho plugin quiz WordPress                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📋 Hướng dẫn sử dụng                                                       │
│ MCQ: [quiz_question question="..." correct="A" ...]                       │
│ MSQ: [quiz_question_T_F question="..." correct="A,B" ...]                 │
│ SA:  [quiz_question_TLN question="..." correct="1234" ...]                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Generated Shortcodes                              [📋 Copy] [💾 Tải file] │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ [quiz_question question="Tìm đạo hàm của f(x) = x²"                   │ │
│ │ option_a="f'(x) = 2x" option_b="f'(x) = x²"                          │ │
│ │ option_c="f'(x) = 2x + 1" option_d="f'(x) = x"                       │ │
│ │ correct="A" explanation="Áp dụng quy tắc đạo hàm..."]                 │ │
│ │                                                                         │ │
│ │ [quiz_question_T_F question="Mệnh đề nào đúng?"                       │ │
│ │ option_a="sin²x + cos²x = 1" option_b="tan(0) = 0"                    │ │
│ │ correct="A,B" explanation="Đây là các đẳng thức cơ bản..."]           │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 Đã tạo 5 shortcodes                           [🔄 Tạo lại] [Đóng]     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **🔧 Admin Panel - AI Tab:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Duyệt câu hỏi] [Tạo câu hỏi] [📥 Import câu hỏi] [✨ AI tạo câu hỏi]    │
├─────────────────────────────────────────────────────────────────────────────┤
│ AI Tạo câu hỏi động                                    [✨ Mở AI Editor]  │
│                                                                             │
│ 🤖 AI Question Generator        ⚡ Dynamic Questions                       │
│ • Tạo câu hỏi từ prompt text    • Biến số ngẫu nhiên: !a!, !b:1:10!      │
│ • Hỗ trợ LaTeX cho công thức    • Tính toán tự động: {tinh: 2*!a!}       │
│ • Tạo câu hỏi động với biến số  • Câu hỏi không trùng lặp               │
│ • Tự động tạo lời giải chi tiết  • Preview real-time                     │
│                                                                             │
│ 📚 Hướng dẫn sử dụng                                                       │
│ [1] Chọn vị trí → [2] Tạo với AI → [3] Lưu vào DB                        │
│                                                                             │
│ 🚀 Thao tác nhanh                                                          │
│ [✨ Tạo câu hỏi AI] [📋 Copy mẫu prompt]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### **📊 Text Cleaning for WordPress:**
```typescript
const cleanText = (text: string) => text
  .replace(/"/g, '&quot;')    // Escape quotes
  .replace(/\[/g, '&#91;')    // Escape opening brackets
  .replace(/\]/g, '&#93;');   // Escape closing brackets
```

### **🎨 WordPress Icon:**
```typescript
<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
  <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.031-.661.854-.082.899 0 0 .541.075 1.115.105l1.65 4.53-2.31 6.92-3.85-11.45c.645-.03 1.231-.105 1.231-.105.582-.075.516-.93-.065-.899 0 0-1.755.135-2.88.135-.202 0-.438-.008-.69-.015C4.911 2.015 8.235 0 12.001 0c2.756 0 5.27 1.055 7.13 2.78-.045-.003-.087-.008-.125-.008-.202 0-.438-.008-.69-.015-.647.03-1.232.105-1.232.105-.582.075-.514.93.067.899 0 0 .541-.075 1.115-.105l1.65-4.53 2.31-6.92 3.85 11.45z"/>
</svg>
```

### **💾 File Download:**
```typescript
const handleDownloadFile = () => {
  const blob = new Blob([shortcodes], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'wordpress-quiz-shortcodes.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

## 🎯 Benefits

### **👥 For Teachers:**
- **WordPress Integration** - Direct shortcodes cho WordPress sites
- **Easy Copy/Paste** - Copy shortcodes và paste vào posts
- **File Download** - Tải file .txt để backup
- **Clean Format** - Shortcodes escaped properly
- **Multiple Types** - MCQ, MSQ, SA support

### **👨‍💻 For Admins:**
- **AI in Admin** - Centralized AI tools trong admin panel
- **Better Organization** - AI tools ở đúng chỗ (admin)
- **Database Integration** - AI questions lưu trực tiếp vào DB
- **Full Control** - Admin có full control over AI generation

### **🎨 For WordPress Users:**
- **Standard Format** - Chuẩn WordPress shortcode format
- **Plugin Ready** - Sẵn sàng cho quiz plugins
- **Escaped Content** - Safe cho WordPress parsing
- **Batch Export** - Export nhiều câu cùng lúc

## 📱 Mobile Responsiveness

### **📱 WordPress Modal:**
- **Full-width** - Modal responsive trên mobile
- **Scrollable** - Textarea scrollable
- **Touch-friendly** - Buttons dễ touch
- **Copy support** - Mobile clipboard support

### **📱 Admin AI Tab:**
- **Stacked layout** - Cards stack trên mobile
- **Touch buttons** - Larger touch targets
- **Responsive grid** - Grid adapts to screen size

## 🚀 Future Enhancements

### **📊 WordPress Features:**
- **Plugin Detection** - Detect WordPress quiz plugins
- **Custom Formats** - Support more shortcode formats
- **Bulk Operations** - Generate shortcodes for entire question banks
- **Preview Mode** - Preview how shortcodes will look

### **🤖 AI Enhancements:**
- **Batch Generation** - Generate multiple questions at once
- **Template Library** - Pre-built AI prompts
- **Smart Suggestions** - AI suggests improvements
- **Auto-categorization** - AI auto-assigns to question types

## 📝 Summary

### **✅ Completed Changes:**
- ✅ **Removed AI from QuizBankPage** - Clean separation
- ✅ **Added WordPress Shortcode Generator** - Professional WP integration
- ✅ **Added AI Tab to Admin** - Centralized AI tools
- ✅ **WordPress Shortcode Modal** - Full-featured generator
- ✅ **Text Escaping** - Safe WordPress parsing
- ✅ **Copy/Download Features** - Easy export options
- ✅ **Mobile Responsive** - Works on all devices

### **🎯 Result:**
**QuizBankPage giờ đây:**
- **WordPress-focused** - Tạo shortcodes cho WP sites
- **Clean UI** - Không còn AI clutter
- **Professional** - Chuẩn WordPress integration

**Admin Panel giờ đây:**
- **Complete AI Suite** - Full AI tools trong admin
- **Better Organization** - AI ở đúng chỗ
- **Database Integration** - AI questions lưu vào DB

### **👥 User Benefits:**
- **Teachers** - Easy WordPress integration
- **Admins** - Centralized AI management  
- **WordPress Users** - Standard shortcode format
- **Developers** - Clean code separation

**Perfect! Giờ đây:**
1. **#/quiz-bank** - Focus vào WordPress shortcode generation
2. **Admin Panel** - Complete AI suite với database integration
3. **Clean separation** - AI tools ở admin, WP tools ở quiz-bank
4. **Professional integration** - Chuẩn WordPress shortcode format

**All features working perfectly! Build successful! 🚀**

---

**Status:** ✅ **COMPLETED**  
**Build:** ✅ **PASSING**  
**WordPress Integration:** ✅ **PROFESSIONAL**  
**AI Migration:** ✅ **SUCCESSFUL**