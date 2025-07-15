// Comprehensive logging utility for data collection operations

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

export interface CollectionMetrics {
  startTime: string;
  endTime?: string;
  duration?: number;
  totalUsers: number;
  successfulCollections: number;
  failedCollections: number;
  skippedCollections: number;
  errors: Array<{
    username: string;
    error: string;
    errorType?: string;
    retryable?: boolean;
  }>;
}

export class DataCollectionLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000; // Keep last 1000 log entries in memory

  /**
   * Log a message with specified level
   */
  static log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };

    // Add to in-memory logs
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output based on level
    const logMessage = this.formatLogMessage(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.log(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        if (error) {
          console.error('Error details:', error);
        }
        break;
    }
  }

  /**
   * Log debug message
   */
  static debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  static info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  static warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  static error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Format log message for console output
   */
  private static formatLogMessage(entry: LogEntry): string {
    const contextStr = entry.context ? ` | ${JSON.stringify(entry.context)}` : '';
    return `[${entry.timestamp}] ${entry.level}: ${entry.message}${contextStr}`;
  }

  /**
   * Get recent logs
   */
  static getRecentLogs(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * Log collection start
   */
  static logCollectionStart(totalUsers: number): CollectionMetrics {
    const metrics: CollectionMetrics = {
      startTime: new Date().toISOString(),
      totalUsers,
      successfulCollections: 0,
      failedCollections: 0,
      skippedCollections: 0,
      errors: []
    };

    this.info('Data collection started', {
      totalUsers,
      startTime: metrics.startTime
    });

    return metrics;
  }

  /**
   * Log collection completion
   */
  static logCollectionEnd(metrics: CollectionMetrics): CollectionMetrics {
    const endTime = new Date().toISOString();
    const duration = new Date(endTime).getTime() - new Date(metrics.startTime).getTime();

    const finalMetrics: CollectionMetrics = {
      ...metrics,
      endTime,
      duration
    };

    this.info('Data collection completed', {
      duration: `${Math.round(duration / 1000)}s`,
      totalUsers: metrics.totalUsers,
      successful: metrics.successfulCollections,
      failed: metrics.failedCollections,
      skipped: metrics.skippedCollections,
      errorCount: metrics.errors.length
    });

    // Log summary of errors if any
    if (metrics.errors.length > 0) {
      this.warn('Collection errors summary', {
        errorCount: metrics.errors.length,
        errors: metrics.errors.map(e => ({
          username: e.username,
          error: e.error,
          retryable: e.retryable
        }))
      });
    }

    return finalMetrics;
  }

  /**
   * Log user collection success
   */
  static logUserSuccess(username: string, context?: Record<string, unknown>): void {
    this.debug(`User data collected successfully: ${username}`, context);
  }

  /**
   * Log user collection failure
   */
  static logUserFailure(username: string, error: string, errorType?: string, retryable?: boolean): void {
    this.error(`User data collection failed: ${username}`, {
      username,
      error,
      errorType,
      retryable
    });
  }

  /**
   * Log user collection skip
   */
  static logUserSkip(username: string, reason: string): void {
    this.debug(`User data collection skipped: ${username}`, {
      username,
      reason
    });
  }

  /**
   * Log batch processing
   */
  static logBatchStart(batchIndex: number, totalBatches: number, batchSize: number): void {
    this.debug(`Processing batch ${batchIndex + 1}/${totalBatches}`, {
      batchIndex: batchIndex + 1,
      totalBatches,
      batchSize
    });
  }

  /**
   * Log batch completion
   */
  static logBatchEnd(batchIndex: number, totalBatches: number, successful: number, failed: number): void {
    this.debug(`Batch ${batchIndex + 1}/${totalBatches} completed`, {
      batchIndex: batchIndex + 1,
      totalBatches,
      successful,
      failed
    });
  }

  /**
   * Log rate limiting delay
   */
  static logRateLimit(delayMs: number, reason: string): void {
    this.info(`Rate limit delay: ${delayMs}ms`, {
      delayMs,
      reason
    });
  }

  /**
   * Get collection statistics
   */
  static getCollectionStats(): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    recentErrors: LogEntry[];
  } {
    const errorLogs = this.getLogsByLevel(LogLevel.ERROR);
    const warningLogs = this.getLogsByLevel(LogLevel.WARN);
    
    return {
      totalLogs: this.logs.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      recentErrors: errorLogs.slice(-10) // Last 10 errors
    };
  }
}

