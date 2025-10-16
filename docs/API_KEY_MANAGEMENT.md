# 🔐 Quản lý API Key cá nhân cho Giáo viên

## 📋 Tổng quan

Hệ thống cho phép giáo viên sử dụng API key Gemini cá nhân thay vì dùng chung API key được hardcode trong code. Điều này mang lại nhiều lợi ích:

- **🔒 Bảo mật:** Mỗi giáo viên dùng API key riêng
- **💰 Chi phí:** Kiểm soát usage và billing cá nhân  
- **⚡ Performance:** Không bị giới hạn rate limit chung
- **🎯 Cá nhân hóa:** Tùy chỉnh model và parameters

## 🏗️ Kiến trúc Hệ thống

### **1. API Key Storage**
```typescript
// localStorage (encrypted)
{
  "teacher_api_keys": {
    "geminiApiKey": "encrypted_key_here",
    "openaiApiKey": "encrypted_key_here", 
    "lastUpdated": "2024-01-01T00:00:00Z",
    "isValid": true
  }
}
```

### **2. Priority System**
```typescript
// Thứ tự ưu tiên sử dụng API key:
1. Personal API Key (localStorage) ← Ưu tiên cao nhất
2. Fallback API Key (environment) ← Backup
3. Error message ← Không có key nào
```

### **3. Security Features**
- ✅ **Encryption:** XOR + Base64 encoding
- ✅ **Local Storage:** Không gửi lên server
- ✅ **Validation:** Format và test connection
- ✅ **Masking:** Hiển thị `AIza****1234` thay vì full key

## 🚀 Cách sử dụng

### **Cho Giáo viên:**

#### **Bước 1: Lấy API Key**
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Đăng nhập Google account
3. Click "Create API Key" → "Create API key in new project"
4. Copy API key (dạng `AIza...`)

#### **Bước 2: Cấu hình trong App**
1. **Đăng nhập** với tài khoản teacher
2. **Vào trang "Tạo câu hỏi AI"** (`/create`)
3. **Click "⚙️ Cài đặt API Key"**
4. **Paste API key** vào ô Gemini
5. **Click "Lưu"** → Hệ thống sẽ test và lưu

#### **Bước 3: Sử dụng**
- API key được lưu tự động và dùng cho tất cả requests
- Hiển thị status trong Header: `🟢 API Key OK`
- Có thể test, update, hoặc xóa bất cứ lúc nào

### **Cho Developer:**

#### **Environment Setup**
```bash
# .env (optional fallback)
VITE_API_KEY=your_fallback_gemini_key_here
```

#### **Code Integration**
```typescript
// services/geminiService.ts
import { ApiKeyManager } from './apiKeyManager';

const getApiKey = (): string | null => {
  // 1. Try personal key first
  const personalKey = ApiKeyManager.getApiKey('gemini');
  if (personalKey) return personalKey;
  
  // 2. Fallback to environment
  return import.meta.env.VITE_API_KEY || null;
};
```

## 🔧 API Reference

### **ApiKeyManager Class**

#### **Save API Key**
```typescript
ApiKeyManager.saveApiKey('gemini', 'AIza...');
// Encrypts and saves to localStorage
```

#### **Get API Key**
```typescript
const key = ApiKeyManager.getApiKey('gemini');
// Returns decrypted key or null
```

#### **Validate Format**
```typescript
const isValid = ApiKeyManager.validateApiKeyFormat('gemini', 'AIza...');
// Returns true if format is correct
```

#### **Test Connection**
```typescript
const result = await ApiKeyManager.testApiKey('gemini', 'AIza...');
// { valid: true } or { valid: false, error: "message" }
```

#### **Get Status**
```typescript
const status = ApiKeyManager.getApiKeyStatus();
// {
//   gemini: { hasKey: true, isValid: true, lastUpdated: "..." },
//   openai: { hasKey: false, isValid: false, lastUpdated: "..." }
// }
```

#### **Remove Key**
```typescript
ApiKeyManager.removeApiKey('gemini');
// Removes from localStorage
```

## 🎨 UI Components

### **1. ApiKeySettings Modal**
- **Location:** `components/ApiKeySettings.tsx`
- **Features:** Add, test, update, remove API keys
- **Security:** Password input, masked display
- **Validation:** Format check + live testing

### **2. ApiKeyIndicator**
- **Location:** `components/ApiKeyIndicator.tsx`  
- **Display:** Status badge in Header
- **Colors:** 🟢 Green (personal), 🟡 Yellow (fallback), 🔴 Red (none)

