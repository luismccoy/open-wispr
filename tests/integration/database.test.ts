/**
 * Integration Tests for Database Manager
 * 
 * Tests the database operations for storing and retrieving transcription history.
 * These tests use the mock database manager to verify CRUD operations work correctly.
 * 
 * @module tests/integration/database.test.ts
 * 
 * Validates: Requirements 11.1-11.5
 * - 11.1: WHEN saveTranscription is called, THE Database_Manager SHALL insert a new record with timestamp
 * - 11.2: WHEN getTranscriptions is called, THE Database_Manager SHALL return records ordered by timestamp descending
 * - 11.3: WHEN deleteTranscription is called with a valid ID, THE Database_Manager SHALL remove the record
 * - 11.4: WHEN clearTranscriptions is called, THE Database_Manager SHALL remove all records
 * - 11.5: IF the database file does not exist, THEN THE Database_Manager SHALL create it on initialization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockDatabaseManager,
  createUninitializedMock,
  createErrorMock,
  createLargeDatasetMock,
  type MockDatabaseManager,
  type TranscriptionItem
} from '../mocks/database';

// ============================================================================
// Test Setup
// ============================================================================

describe('Database Manager Integration Tests', () => {
  let mockDB: MockDatabaseManager;

  beforeEach(() => {
    // Create fresh mock instance for each test
    mockDB = createMockDatabaseManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockDB.__reset();
  });

  // ==========================================================================
  // Requirement 11.5: Database Initialization
  // ==========================================================================
  describe('Database Initialization (Requirement 11.5)', () => {
    it('should create database on initialization if it does not exist', () => {
      // Arrange - create uninitialized mock
      const uninitializedDB = createUninitializedMock();
      
      // Act - initialize the database
      const result = uninitializedDB.initDatabase();
      
      // Assert
      expect(result).toBe(true);
      expect(uninitializedDB.__getState().isInitialized).toBe(true);
    });

    it('should be initialized by default when created', () => {
      // Assert
      const state = mockDB.__getState();
      expect(state.isInitialized).toBe(true);
    });

    it('should start with empty transcriptions table', () => {
      // Assert
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
      expect(state.nextId).toBe(1);
    });

    it('should throw error when operations called on uninitialized database', () => {
      // Arrange
      const uninitializedDB = createUninitializedMock();
      
      // Act & Assert
      expect(() => uninitializedDB.saveTranscription('test')).toThrow('Database not initialized');
      expect(() => uninitializedDB.getTranscriptions()).toThrow('Database not initialized');
      expect(() => uninitializedDB.deleteTranscription(1)).toThrow('Database not initialized');
      expect(() => uninitializedDB.clearTranscriptions()).toThrow('Database not initialized');
    });

    it('should allow operations after initialization', () => {
      // Arrange
      const uninitializedDB = createUninitializedMock();
      
      // Act - initialize
      uninitializedDB.initDatabase();
      
      // Assert - operations should work
      const result = uninitializedDB.saveTranscription('test');
      expect(result.success).toBe(true);
    });

    it('should handle re-initialization gracefully', () => {
      // Act - initialize multiple times
      const result1 = mockDB.initDatabase();
      const result2 = mockDB.initDatabase();
      
      // Assert
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  // ==========================================================================
  // Requirement 11.1: saveTranscription
  // ==========================================================================
  describe('saveTranscription (Requirement 11.1)', () => {
    it('should insert a new record with timestamp', () => {
      // Arrange
      const text = 'Hello, this is a test transcription';
      const beforeSave = Date.now();
      
      // Act
      const result = mockDB.saveTranscription(text);
      const afterSave = Date.now();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      
      // Verify timestamp was set
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe(text);
      
      const timestamp = new Date(transcriptions[0].timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(timestamp).toBeLessThanOrEqual(afterSave);
    });

    it('should return a unique ID for each saved transcription', () => {
      // Act
      const result1 = mockDB.saveTranscription('First transcription');
      const result2 = mockDB.saveTranscription('Second transcription');
      const result3 = mockDB.saveTranscription('Third transcription');
      
      // Assert
      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
      expect(result3.id).toBe(3);
      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
    });

    it('should save empty text', () => {
      // Act
      const result = mockDB.saveTranscription('');
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe('');
    });

    it('should save text with special characters', () => {
      // Arrange
      const specialText = 'Hello! @#$%^&*() "quotes" \'apostrophes\' <tags> 日本語';
      
      // Act
      const result = mockDB.saveTranscription(specialText);
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(specialText);
    });

    it('should save long text', () => {
      // Arrange
      const longText = 'A'.repeat(10000);
      
      // Act
      const result = mockDB.saveTranscription(longText);
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(longText);
    });

    it('should save text with newlines and tabs', () => {
      // Arrange
      const multilineText = 'Line 1\nLine 2\n\tIndented line\nLine 4';
      
      // Act
      const result = mockDB.saveTranscription(multilineText);
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(multilineText);
    });

    it('should save unicode text', () => {
      // Arrange
      const unicodeText = '日本語 中文 한국어 العربية 🎉🚀💻';
      
      // Act
      const result = mockDB.saveTranscription(unicodeText);
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(unicodeText);
    });

    it('should include created_at field', () => {
      // Act
      mockDB.saveTranscription('Test text');
      
      // Assert
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0]).toHaveProperty('created_at');
      expect(transcriptions[0].created_at).toBe(transcriptions[0].timestamp);
    });

    it('should throw error when database has errors', () => {
      // Arrange
      const errorDB = createErrorMock();
      
      // Act & Assert
      expect(() => errorDB.saveTranscription('test')).toThrow('Error saving transcription');
    });
  });

  // ==========================================================================
  // Requirement 11.2: getTranscriptions ordering
  // ==========================================================================
  describe('getTranscriptions ordering (Requirement 11.2)', () => {
    it('should return records ordered by timestamp descending (newest first)', () => {
      // Arrange - save transcriptions in order
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      // Act
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert - newest should be first
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('Second');
      expect(transcriptions[2].text).toBe('First');
    });

    it('should return empty array when no transcriptions exist', () => {
      // Act
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert
      expect(transcriptions).toEqual([]);
    });

    it('should respect the limit parameter', () => {
      // Arrange - add more transcriptions than the limit
      for (let i = 0; i < 10; i++) {
        mockDB.saveTranscription(`Transcription ${i}`);
      }
      
      // Act
      const transcriptions = mockDB.getTranscriptions(5);
      
      // Assert
      expect(transcriptions).toHaveLength(5);
    });

    it('should use default limit of 50', () => {
      // Arrange - add 60 transcriptions
      for (let i = 0; i < 60; i++) {
        mockDB.saveTranscription(`Transcription ${i}`);
      }
      
      // Act
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert
      expect(transcriptions.length).toBeLessThanOrEqual(50);
    });

    it('should return all items if count is less than limit', () => {
      // Arrange
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      
      // Act
      const transcriptions = mockDB.getTranscriptions(100);
      
      // Assert
      expect(transcriptions).toHaveLength(2);
    });

    it('should return transcriptions with all required fields', () => {
      // Arrange
      mockDB.saveTranscription('Test transcription');
      
      // Act
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert
      expect(transcriptions[0]).toHaveProperty('id');
      expect(transcriptions[0]).toHaveProperty('text');
      expect(transcriptions[0]).toHaveProperty('timestamp');
      expect(typeof transcriptions[0].id).toBe('number');
      expect(typeof transcriptions[0].text).toBe('string');
      expect(typeof transcriptions[0].timestamp).toBe('string');
    });

    it('should handle limit of 0', () => {
      // Arrange
      mockDB.saveTranscription('Test');
      
      // Act
      const transcriptions = mockDB.getTranscriptions(0);
      
      // Assert
      expect(transcriptions).toEqual([]);
    });

    it('should maintain correct order with large dataset', () => {
      // Arrange
      const largeDB = createLargeDatasetMock(100);
      
      // Act
      const transcriptions = largeDB.getTranscriptions(100);
      
      // Assert - verify timestamps are in descending order
      for (let i = 0; i < transcriptions.length - 1; i++) {
        const current = new Date(transcriptions[i].timestamp).getTime();
        const next = new Date(transcriptions[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should throw error when database has errors', () => {
      // Arrange
      const errorDB = createErrorMock();
      
      // Act & Assert
      expect(() => errorDB.getTranscriptions()).toThrow('Error getting transcriptions');
    });
  });

  // ==========================================================================
  // Requirement 11.3: deleteTranscription
  // ==========================================================================
  describe('deleteTranscription (Requirement 11.3)', () => {
    it('should remove the record when called with a valid ID', () => {
      // Arrange
      const { id } = mockDB.saveTranscription('To be deleted');
      
      // Act
      const result = mockDB.deleteTranscription(id);
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should return false for non-existent ID', () => {
      // Act
      const result = mockDB.deleteTranscription(999);
      
      // Assert
      expect(result.success).toBe(false);
    });

    it('should only delete the specified transcription', () => {
      // Arrange
      const id1 = mockDB.saveTranscription('First').id;
      const id2 = mockDB.saveTranscription('Second').id;
      const id3 = mockDB.saveTranscription('Third').id;
      
      // Act
      mockDB.deleteTranscription(id2);
      
      // Assert
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(2);
      expect(transcriptions.find(t => t.id === id1)).toBeDefined();
      expect(transcriptions.find(t => t.id === id2)).toBeUndefined();
      expect(transcriptions.find(t => t.id === id3)).toBeDefined();
    });

    it('should handle deleting from empty database', () => {
      // Act
      const result = mockDB.deleteTranscription(1);
      
      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle deleting same ID twice', () => {
      // Arrange
      const { id } = mockDB.saveTranscription('Test');
      
      // Act
      const result1 = mockDB.deleteTranscription(id);
      const result2 = mockDB.deleteTranscription(id);
      
      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
    });

    it('should maintain order after deletion', () => {
      // Arrange
      mockDB.saveTranscription('First');
      const { id } = mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      // Act
      mockDB.deleteTranscription(id);
      
      // Assert
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(2);
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('First');
    });

    it('should allow saving after deletion', () => {
      // Arrange
      const { id } = mockDB.saveTranscription('To delete');
      mockDB.deleteTranscription(id);
      
      // Act
      const result = mockDB.saveTranscription('New transcription');
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('New transcription');
    });

    it('should throw error when database has errors', () => {
      // Arrange
      const errorDB = createErrorMock();
      
      // Act & Assert
      expect(() => errorDB.deleteTranscription(1)).toThrow('Error deleting transcription');
    });
  });

  // ==========================================================================
  // Requirement 11.4: clearTranscriptions
  // ==========================================================================
  describe('clearTranscriptions (Requirement 11.4)', () => {
    it('should remove all records', () => {
      // Arrange
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      // Act
      const result = mockDB.clearTranscriptions();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(3);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should return 0 when clearing empty database', () => {
      // Act
      const result = mockDB.clearTranscriptions();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(0);
    });

    it('should allow saving after clear', () => {
      // Arrange
      mockDB.saveTranscription('Before clear');
      mockDB.clearTranscriptions();
      
      // Act
      const result = mockDB.saveTranscription('After clear');
      
      // Assert
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('After clear');
    });

    it('should reset to empty state', () => {
      // Arrange
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      
      // Act
      mockDB.clearTranscriptions();
      
      // Assert
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
    });

    it('should handle clearing large dataset', () => {
      // Arrange
      const largeDB = createLargeDatasetMock(1000);
      
      // Act
      const result = largeDB.clearTranscriptions();
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(1000);
      
      const transcriptions = largeDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should be callable multiple times', () => {
      // Arrange
      mockDB.saveTranscription('Test');
      
      // Act
      const result1 = mockDB.clearTranscriptions();
      const result2 = mockDB.clearTranscriptions();
      
      // Assert
      expect(result1.cleared).toBe(1);
      expect(result2.cleared).toBe(0);
    });

    it('should throw error when database has errors', () => {
      // Arrange
      const errorDB = createErrorMock();
      
      // Act & Assert
      expect(() => errorDB.clearTranscriptions()).toThrow('Error clearing transcriptions');
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================
  describe('Integration Scenarios', () => {
    it('should handle complete CRUD cycle', () => {
      // Create
      const { id } = mockDB.saveTranscription('Test item');
      expect(id).toBe(1);
      
      // Read
      let transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('Test item');
      
      // Update (via delete and create)
      mockDB.deleteTranscription(id);
      mockDB.saveTranscription('Updated item');
      
      transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('Updated item');
      
      // Delete
      mockDB.clearTranscriptions();
      transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should maintain consistency across operations', () => {
      // Add multiple items
      const ids = [
        mockDB.saveTranscription('First').id,
        mockDB.saveTranscription('Second').id,
        mockDB.saveTranscription('Third').id
      ];
      
      // Verify count
      expect(mockDB.getTranscriptions()).toHaveLength(3);
      
      // Delete one
      mockDB.deleteTranscription(ids[1]);
      expect(mockDB.getTranscriptions()).toHaveLength(2);
      
      // Add another
      mockDB.saveTranscription('Fourth');
      expect(mockDB.getTranscriptions()).toHaveLength(3);
      
      // Clear all
      const result = mockDB.clearTranscriptions();
      expect(result.cleared).toBe(3);
      expect(mockDB.getTranscriptions()).toHaveLength(0);
    });

    it('should handle rapid successive operations', () => {
      // Rapidly add items
      for (let i = 0; i < 10; i++) {
        mockDB.saveTranscription(`Item ${i}`);
      }
      
      expect(mockDB.getTranscriptions()).toHaveLength(10);
      
      // Rapidly delete items
      const transcriptions = mockDB.getTranscriptions();
      for (let i = 0; i < 5; i++) {
        mockDB.deleteTranscription(transcriptions[i].id);
      }
      
      expect(mockDB.getTranscriptions()).toHaveLength(5);
    });

    it('should handle save and retrieve workflow', () => {
      // Arrange
      const text = 'Test transcription for workflow';
      
      // Act - Save
      const saveResult = mockDB.saveTranscription(text);
      
      // Act - Retrieve
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert
      expect(saveResult.id).toBeDefined();
      expect(transcriptions.length).toBe(1);
      expect(transcriptions[0].text).toBe(text);
      expect(transcriptions[0].id).toBe(saveResult.id);
    });

    it('should handle delete workflow', () => {
      // Arrange
      const saveResult = mockDB.saveTranscription('To be deleted');
      
      // Act - Delete
      const deleteResult = mockDB.deleteTranscription(saveResult.id);
      
      // Act - Verify deletion
      const transcriptions = mockDB.getTranscriptions();
      
      // Assert
      expect(deleteResult.success).toBe(true);
      expect(transcriptions.length).toBe(0);
    });

    it('should handle interleaved save and delete operations', () => {
      // Save some items
      const id1 = mockDB.saveTranscription('Item 1').id;
      const id2 = mockDB.saveTranscription('Item 2').id;
      
      // Delete first item
      mockDB.deleteTranscription(id1);
      
      // Save more items
      const id3 = mockDB.saveTranscription('Item 3').id;
      const id4 = mockDB.saveTranscription('Item 4').id;
      
      // Delete second item
      mockDB.deleteTranscription(id2);
      
      // Verify final state
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(2);
      expect(transcriptions.find(t => t.id === id3)).toBeDefined();
      expect(transcriptions.find(t => t.id === id4)).toBeDefined();
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================
  describe('Cleanup', () => {
    it('should clear transcriptions on cleanup', () => {
      // Arrange
      mockDB.saveTranscription('Test');
      
      // Act
      mockDB.cleanup();
      
      // Assert
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
    });

    it('should mark database as uninitialized on cleanup', () => {
      // Act
      mockDB.cleanup();
      
      // Assert
      const state = mockDB.__getState();
      expect(state.isInitialized).toBe(false);
    });

    it('should require re-initialization after cleanup', () => {
      // Arrange
      mockDB.cleanup();
      
      // Act & Assert
      expect(() => mockDB.saveTranscription('test')).toThrow('Database not initialized');
    });
  });
});
