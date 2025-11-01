/**
 * API Key Manager - Quản lý API keys cá nhân của giáo viên
 * Lưu trữ local, không gửi lên server để bảo mật
 */

export interface ApiKeyConfig {
  geminiApiKey?: string;
  openaiApiKey?: string;
  lastUpdated: string;
  isValid?: boolean;
}

export class ApiKeyManager {
  private static readonly STORAGE_KEY = 'teacher_api_keys';
  private static readonly ENCRYPTION_KEY = 'quiz_bank_encrypt_key_2025'; // Updated key

  /**
   * Enhanced encryption using XOR with base64 encoding
   */
  private static encrypt(text: string): string {
    try {
      const key = this.ENCRYPTION_KEY;
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        encrypted += String.fromCharCode(
          text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      // Double encode to make it less obvious
      return btoa(btoa(encrypted));
    } catch (error) {
      console.error('Encryption error:', error);
      return btoa(text); // Fallback to simple base64
    }
  }

  /**
   * Enhanced decryption
   */
  private static decrypt(encryptedText: string): string {
    try {
      // Double decode
      const decodedOnce = atob(encryptedText);
      const key = this.ENCRYPTION_KEY;
      const decoded = atob(decodedOnce);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      try {
        return atob(encryptedText); // Try single decode as fallback
      } catch {
        return encryptedText; // Return as is if all fails
      }
    }
  }

  /**
   * Lưu API key vào localStorage
   */
  static saveApiKey(provider: 'gemini' | 'openai', apiKey: string): void {
    try {
      const config = this.getApiKeyConfig();

      if (provider === 'gemini') {
        config.geminiApiKey = this.encrypt(apiKey);
      } else if (provider === 'openai') {
        config.openaiApiKey = this.encrypt(apiKey);
      }

      config.lastUpdated = new Date().toISOString();
      config.isValid = true;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));

      console.log(`✅ Đã lưu ${provider} API key`);
    } catch (error) {
      console.error('Error saving API key:', error);
      throw new Error('Không thể lưu API key');
    }
  }

  /**
   * Lấy API key từ localStorage
   */
  static getApiKey(provider: 'gemini' | 'openai'): string | null {
    try {
      const config = this.getApiKeyConfig();

      if (provider === 'gemini' && config.geminiApiKey) {
        return this.decrypt(config.geminiApiKey);
      } else if (provider === 'openai' && config.openaiApiKey) {
        return this.decrypt(config.openaiApiKey);
      }

      return null;
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Lấy toàn bộ config API keys
   */
  static getApiKeyConfig(): ApiKeyConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error parsing API key config:', error);
    }

    return {
      lastUpdated: new Date().toISOString(),
      isValid: false
    };
  }

  /**
   * Kiểm tra xem có API key nào được lưu không
   */
  static hasApiKey(provider: 'gemini' | 'openai'): boolean {
    const config = this.getApiKeyConfig();

    if (provider === 'gemini') {
      return !!config.geminiApiKey;
    } else if (provider === 'openai') {
      return !!config.openaiApiKey;
    }

    return false;
  }

  /**
   * Xóa API key
   */
  static removeApiKey(provider: 'gemini' | 'openai'): void {
    try {
      const config = this.getApiKeyConfig();

      if (provider === 'gemini') {
        delete config.geminiApiKey;
      } else if (provider === 'openai') {
        delete config.openaiApiKey;
      }

      config.lastUpdated = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));

      console.log(`✅ Đã xóa ${provider} API key`);
    } catch (error) {
      console.error('Error removing API key:', error);
    }
  }

  /**
   * Xóa tất cả API keys
   */
  static clearAllApiKeys(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Đã xóa tất cả API keys');
    } catch (error) {
      console.error('Error clearing API keys:', error);
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(provider: 'gemini' | 'openai', apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }

    if (provider === 'gemini') {
      // Gemini API key format: AIza...
      return apiKey.startsWith('AIza') && apiKey.length > 20;
    } else if (provider === 'openai') {
      // OpenAI API key format: sk-...
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    return false;
  }

  /**
   * List available models for debugging
   */
  static async listGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        return data.models?.map((model: any) => model.name) || [];
      }
      return [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Test API key bằng SDK để tránh CORS
   */
  static async testApiKey(provider: 'gemini' | 'openai', apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (provider === 'gemini') {
        // Sử dụng SDK để tránh CORS
        const { GoogleGenAI } = await import('@google/genai');
        const genAI = new GoogleGenAI({ apiKey });

        // Thử các model khác nhau dựa trên danh sách có sẵn
        const modelsToTry = [
          'gemini-2.5-flash-preview-05-20',
          'gemini-2.5-pro-preview-03-25',
          'gemini-1.5-flash',
          'gemini-1.5-pro',
          'gemini-pro'
        ];

        let lastError = '';

        // Chỉ thử 2 model đầu tiên để giảm API calls
        const limitedModels = modelsToTry.slice(0, 2);

        for (let i = 0; i < limitedModels.length; i++) {
          const modelName = limitedModels[i];
          
          try {
            // Thêm delay giữa các lần thử để tránh rate limit
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const result = await genAI.models.generateContent({
              model: modelName,
              contents: 'Hi',
              config: {
                maxOutputTokens: 5,
                temperature: 0
              }
            });

            const text = result.text;

            if (text && text.trim()) {
              console.log(`✅ API key valid with model: ${modelName}`);
              return { valid: true };
            }
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';

            // Nếu là lỗi model không tồn tại, thử model tiếp theo
            if (lastError.includes('not found') || lastError.includes('not supported')) {
              continue;
            }

            // Các lỗi khác (API key sai, quota, etc.) thì return ngay
            if (lastError.includes('API_KEY_INVALID') || lastError.includes('invalid api key')) {
              return { valid: false, error: 'API key không hợp lệ' };
            } else if (lastError.includes('quota') || lastError.includes('limit') || lastError.includes('RATE_LIMIT')) {
              return { 
                valid: false, 
                error: 'Đã vượt quá giới hạn API. Có thể do:\n• Free tier có giới hạn requests/phút\n• Thử test quá nhiều lần\n• Rate limiting tạm thời\n\nHãy đợi vài phút rồi thử lại hoặc lưu không test.' 
              };
            } else if (lastError.includes('permission') || lastError.includes('forbidden')) {
              return { valid: false, error: 'Không có quyền truy cập API' };
            }

            // Lỗi khác thì thử model tiếp theo
            continue;
          }
        }

        return { valid: false, error: lastError || 'Không thể kết nối với bất kỳ model nào' };
      } else if (provider === 'openai') {
        // Test OpenAI API (placeholder - implement if needed)
        return { valid: false, error: 'OpenAI testing not implemented yet' };
      }

      return { valid: false, error: 'Unknown provider' };
    } catch (error) {
      console.error('API key test failed:', error);

      // Xử lý các lỗi cụ thể
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
          return { valid: false, error: 'Lỗi kết nối mạng' };
        }

        return { valid: false, error: error.message };
      }

      return {
        valid: false,
        error: 'Không thể kết nối đến API'
      };
    }
  }

  /**
   * Get API key status for UI
   */
  static getApiKeyStatus(): {
    gemini: { hasKey: boolean; isValid?: boolean; lastUpdated?: string };
    openai: { hasKey: boolean; isValid?: boolean; lastUpdated?: string };
  } {
    const config = this.getApiKeyConfig();

    return {
      gemini: {
        hasKey: !!config.geminiApiKey,
        isValid: config.isValid,
        lastUpdated: config.lastUpdated
      },
      openai: {
        hasKey: !!config.openaiApiKey,
        isValid: config.isValid,
        lastUpdated: config.lastUpdated
      }
    };
  }

  /**
   * Mask API key for display (show only first and last few characters)
   */
  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '***';
    }

    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.min(apiKey.length - 8, 20));

    return `${start}${middle}${end}`;
  }
}

// Global access for debugging (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).ApiKeyManager = ApiKeyManager;
}