// Recovery utilities
export class DataCollectionRecovery {
  /**
   * Analyze collection errors and suggest recovery actions
   */
  static analyzeErrors(errors: Array<{ username: string; error: string; errorType?: string; retryable?: boolean }>): {
    retryableUsers: string[];
    permanentFailures: string[];
    rateLimitedUsers: string[];
    suspendedUsers: string[];
    recommendations: string[];
  } {
    const retryableUsers: string[] = [];
    const permanentFailures: string[] = [];
    const rateLimitedUsers: string[] = [];
    const suspendedUsers: string[] = [];
    const recommendations: string[] = [];

    errors.forEach(error => {
      const errorLower = error.error.toLowerCase();
      
      if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
        rateLimitedUsers.push(error.username);
        // Rate limited users are also retryable
        if (error.retryable !== false) {
          retryableUsers.push(error.username);
        }
      } else if (errorLower.includes('suspended') || errorLower.includes('private')) {
        suspendedUsers.push(error.username);
      } else if (errorLower.includes('not found') || errorLower.includes('deleted')) {
        permanentFailures.push(error.username);
      } else if (error.retryable !== false) {
        retryableUsers.push(error.username);
      } else {
        permanentFailures.push(error.username);
      }
    });

    // Generate recommendations
    if (rateLimitedUsers.length > 0) {
      recommendations.push(`${rateLimitedUsers.length} users hit rate limits - consider increasing delays between requests`);
    }
    
    if (suspendedUsers.length > 0) {
      recommendations.push(`${suspendedUsers.length} users are suspended/private - consider removing from tracking`);
    }
    
    if (permanentFailures.length > 0) {
      recommendations.push(`${permanentFailures.length} users have permanent failures - consider removing from tracking`);
    }
    
    if (retryableUsers.length > 0) {
      recommendations.push(`${retryableUsers.length} users can be retried in the next collection cycle`);
    }

    return {
      retryableUsers,
      permanentFailures,
      rateLimitedUsers,
      suspendedUsers,
      recommendations
    };
  }

  /**
   * Generate recovery report
   */
  static generateRecoveryReport(metrics: CollectionMetrics): string {
    const analysis = this.analyzeErrors(metrics.errors);
    const successRate = metrics.totalUsers > 0 ? 
      Math.round((metrics.successfulCollections / metrics.totalUsers) * 100) : 0;

    let report = `Data Collection Recovery Report\n`;
    report += `=====================================\n`;
    report += `Collection Time: ${metrics.startTime}\n`;
    report += `Duration: ${metrics.duration ? Math.round(metrics.duration / 1000) : 'N/A'}s\n`;
    report += `Success Rate: ${successRate}%\n`;
    report += `Total Users: ${metrics.totalUsers}\n`;
    report += `Successful: ${metrics.successfulCollections}\n`;
    report += `Failed: ${metrics.failedCollections}\n`;
    report += `Skipped: ${metrics.skippedCollections}\n\n`;

    if (analysis.recommendations.length > 0) {
      report += `Recommendations:\n`;
      analysis.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += `\n`;
    }

    if (analysis.retryableUsers.length > 0) {
      report += `Retryable Users (${analysis.retryableUsers.length}):\n`;
      analysis.retryableUsers.forEach(user => report += `- ${user}\n`);
      report += `\n`;
    }

    if (analysis.permanentFailures.length > 0) {
      report += `Permanent Failures (${analysis.permanentFailures.length}):\n`;
      analysis.permanentFailures.forEach(user => report += `- ${user}\n`);
      report += `\n`;
    }

    return report;
  }
}

// Export utility functions
export function logCollectionMetrics(metrics: CollectionMetrics): void {
  DataCollectionLogger.logCollectionEnd(metrics);
}

export function analyzeCollectionErrors(errors: Array<{ username: string; error: string; errorType?: string; retryable?: boolean }>) {
  return DataCollectionRecovery.analyzeErrors(errors);
}