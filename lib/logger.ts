interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG]`, message, context || '');
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO]`, message, context || '');
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN]`, message, context || '');
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    console.error(`❌ [ERROR]`, message, error, context || '');
  }

  success(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS]`, message, context || '');
    }
  }
}

export const logger = new Logger();
