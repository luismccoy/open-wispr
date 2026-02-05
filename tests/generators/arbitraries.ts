/**
 * Fast-check Arbitrary Generators for Property-Based Testing
 * 
 * This module provides fast-check arbitrary generators for creating random test data
 * used in property-based tests throughout the Ollie voice dictation app.
 * 
 * @module tests/generators/arbitraries
 * 
 * Validates: All property tests
 * - Property 1-20: Various property-based tests requiring random data generation
 */

import * as fc from 'fast-check';
import type { TranscriptionItem } from '../factories/transcription';
import type { AppContext, Platform } from '../factories/appContext';
import { EMAIL_APPS, CHAT_APPS, UNKNOWN_APPS } from '../factories/appContext';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Settings data structure for the application
 */
export interface SettingsData {
  dictationKey: string;
  transcribeLanguage: string;
  awsRegion: string;
  useTextEnhancement: boolean;
  enhancementModel: string;
  selectedMicrophoneId: string;
  contextAwareEnabled: boolean;
  defaultStyle: 'formal' | 'casual' | 'neutral';
}

/**
 * Style types supported by the style manager
 */
export type StyleType = 'formal' | 'casual' | 'neutral';

// ============================================================================
// Constants
// ============================================================================

/**
 * Valid AWS Transcribe language codes
 * @see https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html
 */
export const VALID_LANGUAGE_CODES = [
  'en-US', 'en-GB', 'en-AU', 'en-IN',
  'es-US', 'es-ES',
  'fr-FR', 'fr-CA',
  'de-DE',
  'it-IT',
  'pt-BR', 'pt-PT',
  'ja-JP',
  'ko-KR',
  'zh-CN',
  'ar-SA',
  'hi-IN',
  'nl-NL',
  'ru-RU',
  'tr-TR'
] as const;

/**
 * Valid AWS regions for Transcribe
 */
export const VALID_AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1',
  'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
  'ca-central-1', 'sa-east-1'
] as const;

/**
 * Reserved system keys that cannot be used as hotkeys
 */
export const RESERVED_KEYS = [
  'Escape', 'Tab', 'Enter', 'Backspace', 'Delete',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'Control', 'Alt', 'Shift', 'Meta', 'CapsLock',
  'Insert', 'PrintScreen', 'ScrollLock', 'Pause',
  'NumLock', 'ContextMenu'
] as const;

/**
 * Valid single-character hotkeys (letters)
 */
export const VALID_LETTER_HOTKEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Valid function key hotkeys
 */
export const VALID_FUNCTION_KEYS = [
  'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
  'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
] as const;

/**
 * Valid Bedrock model IDs
 */
export const VALID_BEDROCK_MODELS = [
  'anthropic.claude-3-sonnet-20240229-v1:0',
  'anthropic.claude-3-haiku-20240307-v1:0',
  'anthropic.claude-instant-v1',
  'amazon.titan-text-express-v1'
] as const;

/**
 * Supported platforms
 */
export const PLATFORMS: Platform[] = ['darwin', 'win32', 'linux'];

// ============================================================================
// Text Arbitraries
// ============================================================================

/**
 * Generates valid transcription text (non-empty strings of various lengths)
 * 
 * @returns Arbitrary that generates valid transcription text
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(validTranscriptionText(), (text) => {
 *     expect(text.length).toBeGreaterThan(0);
 *   })
 * );
 * ```
 */
export function validTranscriptionText(): fc.Arbitrary<string> {
  return fc.oneof(
    // Short phrases (1-50 chars)
    fc.string({ minLength: 1, maxLength: 50 }),
    // Medium sentences (50-200 chars)
    fc.string({ minLength: 50, maxLength: 200 }),
    // Long paragraphs (200-1000 chars)
    fc.string({ minLength: 200, maxLength: 1000 }),
    // Realistic sentences
    fc.array(fc.lorem({ mode: 'words', maxCount: 20 }), { minLength: 1, maxLength: 10 })
      .map(words => words.join(' ')),
    // Sentences with punctuation
    fc.array(fc.lorem({ mode: 'sentences', maxCount: 5 }), { minLength: 1, maxLength: 3 })
      .map(sentences => sentences.join(' '))
  ).filter(text => text.trim().length > 0);
}

/**
 * Generates empty or whitespace-only text for edge case testing
 * 
 * @returns Arbitrary that generates empty or whitespace text
 */
