/**
 * Centralized Error Handler for CareFlow
 * 
 * Provides consistent error handling, logging, and user-friendly messages
 * across the application.
 */

// Error types for categorization
export type ErrorType = 
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NETWORK'
  | 'DATABASE'
  | 'UNKNOWN';

export interface AppError extends Error {
  type: ErrorType;
  code?: string;
  details?: Record<string, unknown>;
  userMessage: string;
  originalError?: unknown;
}

// User-friendly error messages
const USER_MESSAGES: Record<ErrorType, string> = {
  VALIDATION: 'Please check the information you provided and try again.',
  NOT_FOUND: 'The requested item could not be found.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NETWORK: 'Unable to connect. Please check your internet connection.',
  DATABASE: 'A database error occurred. Please try again later.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

/**
 * Create a typed application error
 */
export function createAppError(
  type: ErrorType,
  message: string,
  details?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.type = type;
  error.details = details;
  error.userMessage = USER_MESSAGES[type];
  return error;
}

/**
 * Error factory for common error types
 */
export const createError = {
  validation: (message: string, details?: Record<string, unknown>) =>
    createAppError('VALIDATION', message, details),
  
  notFound: (resource: string, details?: Record<string, unknown>) =>
    createAppError('NOT_FOUND', `${resource} not found`, details),
  
  unauthorized: (message = 'Authentication required') =>
    createAppError('UNAUTHORIZED', message),
  
  forbidden: (message = 'Access denied') =>
    createAppError('FORBIDDEN', message),
  
  network: (message = 'Network error') =>
    createAppError('NETWORK', message),
  
  database: (message: string, details?: Record<string, unknown>) =>
    createAppError('DATABASE', message, details),
};

/**
 * Determine error type from Supabase error codes
 */
function getErrorTypeFromCode(code?: string): ErrorType {
  if (!code) return 'UNKNOWN';
  
  // Supabase/PostgreSQL error codes
  if (code === 'PGRST116') return 'NOT_FOUND'; // Row not found
  if (code === 'PGRST301') return 'UNAUTHORIZED'; // JWT error
  if (code === '23505') return 'VALIDATION'; // Unique violation
  if (code === '23503') return 'VALIDATION'; // Foreign key violation
  if (code === '42501') return 'FORBIDDEN'; // RLS policy violation
  if (code === '42P01') return 'DATABASE'; // Table not found
  if (code.startsWith('P')) return 'DATABASE'; // PostgreSQL errors
  if (code === 'FETCH_ERROR' || code === 'NetworkError') return 'NETWORK';
  
  return 'UNKNOWN';
}

/**
 * Handle and transform any error into a consistent AppError
 */
export function handleError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }
  
  // Supabase error
  if (isSupabaseError(error)) {
    const type = getErrorTypeFromCode(error.code);
    const appError = createAppError(type, error.message, {
      code: error.code,
      hint: error.hint,
      details: error.details,
      context,
    });
    appError.originalError = error;
    return appError;
  }
  
  // Standard Error
  if (error instanceof Error) {
    const appError = createAppError('UNKNOWN', error.message, { context });
    appError.originalError = error;
    return appError;
  }
  
  // String error
  if (typeof error === 'string') {
    return createAppError('UNKNOWN', error, { context });
  }
  
  // Unknown error type
  return createAppError('UNKNOWN', 'An unexpected error occurred', {
    context,
    errorType: typeof error,
  });
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    'type' in error &&
    'userMessage' in error
  );
}

/**
 * Type guard for Supabase errors
 */
interface SupabaseError {
  message: string;
  code?: string;
  hint?: string;
  details?: string;
}

function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
}

/**
 * Get a user-friendly message from any error
 */
export function getUserMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }
  
  const appError = handleError(error);
  return appError.userMessage;
}

/**
 * Extract error message for logging
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * Check if error is a network/connectivity error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.type === 'NETWORK';
  }
  
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('ECONNREFUSED') ||
      error.name === 'NetworkError'
    );
  }
  
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.type === 'NETWORK' || error.type === 'DATABASE';
  }
  return isNetworkError(error);
}
