/**
 * Test Factory for Transcription Items
 * 
 * This module provides factory functions for creating test data
 * for transcription items used throughout the Ollie voice dictation app tests.
 * 
 * @module tests/factories/transcription
 * 
 * Validates: Requirements 2.3, 2.4, 11.1-11.3
 * - 2.3: Transcription history display in chronological order with timestamps
 * - 2.4: Delete transcription functionality
 * - 11.1-11.3: Database save/get/delete transcription operations
 */

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
  duration?: number;
  language?: string;
}

/**
 * Options for creating a transcription item
 */
export interface CreateTranscriptionItemOptions {
  /** Override the auto-generated ID */
  id?: number;
  /** Override the default text */
  text?: string;
  /** Override the auto-generated timestamp */
  timestamp?: string;
  /** Set the duration in milliseconds */
  duration?: number;
  /** Set the detected language code */
  language?: string;
}

/**
 * Options for creating a list of transcription items
 */
export interface CreateTranscriptionListOptions {
  /** Number of items to create (default: 5) */
  count?: number;
  /** Starting ID for the list (default: 1) */
  startId?: number;
  /** Base timestamp for the list (default: now) */
  baseTimestamp?: Date;
  /** Time interval between items in milliseconds (default: 60000 = 1 minute) */
  intervalMs?: number;
  /** Whether to sort in descending order by timestamp (default: true) */
  descendingOrder?: boolean;
  /** Common language for all items */
  language?: string;
  /** Text prefix for generated items */
  textPrefix?: string;
}

// ============================================================================
// Internal State
// ============================================================================

/** Counter for generating unique IDs */
let idCounter = 1;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a single transcription item with sensible defaults
 * 
 * @param overrides - Optional overrides for the default values
 * @returns A TranscriptionItem with the specified or default values
 * 
 * @example
 * ```typescript
 * // Create with all defaults
 * const item = createTranscriptionItem();
 * 
 * // Create with custom text
 * const item = createTranscriptionItem({ text: 'Hello world' });
 * 
 * // Create with all custom values
 * const item = createTranscriptionItem({
 *   id: 42,
 *   text: 'Custom transcription',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   duration: 5000,
 *   language: 'en-US'
 * });
 * ```
 */
export function createTranscriptionItem(
  overrides?: CreateTranscriptionItemOptions
): TranscriptionItem {
  const id = overrides?.id ?? idCounter++;
  const timestamp = overrides?.timestamp ?? new Date().toISOString();
  const text = overrides?.text ?? `Transcription ${id}`;

  const item: TranscriptionItem = {
    id,
    text,
    timestamp,
  };

  // Only add optional fields if they are provided
  if (overrides?.duration !== undefined) {
    item.duration = overrides.duration;
  }

  if (overrides?.language !== undefined) {
    item.language = overrides.language;
  }

  return item;
}

/**
 * Creates a list of transcription items with configurable options
 * 
 * By default, items are created in descending chronological order (newest first)
 * to match the expected display order in the Control Panel.
 * 
 * @param options - Configuration options for the list
 * @returns An array of TranscriptionItem objects
 * 
 * @example
 * ```typescript
 * // Create 5 items with defaults
 * const items = createTranscriptionList();
 * 
 * // Create 10 items
 * const items = createTranscriptionList({ count: 10 });
 * 
 * // Create items with specific language
 * const items = createTranscriptionList({ 
 *   count: 3, 
 *   language: 'es-US' 
 * });
 * 
 * // Create items in ascending order (oldest first)
 * const items = createTranscriptionList({ 
 *   count: 5, 
 *   descendingOrder: false 
 * });
 * 
 * // Create items with custom text prefix
 * const items = createTranscriptionList({
 *   count: 3,
 *   textPrefix: 'Meeting note'
 * });
 * ```
 */
export function createTranscriptionList(
  options?: CreateTranscriptionListOptions
): TranscriptionItem[] {
  const count = options?.count ?? 5;
  const startId = options?.startId ?? idCounter;
  const baseTimestamp = options?.baseTimestamp ?? new Date();
  const intervalMs = options?.intervalMs ?? 60000; // 1 minute default
  const descendingOrder = options?.descendingOrder ?? true;
  const language = options?.language;
  const textPrefix = options?.textPrefix ?? 'Transcription';

  // Update the global counter to avoid ID collisions
  idCounter = startId + count;

  const items: TranscriptionItem[] = [];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    
    // Calculate timestamp based on order
    // For descending order: newest (index 0) should have the latest timestamp
    // For ascending order: oldest (index 0) should have the earliest timestamp
    const timestampOffset = descendingOrder 
      ? (count - 1 - i) * intervalMs  // Newest first
      : i * intervalMs;                // Oldest first
    
    const itemTimestamp = new Date(baseTimestamp.getTime() - (count - 1) * intervalMs + timestampOffset);

    const item: TranscriptionItem = {
      id,
      text: `${textPrefix} ${id}`,
      timestamp: itemTimestamp.toISOString(),
    };

    if (language !== undefined) {
      item.language = language;
    }

    items.push(item);
  }

  return items;
}

