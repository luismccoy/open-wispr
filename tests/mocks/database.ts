/**
 * Mock Database Manager for testing
 * 
 * This module provides an in-memory SQLite mock implementation of the
 * DatabaseManager used by the Ollie voice dictation app. It simulates
 * database operations without requiring actual file system access.
 * 
 * @module tests/mocks/database
 * 
 * Validates: Requirements 11.1-11.5 (Database Manager Testing)
 */

import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Transcription item stored in the database
 */
export interface TranscriptionItem {
  id: number;
  text: string;
  timestamp: string;
  created_at?: string;
}

/**
 * Result of save operation
 */
export interface SaveResult {
  id: number;
  success: boolean;
}

/**
 * Result of clear operation
 */
export interface ClearResult {
  cleared: number;
  success: boolean;
}

/**
 * Result of delete operation
 */
export interface DeleteResult {
  success: boolean;
}

/**
 * Internal state of the mock database
 */
export interface MockDatabaseState {
  transcriptions: TranscriptionItem[];
  nextId: number;
  isInitialized: boolean;
}

/**
 * Configuration options for creating a mock database
 */
export interface MockDatabaseOptions {
  /** Initial transcriptions to populate */
  initialTranscriptions?: TranscriptionItem[];
  /** Whether database should be initialized */
  initialized?: boolean;
  /** Whether to throw errors on operations */
  throwErrors?: boolean;
}

// ============================================================================
// Mock Database Manager Interface
// ============================================================================

/**
 * Complete interface for the mocked Database Manager
 */
export interface MockDatabaseManager {
  /** Initialize the database */
  initDatabase: ReturnType<typeof vi.fn<() => boolean>>;
  
  /** Save a transcription */
  saveTranscription: ReturnType<typeof vi.fn<(text: string) => SaveResult>>;
  
  /** Get transcriptions with optional limit */
  getTranscriptions: ReturnType<typeof vi.fn<(limit?: number) => TranscriptionItem[]>>;
  
  /** Delete a transcription by ID */
  deleteTranscription: ReturnType<typeof vi.fn<(id: number) => DeleteResult>>;
  
  /** Clear all transcriptions */
  clearTranscriptions: ReturnType<typeof vi.fn<() => ClearResult>>;
  
  /** Cleanup database resources */
  cleanup: ReturnType<typeof vi.fn<() => void>>;
  
  // Test helpers
  /** Get the current internal state */
  __getState: () => MockDatabaseState;
  
  /** Set partial internal state */
  __setState: (state: Partial<MockDatabaseState>) => void;
  
  /** Reset the mock to its initial state */
  __reset: () => void;
  
  /** Add a transcription directly to the state */
  __addTranscription: (item: Omit<TranscriptionItem, 'id'>) => TranscriptionItem;
  
  /** Simulate database not initialized error */
  __simulateNotInitialized: () => void;
  
