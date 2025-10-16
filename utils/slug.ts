/**
 * Slug utility functions for consistent URL-friendly string generation
 * Supports Vietnamese characters and provides various slug generation options
 */

// Vietnamese character mapping for slug conversion
const VIETNAMESE_CHAR_MAP: { [key: string]: string } = {
  // Lowercase vowels with diacritics
  'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
  
  'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
  
  'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
  
  'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
  
  'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
  
  'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
  
  'đ': 'd',
  
  // Uppercase vowels with diacritics
  'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 
  'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 
  'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
  
  'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 
  'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
  
  'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
  
  'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 
  'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 
  'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
  
  'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 
  'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
  
  'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
  
  'Đ': 'D'
};

export interface SlugOptions {
  /** Maximum length of the generated slug (default: 50) */
  maxLength?: number;
  /** Whether to preserve case (default: false - converts to lowercase) */
  preserveCase?: boolean;
  /** Custom separator (default: '-') */
  separator?: string;
  /** Whether to allow numbers (default: true) */
  allowNumbers?: boolean;
  /** Custom character replacements */
  customReplacements?: { [key: string]: string };
}

/**
 * Convert Vietnamese characters to ASCII equivalents
 */
export function removeVietnameseDiacritics(text: string, customReplacements?: { [key: string]: string }): string {
  const charMap = { ...VIETNAMESE_CHAR_MAP, ...customReplacements };
  
  return text
    .split('')
    .map(char => charMap[char] || char)
    .join('');
}

/**
 * Generate a URL-friendly slug from text
 * Supports Vietnamese characters and various customization options
 */
export function generateSlug(text: string, options: SlugOptions = {}): string {
  const {
    maxLength = 50,
    preserveCase = false,
    separator = '-',
    allowNumbers = true,
    customReplacements
  } = options;

  if (!text || typeof text !== 'string') {
    return '';
  }

  let slug = text.trim();

  // Remove Vietnamese diacritics
  slug = removeVietnameseDiacritics(slug, customReplacements);

  // Convert to lowercase unless preserveCase is true
  if (!preserveCase) {
    slug = slug.toLowerCase();
  }

  // Build regex pattern based on options
  let allowedChars = 'a-zA-Z';
  if (allowNumbers) {
    allowedChars += '0-9';
  }
  
  // Escape separator for regex
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Remove special characters (keep only letters, numbers, spaces, and separators)
  const regex = new RegExp(`[^${allowedChars}\\s${escapedSeparator}]`, 'g');
  slug = slug.replace(regex, '');

  // Replace multiple spaces with single space
  slug = slug.replace(/\s+/g, ' ');

  // Replace spaces with separator
  slug = slug.replace(/\s/g, separator);

  // Remove consecutive separators
  const separatorRegex = new RegExp(`${escapedSeparator}+`, 'g');
  slug = slug.replace(separatorRegex, separator);

  // Remove leading/trailing separators
  const leadingTrailingRegex = new RegExp(`^${escapedSeparator}+|${escapedSeparator}+$`, 'g');
  slug = slug.replace(leadingTrailingRegex, '');

  // Limit length
  if (maxLength > 0) {
    slug = slug.substring(0, maxLength);
    
    // Remove trailing separator if truncation created one
    const trailingRegex = new RegExp(`${escapedSeparator}+$`);
    slug = slug.replace(trailingRegex, '');
  }

  return slug;
}

/**
 * Generate a unique slug by appending a counter if needed
 * Useful for database operations where slugs must be unique
 */
export async function generateUniqueSlug(
  text: string, 
  checkExists: (slug: string) => Promise<boolean>,
  options: SlugOptions = {}
): Promise<string> {
  const baseSlug = generateSlug(text, options);
  
  if (!baseSlug) {
    throw new Error('Cannot generate slug from provided text');
  }

  let slug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (await checkExists(slug)) {
    // Calculate available length for counter
    const counterSuffix = `-${counter}`;
    const maxBaseLength = (options.maxLength || 50) - counterSuffix.length;
    
    // Truncate base slug if needed to accommodate counter
    const truncatedBase = baseSlug.substring(0, Math.max(0, maxBaseLength));
    slug = `${truncatedBase}${counterSuffix}`;
    
    counter++;
    
    // Prevent infinite loops
    if (counter > 1000) {
      throw new Error('Unable to generate unique slug after 1000 attempts');
    }
  }

  return slug;
}

/**
 * Validate if a string is a valid slug
 */
export function isValidSlug(slug: string, options: SlugOptions = {}): boolean {
  const {
    maxLength = 50,
    separator = '-',
    allowNumbers = true
  } = options;

  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check length
  if (slug.length > maxLength) {
    return false;
  }

  // Build validation regex
  let allowedChars = 'a-zA-Z';
  if (allowNumbers) {
    allowedChars += '0-9';
  }
  
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const validationRegex = new RegExp(`^[${allowedChars}${escapedSeparator}]+$`);
  
  // Check if slug matches allowed pattern
  if (!validationRegex.test(slug)) {
    return false;
  }

  // Check for consecutive separators
  const consecutiveSeparatorRegex = new RegExp(`${escapedSeparator}{2,}`);
  if (consecutiveSeparatorRegex.test(slug)) {
    return false;
  }

  // Check for leading/trailing separators
  const leadingTrailingRegex = new RegExp(`^${escapedSeparator}|${escapedSeparator}$`);
  if (leadingTrailingRegex.test(slug)) {
    return false;
  }

  return true;
}

/**
 * Convert a slug back to a readable title
 */
export function slugToTitle(slug: string, separator: string = '-'): string {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  return slug
    .split(separator)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Predefined slug configurations for common use cases
 */
export const SlugPresets = {
  /** Standard web URL slug */
  url: { maxLength: 50, separator: '-', allowNumbers: true },
  
  /** Short slug for IDs */
  short: { maxLength: 20, separator: '-', allowNumbers: true },
  
  /** File name safe slug */
  filename: { maxLength: 100, separator: '_', allowNumbers: true },
  
  /** Database key slug */
  dbKey: { maxLength: 30, separator: '_', allowNumbers: true, preserveCase: false },
  
  /** SEO optimized slug */
  seo: { maxLength: 60, separator: '-', allowNumbers: false }
} as const;

/**
 * Generate slug using a preset configuration
 */
export function generateSlugWithPreset(
  text: string, 
  preset: keyof typeof SlugPresets,
  overrides: Partial<SlugOptions> = {}
): string {
  const presetOptions = SlugPresets[preset];
  const options = { ...presetOptions, ...overrides };
  return generateSlug(text, options);
}