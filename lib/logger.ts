interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    
  }

  success(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
    }
  }
}

export const logger = new Logger();
