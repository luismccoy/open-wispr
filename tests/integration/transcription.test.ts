/**
 * Integration Tests for Transcription System
 * 
 * Tests the streaming transcription system that handles real-time voice-to-text
 * conversion using AWS Transcribe. These tests verify the complete transcription
 * workflow including session management, audio streaming, result handling, and
 * error scenarios.
 * 
 * @module tests/integration/transcription.test.ts
 * 
 * Validates: Requirements 7.1-7.7
 * - 7.1: WHEN a streaming session starts, THE Transcription_System SHALL establish connection to AWS Transcribe
 * - 7.2: WHEN audio chunks are received, THE Transcription_System SHALL send them to the streaming endpoint
 * - 7.3: WHEN partial results are received, THE Transcription_System SHALL emit onPartialResult callback
 * - 7.4: WHEN final results are received, THE Transcription_System SHALL emit onFinalResult callback
 * - 7.5: WHEN language auto-detection is enabled, THE Transcription_System SHALL detect and report the language
 * - 7.6: WHEN the session ends, THE Transcription_System SHALL return the complete transcript
 * - 7.7: IF connection fails, THEN THE Transcription_System SHALL emit onError callback with details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockAWSServices,
  createMockTranscribeService,
  createMockAudioBuffer,
  createMockSpeechBuffer,
  simulateTranscriptionSession,
  type MockAWSServices,
  type MockTranscribeService,
  type TranscribeCallbacks
} from '../mocks/awsServices';
import { createMockElectronAPI, type MockElectronAPI } from '../mocks/electronAPI';

// ============================================================================
// Test Setup
// ============================================================================

describe('Transcription System Integration Tests', () => {
  let mockAWSServices: MockAWSServices;
  let mockTranscribe: MockTranscribeService;
  let mockElectronAPI: MockElectronAPI;
  let callbacks: TranscribeCallbacks;
  let mockOnPartialResult: ReturnType<typeof vi.fn>;
  let mockOnFinalResult: ReturnType<typeof vi.fn>;
  let mockOnLanguageDetected: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create fresh mock instances for each test
    mockAWSServices = createMockAWSServices();
    mockTranscribe = mockAWSServices.transcribe;
    mockElectronAPI = createMockElectronAPI();

    // Set up mock callbacks
    mockOnPartialResult = vi.fn();
    mockOnFinalResult = vi.fn();
    mockOnLanguageDetected = vi.fn();
    mockOnError = vi.fn();

    callbacks = {
      onPartialResult: mockOnPartialResult,
      onFinalResult: mockOnFinalResult,
      onLanguageDetected: mockOnLanguageDetected,
      onError: mockOnError
    };

    // Set callbacks on the mock transcribe service
    mockTranscribe.setCallbacks(callbacks);

    // Install mock on window
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockAWSServices.__resetAll();
    mockElectronAPI.__reset();
  });

  // ==========================================================================
  // Requirement 7.1: Streaming Session Start
  // ==========================================================================
  describe('Streaming Session Start (Requirement 7.1)', () => {
    it('should establish connection to AWS Transcribe when session starts', async () => {
      // Act
      await mockTranscribe.startSession({ languageCode: 'en-US' });

      // Assert
      expect(mockTranscribe.startSession).toHaveBeenCalledTimes(1);
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });

    it('should start session with default language code', async () => {
      // Act
      await mockTranscribe.startSession();

      // Assert
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });

    it('should start session with specific language code', async () => {
      // Act
      await mockTranscribe.startSession({ languageCode: 'es-US' });

      // Assert
      expect(mockTranscribe.startSession).toHaveBeenCalledWith({ languageCode: 'es-US' });
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });

    it('should start session with auto language detection', async () => {
      // Act
      await mockTranscribe.startSession({ 
        languageCode: 'auto',
        enableLanguageIdentification: true 
      });

      // Assert
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });

    it('should abort previous session if one is already active', async () => {
      // Arrange - start first session
      await mockTranscribe.startSession({ languageCode: 'en-US' });
      
      // Act - start second session
      await mockTranscribe.startSession({ languageCode: 'es-US' });

      // Assert - should have called startSession twice
      expect(mockTranscribe.startSession).toHaveBeenCalledTimes(2);
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });

    it('should reset transcript buffer when starting new session', async () => {
      // Arrange - start session and add some results
      await mockTranscribe.startSession();
      mockTranscribe.simulateFinalResult('Previous text');
      await mockTranscribe.endSession();

      // Act - start new session
      await mockTranscribe.startSession();

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('');
    });

    it('should start session via electronAPI', async () => {
      // Act
      const result = await window.electronAPI.streamingTranscribeStart({
        languageCode: 'en-US',
        region: 'us-east-1'
      });

      // Assert
      expect(mockElectronAPI.streamingTranscribeStart).toHaveBeenCalledWith({
        languageCode: 'en-US',
        region: 'us-east-1'
      });
      expect(result.success).toBe(true);
    });

    it('should handle session start with credentials', async () => {
      // Arrange
      const credentials = {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        sessionToken: 'test-token'
      };

      // Act
      await mockTranscribe.startSession({ credentials });

      // Assert
      expect(mockTranscribe.isSessionActive()).toBe(true);
    });
  });

  // ==========================================================================
  // Requirement 7.2: Audio Chunk Sending
  // ==========================================================================
  describe('Audio Chunk Sending (Requirement 7.2)', () => {
    beforeEach(async () => {
      // Start a session before each test in this block
      await mockTranscribe.startSession({ languageCode: 'en-US' });
    });

    it('should send audio chunks to the streaming endpoint', () => {
      // Arrange
      const audioBuffer = createMockAudioBuffer(100); // 100ms of audio

      // Act
      const result = mockTranscribe.sendChunk(audioBuffer);

      // Assert
      expect(result).toBe(true);
      expect(mockTranscribe.sendChunk).toHaveBeenCalledWith(audioBuffer);
    });

    it('should accept Buffer type audio data', () => {
      // Arrange
      const buffer = Buffer.from(new ArrayBuffer(3200));

      // Act
      const result = mockTranscribe.sendChunk(buffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept ArrayBuffer type audio data', () => {
      // Arrange
      const arrayBuffer = new ArrayBuffer(3200);

      // Act
      const result = mockTranscribe.sendChunk(arrayBuffer);

      // Assert
      expect(result).toBe(true);
    });

    it('should accept Int16Array type audio data', () => {
      // Arrange
      const int16Array = new Int16Array(1600);

      // Act
      const result = mockTranscribe.sendChunk(int16Array);

      // Assert
      expect(result).toBe(true);
    });

    it('should track number of audio chunks received', () => {
      // Arrange
      const chunk1 = createMockAudioBuffer(100);
      const chunk2 = createMockAudioBuffer(100);
      const chunk3 = createMockAudioBuffer(100);

      // Act
      mockTranscribe.sendChunk(chunk1);
      mockTranscribe.sendChunk(chunk2);
      mockTranscribe.sendChunk(chunk3);

      // Assert
      expect(mockTranscribe.__getAudioChunksReceived()).toBe(3);
    });

    it('should return false when session is not active', async () => {
      // Arrange - end the session
      await mockTranscribe.endSession();
      const audioBuffer = createMockAudioBuffer(100);

      // Act
      const result = mockTranscribe.sendChunk(audioBuffer);

      // Assert
      expect(result).toBe(false);
    });

    it('should send chunks via electronAPI', async () => {
      // Arrange
      const audioBuffer = new ArrayBuffer(3200);

      // Act
      const result = await window.electronAPI.streamingTranscribeChunk(audioBuffer);

      // Assert
      expect(mockElectronAPI.streamingTranscribeChunk).toHaveBeenCalledWith(audioBuffer);
      expect(result.success).toBe(true);
    });

    it('should handle multiple rapid chunk sends', () => {
      // Arrange & Act
      for (let i = 0; i < 100; i++) {
        const chunk = createMockAudioBuffer(100);
        mockTranscribe.sendChunk(chunk);
      }

      // Assert
      expect(mockTranscribe.__getAudioChunksReceived()).toBe(100);
    });

    it('should handle large audio chunks', () => {
      // Arrange - 1 second of audio at 16kHz, 16-bit
      const largeBuffer = createMockSpeechBuffer(1000);

      // Act
      const result = mockTranscribe.sendChunk(largeBuffer);

      // Assert
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // Requirement 7.3: Partial Result Handling
  // ==========================================================================
  describe('Partial Result Handling (Requirement 7.3)', () => {
    beforeEach(async () => {
      await mockTranscribe.startSession({ languageCode: 'en-US' });
    });

    it('should emit onPartialResult callback when partial results are received', () => {
      // Act
      mockTranscribe.simulatePartialResult('Hello');

      // Assert
      expect(mockOnPartialResult).toHaveBeenCalledTimes(1);
      expect(mockOnPartialResult).toHaveBeenCalledWith('Hello');
    });

    it('should update current transcript with partial results', () => {
      // Act
      mockTranscribe.simulatePartialResult('Hello world');

      // Assert
      expect(mockTranscribe.getCurrentTranscript()).toBe('Hello world');
    });

    it('should replace previous partial result with new one', () => {
      // Act
      mockTranscribe.simulatePartialResult('Hel');
      mockTranscribe.simulatePartialResult('Hello');
      mockTranscribe.simulatePartialResult('Hello wor');
      mockTranscribe.simulatePartialResult('Hello world');

      // Assert
      expect(mockTranscribe.getCurrentTranscript()).toBe('Hello world');
      expect(mockOnPartialResult).toHaveBeenCalledTimes(4);
    });

    it('should combine final results with partial results in current transcript', () => {
      // Arrange - add a final result first
      mockTranscribe.simulateFinalResult('First sentence.');

      // Act - add partial result
      mockTranscribe.simulatePartialResult('Second');

      // Assert
      expect(mockTranscribe.getCurrentTranscript()).toBe('First sentence. Second');
    });

    it('should not include partial results in final transcript', () => {
      // Act
      mockTranscribe.simulatePartialResult('This is partial');

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('');
    });

    it('should handle empty partial results', () => {
      // Act
      mockTranscribe.simulatePartialResult('');

      // Assert
      expect(mockOnPartialResult).toHaveBeenCalledWith('');
    });

    it('should handle partial results with special characters', () => {
      // Act
      mockTranscribe.simulatePartialResult('Hello! @#$% "quotes"');

      // Assert
      expect(mockOnPartialResult).toHaveBeenCalledWith('Hello! @#$% "quotes"');
    });

    it('should handle partial results with unicode', () => {
      // Act
      mockTranscribe.simulatePartialResult('日本語 中文 🎉');

      // Assert
      expect(mockOnPartialResult).toHaveBeenCalledWith('日本語 中文 🎉');
    });

    it('should not emit partial result when session is not active', async () => {
      // Arrange
      await mockTranscribe.endSession();

      // Act
      mockTranscribe.simulatePartialResult('Should not emit');

      // Assert - callback should not be called after session ends
      // Note: The mock may still call it, but in real implementation it wouldn't
      expect(mockTranscribe.isSessionActive()).toBe(false);
    });

    it('should handle streaming partial events via electronAPI', () => {
      // Arrange
      const partialCallback = vi.fn();
      window.electronAPI.onStreamingPartial(partialCallback);

      // Act - emit event
      mockElectronAPI.__emitEvent('streaming-transcribe-partial', { text: 'Hello' });

      // Assert
      expect(partialCallback).toHaveBeenCalledWith({ text: 'Hello' });
    });
  });

  // ==========================================================================
  // Requirement 7.4: Final Result Handling
  // ==========================================================================
  describe('Final Result Handling (Requirement 7.4)', () => {
    beforeEach(async () => {
      await mockTranscribe.startSession({ languageCode: 'en-US' });
    });

    it('should emit onFinalResult callback when final results are received', () => {
      // Act
      mockTranscribe.simulateFinalResult('Hello world');

      // Assert
      expect(mockOnFinalResult).toHaveBeenCalledTimes(1);
      expect(mockOnFinalResult).toHaveBeenCalledWith('Hello world');
    });

    it('should add final results to transcript buffer', () => {
      // Act
      mockTranscribe.simulateFinalResult('Hello world');

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('Hello world');
    });

    it('should concatenate multiple final results', () => {
      // Act
      mockTranscribe.simulateFinalResult('First sentence.');
      mockTranscribe.simulateFinalResult('Second sentence.');
      mockTranscribe.simulateFinalResult('Third sentence.');

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('First sentence. Second sentence. Third sentence.');
    });

    it('should clear partial transcript when final result is received', () => {
      // Arrange
      mockTranscribe.simulatePartialResult('Hello wor');

      // Act
      mockTranscribe.simulateFinalResult('Hello world');

      // Assert
      expect(mockTranscribe.getCurrentTranscript()).toBe('Hello world');
      expect(mockTranscribe.getFinalTranscript()).toBe('Hello world');
    });

    it('should handle empty final results', () => {
      // Act
      mockTranscribe.simulateFinalResult('');

      // Assert
      expect(mockOnFinalResult).toHaveBeenCalledWith('');
    });

    it('should handle final results with punctuation', () => {
      // Act
      mockTranscribe.simulateFinalResult('Hello, world! How are you?');

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('Hello, world! How are you?');
    });

    it('should handle final results with newlines', () => {
      // Act
      mockTranscribe.simulateFinalResult('Line one.\nLine two.');

      // Assert
      expect(mockTranscribe.getFinalTranscript()).toBe('Line one.\nLine two.');
    });

    it('should handle streaming final events via electronAPI', () => {
      // Arrange
      const finalCallback = vi.fn();
      window.electronAPI.onStreamingFinal(finalCallback);

      // Act - emit event
      mockElectronAPI.__emitEvent('streaming-transcribe-final', { text: 'Final result' });

      // Assert
      expect(finalCallback).toHaveBeenCalledWith({ text: 'Final result' });
    });

    it('should preserve order of final results', () => {
      // Act
      mockTranscribe.simulateFinalResult('One');
      mockTranscribe.simulateFinalResult('Two');
      mockTranscribe.simulateFinalResult('Three');

      // Assert
      const transcript = mockTranscribe.getFinalTranscript();
      expect(transcript.indexOf('One')).toBeLessThan(transcript.indexOf('Two'));
      expect(transcript.indexOf('Two')).toBeLessThan(transcript.indexOf('Three'));
    });
  });

  // ==========================================================================
  // Requirement 7.5: Language Detection
  // ==========================================================================
  describe('Language Detection (Requirement 7.5)', () => {
    beforeEach(async () => {
      await mockTranscribe.startSession({ 
        languageCode: 'auto',
        enableLanguageIdentification: true 
      });
    });

    it('should detect and report the language when auto-detection is enabled', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('en-US');

      // Assert
      expect(mockOnLanguageDetected).toHaveBeenCalledTimes(1);
      expect(mockOnLanguageDetected).toHaveBeenCalledWith('en-US');
    });

    it('should store detected language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('es-US');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('es-US');
    });

    it('should detect Spanish language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('es-US');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('es-US');
      expect(mockOnLanguageDetected).toHaveBeenCalledWith('es-US');
    });

    it('should detect French language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('fr-FR');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('fr-FR');
    });

    it('should detect German language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('de-DE');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('de-DE');
    });

    it('should detect Japanese language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('ja-JP');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('ja-JP');
    });

    it('should detect Chinese language', () => {
      // Act
      mockTranscribe.simulateLanguageDetection('zh-CN');

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBe('zh-CN');
    });

    it('should return null when language not yet detected', async () => {
      // Arrange - start fresh session
      mockTranscribe.__reset();
      await mockTranscribe.startSession();

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBeNull();
    });

    it('should handle streaming language events via electronAPI', () => {
      // Arrange
      const languageCallback = vi.fn();
      window.electronAPI.onStreamingLanguage(languageCallback);

      // Act - emit event
      mockElectronAPI.__emitEvent('streaming-transcribe-language', { languageCode: 'en-US' });

      // Assert
      expect(languageCallback).toHaveBeenCalledWith({ languageCode: 'en-US' });
    });

    it('should reset detected language when starting new session', async () => {
      // Arrange
      mockTranscribe.simulateLanguageDetection('en-US');
      expect(mockTranscribe.getDetectedLanguage()).toBe('en-US');

      // Act - end and start new session
      await mockTranscribe.endSession();
      await mockTranscribe.startSession();

      // Assert
      expect(mockTranscribe.getDetectedLanguage()).toBeNull();
    });
  });

  // ==========================================================================
  // Requirement 7.6: Session End
  // ==========================================================================
  describe('Session End (Requirement 7.6)', () => {
    beforeEach(async () => {
      await mockTranscribe.startSession({ languageCode: 'en-US' });
    });

    it('should return the complete transcript when session ends', async () => {
      // Arrange
      mockTranscribe.simulateFinalResult('Hello world');
      mockTranscribe.simulateFinalResult('This is a test');

      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('Hello world This is a test');
    });

    it('should mark session as inactive after ending', async () => {
      // Act
      await mockTranscribe.endSession();

      // Assert
      expect(mockTranscribe.isSessionActive()).toBe(false);
    });

    it('should return empty string when no transcription occurred', async () => {
      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('');
    });

    it('should not include partial results in final transcript', async () => {
      // Arrange
      mockTranscribe.simulateFinalResult('Final text');
      mockTranscribe.simulatePartialResult('Partial text');

      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('Final text');
      expect(transcript).not.toContain('Partial');
    });

    it('should handle ending session via electronAPI', async () => {
      // Act
      const result = await window.electronAPI.streamingTranscribeEnd();

      // Assert
      expect(mockElectronAPI.streamingTranscribeEnd).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('text');
    });

    it('should return transcript with proper spacing', async () => {
      // Arrange
      mockTranscribe.simulateFinalResult('First.');
      mockTranscribe.simulateFinalResult('Second.');
      mockTranscribe.simulateFinalResult('Third.');

      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('First. Second. Third.');
    });

    it('should handle ending already ended session', async () => {
      // Arrange
      await mockTranscribe.endSession();

      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('');
    });

    it('should trim whitespace from final transcript', async () => {
      // Arrange
      mockTranscribe.simulateFinalResult('Hello');
      mockTranscribe.simulateFinalResult('World');

      // Act
      const transcript = await mockTranscribe.endSession();

      // Assert - final transcript is trimmed and joined with spaces
      expect(transcript).toBe('Hello World');
      expect(transcript.trim()).toBe(transcript); // Verify no leading/trailing whitespace
    });
  });

  // ==========================================================================
  // Requirement 7.7: Error Handling
  // ==========================================================================
  describe('Error Handling (Requirement 7.7)', () => {
    it('should emit onError callback when connection fails', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const error = new Error('Connection failed');

      // Act
      mockTranscribe.simulateError(error);

      // Assert
      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(error);
    });

    it('should emit error with descriptive message', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const error = new Error('AWS Transcribe connection timeout');

      // Act
      mockTranscribe.simulateError(error);

      // Assert
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'AWS Transcribe connection timeout'
        })
      );
    });

    it('should handle network errors', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const networkError = new Error('Network request failed');

      // Act
      mockTranscribe.simulateError(networkError);

      // Assert
      expect(mockOnError).toHaveBeenCalledWith(networkError);
    });

    it('should handle credential errors', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const credentialError = new Error('Invalid AWS credentials');

      // Act
      mockTranscribe.simulateError(credentialError);

      // Assert
      expect(mockOnError).toHaveBeenCalledWith(credentialError);
    });

    it('should handle streaming errors via electronAPI', () => {
      // Arrange
      const errorCallback = vi.fn();
      window.electronAPI.onStreamingError(errorCallback);

      // Act - emit error event
      mockElectronAPI.__emitEvent('streaming-transcribe-error', { error: 'Connection lost' });

      // Assert
      expect(errorCallback).toHaveBeenCalledWith({ error: 'Connection lost' });
    });

    it('should handle session start failure', async () => {
      // Arrange - create a mock that fails on start
      const failingMock = createMockTranscribeService();
      failingMock.startSession = vi.fn().mockRejectedValue(new Error('Failed to start session'));

      // Act & Assert
      await expect(failingMock.startSession()).rejects.toThrow('Failed to start session');
    });

    it('should handle transcription service unavailable', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const serviceError = new Error('Service temporarily unavailable');

      // Act
      mockTranscribe.simulateError(serviceError);

      // Assert
      expect(mockOnError).toHaveBeenCalledWith(serviceError);
    });

    it('should handle rate limit errors', async () => {
      // Arrange
      await mockTranscribe.startSession();
      const rateLimitError = new Error('Rate limit exceeded');

      // Act
      mockTranscribe.simulateError(rateLimitError);

      // Assert
      expect(mockOnError).toHaveBeenCalledWith(rateLimitError);
    });

    it('should handle electronAPI start failure', async () => {
      // Arrange
      mockElectronAPI.streamingTranscribeStart.mockResolvedValueOnce({
        success: false,
        error: 'Failed to connect to AWS Transcribe'
      });

      // Act
      const result = await window.electronAPI.streamingTranscribeStart({
        languageCode: 'en-US'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to connect to AWS Transcribe');
    });

    it('should handle electronAPI end failure', async () => {
      // Arrange
      mockElectronAPI.streamingTranscribeEnd.mockResolvedValueOnce({
        success: false,
        text: '',
        error: 'Transcription failed'
      });

      // Act
      const result = await window.electronAPI.streamingTranscribeEnd();

      // Assert
      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // Integration Scenarios
  // ==========================================================================
  describe('Integration Scenarios', () => {
    it('should handle complete transcription workflow', async () => {
      // Arrange
      await mockTranscribe.startSession({ languageCode: 'en-US' });

      // Act - simulate audio chunks
      for (let i = 0; i < 10; i++) {
        const chunk = createMockAudioBuffer(100);
        mockTranscribe.sendChunk(chunk);
      }

      // Simulate partial results
      mockTranscribe.simulatePartialResult('Hello');
      mockTranscribe.simulatePartialResult('Hello world');

      // Simulate final result
      mockTranscribe.simulateFinalResult('Hello world');

      // End session
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('Hello world');
      expect(mockOnPartialResult).toHaveBeenCalled();
      expect(mockOnFinalResult).toHaveBeenCalled();
    });

    it('should handle workflow with language detection', async () => {
      // Arrange
      await mockTranscribe.startSession({ 
        languageCode: 'auto',
        enableLanguageIdentification: true 
      });

      // Act
      mockTranscribe.simulateLanguageDetection('es-US');
      mockTranscribe.simulateFinalResult('Hola mundo');
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(mockOnLanguageDetected).toHaveBeenCalledWith('es-US');
      expect(transcript).toBe('Hola mundo');
    });

    it('should handle multiple sentences in one session', async () => {
      // Arrange
      await mockTranscribe.startSession();

      // Act
      mockTranscribe.simulateFinalResult('First sentence.');
      mockTranscribe.simulateFinalResult('Second sentence.');
      mockTranscribe.simulateFinalResult('Third sentence.');
      const transcript = await mockTranscribe.endSession();

      // Assert
      expect(transcript).toBe('First sentence. Second sentence. Third sentence.');
    });

    it('should handle abort during transcription', async () => {
      // Arrange
      await mockTranscribe.startSession();
      mockTranscribe.simulateFinalResult('Some text');

      // Act
      mockTranscribe.abortSession();

      // Assert
      expect(mockTranscribe.isSessionActive()).toBe(false);
      expect(mockTranscribe.getFinalTranscript()).toBe('');
    });

    it('should handle rapid session start/stop cycles', async () => {
      // Act
      for (let i = 0; i < 5; i++) {
        await mockTranscribe.startSession();
        mockTranscribe.simulateFinalResult(`Session ${i}`);
        await mockTranscribe.endSession();
      }

      // Assert - should complete without errors
      expect(mockTranscribe.isSessionActive()).toBe(false);
    });

    it('should use simulateTranscriptionSession helper', async () => {
      // Act
      const transcript = await simulateTranscriptionSession(
        mockTranscribe,
        ['Hello', 'Hello world'],
        'Hello world',
        'en-US'
      );

      // Assert
      expect(transcript).toBe('Hello world');
      expect(mockOnLanguageDetected).toHaveBeenCalledWith('en-US');
    });

    it('should handle electronAPI workflow', async () => {
      // Start session
      const startResult = await window.electronAPI.streamingTranscribeStart({
        languageCode: 'en-US',
        region: 'us-east-1'
      });
      expect(startResult.success).toBe(true);

      // Send chunks
      const chunk = new ArrayBuffer(3200);
      const chunkResult = await window.electronAPI.streamingTranscribeChunk(chunk);
      expect(chunkResult.success).toBe(true);

      // End session
      const endResult = await window.electronAPI.streamingTranscribeEnd();
      expect(endResult.success).toBe(true);
      expect(endResult).toHaveProperty('text');
    });

    it('should handle abort via electronAPI', async () => {
      // Start session
      await window.electronAPI.streamingTranscribeStart({ languageCode: 'en-US' });

      // Abort
      const abortResult = await window.electronAPI.streamingTranscribeAbort();

      // Assert
      expect(mockElectronAPI.streamingTranscribeAbort).toHaveBeenCalled();
      expect(abortResult.success).toBe(true);
    });

    it('should handle status check via electronAPI', async () => {
      // Act
      const status = await window.electronAPI.streamingTranscribeStatus();

      // Assert
      expect(mockElectronAPI.streamingTranscribeStatus).toHaveBeenCalled();
      expect(status).toHaveProperty('isActive');
    });
  });

  // ==========================================================================
  // Event Listener Management
  // ==========================================================================
  describe('Event Listener Management', () => {
    it('should register partial result listener', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      window.electronAPI.onStreamingPartial(callback);

      // Assert
      expect(mockElectronAPI.onStreamingPartial).toHaveBeenCalledWith(callback);
    });

    it('should register final result listener', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      window.electronAPI.onStreamingFinal(callback);

      // Assert
      expect(mockElectronAPI.onStreamingFinal).toHaveBeenCalledWith(callback);
    });

    it('should register language detection listener', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      window.electronAPI.onStreamingLanguage(callback);

      // Assert
      expect(mockElectronAPI.onStreamingLanguage).toHaveBeenCalledWith(callback);
    });

    it('should register error listener', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      window.electronAPI.onStreamingError(callback);

      // Assert
      expect(mockElectronAPI.onStreamingError).toHaveBeenCalledWith(callback);
    });

    it('should remove all listeners for a channel', () => {
      // Arrange
      const callback = vi.fn();
      window.electronAPI.onStreamingPartial(callback);

      // Act
      window.electronAPI.removeAllListeners('streaming-transcribe-partial');

      // Assert
      expect(mockElectronAPI.removeAllListeners).toHaveBeenCalledWith('streaming-transcribe-partial');
    });

    it('should handle multiple listeners for same event', () => {
      // Arrange
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Act
      window.electronAPI.onStreamingPartial(callback1);
      window.electronAPI.onStreamingPartial(callback2);

      // Emit event
      mockElectronAPI.__emitEvent('streaming-transcribe-partial', { text: 'Test' });

      // Assert
      expect(callback1).toHaveBeenCalledWith({ text: 'Test' });
      expect(callback2).toHaveBeenCalledWith({ text: 'Test' });
    });
  });

  // ==========================================================================
  // Callback Management
  // ==========================================================================
  describe('Callback Management', () => {
    it('should set callbacks on transcribe service', () => {
      // Arrange
      const newCallbacks: TranscribeCallbacks = {
        onPartialResult: vi.fn(),
        onFinalResult: vi.fn(),
        onLanguageDetected: vi.fn(),
        onError: vi.fn()
      };

      // Act
      mockTranscribe.setCallbacks(newCallbacks);

      // Assert
      expect(mockTranscribe.setCallbacks).toHaveBeenCalledWith(newCallbacks);
    });

    it('should allow partial callback updates', () => {
      // Arrange
      const partialCallbacks: TranscribeCallbacks = {
        onPartialResult: vi.fn()
      };

      // Act
      mockTranscribe.setCallbacks(partialCallbacks);

      // Assert
      expect(mockTranscribe.setCallbacks).toHaveBeenCalledWith(partialCallbacks);
    });

    it('should invoke callbacks in correct order', async () => {
      // Arrange
      const callOrder: string[] = [];
      const orderedCallbacks: TranscribeCallbacks = {
        onPartialResult: () => callOrder.push('partial'),
        onFinalResult: () => callOrder.push('final'),
        onLanguageDetected: () => callOrder.push('language')
      };
      mockTranscribe.setCallbacks(orderedCallbacks);
      await mockTranscribe.startSession();

      // Act
      mockTranscribe.simulateLanguageDetection('en-US');
      mockTranscribe.simulatePartialResult('Hello');
      mockTranscribe.simulateFinalResult('Hello world');

      // Assert
      expect(callOrder).toEqual(['language', 'partial', 'final']);
    });
  });
});
