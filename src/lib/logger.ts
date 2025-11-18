/**
 * Structured Logger
 *
 * Provides consistent logging with context and correlation IDs.
 * Can be extended to integrate with external logging services (Datadog, Sentry, etc.).
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  guildId?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: LogContext;
  error?: Error;
}

class Logger {
  private context: LogContext = {};

  /**
   * Set default context for this logger instance
   */
  withContext(context: LogContext): Logger {
    const newLogger = new Logger();
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * Log at debug level
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, { ...context, error });
  }

  private log(level: LogLevel, message: string, additionalContext?: LogContext): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.context, ...additionalContext },
    };

    // Extract error if present
    if (additionalContext?.error instanceof Error) {
      entry.error = additionalContext.error;
      delete entry.context?.error;
    }

    // Format output based on environment
    if (process.env.NODE_ENV === "production") {
      // JSON format for production (easier to parse by log aggregators)
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable format for development
      const contextStr = Object.keys(entry.context ?? {}).length > 0
        ? ` ${JSON.stringify(entry.context)}`
        : "";

      const errorStr = entry.error
        ? `\n  ${entry.error.stack ?? entry.error.message}`
        : "";

      console.log(
        `[${entry.timestamp.toISOString()}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`
      );
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating scoped loggers
export { Logger };
