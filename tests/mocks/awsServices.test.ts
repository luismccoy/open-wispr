/**
 * Tests for AWS Services Mock
 * 
 * Validates that the mock implementations correctly simulate AWS Transcribe
 * and AWS Bedrock services for testing purposes.
 * 
 * @module tests/mocks/awsServices.test
 * 
 * Validates: Requirements 7.1-7.7 (Transcription System Testing)
 * Validates: Requirements 8.1-8.6 (Text Enhancement System Testing)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockAWSServices,
  createMockTranscribeService,
  createMockBedrockService,
  createEnglishTranscribeMock,
  createSpanishTranscribeMock,
  createTranscriptionErrorMock,
  createBedrockErrorMock,
  createSlowAWSServicesMock,
  createCustomBedrockMock,
  simulateTranscriptionSession,
  createMockAudioBuffer,
  createMockSpeechBuffer,
  SUPPORTED_LANGUAGE_CODES,
  BEDROCK_MODEL_IDS,
  STYLE_RESPONSE_PREFIXES,
  type MockAWSServices,
  type MockTranscribeService,
  type MockBedrockService,
  type TranscribeCallbacks
} from './awsServices';

describe('MockTranscribeService', () => {
  let transcribe: MockTranscribeService;

  beforeEach(() => {
    transcribe = createMockTranscribeService();
  });

  describe('Session Management', () => {
    /**
     * Validates: Requirement 7.1
     * WHEN a streaming session starts, THE Transcription_System SHALL establish connection
     */
    it('should start a transcription session', async () => {
      await transcribe.startSession();
      expect(transcribe.isSessionActive()).toBe(true);
    });

    it('should start session with options', async () => {
      await transcribe.startSession({ languageCode: 'es-US', region: 'us-west-2' });
      expect(transcribe.isSessionActive()).toBe(true);
      expect(transcribe.__getState().sessionOptions?.languageCode).toBe('es-US');
    });

    it('should abort previous session when starting new one', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('First session');
      
      await transcribe.startSession();
      expect(transcribe.getFinalTranscript()).toBe('');
    });

    it('should end session and return transcript', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('Hello world');
      
      const result = await transcribe.endSession();
      expect(result).toBe('Hello world');
      expect(transcribe.isSessionActive()).toBe(false);
    });

    it('should abort session without waiting', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('Some text');
      
      transcribe.abortSession();
      expect(transcribe.isSessionActive()).toBe(false);
      expect(transcribe.getFinalTranscript()).toBe('');
    });
  });

  describe('Audio Chunk Handling', () => {
    /**
     * Validates: Requirement 7.2
     * WHEN audio chunks are received, THE Transcription_System SHALL send them to the streaming endpoint
     */
    it('should accept audio chunks when session is active', async () => {
      await transcribe.startSession();
      
      const buffer = createMockAudioBuffer(100);
      const result = transcribe.sendChunk(buffer);
      
      expect(result).toBe(true);
      expect(transcribe.__getAudioChunksReceived()).toBe(1);
    });

    it('should reject audio chunks when session is not active', () => {
      const buffer = createMockAudioBuffer(100);
      const result = transcribe.sendChunk(buffer);
      
      expect(result).toBe(false);
    });

    it('should count multiple audio chunks', async () => {
      await transcribe.startSession();
      
      for (let i = 0; i < 5; i++) {
        transcribe.sendChunk(createMockAudioBuffer(100));
      }
      
      expect(transcribe.__getAudioChunksReceived()).toBe(5);
    });
  });

  describe('Partial Results', () => {
    /**
     * Validates: Requirement 7.3
     * WHEN partial results are received, THE Transcription_System SHALL emit onPartialResult callback
     */
    it('should emit partial results via callback', async () => {
      const onPartialResult = vi.fn();
      transcribe.setCallbacks({ onPartialResult });
      
      await transcribe.startSession();
      transcribe.simulatePartialResult('Hello');
      
      expect(onPartialResult).toHaveBeenCalledWith('Hello');
    });

    it('should update current transcript with partial results', async () => {
      await transcribe.startSession();
      transcribe.simulatePartialResult('Hello wor');
      
      expect(transcribe.getCurrentTranscript()).toBe('Hello wor');
    });

    it('should combine final and partial transcripts', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('Hello');
      transcribe.simulatePartialResult('world');
      
      expect(transcribe.getCurrentTranscript()).toBe('Hello world');
    });
  });

  describe('Final Results', () => {
    /**
     * Validates: Requirement 7.4
     * WHEN final results are received, THE Transcription_System SHALL emit onFinalResult callback
     */
    it('should emit final results via callback', async () => {
      const onFinalResult = vi.fn();
      transcribe.setCallbacks({ onFinalResult });
      
      await transcribe.startSession();
      transcribe.simulateFinalResult('Hello world');
      
      expect(onFinalResult).toHaveBeenCalledWith('Hello world');
    });

    it('should clear partial transcript when final result received', async () => {
      await transcribe.startSession();
      transcribe.simulatePartialResult('Hello wor');
      transcribe.simulateFinalResult('Hello world');
      
      expect(transcribe.getCurrentTranscript()).toBe('Hello world');
      expect(transcribe.__getState().partialTranscript).toBe('');
    });

    /**
     * Validates: Requirement 7.6
     * WHEN the session ends, THE Transcription_System SHALL return the complete transcript
     */
    it('should concatenate multiple final results', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('Hello');
      transcribe.simulateFinalResult('world');
      transcribe.simulateFinalResult('test');
      
      expect(transcribe.getFinalTranscript()).toBe('Hello world test');
    });
  });

  describe('Language Detection', () => {
    /**
     * Validates: Requirement 7.5
     * WHEN language auto-detection is enabled, THE Transcription_System SHALL detect and report the language
     */
    it('should emit language detection via callback', async () => {
      const onLanguageDetected = vi.fn();
      transcribe.setCallbacks({ onLanguageDetected });
      
      await transcribe.startSession();
      transcribe.simulateLanguageDetection('en-US');
      
      expect(onLanguageDetected).toHaveBeenCalledWith('en-US');
    });

    it('should store detected language', async () => {
      await transcribe.startSession();
      transcribe.simulateLanguageDetection('es-US');
      
      expect(transcribe.getDetectedLanguage()).toBe('es-US');
    });

    it('should reset detected language on new session', async () => {
      await transcribe.startSession();
      transcribe.simulateLanguageDetection('en-US');
      
      await transcribe.startSession();
      expect(transcribe.getDetectedLanguage()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    /**
     * Validates: Requirement 7.7
     * IF connection fails, THEN THE Transcription_System SHALL emit onError callback with details
     */
    it('should emit errors via callback', async () => {
      const onError = vi.fn();
      transcribe.setCallbacks({ onError });
      
      await transcribe.startSession();
      const error = new Error('Connection failed');
      transcribe.simulateError(error);
      
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Test Helpers', () => {
    it('should reset state', async () => {
      await transcribe.startSession();
      transcribe.simulateFinalResult('Test');
      
      transcribe.__reset();
      
      expect(transcribe.isSessionActive()).toBe(false);
      expect(transcribe.getFinalTranscript()).toBe('');
    });

    it('should get and set state', async () => {
      await transcribe.startSession();
      
      const state = transcribe.__getState();
      expect(state.isActive).toBe(true);
      
      transcribe.__setState({ detectedLanguage: 'fr-FR' });
      expect(transcribe.getDetectedLanguage()).toBe('fr-FR');
    });
  });
});

describe('MockBedrockService', () => {
  let bedrock: MockBedrockService;

  beforeEach(() => {
    bedrock = createMockBedrockService();
  });

  describe('Model Invocation', () => {
    /**
     * Validates: Requirement 8.1
     * WHEN text enhancement is enabled, THE Text_Enhancement_System SHALL send text to Bedrock Claude
     */
    it('should invoke model and return enhanced text', async () => {
      const result = await bedrock.invoke({
        modelId: 'claude-3-haiku',
        text: 'Hello world'
      });
      
      expect(result).toBe('Enhanced: Hello world');
    });

    it('should track invocation count', async () => {
      await bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Test 1' });
      await bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Test 2' });
      
      expect(bedrock.__getInvocationCount()).toBe(2);
    });

    it('should store last invocation params', async () => {
      await bedrock.invoke({
        modelId: 'claude-3-sonnet',
        text: 'Test text',
        maxTokens: 100
      });
      
      const lastParams = bedrock.__getLastParams();
      expect(lastParams?.modelId).toBe('claude-3-sonnet');
      expect(lastParams?.text).toBe('Test text');
    });
  });

  describe('Style-Aware Processing', () => {
    /**
     * Validates: Requirement 8.2
     * WHEN context-aware styling is enabled, THE Text_Enhancement_System SHALL apply the appropriate formality style
     */
    it('should process text with formal style', async () => {
      const result = await bedrock.processTextWithStyle('hello world', 'formal');
      // Formal style applies prefix and lowercases the text
      expect(result).toContain('hello world');
      expect(result).toContain(STYLE_RESPONSE_PREFIXES.formal);
    });

    /**
     * Validates: Requirement 8.3
     * WHEN the target app is an email client, THE Text_Enhancement_System SHALL apply formal style
     */
    it('should apply formal style prefix', async () => {
      const result = await bedrock.processTextWithStyle('test message', 'formal');
      // Formal style includes the formal prefix
      expect(result).toContain(STYLE_RESPONSE_PREFIXES.formal);
    });

    /**
     * Validates: Requirement 8.4
     * WHEN the target app is a chat application, THE Text_Enhancement_System SHALL apply casual style
     */
    it('should process text with casual style', async () => {
      const result = await bedrock.processTextWithStyle('HELLO WORLD', 'casual');
      // Casual style applies prefix and lowercases the text
      expect(result).toContain('hello world');
      expect(result).toContain(STYLE_RESPONSE_PREFIXES.casual);
    });

    /**
     * Validates: Requirement 8.5
     * WHEN the target app is unknown, THE Text_Enhancement_System SHALL apply the default style
     */
    it('should process text with neutral style', async () => {
      const result = await bedrock.processTextWithStyle('Hello World', 'neutral');
      // Neutral style returns text unchanged
      expect(result).toBe('Hello World');
    });
  });

  describe('Error Simulation', () => {
    /**
     * Validates: Requirement 8.6
     * IF Bedrock invocation fails, THEN THE Text_Enhancement_System SHALL return the original text
     */
    it('should throw error when simulated', async () => {
      bedrock.simulateError(new Error('Service unavailable'));
      
      await expect(bedrock.invoke({
        modelId: 'claude-3-haiku',
        text: 'Test'
      })).rejects.toThrow('Service unavailable');
    });

    it('should return original text on processTextWithStyle failure', async () => {
      bedrock.simulateError(new Error('Service unavailable'));
      
      const result = await bedrock.processTextWithStyle('Original text', 'formal');
      expect(result).toBe('Original text');
    });

    it('should simulate timeout', async () => {
      bedrock.simulateTimeout(5000);
      
      await expect(bedrock.invoke({
        modelId: 'claude-3-haiku',
        text: 'Test'
      })).rejects.toThrow('timed out');
    });
  });

  describe('Latency Simulation', () => {
    it('should simulate latency', async () => {
      bedrock.simulateLatency(100);
      
      const start = Date.now();
      await bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Test' });
      const duration = Date.now() - start;
      
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });
  });

  describe('Test Helpers', () => {
    it('should reset state', async () => {
      await bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Test' });
      bedrock.simulateError(new Error('Test'));
      
      bedrock.__reset();
      
      expect(bedrock.__getInvocationCount()).toBe(0);
      expect(bedrock.__getState().shouldFail).toBe(false);
    });

    it('should set custom response handler', async () => {
      bedrock.__setResponseHandler((params) => `Custom: ${params.text.toUpperCase()}`);
      
      const result = await bedrock.invoke({
        modelId: 'claude-3-haiku',
        text: 'hello'
      });
      
      expect(result).toBe('Custom: HELLO');
    });
  });
});

describe('MockAWSServices', () => {
  let awsServices: MockAWSServices;

  beforeEach(() => {
    awsServices = createMockAWSServices();
  });

  it('should provide both transcribe and bedrock services', () => {
    expect(awsServices.transcribe).toBeDefined();
    expect(awsServices.bedrock).toBeDefined();
  });

  it('should reset all services', async () => {
    await awsServices.transcribe.startSession();
    await awsServices.bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Test' });
    
    awsServices.__resetAll();
    
    expect(awsServices.transcribe.isSessionActive()).toBe(false);
    expect(awsServices.bedrock.__getInvocationCount()).toBe(0);
  });
});

describe('Pre-configured Mock Factories', () => {
  it('should create English transcribe mock', async () => {
    const mock = createEnglishTranscribeMock();
    await mock.startSession();
    expect(mock.isSessionActive()).toBe(true);
  });

  it('should create Spanish transcribe mock', async () => {
    const mock = createSpanishTranscribeMock();
    await mock.startSession();
    expect(mock.isSessionActive()).toBe(true);
  });

  it('should create transcription error mock', async () => {
    const mock = createTranscriptionErrorMock('Custom error');
    await expect(mock.startSession()).rejects.toThrow('Custom error');
  });

  it('should create Bedrock error mock', async () => {
    const mock = createBedrockErrorMock('Bedrock error');
    await expect(mock.invoke({
      modelId: 'claude-3-haiku',
      text: 'Test'
    })).rejects.toThrow('Bedrock error');
  });

  it('should create slow AWS services mock', async () => {
    const mock = createSlowAWSServicesMock(50);
    
    const start = Date.now();
    await mock.transcribe.startSession();
    const duration = Date.now() - start;
    
    expect(duration).toBeGreaterThanOrEqual(40);
  });

  it('should create custom Bedrock mock', async () => {
    const mock = createCustomBedrockMock((params) => `Processed: ${params.text}`);
    
    const result = await mock.invoke({
      modelId: 'claude-3-haiku',
      text: 'Hello'
    });
    
    expect(result).toBe('Processed: Hello');
  });
});

describe('Utility Functions', () => {
  describe('simulateTranscriptionSession', () => {
    it('should simulate a complete transcription session', async () => {
      const transcribe = createMockTranscribeService();
      const callbacks: TranscribeCallbacks = {
        onPartialResult: vi.fn(),
        onFinalResult: vi.fn(),
        onLanguageDetected: vi.fn()
      };
      transcribe.setCallbacks(callbacks);
      
      const result = await simulateTranscriptionSession(
        transcribe,
        ['Hello', 'Hello wor', 'Hello world'],
        'Hello world',
        'en-US'
      );
      
      expect(result).toBe('Hello world');
      expect(callbacks.onPartialResult).toHaveBeenCalledTimes(3);
      expect(callbacks.onFinalResult).toHaveBeenCalledTimes(1);
      expect(callbacks.onLanguageDetected).toHaveBeenCalledWith('en-US');
    });
  });

  describe('createMockAudioBuffer', () => {
    it('should create buffer with correct size', () => {
      const buffer = createMockAudioBuffer(100, 16000);
      // 100ms at 16kHz = 1600 samples, 2 bytes each = 3200 bytes
      expect(buffer.byteLength).toBe(3200);
    });

    it('should create silent buffer', () => {
      const buffer = createMockAudioBuffer(100);
      const view = new Int16Array(buffer);
      
      // All samples should be 0 (silence)
      for (let i = 0; i < view.length; i++) {
        expect(view[i]).toBe(0);
      }
    });
  });

  describe('createMockSpeechBuffer', () => {
    it('should create buffer with noise', () => {
      const buffer = createMockSpeechBuffer(100);
      const view = new Int16Array(buffer);
      
      // At least some samples should be non-zero
      let hasNonZero = false;
      for (let i = 0; i < view.length; i++) {
        if (view[i] !== 0) {
          hasNonZero = true;
          break;
        }
      }
      expect(hasNonZero).toBe(true);
    });
  });
});

describe('Constants', () => {
  it('should export supported language codes', () => {
    expect(SUPPORTED_LANGUAGE_CODES).toContain('en-US');
    expect(SUPPORTED_LANGUAGE_CODES).toContain('es-US');
    expect(SUPPORTED_LANGUAGE_CODES).toContain('ja-JP');
  });

  it('should export Bedrock model IDs', () => {
    expect(BEDROCK_MODEL_IDS['claude-3-haiku']).toBeDefined();
    expect(BEDROCK_MODEL_IDS['claude-3-sonnet']).toBeDefined();
  });

  it('should export style response prefixes', () => {
    expect(STYLE_RESPONSE_PREFIXES.formal).toBeDefined();
    expect(STYLE_RESPONSE_PREFIXES.casual).toBeDefined();
    expect(STYLE_RESPONSE_PREFIXES.neutral).toBeDefined();
  });
});
