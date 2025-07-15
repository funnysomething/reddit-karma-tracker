import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  DataCollectionLogger, 
  DataCollectionRecovery, 
  LogLevel,
  CollectionMetrics 
} from '../logging';

describe('DataCollectionLogger', () => {
  beforeEach(() => {
    // Clear logs before each test
    DataCollectionLogger.clearLogs();
    
    // Mock console methods to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Basic logging functionality', () => {
    it('should log messages with different levels', () => {
      // Act
      DataCollectionLogger.debug('Debug message', { key: 'value' });
      DataCollectionLogger.info('Info message');
      DataCollectionLogger.warn('Warning message');
      DataCollectionLogger.error('Error message', {}, new Error('Test error'));

      // Assert
      const logs = DataCollectionLogger.getRecentLogs(10);
      expect(logs).toHaveLength(4);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[1].level).toBe(LogLevel.INFO);
      expect(logs[2].level).toBe(LogLevel.WARN);
      expect(logs[3].level).toBe(LogLevel.ERROR);
    });

    it('should include context and timestamps in log entries', () => {
      // Arrange
      const context = { username: 'testuser', attempt: 1 };

      // Act
      DataCollectionLogger.info('Test message', context);

      // Assert
      const logs = DataCollectionLogger.getRecentLogs(1);
      expect(logs[0].message).toBe('Test message');
      expect(logs[0].context).toEqual(context);
      expect(logs[0].timestamp).toBeDefined();
      expect(new Date(logs[0].timestamp)).toBeInstanceOf(Date);
    });

    it('should limit the number of stored logs', () => {
      // Act - Log more than the max limit (1000)
      for (let i = 0; i < 1100; i++) {
        DataCollectionLogger.info(`Message ${i}`);
      }

      // Assert
      const logs = DataCollectionLogger.getRecentLogs(2000);
      expect(logs.length).toBeLessThanOrEqual(1000);
      
      // Should keep the most recent logs
      expect(logs[logs.length - 1].message).toBe('Message 1099');
    });
  });

  describe('Log filtering and retrieval', () => {
    beforeEach(() => {
      DataCollectionLogger.debug('Debug message');
      DataCollectionLogger.info('Info message 1');
      DataCollectionLogger.info('Info message 2');
      DataCollectionLogger.warn('Warning message');
      DataCollectionLogger.error('Error message');
    });

    it('should filter logs by level', () => {
      // Act & Assert
      const errorLogs = DataCollectionLogger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');

      const infoLogs = DataCollectionLogger.getLogsByLevel(LogLevel.INFO);
      expect(infoLogs).toHaveLength(2);
    });

    it('should return recent logs with specified count', () => {
      // Act
      const recentLogs = DataCollectionLogger.getRecentLogs(3);

      // Assert
      expect(recentLogs).toHaveLength(3);
      expect(recentLogs[2].message).toBe('Error message'); // Most recent
    });

    it('should provide collection statistics', () => {
      // Act
      const stats = DataCollectionLogger.getCollectionStats();

      // Assert
      expect(stats.totalLogs).toBe(5);
      expect(stats.errorCount).toBe(1);
      expect(stats.warningCount).toBe(1);
      expect(stats.recentErrors).toHaveLength(1);
    });
  });

  describe('Collection-specific logging', () => {
    it('should log collection start and return metrics', () => {
      // Act
      const metrics = DataCollectionLogger.logCollectionStart(5);

      // Assert
      expect(metrics.totalUsers).toBe(5);
      expect(metrics.successfulCollections).toBe(0);
      expect(metrics.failedCollections).toBe(0);
      expect(metrics.skippedCollections).toBe(0);
      expect(metrics.errors).toHaveLength(0);
      expect(metrics.startTime).toBeDefined();
      expect(new Date(metrics.startTime)).toBeInstanceOf(Date);
    });

    it('should log collection end and calculate duration', () => {
      // Arrange
      const startMetrics = DataCollectionLogger.logCollectionStart(3);
      startMetrics.successfulCollections = 2;
      startMetrics.failedCollections = 1;
      startMetrics.errors = [{ username: 'user1', error: 'Test error' }];

      // Wait a small amount to ensure duration > 0
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // Small delay
      }

      // Act
      const finalMetrics = DataCollectionLogger.logCollectionEnd(startMetrics);

      // Assert
      expect(finalMetrics.endTime).toBeDefined();
      expect(finalMetrics.duration).toBeGreaterThan(0);
      expect(finalMetrics.totalUsers).toBe(3);
      expect(finalMetrics.successfulCollections).toBe(2);
      expect(finalMetrics.failedCollections).toBe(1);
    });

    it('should log user-specific events', () => {
      // Act
      DataCollectionLogger.logUserSuccess('user1', { karma: 1000 });
      DataCollectionLogger.logUserFailure('user2', 'Not found', 'USER_NOT_FOUND', false);
      DataCollectionLogger.logUserSkip('user3', 'Recently collected');

      // Assert
      const logs = DataCollectionLogger.getRecentLogs(10);
      expect(logs.some(log => log.message.includes('user1') && log.level === LogLevel.DEBUG)).toBe(true);
      expect(logs.some(log => log.message.includes('user2') && log.level === LogLevel.ERROR)).toBe(true);
      expect(logs.some(log => log.message.includes('user3') && log.level === LogLevel.DEBUG)).toBe(true);
    });

    it('should log batch processing events', () => {
      // Act
      DataCollectionLogger.logBatchStart(0, 3, 5);
      DataCollectionLogger.logBatchEnd(0, 3, 4, 1);
      DataCollectionLogger.logRateLimit(2000, 'batch delay');

      // Assert
      const logs = DataCollectionLogger.getRecentLogs(10);
      expect(logs.some(log => log.message.includes('Processing batch 1/3'))).toBe(true);
      expect(logs.some(log => log.message.includes('Batch 1/3 completed'))).toBe(true);
      expect(logs.some(log => log.message.includes('Rate limit delay: 2000ms'))).toBe(true);
    });
  });
});

