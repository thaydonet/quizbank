import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from '../services/apiKeyManager';
import ApiKeySettings from './ApiKeySettings';

const ApiKeyIndicator: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState(ApiKeyManager.getApiKeyStatus());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Update status when component mounts
    setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
    
    // Listen for storage changes (if user updates in another tab)
    const handleStorageChange = () => {
      setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleApiKeyUpdated = () => {
    setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
  };

  const hasAnyKey = apiKeyStatus.gemini.hasKey || apiKeyStatus.openai.hasKey;
  const hasFallbackKey = !!import.meta.env.VITE_API_KEY;

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          hasAnyKey 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : hasFallbackKey
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : 'bg-red-100 text-red-800 hover:bg-red-200'
        }`}
        title="Click để cấu hình API keys"
      >
        <span className={`w-2 h-2 rounded-full ${
          hasAnyKey 
            ? 'bg-green-500' 
            : hasFallbackKey
            ? 'bg-yellow-500'
            : 'bg-red-500'
        }`}></span>
        <span>
          {hasAnyKey 
            ? 'API Key OK' 
            : hasFallbackKey
            ? 'API Mặc định'
            : 'Chưa có API'
          }
        </span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {showSettings && (
        <ApiKeySettings 
          onClose={() => setShowSettings(false)}
          onApiKeyUpdated={handleApiKeyUpdated}
        />
      )}
    </>
  );
};

export default ApiKeyIndicator;