export function emptyOrWhitespaceText(): fc.Arbitrary<string> {
  return fc.oneof(
    fc.constant(''),
    fc.constant(' '),
    fc.constant('  '),
    fc.constant('\t'),
    fc.constant('\n'),
    fc.constant('   \t\n   ')
  );
}

/**
 * Generates Unicode text for internationalization testing
 * 
 * @returns Arbitrary that generates Unicode text
 */
export function unicodeText(): fc.Arbitrary<string> {
  // Use only constant values for predictable unicode text generation
  return fc.constantFrom(
    // Japanese
    '日本語テスト',
    // Chinese
    '中文测试',
    // Korean
    '한국어 테스트',
    // Arabic
    'اختبار عربي',
    // Russian
    'Русский тест',
    // Emojis
    '🎤🎧🎵🎶',
    // Mixed
    'Hello 世界 🌍',
    // More Japanese
    'こんにちは世界',
    // More Chinese
    '你好世界',
    // Greek
    'Γειά σου κόσμε',
    // Hebrew
    'שלום עולם',
    // Thai
    'สวัสดีโลก',
    // Hindi
    'नमस्ते दुनिया',
    // Mixed with numbers
    '日本語123テスト',
    // Emoji sequence
    '👋🌍✨🎉'
  );
}

/**
 * Generates text with special characters for encoding testing
 * 
 * @returns Arbitrary that generates text with special characters
 */
export function specialCharText(): fc.Arbitrary<string> {
  return fc.oneof(
    fc.constant('<script>alert("test")</script>'),
    fc.constant('& "quotes" \'apostrophe\''),
    fc.constant('Line1\nLine2\nLine3'),
    fc.constant('Tab\there'),
    fc.constant('Special: @#$%^&*()'),
    fc.constant('Path: C:\\Users\\test'),
    fc.constant('URL: https://example.com?q=test&a=1')
  );
}

// ============================================================================
// Hotkey Arbitraries
// ============================================================================

/**
 * Generates valid hotkey characters (single letters or function keys)
 * 
 * @returns Arbitrary that generates valid hotkey strings
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(validHotkey(), (hotkey) => {
 *     expect(RESERVED_KEYS).not.toContain(hotkey);
 *   })
 * );
 * ```
 */
export function validHotkey(): fc.Arbitrary<string> {
  return fc.oneof(
    // Single uppercase letters
    fc.constantFrom(...VALID_LETTER_HOTKEYS),
    // Function keys
    fc.constantFrom(...VALID_FUNCTION_KEYS)
  );
}

/**
 * Generates reserved/invalid hotkey characters
 * 
 * @returns Arbitrary that generates reserved hotkey strings
 */
export function reservedHotkey(): fc.Arbitrary<string> {
  return fc.constantFrom(...RESERVED_KEYS);
}

/**
 * Generates any hotkey (valid or invalid) for testing validation
 * 
 * @returns Arbitrary that generates any hotkey string
 */
export function anyHotkey(): fc.Arbitrary<string> {
  return fc.oneof(
    validHotkey(),
    reservedHotkey(),
    fc.string({ minLength: 1, maxLength: 10 })
  );
}

// ============================================================================
// Language Code Arbitraries
// ============================================================================

/**
 * Generates valid AWS Transcribe language codes
 * 
 * @returns Arbitrary that generates valid language code strings
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(validLanguageCode(), (code) => {
 *     expect(code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
 *   })
 * );
 * ```
 */
export function validLanguageCode(): fc.Arbitrary<string> {
  return fc.constantFrom(...VALID_LANGUAGE_CODES);
}

/**
 * Generates the two-letter language prefix from a language code
 * 
 * @returns Arbitrary that generates language prefixes (e.g., 'EN', 'ES')
 */
export function languagePrefix(): fc.Arbitrary<string> {
  return validLanguageCode().map(code => code.split('-')[0].toUpperCase());
}

/**
 * Generates valid AWS region strings
 * 
 * @returns Arbitrary that generates valid AWS region strings
 */
export function validAwsRegion(): fc.Arbitrary<string> {
  return fc.constantFrom(...VALID_AWS_REGIONS);
}

// ============================================================================
// Transcription Item Arbitraries
// ============================================================================

/**
 * Generates a valid transcription ID (positive integer)
 * 
 * @returns Arbitrary that generates positive integer IDs
 */
