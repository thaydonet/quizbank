import { QuestionBankService } from './questionBankService';
import type { DatabaseQuestion } from '../types';

interface CacheEntry {
  data: DatabaseQuestion[];
  timestamp: number;
  options: any;
}

class QuestionBankCache {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(questionTypeId: string, options: any): string {
    return `${questionTypeId}_${JSON.stringify(options)}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION;
  }

  async getQuestionsByType(questionTypeId: string, options: any = {}): Promise<DatabaseQuestion[]> {
    const cacheKey = this.getCacheKey(questionTypeId, options);
    const cachedEntry = this.cache.get(cacheKey);

    // Return cached data if valid
    if (cachedEntry && !this.isExpired(cachedEntry)) {
      return cachedEntry.data;
    }

    // Fetch fresh data
    try {
      const data = await QuestionBankService.getQuestionsByType(questionTypeId, options);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        options
      });

      return data;
    } catch (error) {
      // If fetch fails and we have expired cache, return it
      if (cachedEntry) {
        console.warn('Using expired cache due to fetch error:', error);
        return cachedEntry.data;
      }
      throw error;
    }
  }

  // Clear cache for a specific question type
  clearCacheForType(questionTypeId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`${questionTypeId}_`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Get cache stats
  getStats(): { size: number; entries: Array<{ key: string; timestamp: number; expired: boolean }> } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      expired: this.isExpired(entry)
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  // Preload questions for multiple types
  async preloadQuestionTypes(questionTypeIds: string[], options: any = {}): Promise<void> {
    const promises = questionTypeIds.map(id => 
      this.getQuestionsByType(id, options).catch(error => {
        console.error(`Failed to preload questions for type ${id}:`, error);
        return [];
      })
    );

    await Promise.all(promises);
  }
}

// Export singleton instance
export const questionBankCache = new QuestionBankCache();