describe('DataCollectionRecovery', () => {
  describe('Error analysis', () => {
    it('should classify different types of errors', () => {
      // Arrange
      const errors = [
        { username: 'user1', error: 'Rate limit exceeded', retryable: true },
        { username: 'user2', error: 'User not found', retryable: false },
        { username: 'user3', error: 'User suspended', retryable: false },
        { username: 'user4', error: 'Network timeout', retryable: true },
        { username: 'user5', error: 'Too many requests', retryable: true }
      ];

      // Act
      const analysis = DataCollectionRecovery.analyzeErrors(errors);

      // Assert
      expect(analysis.rateLimitedUsers).toEqual(['user1', 'user5']);
      expect(analysis.permanentFailures).toEqual(['user2']);
      expect(analysis.suspendedUsers).toEqual(['user3']);
      expect(analysis.retryableUsers).toEqual(['user1', 'user4', 'user5']); // Rate limited users are also retryable
      expect(analysis.recommendations).toHaveLength(4);
    });

    it('should generate appropriate recommendations', () => {
      // Arrange
      const errors = [
        { username: 'user1', error: 'Rate limit exceeded' },
        { username: 'user2', error: 'Rate limit exceeded' },
        { username: 'user3', error: 'User suspended' }
      ];

      // Act
      const analysis = DataCollectionRecovery.analyzeErrors(errors);

      // Assert
      expect(analysis.recommendations).toContain('2 users hit rate limits - consider increasing delays between requests');
      expect(analysis.recommendations).toContain('1 users are suspended/private - consider removing from tracking');
    });
  });

  describe('Recovery report generation', () => {
    it('should generate comprehensive recovery report', () => {
      // Arrange
      const metrics: CollectionMetrics = {
        startTime: '2024-01-01T12:00:00Z',
        endTime: '2024-01-01T12:01:00Z',
        duration: 60000,
        totalUsers: 5,
        successfulCollections: 3,
        failedCollections: 2,
        skippedCollections: 0,
        errors: [
          { username: 'user1', error: 'Rate limit exceeded', retryable: true },
          { username: 'user2', error: 'User not found', retryable: false }
        ]
      };

      // Act
      const report = DataCollectionRecovery.generateRecoveryReport(metrics);

      // Assert
      expect(report).toContain('Data Collection Recovery Report');
      expect(report).toContain('Success Rate: 60%');
      expect(report).toContain('Total Users: 5');
      expect(report).toContain('Successful: 3');
      expect(report).toContain('Failed: 2');
      expect(report).toContain('Duration: 60s');
      expect(report).toContain('Recommendations:');
      expect(report).toContain('Retryable Users (1):');
      expect(report).toContain('- user1');
      expect(report).toContain('Permanent Failures (1):');
      expect(report).toContain('- user2');
    });

    it('should handle metrics without duration', () => {
      // Arrange
      const metrics: CollectionMetrics = {
        startTime: '2024-01-01T12:00:00Z',
        totalUsers: 2,
        successfulCollections: 2,
        failedCollections: 0,
        skippedCollections: 0,
        errors: []
      };

      // Act
      const report = DataCollectionRecovery.generateRecoveryReport(metrics);

      // Assert
      expect(report).toContain('Duration: N/As');
      expect(report).toContain('Success Rate: 100%');
    });

    it('should handle zero users gracefully', () => {
      // Arrange
      const metrics: CollectionMetrics = {
        startTime: '2024-01-01T12:00:00Z',
        totalUsers: 0,
        successfulCollections: 0,
        failedCollections: 0,
        skippedCollections: 0,
        errors: []
      };

      // Act
      const report = DataCollectionRecovery.generateRecoveryReport(metrics);

      // Assert
      expect(report).toContain('Success Rate: 0%');
      expect(report).toContain('Total Users: 0');
    });
  });
});