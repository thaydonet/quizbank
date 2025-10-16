/**
 * Centralized Error Handler Service
 * Handles all errors consistently across the application
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  private static logError(error: AppError): void {
    console.error(`[${error.timestamp.toISOString()}] ${error.code}: ${error.message}`, error.details);
  }

  /**
   * Handle API errors from Supabase or other services
   */
  static handleApiError(error: any, context: string): AppError {
    const appError: AppError = {
      code: error?.code || 'API_ERROR',
      message: error?.message || 'An unexpected API error occurred',
      details: { context, originalError: error },
      timestamp: new Date()
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(message: string, field?: string): AppError {
    const appError: AppError = {
      code: 'VALIDATION_ERROR',
      message,
      details: { field },
      timestamp: new Date()
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: any): AppError {
    const appError: AppError = {
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      details: error,
      timestamp: new Date()
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Create user-friendly error messages
   */
  static getUserMessage(error: AppError): string {
    const errorMessages: { [key: string]: string } = {
      'API_ERROR': 'Có lỗi xảy ra với server. Vui lòng thử lại sau.',
      'VALIDATION_ERROR': error.message,
      'AUTH_ERROR': 'Lỗi xác thực. Vui lòng đăng nhập lại.',
      'NETWORK_ERROR': 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.'
    };

    return errorMessages[error.code] || 'Đã xảy ra lỗi không xác định.';
  }
}