export function transcriptionId(): fc.Arbitrary<number> {
  return fc.integer({ min: 1, max: 1000000 });
}

/**
 * Generates a valid ISO timestamp string
 * 
 * @returns Arbitrary that generates ISO timestamp strings
 */
export function isoTimestamp(): fc.Arbitrary<string> {
  // Generate timestamps between 2020 and 2030 using integer milliseconds
  const minTime = new Date('2020-01-01T00:00:00.000Z').getTime();
  const maxTime = new Date('2030-12-31T23:59:59.999Z').getTime();
  
  return fc.integer({ min: minTime, max: maxTime })
    .map(ms => new Date(ms).toISOString());
}

/**
 * Generates a complete TranscriptionItem object
 * 
 * @returns Arbitrary that generates TranscriptionItem objects
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(transcriptionItem(), (item) => {
 *     expect(item.id).toBeGreaterThan(0);
 *     expect(item.text).toBeDefined();
 *     expect(item.timestamp).toBeDefined();
 *   })
 * );
 * ```
 */
export function transcriptionItem(): fc.Arbitrary<TranscriptionItem> {
  return fc.record({
    id: transcriptionId(),
    text: validTranscriptionText(),
    timestamp: isoTimestamp(),
    duration: fc.option(fc.integer({ min: 100, max: 300000 }), { nil: undefined }),
    language: fc.option(validLanguageCode(), { nil: undefined })
  });
}

/**
 * Generates a list of transcription items
 * 
 * @param options - Configuration for the list generation
 * @returns Arbitrary that generates arrays of TranscriptionItem objects
 */
export function transcriptionList(options?: {
  minLength?: number;
  maxLength?: number;
}): fc.Arbitrary<TranscriptionItem[]> {
  const minLength = options?.minLength ?? 0;
  const maxLength = options?.maxLength ?? 50;
  
  return fc.array(transcriptionItem(), { minLength, maxLength });
}

/**
 * Generates a list of transcription items with unique IDs
 * 
 * @param options - Configuration for the list generation
 * @returns Arbitrary that generates arrays with unique IDs
 */
export function uniqueTranscriptionList(options?: {
  minLength?: number;
  maxLength?: number;
}): fc.Arbitrary<TranscriptionItem[]> {
  const minLength = options?.minLength ?? 0;
  const maxLength = options?.maxLength ?? 50;
  
  return fc.array(transcriptionItem(), { minLength, maxLength })
    .map(items => {
      // Ensure unique IDs
      const seen = new Set<number>();
      return items.filter(item => {
        if (seen.has(item.id)) {
          return false;
        }
        seen.add(item.id);
        return true;
      });
    });
}

/**
 * Generates a list of transcription items sorted by timestamp (descending)
 * 
 * @param options - Configuration for the list generation
 * @returns Arbitrary that generates sorted arrays
 */
export function sortedTranscriptionList(options?: {
  minLength?: number;
  maxLength?: number;
}): fc.Arbitrary<TranscriptionItem[]> {
  return transcriptionList(options).map(items => 
    [...items].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  );
}

// ============================================================================
// App Context Arbitraries
// ============================================================================

/**
 * Generates a valid platform type
 * 
 * @returns Arbitrary that generates platform strings
 */
export function platform(): fc.Arbitrary<Platform> {
  return fc.constantFrom<Platform>('darwin', 'win32', 'linux');
}

/**
 * Generates an email app context
 * 
 * @returns Arbitrary that generates email AppContext objects
 */
export function emailAppContext(): fc.Arbitrary<AppContext> {
  const emailApps = Object.values(EMAIL_APPS);
  return fc.constantFrom(...emailApps).map(app => ({
    appName: app.appName,
    bundleId: app.bundleId,
    executablePath: app.executablePath,
    windowTitle: app.windowTitle,
    platform: app.platform
  }));
}

/**
 * Generates a chat app context
 * 
 * @returns Arbitrary that generates chat AppContext objects
 */
export function chatAppContext(): fc.Arbitrary<AppContext> {
  const chatApps = Object.values(CHAT_APPS);
  return fc.constantFrom(...chatApps).map(app => ({
    appName: app.appName,
    bundleId: app.bundleId,
    executablePath: app.executablePath,
    windowTitle: app.windowTitle,
    platform: app.platform
  }));
}

