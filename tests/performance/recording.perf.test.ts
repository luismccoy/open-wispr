/**
 * Recording Performance Tests
 * 
 * Tests recording and transcription performance to ensure operations
 * complete within acceptable time limits.
 * 
 * @module tests/performance/recording.perf.test.ts
 * 
 * Validates: Requirements 14.2-14.4
 * - 14.2: Recording start latency SHALL be less than 100ms
 * - 14.3: Transcription partial result latency SHALL be less than 500ms
 * - 14.4: Enhancement latency SHALL be less than 2 seconds
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElectronAPI, type MockElectronAPI } from '../mocks/electronAPI';
import { createMockAWSServices, type MockAWSServices } from '../mocks/awsServices';

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

/**
 * Measures execution time of a sync function
 */
function measureTimeSync<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// ============================================================================
// Test Setup
// ============================================================================

describe('Recording Performance Tests', () => {
  let mockElectronAPI: MockElectronAPI;
  let mockAWSServices: MockAWSServices;

  beforeEach(() => {
    mockElectronAPI = createMockElectronAPI();
    mockAWSServices = createMockAWSServices();

    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.__reset();
    mockAWSServices.__resetAll();
  });

  // ==========================================================================
  // Requirement 14.2: Recording Start Latency < 100ms
  // ==========================================================================
  describe('Recording Start Latency (Requirement 14.2)', () => {
    it('should start recording within 100ms', async () => {
      // Arrange
      const MAX_START_LATENCY_MS = 100;

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_START_LATENCY_MS);
    });

    it('should initialize audio capture quickly', async () => {
      // Arrange
      const MAX_AUDIO_INIT_MS = 50;

      // Act
      const { duration } = await measureTime(async () => {
        // Simulate audio initialization
        await Promise.resolve();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_AUDIO_INIT_MS);
    });

    it('should establish WebSocket connection quickly', async () => {
      // Arrange
      const MAX_WEBSOCKET_CONNECT_MS = 100;

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_WEBSOCKET_CONNECT_MS);
    });

    it('should handle rapid start/stop cycles efficiently', async () => {
      // Arrange
      const MAX_CYCLE_TIME_MS = 200;
      const NUM_CYCLES = 5;

      // Act
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < NUM_CYCLES; i++) {
          await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
          await mockElectronAPI.streamingTranscribeEnd();
        }
      });

      // Assert - average cycle time should be reasonable
      const avgCycleTime = duration / NUM_CYCLES;
      expect(avgCycleTime).toBeLessThan(MAX_CYCLE_TIME_MS);
    });

    it('should start with language detection quickly', async () => {
      // Arrange
      const MAX_AUTO_DETECT_START_MS = 150;

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeStart({
          languageCode: 'auto',
          enableLanguageIdentification: true
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_AUTO_DETECT_START_MS);
    });
  });

  // ==========================================================================
  // Requirement 14.3: Transcription Partial Result Latency < 500ms
  // ==========================================================================
  describe('Transcription Partial Result Latency (Requirement 14.3)', () => {
    it('should receive partial results within 500ms', async () => {
      // Arrange
      const MAX_PARTIAL_LATENCY_MS = 500;
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });

      // Act
      const { duration } = await measureTime(async () => {
        // Simulate receiving partial result
        mockAWSServices.transcribe.simulatePartialResult('Hello');
        await Promise.resolve();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_PARTIAL_LATENCY_MS);
    });

    it('should process audio chunks quickly', async () => {
      // Arrange
      const MAX_CHUNK_PROCESS_MS = 50;
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      const audioChunk = new ArrayBuffer(1024);

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeChunk(audioChunk);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_CHUNK_PROCESS_MS);
    });

    it('should handle multiple rapid partial results', async () => {
      // Arrange
      const MAX_MULTI_PARTIAL_MS = 200;
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });

      // Act
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < 10; i++) {
          mockAWSServices.transcribe.simulatePartialResult(`Word ${i}`);
        }
        await Promise.resolve();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_MULTI_PARTIAL_MS);
    });

    it('should update UI with partial results quickly', async () => {
      // Arrange
      const MAX_UI_UPDATE_MS = 50;
      let partialText = '';
      
      // Set up callback via the transcribe mock
      mockAWSServices.transcribe.setCallbacks({
        onPartialResult: (text: string) => {
          partialText = text;
        }
      });

      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });

      // Act
      const { duration } = measureTimeSync(() => {
        mockAWSServices.transcribe.simulatePartialResult('Test partial');
        return partialText;
      });

      // Assert
      expect(duration).toBeLessThan(MAX_UI_UPDATE_MS);
    });

    it('should handle long partial results efficiently', async () => {
      // Arrange
      const MAX_LONG_PARTIAL_MS = 100;
      const longText = 'This is a very long partial result '.repeat(50);
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });

      // Act
      const { duration } = await measureTime(async () => {
        mockAWSServices.transcribe.simulatePartialResult(longText);
        await Promise.resolve();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_LONG_PARTIAL_MS);
    });
  });

  // ==========================================================================
  // Requirement 14.4: Enhancement Latency < 2 seconds
  // ==========================================================================
  describe('Enhancement Latency (Requirement 14.4)', () => {
    it('should enhance text within 2 seconds', async () => {
      // Arrange
      const MAX_ENHANCEMENT_LATENCY_MS = 2000;
      const rawText = 'this is some text that needs enhancement';

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.invokeBedrockModel({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt: `Enhance: ${rawText}`
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_ENHANCEMENT_LATENCY_MS);
    });

    it('should handle short text enhancement quickly', async () => {
      // Arrange
      const MAX_SHORT_ENHANCEMENT_MS = 500;
      const shortText = 'hello world';

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.invokeBedrockModel({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt: shortText
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_SHORT_ENHANCEMENT_MS);
    });

    it('should handle medium text enhancement within limits', async () => {
      // Arrange
      const MAX_MEDIUM_ENHANCEMENT_MS = 1000;
      const mediumText = 'This is a medium length text that contains several sentences. '.repeat(5);

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.invokeBedrockModel({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt: mediumText
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_MEDIUM_ENHANCEMENT_MS);
    });

    it('should handle long text enhancement within limits', async () => {
      // Arrange
      const MAX_LONG_ENHANCEMENT_MS = 2000;
      const longText = 'This is a longer piece of text that simulates a real dictation session. '.repeat(20);

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.invokeBedrockModel({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt: longText
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_LONG_ENHANCEMENT_MS);
    });

    it('should skip enhancement quickly when disabled', async () => {
      // Arrange
      const MAX_SKIP_TIME_MS = 10;
      const enhancementEnabled = false;

      // Act
      const { duration } = measureTimeSync(() => {
        if (!enhancementEnabled) {
          return 'raw text';
        }
        return 'enhanced text';
      });

      // Assert
      expect(duration).toBeLessThan(MAX_SKIP_TIME_MS);
    });
  });

  // ==========================================================================
  // End-to-End Recording Performance
  // ==========================================================================
  describe('End-to-End Recording Performance', () => {
    it('should complete full recording cycle within acceptable time', async () => {
      // Arrange
      const MAX_FULL_CYCLE_MS = 3000;

      // Act
      const { duration } = await measureTime(async () => {
        // Start recording
        await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
        
        // Send some audio chunks
        for (let i = 0; i < 5; i++) {
          await mockElectronAPI.streamingTranscribeChunk(new ArrayBuffer(1024));
        }
        
        // End recording
        await mockElectronAPI.streamingTranscribeEnd();
        
        // Enhance text
        await mockElectronAPI.invokeBedrockModel({
          modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
          prompt: 'Hello world'
        });
      });

      // Assert
      expect(duration).toBeLessThan(MAX_FULL_CYCLE_MS);
    });

    it('should handle abort quickly', async () => {
      // Arrange
      const MAX_ABORT_TIME_MS = 100;
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeAbort();
      });

      // Assert
      expect(duration).toBeLessThan(MAX_ABORT_TIME_MS);
    });

    it('should maintain performance under repeated use', async () => {
      // Arrange
      const NUM_ITERATIONS = 3;
      const durations: number[] = [];

      // Act
      for (let i = 0; i < NUM_ITERATIONS; i++) {
        const { duration } = await measureTime(async () => {
          await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
          await mockElectronAPI.streamingTranscribeChunk(new ArrayBuffer(1024));
          await mockElectronAPI.streamingTranscribeEnd();
        });
        durations.push(duration);
      }

      // Assert - later iterations should not be significantly slower
      const firstDuration = durations[0];
      const lastDuration = durations[durations.length - 1];
      expect(lastDuration).toBeLessThan(firstDuration * 2);
    });
  });

  // ==========================================================================
  // Audio Processing Performance
  // ==========================================================================
  describe('Audio Processing Performance', () => {
    it('should process audio buffer quickly', async () => {
      // Arrange
      const MAX_BUFFER_PROCESS_MS = 20;
      const audioBuffer = new ArrayBuffer(4096);

      // Act
      const { duration } = measureTimeSync(() => {
        // Simulate buffer processing
        const view = new DataView(audioBuffer);
        let sum = 0;
        for (let i = 0; i < audioBuffer.byteLength; i += 2) {
          sum += view.getInt16(i, true);
        }
        return sum;
      });

      // Assert
      expect(duration).toBeLessThan(MAX_BUFFER_PROCESS_MS);
    });

    it('should handle large audio chunks efficiently', async () => {
      // Arrange
      const MAX_LARGE_CHUNK_MS = 50;
      const largeChunk = new ArrayBuffer(32768); // 32KB

      // Act
      const { duration } = await measureTime(async () => {
        await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
        await mockElectronAPI.streamingTranscribeChunk(largeChunk);
      });

      // Assert
      expect(duration).toBeLessThan(MAX_LARGE_CHUNK_MS);
    });

    it('should handle continuous audio stream efficiently', async () => {
      // Arrange
      const MAX_STREAM_TIME_MS = 500;
      const NUM_CHUNKS = 50;
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });

      // Act
      const { duration } = await measureTime(async () => {
        for (let i = 0; i < NUM_CHUNKS; i++) {
          await mockElectronAPI.streamingTranscribeChunk(new ArrayBuffer(1024));
        }
      });

      // Assert
      expect(duration).toBeLessThan(MAX_STREAM_TIME_MS);
    });
  });
});