  /** Restore normal operation after error simulation */
  __restoreNormalOperation: () => void;
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new mock Database Manager instance with configurable options
 * 
 * @param options - Configuration options for the mock
 * @returns A fully configured mock Database Manager
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const mockDB = createMockDatabaseManager();
 * 
 * // With initial data
 * const mockDB = createMockDatabaseManager({
 *   initialTranscriptions: [
 *     { id: 1, text: 'Hello', timestamp: '2024-01-01T00:00:00Z' }
 *   ]
 * });
 * 
 * // Simulate uninitialized database
 * const mockDB = createMockDatabaseManager({ initialized: false });
 * ```
 */
export function createMockDatabaseManager(options: MockDatabaseOptions = {}): MockDatabaseManager {
  // Initialize internal state
  let state: MockDatabaseState = {
    transcriptions: options.initialTranscriptions ? [...options.initialTranscriptions] : [],
    nextId: options.initialTranscriptions 
      ? Math.max(...options.initialTranscriptions.map(t => t.id), 0) + 1 
      : 1,
    isInitialized: options.initialized ?? true
  };

  // Error simulation flag
  let shouldThrowErrors = options.throwErrors ?? false;

  /**
   * Helper to check if database is initialized
   */
  const checkInitialized = () => {
    if (!state.isInitialized) {
      throw new Error('Database not initialized');
    }
  };

  const mockDB: MockDatabaseManager = {
    // ========================================================================
    // Database Initialization
    // ========================================================================
    initDatabase: vi.fn().mockImplementation(() => {
      if (shouldThrowErrors) {
        throw new Error('Database initialization failed');
      }
      state.isInitialized = true;
      return true;
    }),

    // ========================================================================
    // Save Transcription
    // ========================================================================
    saveTranscription: vi.fn().mockImplementation((text: string): SaveResult => {
      checkInitialized();
      
      if (shouldThrowErrors) {
        throw new Error('Error saving transcription');
      }

      const timestamp = new Date().toISOString();
      const item: TranscriptionItem = {
        id: state.nextId++,
        text,
        timestamp,
        created_at: timestamp
      };
      
      // Add to beginning of array (newest first)
      state.transcriptions.unshift(item);
      
      return { id: item.id, success: true };
    }),

    // ========================================================================
    // Get Transcriptions
    // ========================================================================
    getTranscriptions: vi.fn().mockImplementation((limit: number = 50): TranscriptionItem[] => {
      checkInitialized();
      
      if (shouldThrowErrors) {
        throw new Error('Error getting transcriptions');
      }

      // Return transcriptions in descending order by timestamp (newest first)
      // Already in correct order since we unshift on save
      return state.transcriptions.slice(0, limit);
    }),

    // ========================================================================
    // Delete Transcription
    // ========================================================================
    deleteTranscription: vi.fn().mockImplementation((id: number): DeleteResult => {
      checkInitialized();
      
      if (shouldThrowErrors) {
        throw new Error('Error deleting transcription');
      }

      const index = state.transcriptions.findIndex(t => t.id === id);
      if (index !== -1) {
        state.transcriptions.splice(index, 1);
        return { success: true };
      }
      
      return { success: false };
    }),

    // ========================================================================
    // Clear Transcriptions
    // ========================================================================
    clearTranscriptions: vi.fn().mockImplementation((): ClearResult => {
      checkInitialized();
      
      if (shouldThrowErrors) {
        throw new Error('Error clearing transcriptions');
      }

      const count = state.transcriptions.length;
      state.transcriptions = [];
      
      return { cleared: count, success: true };
    }),

    // ========================================================================
    // Cleanup
    // ========================================================================
    cleanup: vi.fn().mockImplementation(() => {
      // In mock, just reset state
      state.transcriptions = [];
      state.isInitialized = false;
    }),

    // ========================================================================
    // Test Helpers
    // ========================================================================
    
    /**
     * Get the current internal state
     */
    __getState: () => ({
      transcriptions: [...state.transcriptions],
      nextId: state.nextId,
      isInitialized: state.isInitialized
    }),

    /**
     * Set partial internal state
     */
    __setState: (newState: Partial<MockDatabaseState>) => {
      if (newState.transcriptions !== undefined) {
        state.transcriptions = [...newState.transcriptions];
      }
      if (newState.nextId !== undefined) {
        state.nextId = newState.nextId;
      }
      if (newState.isInitialized !== undefined) {
        state.isInitialized = newState.isInitialized;
      }
    },

    /**
     * Reset the mock to its initial state
     */
    __reset: () => {
      state = {
        transcriptions: options.initialTranscriptions ? [...options.initialTranscriptions] : [],
        nextId: options.initialTranscriptions 
          ? Math.max(...options.initialTranscriptions.map(t => t.id), 0) + 1 
          : 1,
        isInitialized: options.initialized ?? true
      };
      shouldThrowErrors = options.throwErrors ?? false;
    },

    /**
     * Add a transcription directly to the state
     */
    __addTranscription: (item: Omit<TranscriptionItem, 'id'>): TranscriptionItem => {
      const newItem: TranscriptionItem = {
        ...item,
        id: state.nextId++
      };
      state.transcriptions.unshift(newItem);
      return newItem;
    },

    /**
     * Simulate database not initialized error
     */
    __simulateNotInitialized: () => {
      state.isInitialized = false;
    },

    /**
     * Restore normal operation after error simulation
     */
    __restoreNormalOperation: () => {
      state.isInitialized = true;
      shouldThrowErrors = false;
    }
  };

  return mockDB;
}

// ============================================================================
// Pre-configured Mock Factories
// ============================================================================

/**
 * Creates a mock with pre-populated transcriptions
 */
export function createMockWithTranscriptions(transcriptions: TranscriptionItem[]): MockDatabaseManager {
  return createMockDatabaseManager({
    initialTranscriptions: transcriptions
  });
}

/**
 * Creates a mock that simulates an uninitialized database
 */
export function createUninitializedMock(): MockDatabaseManager {
  return createMockDatabaseManager({
    initialized: false
  });
}

/**
 * Creates a mock that throws errors on all operations
 */
export function createErrorMock(): MockDatabaseManager {
  return createMockDatabaseManager({
    throwErrors: true,
    initialized: true
  });
}

/**
 * Creates a mock with a large dataset for performance testing
 */
export function createLargeDatasetMock(count: number = 1000): MockDatabaseManager {
  const transcriptions: TranscriptionItem[] = [];
  const baseTime = Date.now();
  
  for (let i = 0; i < count; i++) {
    transcriptions.push({
      id: i + 1,
      text: `Transcription ${i + 1}`,
      timestamp: new Date(baseTime - i * 60000).toISOString(), // 1 minute apart
      created_at: new Date(baseTime - i * 60000).toISOString()
    });
  }
  
  return createMockDatabaseManager({
    initialTranscriptions: transcriptions
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default createMockDatabaseManager;