/**
 * Generates an unknown app context
 * 
 * @returns Arbitrary that generates unknown AppContext objects
 */
export function unknownAppContext(): fc.Arbitrary<AppContext> {
  const unknownApps = Object.values(UNKNOWN_APPS);
  return fc.constantFrom(...unknownApps).map(app => ({
    appName: app.appName,
    bundleId: app.bundleId,
    executablePath: app.executablePath,
    windowTitle: app.windowTitle,
    platform: app.platform
  }));
}

/**
 * Generates any app context (email, chat, or unknown)
 * 
 * @returns Arbitrary that generates any AppContext object
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(appContext(), (context) => {
 *     expect(context.appName).toBeDefined();
 *     expect(context.platform).toMatch(/^(darwin|win32|linux)$/);
 *   })
 * );
 * ```
 */
export function appContext(): fc.Arbitrary<AppContext> {
  return fc.oneof(
    emailAppContext(),
    chatAppContext(),
    unknownAppContext()
  );
}

/**
 * Generates a custom app context with random values
 * 
 * @returns Arbitrary that generates custom AppContext objects
 */
export function customAppContext(): fc.Arbitrary<AppContext> {
  return fc.record({
    appName: fc.string({ minLength: 1, maxLength: 50 }),
    bundleId: fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: null }),
    executablePath: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: null }),
    windowTitle: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    platform: platform()
  });
}

// ============================================================================
// Settings Arbitraries
// ============================================================================

/**
 * Generates a valid style type
 * 
 * @returns Arbitrary that generates style type strings
 */
export function styleType(): fc.Arbitrary<StyleType> {
  return fc.constantFrom<StyleType>('formal', 'casual', 'neutral');
}

/**
 * Generates a valid Bedrock model ID
 * 
 * @returns Arbitrary that generates Bedrock model ID strings
 */
export function bedrockModel(): fc.Arbitrary<string> {
  return fc.constantFrom(...VALID_BEDROCK_MODELS);
}

/**
 * Generates a valid microphone device ID
 * 
 * @returns Arbitrary that generates device ID strings
 */
export function microphoneId(): fc.Arbitrary<string> {
  return fc.oneof(
    fc.constant('default'),
    fc.uuid()
  );
}

/**
 * Generates a complete SettingsData object
 * 
 * @returns Arbitrary that generates SettingsData objects
 * 
 * @example
 * ```typescript
 * fc.assert(
 *   fc.property(settingsData(), (settings) => {
 *     expect(VALID_LANGUAGE_CODES).toContain(settings.transcribeLanguage);
 *     expect(VALID_AWS_REGIONS).toContain(settings.awsRegion);
 *   })
 * );
 * ```
 */
export function settingsData(): fc.Arbitrary<SettingsData> {
  return fc.record({
    dictationKey: validHotkey(),
    transcribeLanguage: validLanguageCode(),
    awsRegion: validAwsRegion(),
    useTextEnhancement: fc.boolean(),
    enhancementModel: bedrockModel(),
    selectedMicrophoneId: microphoneId(),
    contextAwareEnabled: fc.boolean(),
    defaultStyle: styleType()
  });
}

/**
 * Generates partial settings data for update testing
 * 
 * @returns Arbitrary that generates partial SettingsData objects
 */
export function partialSettingsData(): fc.Arbitrary<Partial<SettingsData>> {
  return fc.record({
    dictationKey: fc.option(validHotkey(), { nil: undefined }),
    transcribeLanguage: fc.option(validLanguageCode(), { nil: undefined }),
    awsRegion: fc.option(validAwsRegion(), { nil: undefined }),
    useTextEnhancement: fc.option(fc.boolean(), { nil: undefined }),
    enhancementModel: fc.option(bedrockModel(), { nil: undefined }),
    selectedMicrophoneId: fc.option(microphoneId(), { nil: undefined }),
    contextAwareEnabled: fc.option(fc.boolean(), { nil: undefined }),
    defaultStyle: fc.option(styleType(), { nil: undefined })
  }).map(obj => {
    // Remove undefined values
    const result: Partial<SettingsData> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (result as Record<string, unknown>)[key] = value;
      }
    }
    return result;
  });
}

// ============================================================================
// Audio Buffer Arbitraries
// ============================================================================

/**
 * Generates mock audio buffer data
 * 
 * @param options - Configuration for buffer generation
 * @returns Arbitrary that generates ArrayBuffer objects
 */