### **3. Integration in AIGeneratorPage**
- **Button:** "⚙️ Cài đặt API Key" 
- **Status:** Real-time API key status
- **Error Handling:** Clear messages when no key

## 🔒 Security Considerations

### **What's Secure:**
- ✅ Keys stored locally (not on server)
- ✅ Basic encryption (XOR + Base64)
- ✅ No transmission to backend
- ✅ User can delete anytime

### **What's NOT Secure:**
- ⚠️ Not military-grade encryption
- ⚠️ Vulnerable to XSS attacks
- ⚠️ Accessible via browser DevTools
- ⚠️ Shared computer risks

### **Best Practices:**
- 🎯 Use personal devices only
- 🎯 Log out after use
- 🎯 Rotate keys regularly
- 🎯 Monitor usage in Google Console

## 📊 Monitoring & Analytics

### **For Teachers:**
```typescript
// Check your usage
const status = ApiKeyManager.getApiKeyStatus();
console.log('Last used:', status.gemini.lastUpdated);
```

### **For Admins:**
```typescript
// Check system-wide status (no access to actual keys)
const hasPersonalKeys = localStorage.getItem('teacher_api_keys') !== null;
const fallbackAvailable = !!import.meta.env.VITE_API_KEY;
```

## 🚀 Future Enhancements

### **Planned Features:**
- 🔄 **OpenAI Integration:** Support GPT models
- 📊 **Usage Analytics:** Track requests per teacher
- 🔐 **Better Encryption:** AES encryption
- ☁️ **Cloud Sync:** Optional encrypted cloud storage
- 👥 **Team Management:** Shared keys for departments
- 📱 **Mobile App:** React Native support

### **Advanced Configuration:**
```typescript
// Future: Per-teacher model settings
interface TeacherAIConfig {
  geminiModel: 'gemini-2.5-flash' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}
```

## 🐛 Troubleshooting

### **Common Issues:**

#### **"API Key không hợp lệ"**
```bash
✅ Solutions:
- Kiểm tra format: phải bắt đầu bằng "AIza"
- Tạo key mới tại Google AI Studio
- Đảm bảo project có enable Gemini API
```

#### **"Không thể kết nối"**
```bash
✅ Solutions:
- Kiểm tra internet connection
- Verify API key chưa bị revoke
- Check quota limits trong Google Console
```

#### **"API Key bị mất"**
```bash
✅ Solutions:
- Check localStorage: F12 → Application → Local Storage
- Tạo key mới nếu cần
- Import/export backup (future feature)
```

### **Debug Commands:**
```javascript
// Browser console (F12)
console.log(ApiKeyManager.getApiKeyStatus());
console.log(ApiKeyManager.hasApiKey('gemini'));

// Test connection
ApiKeyManager.testApiKey('gemini', 'your_key').then(console.log);

// Clear all (emergency)
ApiKeyManager.clearAllApiKeys();
```

## 📝 Migration Guide

### **From Hardcoded to Personal Keys:**

#### **Before (Old System):**
```typescript
// .env
VITE_API_KEY=shared_key_for_everyone

// Code
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
```

#### **After (New System):**
```typescript
// .env (optional fallback)
VITE_API_KEY=fallback_key

// Code
const getApiKey = () => {
  return ApiKeyManager.getApiKey('gemini') || import.meta.env.VITE_API_KEY;
};
const ai = new GoogleGenAI({ apiKey: getApiKey() });
```

#### **Migration Steps:**
1. ✅ Keep existing VITE_API_KEY as fallback
2. ✅ Add ApiKeyManager integration
3. ✅ Update UI to show API key settings
4. ✅ Test with both personal and fallback keys
5. ✅ Train teachers on new workflow

---

## 🎯 Summary

**Lợi ích chính:**
- 🔐 **Security:** Personal API keys, local storage
- 💰 **Cost Control:** Individual billing and quotas  
- ⚡ **Performance:** No shared rate limits
- 🎨 **UX:** Easy setup and management UI
- 🔄 **Flexibility:** Fallback system for reliability

**Workflow:**
1. Teacher gets personal Gemini API key
2. Configures in app settings (encrypted local storage)
3. Uses AI features with personal quota
4. Can manage/update keys anytime

**Next Steps:**
- Deploy and train teachers
- Monitor usage and feedback
- Plan OpenAI integration
- Consider advanced features

**🚀 Ready to empower teachers with personal AI capabilities!**