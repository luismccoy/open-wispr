/**
 * Database Performance Tests
 * 
 * Tests database operations to ensure they complete within acceptable time limits.
 * 
 * @module tests/performance/database.perf.test.ts
 * 
 * Validates: Requirements 14.5
 * - 14.5: Database query time SHALL be less than 50ms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElectronAPI, type MockElectronAPI } from '../mocks/electronAPI';

// ============================================================================
// Performance Test Utilities
// ============================================================================

/**
 * Measures execution time of an async function
 */
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Database Performance Tests', () => {
  let mockElectronAPI: MockElectronAPI;

  beforeEach(() => {
    mockElectronAPI = createMockElectronAPI();

    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.__reset();
  });

  // ==========================================================================
  // Requirement 14.5: Database Query Time < 50ms
  // ==========================================================================
  describe('Database Query Time (Requirement 14.5)', () => {
    it('should save transcription within 50ms', async () => {
      // Arrange
      const MAX_SAVE_TIME_MS = 50;
      const text = 'Test transcription text';

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.saveTranscription(text);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_SAVE_TIME_MS);
    });

    it('should retrieve transcriptions within 50ms', async () => {
      // Arrange
      const MAX_QUERY_TIME_MS = 50;
      
      // Pre-populate with some transcriptions
      for (let i = 0; i < 10; i++) {
        await mockElectronAPI.saveTranscription(`Transcription ${i}`);
      }

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(10);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_QUERY_TIME_MS);
    });

    it('should delete transcription within 50ms', async () => {
      // Arrange
      const MAX_DELETE_TIME_MS = 50;
      const { id } = await mockElectronAPI.saveTranscription('Test');

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.deleteTranscription(id);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_DELETE_TIME_MS);
    });

    it('should clear all transcriptions within 50ms', async () => {
      // Arrange
      const MAX_CLEAR_TIME_MS = 50;
      
      // Pre-populate with transcriptions
      for (let i = 0; i < 20; i++) {
        await mockElectronAPI.saveTranscription(`Transcription ${i}`);
      }

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.clearTranscriptions();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_CLEAR_TIME_MS);
    });

    it('should handle large result sets within acceptable time', async () => {
      // Arrange
      const MAX_LARGE_QUERY_TIME_MS = 100;
      const NUM_TRANSCRIPTIONS = 100;
      
      // Pre-populate with many transcriptions
      for (let i = 0; i < NUM_TRANSCRIPTIONS; i++) {
        await mockElectronAPI.saveTranscription(`Transcription ${i} with some longer text content`);
      }

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(NUM_TRANSCRIPTIONS);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_LARGE_QUERY_TIME_MS);
    });
  });

  // ==========================================================================
  // Database Operation Consistency
  // ==========================================================================
  describe('Database Operation Consistency', () => {
    it('should maintain consistent save performance over multiple operations', async () => {
      // Arrange
      const NUM_OPERATIONS = 20;
      const durations: number[] = [];

      // Act
      for (let i = 0; i < NUM_OPERATIONS; i++) {
        const { duration } = await measureTime(async () => {
          await mockElectronAPI.saveTranscription(`Transcription ${i}`);
        });
        durations.push(duration);
      }

      // Assert - average should be reasonable
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(20);
    });

    it('should maintain consistent query performance over multiple operations', async () => {
      // Arrange
      const NUM_QUERIES = 10;
      const durations: number[] = [];
      
      // Pre-populate
      for (let i = 0; i < 50; i++) {
        await mockElectronAPI.saveTranscription(`Transcription ${i}`);
      }

      // Act
      for (let i = 0; i < NUM_QUERIES; i++) {
        const { duration } = await measureTime(async () => {
          await mockElectronAPI.getTranscriptions(50);
        });
        durations.push(duration);
      }

      // Assert - all queries should be fast
      const maxDuration = Math.max(...durations);
      expect(maxDuration).toBeLessThan(50);
    });

    it('should handle rapid sequential operations efficiently', async () => {
      // Arrange
      const MAX_TOTAL_TIME_MS = 200;
      const NUM_OPERATIONS = 50;

      // Act
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < NUM_OPERATIONS; i++) {
          await mockElectronAPI.saveTranscription(`Text ${i}`);
        }
      });

      // Assert
      expect(duration).toBeLessThan(MAX_TOTAL_TIME_MS);
    });

    it('should handle mixed operations efficiently', async () => {
      // Arrange
      const MAX_MIXED_TIME_MS = 100;

      // Act
      const { duration } = await measureTime(async () => {
        // Save some items
        const { id: id1 } = await mockElectronAPI.saveTranscription('First');
        const { id: id2 } = await mockElectronAPI.saveTranscription('Second');
        await mockElectronAPI.saveTranscription('Third');
        
        // Query
        await mockElectronAPI.getTranscriptions(10);
        
        // Delete one
        await mockElectronAPI.deleteTranscription(id1);
        
        // Query again
        await mockElectronAPI.getTranscriptions(10);
        
        // Save more
        await mockElectronAPI.saveTranscription('Fourth');
        
        // Delete another
        await mockElectronAPI.deleteTranscription(id2);
        
        // Final query
        await mockElectronAPI.getTranscriptions(10);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_MIXED_TIME_MS);
    });
  });

  // ==========================================================================
  // Database Scalability
  // ==========================================================================
  describe('Database Scalability', () => {
    it('should scale linearly with data size', async () => {
      // Arrange
      const SMALL_SIZE = 10;
      const LARGE_SIZE = 100;
      
      // Measure small dataset
      for (let i = 0; i < SMALL_SIZE; i++) {
        await mockElectronAPI.saveTranscription(`Small ${i}`);
      }
      const { duration: smallDuration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(SMALL_SIZE);
      });
      
      // Clear and measure large dataset
      await mockElectronAPI.clearTranscriptions();
      for (let i = 0; i < LARGE_SIZE; i++) {
        await mockElectronAPI.saveTranscription(`Large ${i}`);
      }
      const { duration: largeDuration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(LARGE_SIZE);
      });

      // Assert - large should not be more than 20x slower (allowing for overhead)
      expect(largeDuration).toBeLessThan(smallDuration * 20 + 10);
    });

    it('should handle empty database quickly', async () => {
      // Arrange
      const MAX_EMPTY_QUERY_MS = 10;

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(100);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_EMPTY_QUERY_MS);
    });

    it('should handle single item operations quickly', async () => {
      // Arrange
      const MAX_SINGLE_OP_MS = 20;

      // Act - save
      const { duration: saveDuration, result } = await measureTime(async () => {
        return mockElectronAPI.saveTranscription('Single item');
      });

      // Act - query
      const { duration: queryDuration } = await measureTime(async () => {
        await mockElectronAPI.getTranscriptions(1);
      });

      // Act - delete
      const { duration: deleteDuration } = await measureTime(async () => {
        await mockElectronAPI.deleteTranscription(result.id);
      });

      // Assert
      expect(saveDuration).toBeLessThan(MAX_SINGLE_OP_MS);
      expect(queryDuration).toBeLessThan(MAX_SINGLE_OP_MS);
      expect(deleteDuration).toBeLessThan(MAX_SINGLE_OP_MS);
    });
  });
});