export function audioBuffer(options?: {
  minSize?: number;
  maxSize?: number;
}): fc.Arbitrary<ArrayBuffer> {
  const minSize = options?.minSize ?? 1024;
  const maxSize = options?.maxSize ?? 65536;
  
  return fc.integer({ min: minSize, max: maxSize })
    .map(size => new ArrayBuffer(size));
}

/**
 * Generates a list of audio buffer chunks
 * 
 * @param options - Configuration for chunk generation
 * @returns Arbitrary that generates arrays of ArrayBuffer objects
 */
export function audioChunks(options?: {
  minChunks?: number;
  maxChunks?: number;
  chunkSize?: number;
}): fc.Arbitrary<ArrayBuffer[]> {
  const minChunks = options?.minChunks ?? 1;
  const maxChunks = options?.maxChunks ?? 20;
  const chunkSize = options?.chunkSize ?? 4096;
  
  return fc.array(
    fc.constant(new ArrayBuffer(chunkSize)),
    { minLength: minChunks, maxLength: maxChunks }
  );
}

/**
 * Generates Float32Array audio samples
 * 
 * @param options - Configuration for sample generation
 * @returns Arbitrary that generates Float32Array objects
 */
export function audioSamples(options?: {
  minLength?: number;
  maxLength?: number;
}): fc.Arbitrary<Float32Array> {
  const minLength = options?.minLength ?? 128;
  const maxLength = options?.maxLength ?? 4096;
  
  return fc.array(
    fc.float({ min: -1, max: 1, noNaN: true }),
    { minLength, maxLength }
  ).map(arr => new Float32Array(arr));
}

// ============================================================================
// Style Mapping Arbitraries
// ============================================================================

/**
 * Generates a style mapping entry (app name to style)
 * 
 * @returns Arbitrary that generates [appName, style] tuples
 */
export function styleMapping(): fc.Arbitrary<[string, StyleType]> {
  return fc.tuple(
    fc.string({ minLength: 1, maxLength: 50 }),
    styleType()
  );
}

/**
 * Generates a map of style mappings
 * 
 * @param options - Configuration for map generation
 * @returns Arbitrary that generates Map objects
 */
export function styleMappingMap(options?: {
  minSize?: number;
  maxSize?: number;
}): fc.Arbitrary<Map<string, StyleType>> {
  const minSize = options?.minSize ?? 0;
  const maxSize = options?.maxSize ?? 20;
  
  return fc.array(styleMapping(), { minLength: minSize, maxLength: maxSize })
    .map(entries => new Map(entries));
}

/**
 * Generates a JSON-serializable style mapping object
 * 
 * @returns Arbitrary that generates plain objects
 */
export function styleMappingObject(): fc.Arbitrary<Record<string, StyleType>> {
  return fc.dictionary(
    fc.string({ minLength: 1, maxLength: 50 }),
    styleType()
  );
}

// ============================================================================
// Toast Arbitraries
// ============================================================================

/**
 * Generates toast notification data
 * 
 * @returns Arbitrary that generates toast data objects
 */
export function toastData(): fc.Arbitrary<{
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}> {
  return fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    variant: fc.option(fc.constantFrom('default' as const, 'destructive' as const), { nil: undefined }),
    duration: fc.option(fc.integer({ min: 1000, max: 10000 }), { nil: undefined })
  });
}

// ============================================================================
// Utility Arbitraries
// ============================================================================

/**
 * Generates a positive duration in milliseconds
 * 
 * @param options - Configuration for duration generation
 * @returns Arbitrary that generates positive integers
 */
export function durationMs(options?: {
  min?: number;
  max?: number;
}): fc.Arbitrary<number> {
  return fc.integer({
    min: options?.min ?? 0,
    max: options?.max ?? 300000 // 5 minutes max
  });
}

/**
 * Generates a percentage value (0-100)
 * 
 * @returns Arbitrary that generates numbers between 0 and 100
 */
export function percentage(): fc.Arbitrary<number> {
  return fc.integer({ min: 0, max: 100 });
}

/**
 * Generates a confidence score (0-1)
 * 
 * @returns Arbitrary that generates numbers between 0 and 1
 */
export function confidenceScore(): fc.Arbitrary<number> {
  return fc.float({ min: 0, max: 1, noNaN: true });
}

// ============================================================================
// Default Export
// ============================================================================

export default {
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
};
