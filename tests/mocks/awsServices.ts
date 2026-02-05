/**
 * Mock AWS Services for testing
 * 
 * This module provides reusable, configurable mock implementations of AWS services
 * used by the Ollie voice dictation app, including AWS Transcribe streaming and
 * AWS Bedrock text enhancement.
 * 
 * @module tests/mocks/awsServices
 * 
 * Validates: Requirements 7.1-7.7 (Transcription System Testing)
 * Validates: Requirements 8.1-8.6 (Text Enhancement System Testing)
 */

import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Options for starting a transcription session
 */
export interface TranscribeSessionOptions {
  languageCode?: string;
  region?: string;
  enableLanguageIdentification?: boolean;
  credentials?: AWSCredentials | null;
}

/**
 * AWS credentials structure
 */
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region?: string;
}

/**
 * Transcription result from AWS Transcribe
 */
export interface TranscriptionResult {
  text: string;
  isPartial: boolean;
  languageCode?: string;
  confidence?: number;
}

/**
 * Parameters for Bedrock model invocation
 */
export interface BedrockInvokeParams {
  modelId: string;
  text: string;
  region?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Bedrock response structure
 */
export interface BedrockResponse {
  text: string;
  modelId: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Callbacks for transcription events
 */
export interface TranscribeCallbacks {
  onPartialResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onLanguageDetected?: (languageCode: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Internal state for the transcribe mock
 */
export interface TranscribeMockState {
  isActive: boolean;
  transcriptBuffer: string[];
  partialTranscript: string;
  detectedLanguage: string | null;
  audioChunksReceived: number;
  sessionOptions: TranscribeSessionOptions | null;
  callbacks: TranscribeCallbacks;
}

/**
 * Internal state for the Bedrock mock
 */
export interface BedrockMockState {
  invocationCount: number;
  lastParams: BedrockInvokeParams | null;
  simulatedLatency: number;
  shouldFail: boolean;
  failureError: Error | null;
}

/**
 * Configuration options for creating the AWS services mock
 */
export interface MockAWSServicesOptions {
  /** Default language code for transcription */
  defaultLanguageCode?: string;
  /** Default region */
  defaultRegion?: string;
  /** Default Bedrock response handler */
  bedrockResponseHandler?: (params: BedrockInvokeParams) => string | Promise<string>;
  /** Simulated latency for Bedrock calls (ms) */
  bedrockLatency?: number;
  /** Simulated latency for transcription results (ms) */
  transcribeLatency?: number;
  /** Whether to auto-detect language by default */
  enableAutoLanguageDetection?: boolean;
}

// ============================================================================
// Mock AWS Transcribe Interface
// ============================================================================

/**
 * Mock interface for AWS Transcribe streaming service
 */
export interface MockTranscribeService {
  // Session management
  startSession: (options?: TranscribeSessionOptions) => Promise<void>;
  sendChunk: (buffer: Buffer | ArrayBuffer | Int16Array) => boolean;
  endSession: () => Promise<string>;
  abortSession: () => void;
  
  // State queries
  isSessionActive: () => boolean;
  getDetectedLanguage: () => string | null;
  getCurrentTranscript: () => string;
  getFinalTranscript: () => string;
  
  // Callback management
  setCallbacks: (callbacks: TranscribeCallbacks) => void;
  
  // Simulation methods for testing
  simulatePartialResult: (text: string) => void;
  simulateFinalResult: (text: string) => void;
  simulateLanguageDetection: (languageCode: string) => void;
  simulateError: (error: Error) => void;
  
  // Test helpers
  __reset: () => void;
  __getState: () => TranscribeMockState;
  __setState: (state: Partial<TranscribeMockState>) => void;
  __getAudioChunksReceived: () => number;
}

// ============================================================================
// Mock AWS Bedrock Interface
// ============================================================================

/**
 * Mock interface for AWS Bedrock service
 */
export interface MockBedrockService {
  // Model invocation
  invoke: (params: BedrockInvokeParams) => Promise<string>;
  
  // Style-aware processing
  processTextWithStyle: (text: string, style: 'formal' | 'casual' | 'neutral', modelId?: string) => Promise<string>;
  
  // Simulation methods for testing
  simulateTimeout: (timeoutMs?: number) => void;
  simulateError: (error: Error) => void;
  simulateLatency: (latencyMs: number) => void;
  
  // Test helpers
  __reset: () => void;
  __getState: () => BedrockMockState;
  __getInvocationCount: () => number;
  __getLastParams: () => BedrockInvokeParams | null;
  __setResponseHandler: (handler: (params: BedrockInvokeParams) => string | Promise<string>) => void;
}

// ============================================================================
// Combined Mock AWS Services Interface
// ============================================================================

/**
 * Complete interface for mocked AWS services
 */
export interface MockAWSServices {
  transcribe: MockTranscribeService;
  bedrock: MockBedrockService;
  
  // Global test helpers
  __resetAll: () => void;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default language codes supported by AWS Transcribe
 */
export const SUPPORTED_LANGUAGE_CODES = [
  'en-US', 'en-GB', 'en-AU',
  'es-US', 'es-ES',
  'pt-BR', 'pt-PT',
  'fr-FR', 'fr-CA',
  'de-DE',
  'it-IT',
  'ja-JP',
  'ko-KR',
  'zh-CN'
];

/**
 * Default Bedrock model IDs
 */
export const BEDROCK_MODEL_IDS = {
  'claude-3-haiku': 'anthropic.claude-3-haiku-20240307-v1:0',
  'claude-3-sonnet': 'anthropic.claude-3-sonnet-20240229-v1:0',
  'claude-3-5-sonnet': 'anthropic.claude-3-5-sonnet-20241022-v2:0'
};

/**
 * Style-specific response prefixes for testing
 */
export const STYLE_RESPONSE_PREFIXES = {
  formal: 'I would like to inform you that',
  casual: 'Hey, just wanted to say',
  neutral: ''
};

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a mock AWS Transcribe service
 * 
 * @param options - Configuration options
 * @returns Mock transcribe service
 * 
 * @example
 * ```typescript
 * const transcribe = createMockTranscribeService();
 * await transcribe.startSession({ languageCode: 'en-US' });
 * transcribe.sendChunk(audioBuffer);
 * transcribe.simulatePartialResult('Hello');
 * transcribe.simulateFinalResult('Hello world');
 * const result = await transcribe.endSession();
 * ```
 */
export function createMockTranscribeService(
  options: Pick<MockAWSServicesOptions, 'defaultLanguageCode' | 'defaultRegion' | 'transcribeLatency' | 'enableAutoLanguageDetection'> = {}
): MockTranscribeService {
  // Initialize internal state
  let state: TranscribeMockState = {
    isActive: false,
    transcriptBuffer: [],
    partialTranscript: '',
    detectedLanguage: null,
    audioChunksReceived: 0,
    sessionOptions: null,
    callbacks: {}
  };

  const defaultLanguageCode = options.defaultLanguageCode ?? 'en-US';
  const transcribeLatency = options.transcribeLatency ?? 0;
  const enableAutoLanguageDetection = options.enableAutoLanguageDetection ?? true;

  const mockService: MockTranscribeService = {
    /**
     * Start a streaming transcription session
     * Validates: Requirement 7.1
     */
    startSession: vi.fn().mockImplementation(async (sessionOptions?: TranscribeSessionOptions) => {
      if (state.isActive) {
        console.warn('[MockTranscribe] Session already active, aborting previous session');
        mockService.abortSession();
      }

      state.isActive = true;
      state.transcriptBuffer = [];
      state.partialTranscript = '';
      state.detectedLanguage = null;
      state.audioChunksReceived = 0;
      state.sessionOptions = sessionOptions ?? null;

      // Simulate auto language detection if enabled
      if (enableAutoLanguageDetection && (!sessionOptions?.languageCode || sessionOptions.languageCode === 'auto')) {
        // Will be set when simulateLanguageDetection is called
      }

      if (transcribeLatency > 0) {
        await new Promise(resolve => setTimeout(resolve, transcribeLatency));
      }

      console.log('[MockTranscribe] Session started', { sessionOptions });
    }),

    /**
     * Send an audio chunk to the transcription stream
     * Validates: Requirement 7.2
     */
    sendChunk: vi.fn().mockImplementation((buffer: Buffer | ArrayBuffer | Int16Array) => {
      if (!state.isActive) {
        console.warn('[MockTranscribe] Cannot send chunk - session not active');
        return false;
      }

      state.audioChunksReceived++;
      return true;
    }),

    /**
     * End the transcription session and get final transcript
     * Validates: Requirement 7.6
     */
    endSession: vi.fn().mockImplementation(async () => {
      if (!state.isActive) {
        console.warn('[MockTranscribe] No active session to end');
        return mockService.getFinalTranscript();
      }

      if (transcribeLatency > 0) {
        await new Promise(resolve => setTimeout(resolve, transcribeLatency));
      }

      state.isActive = false;
      const finalText = mockService.getFinalTranscript();
      
      console.log('[MockTranscribe] Session ended', { 
        transcriptLength: finalText.length,
        chunksReceived: state.audioChunksReceived 
      });

      return finalText;
    }),

    /**
     * Abort the session without waiting for results
     */
    abortSession: vi.fn().mockImplementation(() => {
      state.isActive = false;
      state.transcriptBuffer = [];
      state.partialTranscript = '';
      state.detectedLanguage = null;
      state.audioChunksReceived = 0;
      console.log('[MockTranscribe] Session aborted');
    }),

    /**
     * Check if a session is currently active
     */
    isSessionActive: vi.fn().mockImplementation(() => state.isActive),

    /**
     * Get the detected language (when using auto-detect)
     * Validates: Requirement 7.5
     */
    getDetectedLanguage: vi.fn().mockImplementation(() => state.detectedLanguage),

    /**
     * Get current transcript including partial results
     */
    getCurrentTranscript: vi.fn().mockImplementation(() => {
      const final = state.transcriptBuffer.join(' ');
      if (state.partialTranscript) {
        return final ? `${final} ${state.partialTranscript}` : state.partialTranscript;
      }
      return final;
    }),

    /**
     * Get final transcript (only confirmed results)
     */
    getFinalTranscript: vi.fn().mockImplementation(() => {
      return state.transcriptBuffer.join(' ').trim();
    }),

    /**
     * Set callbacks for transcription events
     */
    setCallbacks: vi.fn().mockImplementation((callbacks: TranscribeCallbacks) => {
      state.callbacks = { ...callbacks };
    }),

    /**
     * Simulate receiving a partial transcription result
     * Validates: Requirement 7.3
     */
    simulatePartialResult: vi.fn().mockImplementation((text: string) => {
      if (!state.isActive) {
        console.warn('[MockTranscribe] Cannot simulate partial result - session not active');
        return;
      }

      state.partialTranscript = text;
      state.callbacks.onPartialResult?.(mockService.getCurrentTranscript());
    }),

    /**
     * Simulate receiving a final transcription result
     * Validates: Requirement 7.4
     */
    simulateFinalResult: vi.fn().mockImplementation((text: string) => {
      if (!state.isActive) {
        console.warn('[MockTranscribe] Cannot simulate final result - session not active');
        return;
      }

      state.transcriptBuffer.push(text);
      state.partialTranscript = '';
      state.callbacks.onFinalResult?.(mockService.getFinalTranscript());
    }),

    /**
     * Simulate language detection
     * Validates: Requirement 7.5
     */
    simulateLanguageDetection: vi.fn().mockImplementation((languageCode: string) => {
      if (!state.isActive) {
        console.warn('[MockTranscribe] Cannot simulate language detection - session not active');
        return;
      }

      state.detectedLanguage = languageCode;
      state.callbacks.onLanguageDetected?.(languageCode);
    }),

    /**
     * Simulate a transcription error
     * Validates: Requirement 7.7
     */
    simulateError: vi.fn().mockImplementation((error: Error) => {
      state.callbacks.onError?.(error);
    }),

    /**
     * Reset the mock to initial state
     */
    __reset: () => {
      state = {
        isActive: false,
        transcriptBuffer: [],
        partialTranscript: '',
        detectedLanguage: null,
        audioChunksReceived: 0,
        sessionOptions: null,
        callbacks: {}
      };
      
      // Clear mock call history
      vi.mocked(mockService.startSession).mockClear();
      vi.mocked(mockService.sendChunk).mockClear();
      vi.mocked(mockService.endSession).mockClear();
      vi.mocked(mockService.abortSession).mockClear();
      vi.mocked(mockService.simulatePartialResult).mockClear();
      vi.mocked(mockService.simulateFinalResult).mockClear();
      vi.mocked(mockService.simulateLanguageDetection).mockClear();
      vi.mocked(mockService.simulateError).mockClear();
    },

    /**
     * Get the current internal state
     */
    __getState: () => ({ ...state }),

    /**
     * Set partial internal state
     */
    __setState: (newState: Partial<TranscribeMockState>) => {
      state = { ...state, ...newState };
    },

    /**
     * Get the number of audio chunks received
     */
    __getAudioChunksReceived: () => state.audioChunksReceived
  };

  return mockService;
}

/**
 * Creates a mock AWS Bedrock service
 * 
 * @param options - Configuration options
 * @returns Mock Bedrock service
 * 
 * @example
 * ```typescript
 * const bedrock = createMockBedrockService();
 * const result = await bedrock.invoke({ modelId: 'claude-3-haiku', text: 'Hello' });
 * 
 * // Simulate errors
 * bedrock.simulateError(new Error('Service unavailable'));
 * ```
 */
export function createMockBedrockService(
  options: Pick<MockAWSServicesOptions, 'bedrockResponseHandler' | 'bedrockLatency'> = {}
): MockBedrockService {
  // Initialize internal state
  let state: BedrockMockState = {
    invocationCount: 0,
    lastParams: null,
    simulatedLatency: options.bedrockLatency ?? 0,
    shouldFail: false,
    failureError: null
  };

  // Default response handler
  let responseHandler = options.bedrockResponseHandler ?? ((params: BedrockInvokeParams) => {
    return `Enhanced: ${params.text}`;
  });

  const mockService: MockBedrockService = {
    /**
     * Invoke a Bedrock model
     * Validates: Requirement 8.1
     */
    invoke: vi.fn().mockImplementation(async (params: BedrockInvokeParams) => {
      state.invocationCount++;
      state.lastParams = { ...params };

      // Check for simulated failure
      if (state.shouldFail && state.failureError) {
        throw state.failureError;
      }

      // Simulate latency
      if (state.simulatedLatency > 0) {
        await new Promise(resolve => setTimeout(resolve, state.simulatedLatency));
      }

      // Generate response
      const response = await responseHandler(params);
      return response;
    }),

    /**
     * Process text with context-aware styling
     * Validates: Requirements 8.2-8.5
     */
    processTextWithStyle: vi.fn().mockImplementation(async (
      text: string, 
      style: 'formal' | 'casual' | 'neutral',
      modelId: string = 'claude-3-haiku'
    ) => {
      const prefix = STYLE_RESPONSE_PREFIXES[style] || '';
      
      // Simulate the style-aware processing
      const params: BedrockInvokeParams = {
        modelId,
        text
      };

      state.invocationCount++;
      state.lastParams = { ...params };

      // Check for simulated failure
      if (state.shouldFail && state.failureError) {
        // Validates: Requirement 8.6 - Return original text on failure
        console.warn('[MockBedrock] Invocation failed, returning original text');
        return text;
      }

      // Simulate latency
      if (state.simulatedLatency > 0) {
        await new Promise(resolve => setTimeout(resolve, state.simulatedLatency));
      }

      // Apply style-specific transformation
      let result: string;
      switch (style) {
        case 'formal':
          // Validates: Requirement 8.3 - Formal style for email clients
          result = prefix ? `${prefix} ${text.toLowerCase()}` : text.charAt(0).toUpperCase() + text.slice(1);
          break;
        case 'casual':
          // Validates: Requirement 8.4 - Casual style for chat apps
          result = prefix ? `${prefix} ${text.toLowerCase()}` : text.toLowerCase();
          break;
        case 'neutral':
        default:
          // Validates: Requirement 8.5 - Default style for unknown apps
          result = text;
          break;
      }

      return result;
    }),

    /**
     * Simulate a timeout error
     */
    simulateTimeout: vi.fn().mockImplementation((timeoutMs: number = 30000) => {
      state.shouldFail = true;
      state.failureError = new Error(`Request timed out after ${timeoutMs}ms`);
    }),

    /**
     * Simulate an error
     * Validates: Requirement 8.6
     */
    simulateError: vi.fn().mockImplementation((error: Error) => {
      state.shouldFail = true;
      state.failureError = error;
    }),

    /**
     * Set simulated latency for responses
     */
    simulateLatency: vi.fn().mockImplementation((latencyMs: number) => {
      state.simulatedLatency = latencyMs;
    }),

    /**
     * Reset the mock to initial state
     */
    __reset: () => {
      state = {
        invocationCount: 0,
        lastParams: null,
        simulatedLatency: options.bedrockLatency ?? 0,
        shouldFail: false,
        failureError: null
      };
      
      // Reset response handler to default
      responseHandler = options.bedrockResponseHandler ?? ((params: BedrockInvokeParams) => {
        return `Enhanced: ${params.text}`;
      });

      // Clear mock call history
      vi.mocked(mockService.invoke).mockClear();
      vi.mocked(mockService.processTextWithStyle).mockClear();
      vi.mocked(mockService.simulateTimeout).mockClear();
      vi.mocked(mockService.simulateError).mockClear();
      vi.mocked(mockService.simulateLatency).mockClear();
    },

    /**
     * Get the current internal state
     */
    __getState: () => ({ ...state }),

    /**
     * Get the number of invocations
     */
    __getInvocationCount: () => state.invocationCount,

    /**
     * Get the last invocation parameters
     */
    __getLastParams: () => state.lastParams ? { ...state.lastParams } : null,

    /**
     * Set a custom response handler
     */
    __setResponseHandler: (handler: (params: BedrockInvokeParams) => string | Promise<string>) => {
      responseHandler = handler;
    }
  };

  return mockService;
}

/**
 * Creates a complete mock AWS services object
 * 
 * @param options - Configuration options
 * @returns Mock AWS services
 * 
 * @example
 * ```typescript
 * const awsServices = createMockAWSServices();
 * 
 * // Use transcribe
 * await awsServices.transcribe.startSession();
 * awsServices.transcribe.simulatePartialResult('Hello');
 * 
 * // Use Bedrock
 * const enhanced = await awsServices.bedrock.invoke({ modelId: 'claude-3-haiku', text: 'test' });
 * 
 * // Reset all
 * awsServices.__resetAll();
 * ```
 */
export function createMockAWSServices(options: MockAWSServicesOptions = {}): MockAWSServices {
  const transcribe = createMockTranscribeService({
    defaultLanguageCode: options.defaultLanguageCode,
    defaultRegion: options.defaultRegion,
    transcribeLatency: options.transcribeLatency,
    enableAutoLanguageDetection: options.enableAutoLanguageDetection
  });

  const bedrock = createMockBedrockService({
    bedrockResponseHandler: options.bedrockResponseHandler,
    bedrockLatency: options.bedrockLatency
  });

  return {
    transcribe,
    bedrock,
    __resetAll: () => {
      transcribe.__reset();
      bedrock.__reset();
    }
  };
}

// ============================================================================
// Pre-configured Mock Factories
// ============================================================================

/**
 * Creates a mock configured for English transcription
 */
export function createEnglishTranscribeMock(): MockTranscribeService {
  const mock = createMockTranscribeService({ defaultLanguageCode: 'en-US' });
  return mock;
}

/**
 * Creates a mock configured for Spanish transcription
 */
export function createSpanishTranscribeMock(): MockTranscribeService {
  const mock = createMockTranscribeService({ defaultLanguageCode: 'es-US' });
  return mock;
}

/**
 * Creates a mock that simulates transcription errors
 */
export function createTranscriptionErrorMock(errorMessage: string = 'Transcription failed'): MockTranscribeService {
  const mock = createMockTranscribeService();
  
  // Override startSession to fail
  mock.startSession = vi.fn().mockRejectedValue(new Error(errorMessage));
  
  return mock;
}

/**
 * Creates a mock that simulates Bedrock errors
 */
export function createBedrockErrorMock(errorMessage: string = 'Bedrock invocation failed'): MockBedrockService {
  const mock = createMockBedrockService();
  mock.simulateError(new Error(errorMessage));
  return mock;
}

/**
 * Creates a mock with slow responses for latency testing
 */
export function createSlowAWSServicesMock(latencyMs: number = 1000): MockAWSServices {
  return createMockAWSServices({
    transcribeLatency: latencyMs,
    bedrockLatency: latencyMs
  });
}

/**
 * Creates a mock with custom Bedrock response handler
 */
export function createCustomBedrockMock(
  handler: (params: BedrockInvokeParams) => string | Promise<string>
): MockBedrockService {
  return createMockBedrockService({
    bedrockResponseHandler: handler
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Simulates a complete transcription session
 * 
 * @param transcribe - The mock transcribe service
 * @param partialResults - Array of partial results to simulate
 * @param finalResult - The final result to simulate
 * @param languageCode - Optional language code to detect
 * @returns The final transcript
 */
export async function simulateTranscriptionSession(
  transcribe: MockTranscribeService,
  partialResults: string[],
  finalResult: string,
  languageCode?: string
): Promise<string> {
  await transcribe.startSession();

  // Simulate language detection if provided
  if (languageCode) {
    transcribe.simulateLanguageDetection(languageCode);
  }

  // Simulate partial results
  for (const partial of partialResults) {
    transcribe.simulatePartialResult(partial);
  }

  // Simulate final result
  transcribe.simulateFinalResult(finalResult);

  // End session and return transcript
  return transcribe.endSession();
}

/**
 * Creates a mock audio buffer for testing
 * 
 * @param durationMs - Duration in milliseconds
 * @param sampleRate - Sample rate (default: 16000)
 * @returns ArrayBuffer containing mock PCM audio data
 */
export function createMockAudioBuffer(durationMs: number, sampleRate: number = 16000): ArrayBuffer {
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(samples * 2); // 16-bit samples
  const view = new Int16Array(buffer);
  
  // Fill with silence (zeros)
  for (let i = 0; i < samples; i++) {
    view[i] = 0;
  }
  
  return buffer;
}

/**
 * Creates a mock audio buffer with simulated speech
 * 
 * @param durationMs - Duration in milliseconds
 * @param sampleRate - Sample rate (default: 16000)
 * @returns ArrayBuffer containing mock PCM audio data with noise
 */
export function createMockSpeechBuffer(durationMs: number, sampleRate: number = 16000): ArrayBuffer {
  const samples = Math.floor((durationMs / 1000) * sampleRate);
  const buffer = new ArrayBuffer(samples * 2); // 16-bit samples
  const view = new Int16Array(buffer);
  
  // Fill with random noise to simulate speech
  for (let i = 0; i < samples; i++) {
    view[i] = Math.floor(Math.random() * 32767) - 16384;
  }
  
  return buffer;
}

// ============================================================================
// Default Export
// ============================================================================

export default createMockAWSServices;
