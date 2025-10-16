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
   * Test API key bằng cách gọi API
   */
  static async testApiKey(provider: 'gemini' | 'openai', apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      if (provider === 'gemini') {
        // Test Gemini API
        const { GoogleGenAI } = await import('@google/genai');
        const genAI = new GoogleGenAI({ apiKey });
        
        // Simple test call
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: 'Test connection. Reply with "OK"',
          config: {
            maxOutputTokens: 10
          }
        });
        
        if (response.text) {
          return { valid: true };
        } else {
          return { valid: false, error: 'No response from API' };
        }
      } else if (provider === 'openai') {
        // Test OpenAI API (placeholder - implement if needed)
        return { valid: false, error: 'OpenAI testing not implemented yet' };
      }
      
      return { valid: false, error: 'Unknown provider' };
    } catch (error) {
      console.error('API key test failed:', error);
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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