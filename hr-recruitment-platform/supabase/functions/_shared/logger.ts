/**
 * Centralized logging utility for Supabase Edge Functions
 * Provides structured logging with timestamps and correlation IDs
 */

export interface LogContext {
    correlationId?: string;
    userId?: string;
    action?: string;
    [key: string]: any;
}

export class Logger {
    private context: LogContext;

    constructor(context: LogContext = {}) {
        this.context = {
            ...context,
            correlationId: context.correlationId || crypto.randomUUID(),
        };
    }

    private formatMessage(level: string, message: string, data?: any) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...this.context,
            ...(data && { data }),
        };
        return JSON.stringify(logEntry);
    }

    info(message: string, data?: any) {
        console.log(this.formatMessage('INFO', message, data));
    }

    warn(message: string, data?: any) {
        console.warn(this.formatMessage('WARN', message, data));
    }

    error(message: string, error?: any, data?: any) {
        console.error(
            this.formatMessage('ERROR', message, {
                error: error?.message || String(error),
                stack: error?.stack,
                ...data,
            })
        );
    }

    /**
     * Time an async operation and log its duration
     */
    async timeAsync<T>(
        operation: string,
        fn: () => Promise<T>
    ): Promise<T> {
        const startTime = performance.now();
        this.info(`Starting: ${operation}`);

        try {
            const result = await fn();
            const duration = performance.now() - startTime;
            this.info(`Completed: ${operation}`, { durationMs: duration.toFixed(2) });
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            this.error(`Failed: ${operation}`, error, { durationMs: duration.toFixed(2) });
            throw error;
        }
    }
}

/**
 * Create a logger instance for an Edge Function request
 */
export function createLogger(req: Request, additionalContext?: LogContext): Logger {
    const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();

    return new Logger({
        correlationId,
        method: req.method,
        url: req.url,
        ...additionalContext,
    });
}
