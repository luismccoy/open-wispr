/**
 * Tests for Transcription Factory
 * 
 * Verifies that the transcription factory functions create valid test data
 * with the expected structure and behavior.
 * 
 * @module tests/factories/transcription.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTranscriptionItem,
  createTranscriptionList,
  createEnglishTranscription,
  createSpanishTranscription,
  createLongTranscription,
  createEmptyTranscription,
  createSpecialCharTranscription,
  createUnicodeTranscription,
  createMixedLanguageList,
  createVariedDurationList,
  resetIdCounter,
  getCurrentIdCounter,
  createTimestamp,
  createSpecificTimestamp,
  TranscriptionItem,
} from './transcription';

describe('Transcription Factory', () => {
  beforeEach(() => {
    // Reset ID counter before each test for predictable IDs
    resetIdCounter(1);
  });

  describe('createTranscriptionItem', () => {
    it('should create a transcription item with default values', () => {
      const item = createTranscriptionItem();

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('text');
      expect(item).toHaveProperty('timestamp');
      expect(typeof item.id).toBe('number');
      expect(typeof item.text).toBe('string');
      expect(typeof item.timestamp).toBe('string');
    });

    it('should auto-increment IDs for multiple items', () => {
      const item1 = createTranscriptionItem();
      const item2 = createTranscriptionItem();
      const item3 = createTranscriptionItem();

      expect(item1.id).toBe(1);
      expect(item2.id).toBe(2);
      expect(item3.id).toBe(3);
    });

    it('should allow overriding the ID', () => {
      const item = createTranscriptionItem({ id: 42 });

      expect(item.id).toBe(42);
    });

    it('should allow overriding the text', () => {
      const customText = 'Hello, this is a custom transcription';
      const item = createTranscriptionItem({ text: customText });

      expect(item.text).toBe(customText);
    });

    it('should allow overriding the timestamp', () => {
      const customTimestamp = '2024-01-15T10:30:00.000Z';
      const item = createTranscriptionItem({ timestamp: customTimestamp });

      expect(item.timestamp).toBe(customTimestamp);
    });

    it('should include duration when provided', () => {
      const item = createTranscriptionItem({ duration: 5000 });

      expect(item.duration).toBe(5000);
    });

    it('should not include duration when not provided', () => {
      const item = createTranscriptionItem();

      expect(item).not.toHaveProperty('duration');
    });

    it('should include language when provided', () => {
      const item = createTranscriptionItem({ language: 'en-US' });

      expect(item.language).toBe('en-US');
    });

    it('should not include language when not provided', () => {
      const item = createTranscriptionItem();

      expect(item).not.toHaveProperty('language');
    });

    it('should create valid ISO timestamp', () => {
      const item = createTranscriptionItem();
      const parsedDate = new Date(item.timestamp);

      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });

    it('should allow all overrides at once', () => {
      const item = createTranscriptionItem({
        id: 100,
        text: 'Full override test',
        timestamp: '2024-06-01T12:00:00.000Z',
        duration: 3000,
        language: 'fr-FR',
      });

      expect(item.id).toBe(100);
      expect(item.text).toBe('Full override test');
      expect(item.timestamp).toBe('2024-06-01T12:00:00.000Z');
      expect(item.duration).toBe(3000);
      expect(item.language).toBe('fr-FR');
    });
  });

  describe('createTranscriptionList', () => {
    it('should create a list with default count of 5', () => {
      const items = createTranscriptionList();

      expect(items).toHaveLength(5);
    });

    it('should create a list with specified count', () => {
      const items = createTranscriptionList({ count: 10 });

      expect(items).toHaveLength(10);
    });

    it('should create items with unique IDs', () => {
      const items = createTranscriptionList({ count: 5 });
      const ids = items.map(item => item.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(5);
    });

    it('should create items in descending chronological order by default', () => {
      const items = createTranscriptionList({ count: 5 });

      for (let i = 0; i < items.length - 1; i++) {
        const currentTime = new Date(items[i].timestamp).getTime();
        const nextTime = new Date(items[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('should create items in ascending order when specified', () => {
      const items = createTranscriptionList({ count: 5, descendingOrder: false });

      for (let i = 0; i < items.length - 1; i++) {
        const currentTime = new Date(items[i].timestamp).getTime();
        const nextTime = new Date(items[i + 1].timestamp).getTime();
        expect(currentTime).toBeLessThanOrEqual(nextTime);
      }
    });

    it('should use custom starting ID', () => {
      const items = createTranscriptionList({ count: 3, startId: 100 });

      expect(items[0].id).toBe(100);
      expect(items[1].id).toBe(101);
      expect(items[2].id).toBe(102);
    });

    it('should apply language to all items when specified', () => {
      const items = createTranscriptionList({ count: 3, language: 'es-US' });

      items.forEach(item => {
        expect(item.language).toBe('es-US');
      });
    });

    it('should use custom text prefix', () => {
      const items = createTranscriptionList({ count: 3, textPrefix: 'Note' });

      items.forEach(item => {
        expect(item.text).toMatch(/^Note \d+$/);
      });
    });

    it('should use custom interval between timestamps', () => {
      const intervalMs = 120000; // 2 minutes
      const items = createTranscriptionList({ count: 3, intervalMs });

      const time1 = new Date(items[0].timestamp).getTime();
      const time2 = new Date(items[1].timestamp).getTime();
      const time3 = new Date(items[2].timestamp).getTime();

      // In descending order, time differences should be approximately intervalMs
      expect(Math.abs(time1 - time2)).toBeCloseTo(intervalMs, -2);
      expect(Math.abs(time2 - time3)).toBeCloseTo(intervalMs, -2);
    });

    it('should handle empty list (count: 0)', () => {
      const items = createTranscriptionList({ count: 0 });

      expect(items).toHaveLength(0);
    });
  });

  describe('Specialized Factory Functions', () => {
    describe('createEnglishTranscription', () => {
      it('should create a transcription with en-US language', () => {
        const item = createEnglishTranscription();

        expect(item.language).toBe('en-US');
      });

      it('should allow other overrides', () => {
        const item = createEnglishTranscription({ text: 'English text' });

        expect(item.language).toBe('en-US');
        expect(item.text).toBe('English text');
      });
    });

    describe('createSpanishTranscription', () => {
      it('should create a transcription with es-US language', () => {
        const item = createSpanishTranscription();

        expect(item.language).toBe('es-US');
      });
    });

    describe('createLongTranscription', () => {
      it('should create a transcription with long text', () => {
        const item = createLongTranscription();

        expect(item.text.length).toBeGreaterThan(100);
      });

      it('should allow overriding other properties', () => {
        const item = createLongTranscription({ id: 999 });

        expect(item.id).toBe(999);
        expect(item.text.length).toBeGreaterThan(100);
      });
    });

    describe('createEmptyTranscription', () => {
      it('should create a transcription with empty text', () => {
        const item = createEmptyTranscription();

        expect(item.text).toBe('');
      });
    });

    describe('createSpecialCharTranscription', () => {
      it('should create a transcription with special characters', () => {
        const item = createSpecialCharTranscription();

        expect(item.text).toContain('<script>');
        expect(item.text).toContain('&');
        expect(item.text).toContain('"');
        expect(item.text).toContain("'");
        expect(item.text).toContain('🎤');
      });
    });

    describe('createUnicodeTranscription', () => {
      it('should create a transcription with Unicode text', () => {
        const item = createUnicodeTranscription();

        expect(item.text).toContain('日本語');
        expect(item.text).toContain('中文');
        expect(item.text).toContain('한국어');
      });
    });

    describe('createMixedLanguageList', () => {
      it('should create items with different languages', () => {
        const items = createMixedLanguageList(5);
        const languages = items.map(item => item.language);
        const uniqueLanguages = new Set(languages);

        expect(uniqueLanguages.size).toBe(5);
      });

      it('should cycle through languages for larger counts', () => {
        const items = createMixedLanguageList(10);

        expect(items[0].language).toBe(items[5].language);
      });
    });

    describe('createVariedDurationList', () => {
      it('should create items with increasing durations', () => {
        const items = createVariedDurationList(5);

        expect(items[0].duration).toBe(1000);
        expect(items[1].duration).toBe(2000);
        expect(items[2].duration).toBe(3000);
        expect(items[3].duration).toBe(4000);
        expect(items[4].duration).toBe(5000);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('resetIdCounter', () => {
      it('should reset the counter to 1 by default', () => {
        createTranscriptionItem(); // id = 1
        createTranscriptionItem(); // id = 2
        
        resetIdCounter();
        
        const item = createTranscriptionItem();
        expect(item.id).toBe(1);
      });

      it('should reset the counter to a specific value', () => {
        resetIdCounter(100);
        
        const item = createTranscriptionItem();
        expect(item.id).toBe(100);
      });
    });

    describe('getCurrentIdCounter', () => {
      it('should return the current counter value', () => {
        resetIdCounter(1);
        
        expect(getCurrentIdCounter()).toBe(1);
        
        createTranscriptionItem();
        expect(getCurrentIdCounter()).toBe(2);
        
        createTranscriptionItem();
        expect(getCurrentIdCounter()).toBe(3);
      });
    });

    describe('createTimestamp', () => {
      it('should create a timestamp for now with no offset', () => {
        const before = Date.now();
        const timestamp = createTimestamp();
        const after = Date.now();
        
        const timestampMs = new Date(timestamp).getTime();
        
        expect(timestampMs).toBeGreaterThanOrEqual(before);
        expect(timestampMs).toBeLessThanOrEqual(after);
      });

      it('should create a timestamp in the past with negative offset', () => {
        const now = Date.now();
        const oneHourAgo = createTimestamp(-3600000);
        const timestampMs = new Date(oneHourAgo).getTime();
        
        expect(timestampMs).toBeLessThan(now);
        expect(now - timestampMs).toBeCloseTo(3600000, -2);
      });

      it('should create a timestamp in the future with positive offset', () => {
        const now = Date.now();
        const oneHourLater = createTimestamp(3600000);
        const timestampMs = new Date(oneHourLater).getTime();
        
        expect(timestampMs).toBeGreaterThan(now);
      });
    });

    describe('createSpecificTimestamp', () => {
      it('should create a timestamp for a specific date', () => {
        const timestamp = createSpecificTimestamp(2024, 6, 15, 10, 30, 0);
        const date = new Date(timestamp);
        
        expect(date.getFullYear()).toBe(2024);
        expect(date.getMonth()).toBe(5); // June is month 5 (0-indexed)
        expect(date.getDate()).toBe(15);
        expect(date.getHours()).toBe(10);
        expect(date.getMinutes()).toBe(30);
        expect(date.getSeconds()).toBe(0);
      });

      it('should default time components to 0', () => {
        const timestamp = createSpecificTimestamp(2024, 1, 1);
        const date = new Date(timestamp);
        
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
      });
    });
  });

  describe('Type Safety', () => {
    it('should return objects conforming to TranscriptionItem interface', () => {
      const item: TranscriptionItem = createTranscriptionItem({
        id: 1,
        text: 'Test',
        timestamp: new Date().toISOString(),
        duration: 1000,
        language: 'en-US',
      });

      // TypeScript compilation is the real test here
      expect(item.id).toBeDefined();
      expect(item.text).toBeDefined();
      expect(item.timestamp).toBeDefined();
    });

    it('should return arrays of TranscriptionItem', () => {
      const items: TranscriptionItem[] = createTranscriptionList({ count: 3 });

      expect(Array.isArray(items)).toBe(true);
      items.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.text).toBeDefined();
        expect(item.timestamp).toBeDefined();
      });
    });
  });
});
