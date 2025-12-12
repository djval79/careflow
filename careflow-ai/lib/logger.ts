/**
 * Structured Logger for CareFlow
 * 
 * Provides consistent logging across the application with support for
 * different log levels, structured data, and environment-aware output.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  component?: string;
}

// Environment check
const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

// Log level priority
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level based on environment
const MIN_LOG_LEVEL: LogLevel = isDevelopment ? 'debug' : 'warn';

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Suppress logs during tests
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, component } = entry;
  const prefix = component ? `[${component}]` : '';
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}${contextStr}`;
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  component?: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    component,
  };
}

/**
 * Output log to console with appropriate styling
 */
function outputLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const formatted = formatLogEntry(entry);
  
  switch (entry.level) {
    case 'debug':
      console.debug(`%c${formatted}`, 'color: #888');
      break;
    case 'info':
      console.info(`%c${formatted}`, 'color: #0066cc');
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Main logger object
 */
export const log = {
  /**
   * Debug level - verbose output for development
   */
  debug(message: string, context?: LogContext): void {
    outputLog(createLogEntry('debug', message, context));
  },

  /**
   * Info level - general information
   */
  info(message: string, context?: LogContext): void {
    outputLog(createLogEntry('info', message, context));
  },

  /**
   * Warning level - potential issues
   */
  warn(message: string, context?: LogContext): void {
    outputLog(createLogEntry('warn', message, context));
  },

  /**
   * Error level - errors and failures
   */
  error(message: string, context?: LogContext): void {
    outputLog(createLogEntry('error', message, context));
  },

  /**
   * Track an event (for analytics/monitoring)
   */
  track(event: string, properties?: LogContext): void {
    outputLog(createLogEntry('info', `[TRACK] ${event}`, properties));
    
    // In production, this could send to analytics service
    // e.g., analytics.track(event, properties);
  },

  /**
   * Create a scoped logger for a specific component
   */
  scope(component: string) {
    return {
      debug: (message: string, context?: LogContext) =>
        outputLog(createLogEntry('debug', message, context, component)),
      info: (message: string, context?: LogContext) =>
        outputLog(createLogEntry('info', message, context, component)),
      warn: (message: string, context?: LogContext) =>
        outputLog(createLogEntry('warn', message, context, component)),
      error: (message: string, context?: LogContext) =>
        outputLog(createLogEntry('error', message, context, component)),
      track: (event: string, properties?: LogContext) =>
        outputLog(createLogEntry('info', `[TRACK] ${event}`, properties, component)),
    };
  },

  /**
   * Time an operation
   */
  time(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      log.debug(`${label} completed`, { durationMs: Math.round(duration) });
    };
  },

  /**
   * Log a group of related messages
   */
  group(label: string, fn: () => void): void {
    if (!shouldLog('debug')) {
      fn();
      return;
    }
    console.group(label);
    fn();
    console.groupEnd();
  },
};

/**
 * Performance monitoring helper
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T
): T {
  const end = log.time(label);
  try {
    const result = fn();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
}

/**
 * Async performance monitoring helper
 */
export async function measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const end = log.time(label);
  try {
    const result = await fn();
    end();
    return result;
  } catch (error) {
    end();
    throw error;
  }
}

export default log;