// ============================================================================
// Specialized Factory Functions
// ============================================================================

/**
 * Creates a transcription item with English language
 */
export function createEnglishTranscription(
  overrides?: Omit<CreateTranscriptionItemOptions, 'language'>
): TranscriptionItem {
  return createTranscriptionItem({
    ...overrides,
    language: 'en-US',
  });
}

/**
 * Creates a transcription item with Spanish language
 */
export function createSpanishTranscription(
  overrides?: Omit<CreateTranscriptionItemOptions, 'language'>
): TranscriptionItem {
  return createTranscriptionItem({
    ...overrides,
    language: 'es-US',
  });
}

/**
 * Creates a transcription item with a long text (for testing truncation/display)
 */
export function createLongTranscription(
  overrides?: CreateTranscriptionItemOptions
): TranscriptionItem {
  const longText = 'This is a very long transcription that contains multiple sentences. ' +
    'It is designed to test how the UI handles longer text content. ' +
    'The transcription system should be able to handle text of various lengths. ' +
    'This includes short phrases, medium-length sentences, and longer paragraphs like this one.';
  
  return createTranscriptionItem({
    text: longText,
    ...overrides,
  });
}

/**
 * Creates a transcription item with empty text (edge case testing)
 */
export function createEmptyTranscription(
  overrides?: Omit<CreateTranscriptionItemOptions, 'text'>
): TranscriptionItem {
  return createTranscriptionItem({
    ...overrides,
    text: '',
  });
}

/**
 * Creates a transcription item with special characters (for testing encoding)
 */
export function createSpecialCharTranscription(
  overrides?: Omit<CreateTranscriptionItemOptions, 'text'>
): TranscriptionItem {
  return createTranscriptionItem({
    ...overrides,
    text: 'Special chars: <script>alert("test")</script> & "quotes" \'apostrophe\' émojis: 🎤🎧',
  });
}

/**
 * Creates a transcription item with Unicode text
 */
export function createUnicodeTranscription(
  overrides?: Omit<CreateTranscriptionItemOptions, 'text'>
): TranscriptionItem {
  return createTranscriptionItem({
    ...overrides,
    text: '日本語テスト 中文测试 한국어 테스트 العربية тест',
  });
}

/**
 * Creates a list of transcriptions with mixed languages
 */
export function createMixedLanguageList(count: number = 5): TranscriptionItem[] {
  const languages = ['en-US', 'es-US', 'fr-FR', 'de-DE', 'ja-JP'];
  const items: TranscriptionItem[] = [];

  for (let i = 0; i < count; i++) {
    items.push(createTranscriptionItem({
      language: languages[i % languages.length],
    }));
  }

  return items;
}

/**
 * Creates a list of transcriptions with varying durations
 */
export function createVariedDurationList(count: number = 5): TranscriptionItem[] {
  const items: TranscriptionItem[] = [];
  const baseDuration = 1000; // 1 second

  for (let i = 0; i < count; i++) {
    items.push(createTranscriptionItem({
      duration: baseDuration * (i + 1), // 1s, 2s, 3s, etc.
    }));
  }

  return items;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Resets the internal ID counter
 * Useful for ensuring consistent IDs across test runs
 * 
 * @param startId - The ID to start from (default: 1)
 */
export function resetIdCounter(startId: number = 1): void {
  idCounter = startId;
}

/**
 * Gets the current ID counter value
 * Useful for debugging or ensuring unique IDs
 */
export function getCurrentIdCounter(): number {
  return idCounter;
}

/**
 * Creates a timestamp string for a specific time offset from now
 * 
 * @param offsetMs - Offset in milliseconds (negative for past, positive for future)
 * @returns ISO timestamp string
 */
export function createTimestamp(offsetMs: number = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

/**
 * Creates a timestamp string for a specific date
 * 
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Second (0-59)
 * @returns ISO timestamp string
 */
export function createSpecificTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
  second: number = 0
): string {
  return new Date(year, month - 1, day, hour, minute, second).toISOString();
}

// ============================================================================
// Default Export
// ============================================================================

export default {
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
};
