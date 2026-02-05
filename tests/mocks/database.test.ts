/**
 * Tests for Database Manager Mock
 * 
 * Validates: Requirements 11.1-11.5 (Database Manager Testing)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockDatabaseManager,
  createMockWithTranscriptions,
  createUninitializedMock,
  createErrorMock,
  createLargeDatasetMock,
  type MockDatabaseManager,
  type TranscriptionItem
} from './database';

describe('Database Mock', () => {
  let mockDB: MockDatabaseManager;

  beforeEach(() => {
    mockDB = createMockDatabaseManager();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      const result = mockDB.initDatabase();
      expect(result).toBe(true);
      expect(mockDB.__getState().isInitialized).toBe(true);
    });

    it('should be initialized by default', () => {
      const state = mockDB.__getState();
      expect(state.isInitialized).toBe(true);
    });

    it('should start with empty transcriptions', () => {
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
      expect(state.nextId).toBe(1);
    });

    it('should throw error when operations called on uninitialized database', () => {
      const uninitializedDB = createUninitializedMock();
      
      expect(() => uninitializedDB.saveTranscription('test')).toThrow('Database not initialized');
      expect(() => uninitializedDB.getTranscriptions()).toThrow('Database not initialized');
      expect(() => uninitializedDB.deleteTranscription(1)).toThrow('Database not initialized');
      expect(() => uninitializedDB.clearTranscriptions()).toThrow('Database not initialized');
    });
  });

  // ==========================================================================
  // Save Transcription Tests
  // ==========================================================================

  describe('saveTranscription', () => {
    it('should save a transcription and return id', () => {
      const result = mockDB.saveTranscription('Hello world');
      
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
    });

    it('should increment id for each save', () => {
      const result1 = mockDB.saveTranscription('First');
      const result2 = mockDB.saveTranscription('Second');
      const result3 = mockDB.saveTranscription('Third');
      
      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
      expect(result3.id).toBe(3);
    });

    it('should store transcription with timestamp', () => {
      const beforeSave = Date.now();
      mockDB.saveTranscription('Test text');
      const afterSave = Date.now();
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('Test text');
      
      const timestamp = new Date(transcriptions[0].timestamp).getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeSave);
      expect(timestamp).toBeLessThanOrEqual(afterSave);
    });

    it('should store transcription with created_at field', () => {
      mockDB.saveTranscription('Test text');
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0]).toHaveProperty('created_at');
      expect(transcriptions[0].created_at).toBe(transcriptions[0].timestamp);
    });

    it('should add new transcriptions to the beginning', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('Second');
      expect(transcriptions[2].text).toBe('First');
    });

    it('should handle empty text', () => {
      const result = mockDB.saveTranscription('');
      
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe('');
    });

    it('should handle long text', () => {
      const longText = 'A'.repeat(10000);
      const result = mockDB.saveTranscription(longText);
      
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(longText);
    });

    it('should handle special characters', () => {
      const specialText = 'Hello "world" with \'quotes\' and \n newlines \t tabs';
      const result = mockDB.saveTranscription(specialText);
      
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe(specialText);
    });
  });

  // ==========================================================================
  // Get Transcriptions Tests
  // ==========================================================================

  describe('getTranscriptions', () => {
    it('should return empty array when no transcriptions', () => {
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toEqual([]);
    });

    it('should return all transcriptions when limit not specified', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(3);
    });

    it('should respect limit parameter', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      mockDB.saveTranscription('Fourth');
      
      const transcriptions = mockDB.getTranscriptions(2);
      expect(transcriptions).toHaveLength(2);
    });

    it('should return transcriptions in descending order (newest first)', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('Second');
      expect(transcriptions[2].text).toBe('First');
    });

    it('should use default limit of 50', () => {
      // Add 60 transcriptions
      for (let i = 0; i < 60; i++) {
        mockDB.saveTranscription(`Transcription ${i}`);
      }
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions.length).toBeLessThanOrEqual(50);
    });

    it('should return all items if count is less than limit', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      
      const transcriptions = mockDB.getTranscriptions(100);
      expect(transcriptions).toHaveLength(2);
    });

    it('should include all required fields', () => {
      mockDB.saveTranscription('Test');
      
      const transcriptions = mockDB.getTranscriptions();
      const item = transcriptions[0];
      
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('text');
      expect(item).toHaveProperty('timestamp');
      expect(typeof item.id).toBe('number');
      expect(typeof item.text).toBe('string');
      expect(typeof item.timestamp).toBe('string');
    });
  });

  // ==========================================================================
  // Delete Transcription Tests
  // ==========================================================================

  describe('deleteTranscription', () => {
    it('should delete existing transcription', () => {
      const { id } = mockDB.saveTranscription('To delete');
      
      const result = mockDB.deleteTranscription(id);
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should return false for non-existent id', () => {
      const result = mockDB.deleteTranscription(999);
      expect(result.success).toBe(false);
    });

    it('should only delete specified transcription', () => {
      const id1 = mockDB.saveTranscription('First').id;
      const id2 = mockDB.saveTranscription('Second').id;
      const id3 = mockDB.saveTranscription('Third').id;
      
      mockDB.deleteTranscription(id2);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(2);
      expect(transcriptions.find(t => t.id === id1)).toBeDefined();
      expect(transcriptions.find(t => t.id === id2)).toBeUndefined();
      expect(transcriptions.find(t => t.id === id3)).toBeDefined();
    });

    it('should handle deleting from empty database', () => {
      const result = mockDB.deleteTranscription(1);
      expect(result.success).toBe(false);
    });

    it('should handle deleting same id twice', () => {
      const { id } = mockDB.saveTranscription('Test');
      
      const result1 = mockDB.deleteTranscription(id);
      expect(result1.success).toBe(true);
      
      const result2 = mockDB.deleteTranscription(id);
      expect(result2.success).toBe(false);
    });
  });

  // ==========================================================================
  // Clear Transcriptions Tests
  // ==========================================================================

  describe('clearTranscriptions', () => {
    it('should clear all transcriptions', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      mockDB.saveTranscription('Third');
      
      const result = mockDB.clearTranscriptions();
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(3);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(0);
    });

    it('should return 0 when clearing empty database', () => {
      const result = mockDB.clearTranscriptions();
      expect(result.success).toBe(true);
      expect(result.cleared).toBe(0);
    });

    it('should allow saving after clear', () => {
      mockDB.saveTranscription('Before clear');
      mockDB.clearTranscriptions();
      
      const result = mockDB.saveTranscription('After clear');
      expect(result.success).toBe(true);
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('After clear');
    });

    it('should reset to empty state', () => {
      mockDB.saveTranscription('First');
      mockDB.saveTranscription('Second');
      
      mockDB.clearTranscriptions();
      
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
    });
  });

  // ==========================================================================
  // Cleanup Tests
  // ==========================================================================

  describe('cleanup', () => {
    it('should clear transcriptions', () => {
      mockDB.saveTranscription('Test');
      mockDB.cleanup();
      
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
    });

    it('should mark database as uninitialized', () => {
      mockDB.cleanup();
      
      const state = mockDB.__getState();
      expect(state.isInitialized).toBe(false);
    });
  });

  // ==========================================================================
  // Test Helper Tests
  // ==========================================================================

  describe('Test Helpers', () => {
    it('should get current state', () => {
      mockDB.saveTranscription('Test');
      
      const state = mockDB.__getState();
      expect(state.transcriptions).toHaveLength(1);
      expect(state.nextId).toBe(2);
      expect(state.isInitialized).toBe(true);
    });

    it('should set state', () => {
      mockDB.__setState({
        transcriptions: [
          { id: 1, text: 'Manual', timestamp: '2024-01-01T00:00:00Z' }
        ],
        nextId: 10
      });
      
      const state = mockDB.__getState();
      expect(state.transcriptions).toHaveLength(1);
      expect(state.nextId).toBe(10);
    });

    it('should reset to initial state', () => {
      mockDB.saveTranscription('Test');
      mockDB.__reset();
      
      const state = mockDB.__getState();
      expect(state.transcriptions).toEqual([]);
      expect(state.nextId).toBe(1);
      expect(state.isInitialized).toBe(true);
    });

    it('should add transcription directly', () => {
      const item = mockDB.__addTranscription({
        text: 'Direct add',
        timestamp: '2024-01-01T00:00:00Z'
      });
      
      expect(item.id).toBe(1);
      expect(item.text).toBe('Direct add');
      
      const transcriptions = mockDB.getTranscriptions();
      expect(transcriptions).toHaveLength(1);
    });

    it('should simulate not initialized', () => {
      mockDB.__simulateNotInitialized();
      
      expect(() => mockDB.saveTranscription('test')).toThrow('Database not initialized');
    });

    it('should restore normal operation', () => {
      mockDB.__simulateNotInitialized();
      mockDB.__restoreNormalOperation();
      
      const result = mockDB.saveTranscription('test');
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create mock with initial transcriptions', () => {
      const initial: TranscriptionItem[] = [
        { id: 1, text: 'First', timestamp: '2024-01-01T00:00:00Z' },
        { id: 2, text: 'Second', timestamp: '2024-01-01T00:01:00Z' }
      ];
      
      const mock = createMockWithTranscriptions(initial);
      const transcriptions = mock.getTranscriptions();
      
      expect(transcriptions).toHaveLength(2);
      expect(transcriptions[0].text).toBe('First');
      expect(transcriptions[1].text).toBe('Second');
    });

    it('should create uninitialized mock', () => {
      const mock = createUninitializedMock();
      
      expect(() => mock.saveTranscription('test')).toThrow('Database not initialized');
    });

    it('should create error mock', () => {
      const mock = createErrorMock();
      
      expect(() => mock.saveTranscription('test')).toThrow('Error saving transcription');
      expect(() => mock.getTranscriptions()).toThrow('Error getting transcriptions');
      expect(() => mock.deleteTranscription(1)).toThrow('Error deleting transcription');
      expect(() => mock.clearTranscriptions()).toThrow('Error clearing transcriptions');
    });

    it('should create large dataset mock', () => {
      const mock = createLargeDatasetMock(100);
      const transcriptions = mock.getTranscriptions(100);
      
      expect(transcriptions).toHaveLength(100);
      expect(transcriptions[0].text).toBe('Transcription 1');
      expect(transcriptions[99].text).toBe('Transcription 100');
    });

    it('should create large dataset with correct ordering', () => {
      const mock = createLargeDatasetMock(50);
      const transcriptions = mock.getTranscriptions(50);
      
      // Verify timestamps are in descending order
      for (let i = 0; i < transcriptions.length - 1; i++) {
        const current = new Date(transcriptions[i].timestamp).getTime();
        const next = new Date(transcriptions[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  // ==========================================================================
  // Integration Tests
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
  });
});
