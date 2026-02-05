/**
 * Tests for Fast-check Arbitrary Generators
 * 
 * This file verifies that all arbitrary generators produce valid data
 * that conforms to the expected types and constraints.
 * 
 * @module tests/generators/arbitraries.test
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  // Text arbitraries
  validTranscriptionText,
  emptyOrWhitespaceText,
  unicodeText,
  specialCharText,
  
  // Hotkey arbitraries
  validHotkey,
  reservedHotkey,
  anyHotkey,
  
  // Language code arbitraries
  validLanguageCode,
  languagePrefix,
  validAwsRegion,
  
  // Transcription item arbitraries
  transcriptionId,
  isoTimestamp,
  transcriptionItem,
  transcriptionList,
  uniqueTranscriptionList,
  sortedTranscriptionList,
  
  // App context arbitraries
  platform,
  emailAppContext,
  chatAppContext,
  unknownAppContext,
  appContext,
  customAppContext,
  
  // Settings arbitraries
  styleType,
  bedrockModel,
  microphoneId,
  settingsData,
  partialSettingsData,
  
  // Audio buffer arbitraries
  audioBuffer,
  audioChunks,
  audioSamples,
  
  // Style mapping arbitraries
  styleMapping,
  styleMappingMap,
  styleMappingObject,
  
  // Toast arbitraries
  toastData,
  
  // Utility arbitraries
  durationMs,
  percentage,
  confidenceScore,
  
  // Constants
  VALID_LANGUAGE_CODES,
  VALID_AWS_REGIONS,
  RESERVED_KEYS,
  VALID_LETTER_HOTKEYS,
  VALID_FUNCTION_KEYS,
  VALID_BEDROCK_MODELS,
  PLATFORMS
} from './arbitraries';

// ============================================================================
// Test Configuration
// ============================================================================

const testConfig: fc.Parameters<unknown> = {
  numRuns: 50, // Reduced for faster test execution
  verbose: false
};

// ============================================================================
// Text Arbitrary Tests
// ============================================================================

describe('Text Arbitraries', () => {
  describe('validTranscriptionText', () => {
    it('should generate non-empty strings', () => {
      fc.assert(
        fc.property(validTranscriptionText(), (text) => {
          expect(typeof text).toBe('string');
          expect(text.trim().length).toBeGreaterThan(0);
        }),
        testConfig
      );
    });

    it('should generate strings of various lengths', () => {
      const lengths = new Set<number>();
      fc.assert(
        fc.property(validTranscriptionText(), (text) => {
          lengths.add(text.length);
          return true;
        }),
        { ...testConfig, numRuns: 100 }
      );
      // Should have generated texts of different lengths
      expect(lengths.size).toBeGreaterThan(1);
    });
  });

  describe('emptyOrWhitespaceText', () => {
    it('should generate empty or whitespace-only strings', () => {
      fc.assert(
        fc.property(emptyOrWhitespaceText(), (text) => {
          expect(typeof text).toBe('string');
          expect(text.trim().length).toBe(0);
        }),
        testConfig
      );
    });
  });

  describe('unicodeText', () => {
    it('should generate valid strings', () => {
      fc.assert(
        fc.property(unicodeText(), (text) => {
          expect(typeof text).toBe('string');
        }),
        testConfig
      );
    });
  });

  describe('specialCharText', () => {
    it('should generate strings with special characters', () => {
      fc.assert(
        fc.property(specialCharText(), (text) => {
          expect(typeof text).toBe('string');
          expect(text.length).toBeGreaterThan(0);
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Hotkey Arbitrary Tests
// ============================================================================

describe('Hotkey Arbitraries', () => {
  describe('validHotkey', () => {
    it('should generate valid hotkey characters', () => {
      fc.assert(
        fc.property(validHotkey(), (hotkey) => {
          expect(typeof hotkey).toBe('string');
          const isLetter = VALID_LETTER_HOTKEYS.includes(hotkey);
          const isFunctionKey = VALID_FUNCTION_KEYS.includes(hotkey as typeof VALID_FUNCTION_KEYS[number]);
          expect(isLetter || isFunctionKey).toBe(true);
        }),
        testConfig
      );
    });

    it('should not generate reserved keys', () => {
      fc.assert(
        fc.property(validHotkey(), (hotkey) => {
          expect(RESERVED_KEYS).not.toContain(hotkey);
        }),
        testConfig
      );
    });
  });

  describe('reservedHotkey', () => {
    it('should generate only reserved keys', () => {
      fc.assert(
        fc.property(reservedHotkey(), (hotkey) => {
          expect(RESERVED_KEYS).toContain(hotkey);
        }),
        testConfig
      );
    });
  });

  describe('anyHotkey', () => {
    it('should generate string hotkeys', () => {
      fc.assert(
        fc.property(anyHotkey(), (hotkey) => {
          expect(typeof hotkey).toBe('string');
          expect(hotkey.length).toBeGreaterThan(0);
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Language Code Arbitrary Tests
// ============================================================================

describe('Language Code Arbitraries', () => {
  describe('validLanguageCode', () => {
    it('should generate valid AWS Transcribe language codes', () => {
      fc.assert(
        fc.property(validLanguageCode(), (code) => {
          expect(VALID_LANGUAGE_CODES).toContain(code);
        }),
        testConfig
      );
    });

    it('should match the expected format (xx-XX)', () => {
      fc.assert(
        fc.property(validLanguageCode(), (code) => {
          expect(code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
        }),
        testConfig
      );
    });
  });

  describe('languagePrefix', () => {
    it('should generate uppercase two-letter prefixes', () => {
      fc.assert(
        fc.property(languagePrefix(), (prefix) => {
          expect(prefix).toMatch(/^[A-Z]{2}$/);
        }),
        testConfig
      );
    });
  });

  describe('validAwsRegion', () => {
    it('should generate valid AWS regions', () => {
      fc.assert(
        fc.property(validAwsRegion(), (region) => {
          expect(VALID_AWS_REGIONS).toContain(region);
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Transcription Item Arbitrary Tests
// ============================================================================

describe('Transcription Item Arbitraries', () => {
  describe('transcriptionId', () => {
    it('should generate positive integers', () => {
      fc.assert(
        fc.property(transcriptionId(), (id) => {
          expect(typeof id).toBe('number');
          expect(Number.isInteger(id)).toBe(true);
          expect(id).toBeGreaterThan(0);
        }),
        testConfig
      );
    });
  });

  describe('isoTimestamp', () => {
    it('should generate valid ISO timestamp strings', () => {
      fc.assert(
        fc.property(isoTimestamp(), (timestamp) => {
          expect(typeof timestamp).toBe('string');
          const date = new Date(timestamp);
          expect(date.toISOString()).toBe(timestamp);
        }),
        testConfig
      );
    });
  });

  describe('transcriptionItem', () => {
    it('should generate valid TranscriptionItem objects', () => {
      fc.assert(
        fc.property(transcriptionItem(), (item) => {
          expect(typeof item.id).toBe('number');
          expect(item.id).toBeGreaterThan(0);
          expect(typeof item.text).toBe('string');
          expect(typeof item.timestamp).toBe('string');
          
          // Optional fields
          if (item.duration !== undefined) {
            expect(typeof item.duration).toBe('number');
            expect(item.duration).toBeGreaterThanOrEqual(100);
          }
          if (item.language !== undefined) {
            expect(VALID_LANGUAGE_CODES).toContain(item.language);
          }
        }),
        testConfig
      );
    });
  });

  describe('transcriptionList', () => {
    it('should generate arrays of TranscriptionItem objects', () => {
      fc.assert(
        fc.property(transcriptionList({ minLength: 1, maxLength: 10 }), (items) => {
          expect(Array.isArray(items)).toBe(true);
          expect(items.length).toBeGreaterThanOrEqual(1);
          expect(items.length).toBeLessThanOrEqual(10);
          
          items.forEach(item => {
            expect(typeof item.id).toBe('number');
            expect(typeof item.text).toBe('string');
            expect(typeof item.timestamp).toBe('string');
          });
        }),
        testConfig
      );
    });
  });

  describe('uniqueTranscriptionList', () => {
    it('should generate lists with unique IDs', () => {
      fc.assert(
        fc.property(uniqueTranscriptionList({ minLength: 5, maxLength: 20 }), (items) => {
          const ids = items.map(item => item.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }),
        testConfig
      );
    });
  });

  describe('sortedTranscriptionList', () => {
    it('should generate lists sorted by timestamp descending', () => {
      fc.assert(
        fc.property(sortedTranscriptionList({ minLength: 2, maxLength: 10 }), (items) => {
          for (let i = 0; i < items.length - 1; i++) {
            const currentTime = new Date(items[i].timestamp).getTime();
            const nextTime = new Date(items[i + 1].timestamp).getTime();
            expect(currentTime).toBeGreaterThanOrEqual(nextTime);
          }
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// App Context Arbitrary Tests
// ============================================================================

describe('App Context Arbitraries', () => {
  describe('platform', () => {
    it('should generate valid platform strings', () => {
      fc.assert(
        fc.property(platform(), (p) => {
          expect(PLATFORMS).toContain(p);
        }),
        testConfig
      );
    });
  });

  describe('emailAppContext', () => {
    it('should generate email app contexts', () => {
      fc.assert(
        fc.property(emailAppContext(), (context) => {
          expect(typeof context.appName).toBe('string');
          expect(PLATFORMS).toContain(context.platform);
          
          // Should be recognizable as an email app
          const normalizedName = context.appName.toLowerCase();
          const normalizedTitle = (context.windowTitle || '').toLowerCase();
          const isEmailApp = ['mail', 'outlook', 'gmail', 'thunderbird'].some(
            name => normalizedName.includes(name) || normalizedTitle.includes(name)
          );
          expect(isEmailApp).toBe(true);
        }),
        testConfig
      );
    });
  });

  describe('chatAppContext', () => {
    it('should generate chat app contexts', () => {
      fc.assert(
        fc.property(chatAppContext(), (context) => {
          expect(typeof context.appName).toBe('string');
          expect(PLATFORMS).toContain(context.platform);
          
          // Should be recognizable as a chat app
          const normalizedName = context.appName.toLowerCase();
          const normalizedTitle = (context.windowTitle || '').toLowerCase();
          const isChatApp = ['slack', 'discord', 'messages', 'teams', 'whatsapp'].some(
            name => normalizedName.includes(name) || normalizedTitle.includes(name)
          );
          expect(isChatApp).toBe(true);
        }),
        testConfig
      );
    });
  });

  describe('unknownAppContext', () => {
    it('should generate unknown app contexts', () => {
      fc.assert(
        fc.property(unknownAppContext(), (context) => {
          expect(typeof context.appName).toBe('string');
          expect(PLATFORMS).toContain(context.platform);
        }),
        testConfig
      );
    });
  });

  describe('appContext', () => {
    it('should generate valid app contexts', () => {
      fc.assert(
        fc.property(appContext(), (context) => {
          expect(typeof context.appName).toBe('string');
          expect(context.bundleId === null || typeof context.bundleId === 'string').toBe(true);
          expect(context.executablePath === null || typeof context.executablePath === 'string').toBe(true);
          expect(context.windowTitle === null || typeof context.windowTitle === 'string').toBe(true);
          expect(PLATFORMS).toContain(context.platform);
        }),
        testConfig
      );
    });
  });

  describe('customAppContext', () => {
    it('should generate custom app contexts with random values', () => {
      fc.assert(
        fc.property(customAppContext(), (context) => {
          expect(typeof context.appName).toBe('string');
          expect(context.appName.length).toBeGreaterThan(0);
          expect(PLATFORMS).toContain(context.platform);
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Settings Arbitrary Tests
// ============================================================================

describe('Settings Arbitraries', () => {
  describe('styleType', () => {
    it('should generate valid style types', () => {
      fc.assert(
        fc.property(styleType(), (style) => {
          expect(['formal', 'casual', 'neutral']).toContain(style);
        }),
        testConfig
      );
    });
  });

  describe('bedrockModel', () => {
    it('should generate valid Bedrock model IDs', () => {
      fc.assert(
        fc.property(bedrockModel(), (model) => {
          expect(VALID_BEDROCK_MODELS).toContain(model);
        }),
        testConfig
      );
    });
  });

  describe('microphoneId', () => {
    it('should generate valid microphone IDs', () => {
      fc.assert(
        fc.property(microphoneId(), (id) => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        }),
        testConfig
      );
    });
  });

  describe('settingsData', () => {
    it('should generate valid SettingsData objects', () => {
      fc.assert(
        fc.property(settingsData(), (settings) => {
          // Validate all required fields
          expect(typeof settings.dictationKey).toBe('string');
          expect(VALID_LANGUAGE_CODES).toContain(settings.transcribeLanguage);
          expect(VALID_AWS_REGIONS).toContain(settings.awsRegion);
          expect(typeof settings.useTextEnhancement).toBe('boolean');
          expect(VALID_BEDROCK_MODELS).toContain(settings.enhancementModel);
          expect(typeof settings.selectedMicrophoneId).toBe('string');
          expect(typeof settings.contextAwareEnabled).toBe('boolean');
          expect(['formal', 'casual', 'neutral']).toContain(settings.defaultStyle);
        }),
        testConfig
      );
    });
  });

  describe('partialSettingsData', () => {
    it('should generate partial settings objects', () => {
      fc.assert(
        fc.property(partialSettingsData(), (settings) => {
          expect(typeof settings).toBe('object');
          
          // All present fields should be valid
          if (settings.dictationKey !== undefined) {
            expect(typeof settings.dictationKey).toBe('string');
          }
          if (settings.transcribeLanguage !== undefined) {
            expect(VALID_LANGUAGE_CODES).toContain(settings.transcribeLanguage);
          }
          if (settings.awsRegion !== undefined) {
            expect(VALID_AWS_REGIONS).toContain(settings.awsRegion);
          }
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Audio Buffer Arbitrary Tests
// ============================================================================

describe('Audio Buffer Arbitraries', () => {
  describe('audioBuffer', () => {
    it('should generate ArrayBuffer objects', () => {
      fc.assert(
        fc.property(audioBuffer(), (buffer) => {
          expect(buffer).toBeInstanceOf(ArrayBuffer);
          expect(buffer.byteLength).toBeGreaterThanOrEqual(1024);
          expect(buffer.byteLength).toBeLessThanOrEqual(65536);
        }),
        testConfig
      );
    });

    it('should respect custom size options', () => {
      fc.assert(
        fc.property(audioBuffer({ minSize: 100, maxSize: 500 }), (buffer) => {
          expect(buffer.byteLength).toBeGreaterThanOrEqual(100);
          expect(buffer.byteLength).toBeLessThanOrEqual(500);
        }),
        testConfig
      );
    });
  });

  describe('audioChunks', () => {
    it('should generate arrays of ArrayBuffer objects', () => {
      fc.assert(
        fc.property(audioChunks({ minChunks: 1, maxChunks: 5 }), (chunks) => {
          expect(Array.isArray(chunks)).toBe(true);
          expect(chunks.length).toBeGreaterThanOrEqual(1);
          expect(chunks.length).toBeLessThanOrEqual(5);
          
          chunks.forEach(chunk => {
            expect(chunk).toBeInstanceOf(ArrayBuffer);
          });
        }),
        testConfig
      );
    });
  });

  describe('audioSamples', () => {
    it('should generate Float32Array objects with values in [-1, 1]', () => {
      fc.assert(
        fc.property(audioSamples({ minLength: 10, maxLength: 100 }), (samples) => {
          expect(samples).toBeInstanceOf(Float32Array);
          expect(samples.length).toBeGreaterThanOrEqual(10);
          expect(samples.length).toBeLessThanOrEqual(100);
          
          samples.forEach(sample => {
            expect(sample).toBeGreaterThanOrEqual(-1);
            expect(sample).toBeLessThanOrEqual(1);
          });
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Style Mapping Arbitrary Tests
// ============================================================================

describe('Style Mapping Arbitraries', () => {
  describe('styleMapping', () => {
    it('should generate [appName, style] tuples', () => {
      fc.assert(
        fc.property(styleMapping(), ([appName, style]) => {
          expect(typeof appName).toBe('string');
          expect(['formal', 'casual', 'neutral']).toContain(style);
        }),
        testConfig
      );
    });
  });

  describe('styleMappingMap', () => {
    it('should generate Map objects', () => {
      fc.assert(
        fc.property(styleMappingMap({ minSize: 1, maxSize: 5 }), (map) => {
          expect(map).toBeInstanceOf(Map);
          
          map.forEach((style, appName) => {
            expect(typeof appName).toBe('string');
            expect(['formal', 'casual', 'neutral']).toContain(style);
          });
        }),
        testConfig
      );
    });
  });

  describe('styleMappingObject', () => {
    it('should generate plain objects', () => {
      fc.assert(
        fc.property(styleMappingObject(), (obj) => {
          expect(typeof obj).toBe('object');
          
          Object.entries(obj).forEach(([appName, style]) => {
            expect(typeof appName).toBe('string');
            expect(['formal', 'casual', 'neutral']).toContain(style);
          });
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Toast Arbitrary Tests
// ============================================================================

describe('Toast Arbitraries', () => {
  describe('toastData', () => {
    it('should generate valid toast data objects', () => {
      fc.assert(
        fc.property(toastData(), (toast) => {
          expect(typeof toast.title).toBe('string');
          expect(toast.title.length).toBeGreaterThan(0);
          expect(typeof toast.description).toBe('string');
          expect(toast.description.length).toBeGreaterThan(0);
          
          if (toast.variant !== undefined) {
            expect(['default', 'destructive']).toContain(toast.variant);
          }
          if (toast.duration !== undefined) {
            expect(toast.duration).toBeGreaterThanOrEqual(1000);
            expect(toast.duration).toBeLessThanOrEqual(10000);
          }
        }),
        testConfig
      );
    });
  });
});

// ============================================================================
// Utility Arbitrary Tests
// ============================================================================

describe('Utility Arbitraries', () => {
  describe('durationMs', () => {
    it('should generate non-negative durations', () => {
      fc.assert(
        fc.property(durationMs(), (duration) => {
          expect(typeof duration).toBe('number');
          expect(duration).toBeGreaterThanOrEqual(0);
          expect(duration).toBeLessThanOrEqual(300000);
        }),
        testConfig
      );
    });

    it('should respect custom min/max options', () => {
      fc.assert(
        fc.property(durationMs({ min: 1000, max: 5000 }), (duration) => {
          expect(duration).toBeGreaterThanOrEqual(1000);
          expect(duration).toBeLessThanOrEqual(5000);
        }),
        testConfig
      );
    });
  });

  describe('percentage', () => {
    it('should generate values between 0 and 100', () => {
      fc.assert(
        fc.property(percentage(), (pct) => {
          expect(typeof pct).toBe('number');
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);
        }),
        testConfig
      );
    });
  });

  describe('confidenceScore', () => {
    it('should generate values between 0 and 1', () => {
      fc.assert(
        fc.property(confidenceScore(), (score) => {
          expect(typeof score).toBe('number');
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
          expect(Number.isNaN(score)).toBe(false);
        }),
        testConfig
      );
    });
  });
});
