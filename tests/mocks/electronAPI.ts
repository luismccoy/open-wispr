/**
 * Mock Electron API for testing
 * 
 * This module provides a reusable, configurable mock implementation of the
 * Electron API used by the Ollie voice dictation app. It can be imported
 * independently and customized for specific test scenarios.
 * 
 * @module tests/mocks/electronAPI
 * 
 * Validates: Requirements 10.1-10.7 (IPC Handler Testing)
 */

import { vi } from 'vitest';

// Use ReturnType to get the correct mock function type
type MockFn<T extends (...args: never[]) => unknown = (...args: never[]) => unknown> = ReturnType<typeof vi.fn<T>>;

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
 * Application context for style detection
 */
export interface AppContext {
  appName: string;
  bundleId: string | null;
  executablePath: string | null;
  windowTitle: string | null;
  platform: 'darwin' | 'win32' | 'linux';
}

/**
 * Options for starting a transcription session
 */
export interface TranscribeOptions {
  languageCode?: string;
  region?: string;
  enableLanguageIdentification?: boolean;
}

/**
 * Parameters for Bedrock model invocation
 */
export interface BedrockParams {
  modelId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Connection warmup status
 */
export interface ConnectionStatus {
  isReady: boolean;
  bedrockWarmed: boolean;
  transcribeWarmed: boolean;
  lastWarmupTime: number | null;
}

/**
 * AWS credentials structure
 */
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Event callback types for streaming transcription
 */
export type StreamingPartialCallback = (data: { text: string }) => void;
export type StreamingFinalCallback = (data: { text: string }) => void;
export type StreamingLanguageCallback = (data: { languageCode: string }) => void;
export type StreamingErrorCallback = (data: { error: string }) => void;
export type ToggleDictationCallback = () => void;
export type NoAudioCallback = () => void;

/**
 * Event listener map for type-safe event handling
 */
export interface EventListenerMap {
  'toggle-dictation': ToggleDictationCallback[];
  'streaming-transcribe-partial': StreamingPartialCallback[];
  'streaming-transcribe-final': StreamingFinalCallback[];
  'streaming-transcribe-language': StreamingLanguageCallback[];
  'streaming-transcribe-error': StreamingErrorCallback[];
  'no-audio-detected': NoAudioCallback[];
}

/**
 * Internal state of the mock
 */
export interface MockElectronAPIState {
  transcriptions: TranscriptionItem[];
  clipboardContent: string;
  currentHotkey: string;
  eventListeners: EventListenerMap;
  nextId: number;
}

/**
 * Configuration options for creating a mock
 */
export interface MockElectronAPIOptions {
  /** Initial transcriptions to populate */
  initialTranscriptions?: TranscriptionItem[];
  /** Initial clipboard content */
  initialClipboardContent?: string;
  /** Initial hotkey */
  initialHotkey?: string;
  /** Default app context to return */
  defaultAppContext?: AppContext;
  /** Default AWS credentials */
  defaultAWSCredentials?: AWSCredentials;
  /** Whether connection is ready by default */
  connectionReady?: boolean;
  /** Custom Bedrock response handler */
  bedrockResponseHandler?: (params: BedrockParams) => string | Promise<string>;
  /** Custom transcription end handler */
  transcriptionEndHandler?: () => { success: boolean; text: string } | Promise<{ success: boolean; text: string }>;
}

// ============================================================================
// Mock Electron API Interface
// ============================================================================

/**
 * Complete interface for the mocked Electron API
 */
export interface MockElectronAPI {
  // Window management
  hideWindow: MockFn<() => Promise<void>>;
  showDictationPanel: MockFn<() => Promise<void>>;
  windowMinimize: MockFn<() => Promise<void>>;
  windowMaximize: MockFn<() => Promise<void>>;
  windowClose: MockFn<() => Promise<void>>;
  windowIsMaximized: MockFn<() => Promise<boolean>>;
  startWindowDrag: MockFn<() => Promise<void>>;
  stopWindowDrag: MockFn<() => Promise<void>>;

  // Hotkey management
  updateHotkey: MockFn<(key: string) => Promise<{ success: boolean }>>;
  onToggleDictation: MockFn<(callback: ToggleDictationCallback) => void>;

  // Database operations
  saveTranscription: MockFn<(text: string) => Promise<{ id: number }>>;
  getTranscriptions: MockFn<(limit: number) => Promise<TranscriptionItem[]>>;
  deleteTranscription: MockFn<(id: number) => Promise<{ success: boolean }>>;
  clearTranscriptions: MockFn<() => Promise<{ cleared: number }>>;

  // Clipboard operations
  pasteText: MockFn<(text: string) => Promise<void>>;
  readClipboard: MockFn<() => Promise<string>>;
  writeClipboard: MockFn<(text: string) => Promise<void>>;

  // Settings management
  saveSettings: MockFn<(settings: Record<string, unknown>) => Promise<{ success: boolean }>>;

  // AWS Transcribe streaming operations
  streamingTranscribeStart: MockFn<(options?: TranscribeOptions) => Promise<{ success: boolean }>>;
  streamingTranscribeChunk: MockFn<(buffer: ArrayBuffer) => Promise<{ success: boolean }>>;
  streamingTranscribeEnd: MockFn<() => Promise<{ success: boolean; text: string }>>;
  streamingTranscribeAbort: MockFn<() => Promise<{ success: boolean }>>;
  streamingTranscribeStatus: MockFn<() => Promise<{ isActive: boolean }>>;

  // Legacy transcribe function
  transcribeAWS: MockFn<(buffer: ArrayBuffer) => Promise<{ text: string; confidence: number }>>;

  // AWS Bedrock operations
  invokeBedrockModel: MockFn<(params: BedrockParams) => Promise<string>>;
  getAWSCredentials: MockFn<() => Promise<AWSCredentials>>;
  saveAWSCredentials: MockFn<(credentials: AWSCredentials) => Promise<{ success: boolean }>>;
  getAnthropicKey: MockFn<() => Promise<string>>;
  saveAnthropicKey: MockFn<(key: string) => Promise<{ success: boolean }>>;

  // Context detection
  getActiveAppContext: MockFn<() => Promise<AppContext>>;

  // Connection warmup
  connectionWarmup: MockFn<() => Promise<{ success: boolean }>>;
  connectionStatus: MockFn<() => Promise<ConnectionStatus>>;
  connectionHealthCheck: MockFn<() => Promise<{ healthy: boolean }>>;
  connectionIsReady: MockFn<() => Promise<boolean>>;
  connectionReset: MockFn<() => Promise<{ success: boolean }>>;

  // Streaming transcription event listeners
  onStreamingPartial: MockFn<(callback: StreamingPartialCallback) => void>;
  onStreamingFinal: MockFn<(callback: StreamingFinalCallback) => void>;
  onStreamingLanguage: MockFn<(callback: StreamingLanguageCallback) => void>;
  onStreamingError: MockFn<(callback: StreamingErrorCallback) => void>;

  // Audio event listeners
  onNoAudioDetected: MockFn<(callback: NoAudioCallback) => void>;

  // Update functions
  checkForUpdates: MockFn<() => Promise<{ updateAvailable: boolean }>>;
  downloadUpdate: MockFn<() => Promise<{ success: boolean }>>;
  installUpdate: MockFn<() => Promise<{ success: boolean }>>;
  getAppVersion: MockFn<() => Promise<string>>;
  getUpdateStatus: MockFn<() => Promise<{ status: string }>>;

  // Update event listeners
  onUpdateAvailable: MockFn<(callback: () => void) => void>;
  onUpdateNotAvailable: MockFn<(callback: () => void) => void>;
  onUpdateDownloaded: MockFn<(callback: () => void) => void>;
  onUpdateDownloadProgress: MockFn<(callback: (progress: number) => void) => void>;
  onUpdateError: MockFn<(callback: (error: Error) => void) => void>;

  // Utility functions
  cleanupApp: MockFn<() => Promise<{ success: boolean }>>;
  openExternal: MockFn<(url: string) => Promise<void>>;
  debugLog: MockFn<(message: string, ...args: unknown[]) => Promise<void>>;

  // Remove all listeners for a channel
  removeAllListeners: MockFn<(channel: string) => void>;

  // Test helpers
  __emitEvent: <K extends keyof EventListenerMap>(
    channel: K,
    ...args: Parameters<EventListenerMap[K][number]>
  ) => void;
  __reset: () => void;
  __getState: () => MockElectronAPIState;
  __setState: (state: Partial<MockElectronAPIState>) => void;
  __setAppContext: (context: AppContext) => void;
  __setConnectionReady: (ready: boolean) => void;
  __addTranscription: (item: Omit<TranscriptionItem, 'id'>) => TranscriptionItem;
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Default app context for unknown applications
 */
export const DEFAULT_APP_CONTEXT: AppContext = {
  appName: 'Unknown',
  bundleId: null,
  executablePath: null,
  windowTitle: null,
  platform: 'darwin'
};

/**
 * Default AWS credentials for testing
 */
export const DEFAULT_AWS_CREDENTIALS: AWSCredentials = {
  accessKeyId: 'mock-access-key',
  secretAccessKey: 'mock-secret-key',
  region: 'us-east-1'
};

/**
 * Default connection status
 */
export const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  isReady: true,
  bedrockWarmed: true,
  transcribeWarmed: true,
  lastWarmupTime: Date.now()
};

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new mock Electron API instance with configurable options
 * 
 * @param options - Configuration options for the mock
 * @returns A fully configured mock Electron API
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const mockAPI = createMockElectronAPI();
 * 
 * // With initial data
 * const mockAPI = createMockElectronAPI({
 *   initialTranscriptions: [
 *     { id: 1, text: 'Hello', timestamp: '2024-01-01T00:00:00Z' }
 *   ],
 *   defaultAppContext: { appName: 'Slack', bundleId: 'com.slack', ... }
 * });
 * 
 * // With custom handlers
 * const mockAPI = createMockElectronAPI({
 *   bedrockResponseHandler: (params) => `Custom: ${params.prompt}`
 * });
 * ```
 */
export function createMockElectronAPI(options: MockElectronAPIOptions = {}): MockElectronAPI {
  // Initialize internal state
  let state: MockElectronAPIState = {
    transcriptions: options.initialTranscriptions ? [...options.initialTranscriptions] : [],
    clipboardContent: options.initialClipboardContent ?? '',
    currentHotkey: options.initialHotkey ?? 'D',
    eventListeners: {
      'toggle-dictation': [],
      'streaming-transcribe-partial': [],
      'streaming-transcribe-final': [],
      'streaming-transcribe-language': [],
      'streaming-transcribe-error': [],
      'no-audio-detected': []
    },
    nextId: options.initialTranscriptions 
      ? Math.max(...options.initialTranscriptions.map(t => t.id), 0) + 1 
      : 1
  };

  // Configurable values
  let appContext: AppContext = options.defaultAppContext ?? { ...DEFAULT_APP_CONTEXT };
  let awsCredentials: AWSCredentials = options.defaultAWSCredentials ?? { ...DEFAULT_AWS_CREDENTIALS };
  let connectionReady = options.connectionReady ?? true;

  // Custom handlers
  const bedrockHandler = options.bedrockResponseHandler ?? ((params: BedrockParams) => `Enhanced: ${params.prompt}`);
  const transcriptionEndHandler = options.transcriptionEndHandler ?? (() => ({ success: true, text: 'Mock transcription result' }));

  const mockAPI: MockElectronAPI = {
    // ========================================================================
    // Window Management
    // ========================================================================
    hideWindow: vi.fn().mockResolvedValue(undefined),
    showDictationPanel: vi.fn().mockResolvedValue(undefined),
    windowMinimize: vi.fn().mockResolvedValue(undefined),
    windowMaximize: vi.fn().mockResolvedValue(undefined),
    windowClose: vi.fn().mockResolvedValue(undefined),
    windowIsMaximized: vi.fn().mockResolvedValue(false),
    startWindowDrag: vi.fn().mockResolvedValue(undefined),
    stopWindowDrag: vi.fn().mockResolvedValue(undefined),

    // ========================================================================
    // Hotkey Management
    // ========================================================================
    updateHotkey: vi.fn().mockImplementation((key: string) => {
      state.currentHotkey = key;
      return Promise.resolve({ success: true });
    }),

    onToggleDictation: vi.fn().mockImplementation((callback: ToggleDictationCallback) => {
      state.eventListeners['toggle-dictation'].push(callback);
    }),

    // ========================================================================
    // Database Operations
    // ========================================================================
    saveTranscription: vi.fn().mockImplementation((text: string) => {
      const item: TranscriptionItem = {
        id: state.nextId++,
        text,
        timestamp: new Date().toISOString()
      };
      state.transcriptions.unshift(item);
      return Promise.resolve({ id: item.id });
    }),

    getTranscriptions: vi.fn().mockImplementation((limit: number) => {
      return Promise.resolve(state.transcriptions.slice(0, limit));
    }),

    deleteTranscription: vi.fn().mockImplementation((id: number) => {
      const index = state.transcriptions.findIndex(t => t.id === id);
      if (index !== -1) {
        state.transcriptions.splice(index, 1);
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false });
    }),

    clearTranscriptions: vi.fn().mockImplementation(() => {
      const count = state.transcriptions.length;
      state.transcriptions = [];
      return Promise.resolve({ cleared: count });
    }),

    // ========================================================================
    // Clipboard Operations
    // ========================================================================
    pasteText: vi.fn().mockResolvedValue(undefined),

    readClipboard: vi.fn().mockImplementation(() => {
      return Promise.resolve(state.clipboardContent);
    }),

    writeClipboard: vi.fn().mockImplementation((text: string) => {
      state.clipboardContent = text;
      return Promise.resolve(undefined);
    }),

    // ========================================================================
    // Settings Management
    // ========================================================================
    saveSettings: vi.fn().mockResolvedValue({ success: true }),

    // ========================================================================
    // AWS Transcribe Streaming Operations
    // ========================================================================
    streamingTranscribeStart: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeChunk: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeEnd: vi.fn().mockImplementation(() => Promise.resolve(transcriptionEndHandler())),
    streamingTranscribeAbort: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeStatus: vi.fn().mockResolvedValue({ isActive: false }),

    // Legacy transcribe function
    transcribeAWS: vi.fn().mockResolvedValue({ text: 'Mock transcription', confidence: 0.95 }),

    // ========================================================================
    // AWS Bedrock Operations
    // ========================================================================
    invokeBedrockModel: vi.fn().mockImplementation((params: BedrockParams) => {
      return Promise.resolve(bedrockHandler(params));
    }),

    getAWSCredentials: vi.fn().mockImplementation(() => {
      return Promise.resolve({ ...awsCredentials });
    }),

    saveAWSCredentials: vi.fn().mockResolvedValue({ success: true }),
    getAnthropicKey: vi.fn().mockResolvedValue('mock-anthropic-key'),
    saveAnthropicKey: vi.fn().mockResolvedValue({ success: true }),

    // ========================================================================
    // Context Detection
    // ========================================================================
    getActiveAppContext: vi.fn().mockImplementation(() => {
      return Promise.resolve({ ...appContext });
    }),

    // ========================================================================
    // Connection Warmup
    // ========================================================================
    connectionWarmup: vi.fn().mockResolvedValue({ success: true }),

    connectionStatus: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        isReady: connectionReady,
        bedrockWarmed: connectionReady,
        transcribeWarmed: connectionReady,
        lastWarmupTime: connectionReady ? Date.now() : null
      });
    }),

    connectionHealthCheck: vi.fn().mockImplementation(() => {
      return Promise.resolve({ healthy: connectionReady });
    }),

    connectionIsReady: vi.fn().mockImplementation(() => {
      return Promise.resolve(connectionReady);
    }),

    connectionReset: vi.fn().mockResolvedValue({ success: true }),

    // ========================================================================
    // Streaming Transcription Event Listeners
    // ========================================================================
    onStreamingPartial: vi.fn().mockImplementation((callback: StreamingPartialCallback) => {
      state.eventListeners['streaming-transcribe-partial'].push(callback);
    }),

    onStreamingFinal: vi.fn().mockImplementation((callback: StreamingFinalCallback) => {
      state.eventListeners['streaming-transcribe-final'].push(callback);
    }),

    onStreamingLanguage: vi.fn().mockImplementation((callback: StreamingLanguageCallback) => {
      state.eventListeners['streaming-transcribe-language'].push(callback);
    }),

    onStreamingError: vi.fn().mockImplementation((callback: StreamingErrorCallback) => {
      state.eventListeners['streaming-transcribe-error'].push(callback);
    }),

    // ========================================================================
    // Audio Event Listeners
    // ========================================================================
    onNoAudioDetected: vi.fn().mockImplementation((callback: NoAudioCallback) => {
      state.eventListeners['no-audio-detected'].push(callback);
    }),

    // ========================================================================
    // Update Functions
    // ========================================================================
    checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: false }),
    downloadUpdate: vi.fn().mockResolvedValue({ success: true }),
    installUpdate: vi.fn().mockResolvedValue({ success: true }),
    getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
    getUpdateStatus: vi.fn().mockResolvedValue({ status: 'idle' }),

    // Update event listeners
    onUpdateAvailable: vi.fn(),
    onUpdateNotAvailable: vi.fn(),
    onUpdateDownloaded: vi.fn(),
    onUpdateDownloadProgress: vi.fn(),
    onUpdateError: vi.fn(),

    // ========================================================================
    // Utility Functions
    // ========================================================================
    cleanupApp: vi.fn().mockResolvedValue({ success: true }),
    openExternal: vi.fn().mockResolvedValue(undefined),
    debugLog: vi.fn().mockResolvedValue(undefined),

    // ========================================================================
    // Remove All Listeners
    // ========================================================================
    removeAllListeners: vi.fn().mockImplementation((channel: string) => {
      if (channel === 'toggle-dictation') {
        state.eventListeners['toggle-dictation'] = [];
      } else if (channel === 'streaming-transcribe-partial') {
        state.eventListeners['streaming-transcribe-partial'] = [];
      } else if (channel === 'streaming-transcribe-final') {
        state.eventListeners['streaming-transcribe-final'] = [];
      } else if (channel === 'streaming-transcribe-language') {
        state.eventListeners['streaming-transcribe-language'] = [];
      } else if (channel === 'streaming-transcribe-error') {
        state.eventListeners['streaming-transcribe-error'] = [];
      } else if (channel === 'no-audio-detected') {
        state.eventListeners['no-audio-detected'] = [];
      }
    }),

    // ========================================================================
    // Test Helpers
    // ========================================================================
    
    /**
     * Emit an event to all registered listeners
     */
    __emitEvent: <K extends keyof EventListenerMap>(
      channel: K,
      ...args: Parameters<EventListenerMap[K][number]>
    ) => {
      if (channel === 'toggle-dictation') {
        state.eventListeners['toggle-dictation'].forEach(cb => cb());
      } else if (channel === 'streaming-transcribe-partial') {
        const data = args[0] as { text: string };
        state.eventListeners['streaming-transcribe-partial'].forEach(cb => cb(data));
      } else if (channel === 'streaming-transcribe-final') {
        const data = args[0] as { text: string };
        state.eventListeners['streaming-transcribe-final'].forEach(cb => cb(data));
      } else if (channel === 'streaming-transcribe-language') {
        const data = args[0] as { languageCode: string };
        state.eventListeners['streaming-transcribe-language'].forEach(cb => cb(data));
      } else if (channel === 'streaming-transcribe-error') {
        const data = args[0] as { error: string };
        state.eventListeners['streaming-transcribe-error'].forEach(cb => cb(data));
      } else if (channel === 'no-audio-detected') {
        state.eventListeners['no-audio-detected'].forEach(cb => cb());
      }
    },

    /**
     * Reset the mock to its initial state
     */
    __reset: () => {
      state = {
        transcriptions: options.initialTranscriptions ? [...options.initialTranscriptions] : [],
        clipboardContent: options.initialClipboardContent ?? '',
        currentHotkey: options.initialHotkey ?? 'D',
        eventListeners: {
          'toggle-dictation': [],
          'streaming-transcribe-partial': [],
          'streaming-transcribe-final': [],
          'streaming-transcribe-language': [],
          'streaming-transcribe-error': [],
          'no-audio-detected': []
        },
        nextId: options.initialTranscriptions 
          ? Math.max(...options.initialTranscriptions.map(t => t.id), 0) + 1 
          : 1
      };
      appContext = options.defaultAppContext ?? { ...DEFAULT_APP_CONTEXT };
      awsCredentials = options.defaultAWSCredentials ?? { ...DEFAULT_AWS_CREDENTIALS };
      connectionReady = options.connectionReady ?? true;
    },

    /**
     * Get the current internal state
     */
    __getState: () => ({
      transcriptions: [...state.transcriptions],
      clipboardContent: state.clipboardContent,
      currentHotkey: state.currentHotkey,
      eventListeners: { ...state.eventListeners },
      nextId: state.nextId
    }),

    /**
     * Set partial internal state
     */
    __setState: (newState: Partial<MockElectronAPIState>) => {
      if (newState.transcriptions !== undefined) {
        state.transcriptions = [...newState.transcriptions];
      }
      if (newState.clipboardContent !== undefined) {
        state.clipboardContent = newState.clipboardContent;
      }
      if (newState.currentHotkey !== undefined) {
        state.currentHotkey = newState.currentHotkey;
      }
      if (newState.nextId !== undefined) {
        state.nextId = newState.nextId;
      }
    },

    /**
     * Set the app context returned by getActiveAppContext
     */
    __setAppContext: (context: AppContext) => {
      appContext = { ...context };
    },

    /**
     * Set the connection ready state
     */
    __setConnectionReady: (ready: boolean) => {
      connectionReady = ready;
    },

    /**
     * Add a transcription directly to the state
     */
    __addTranscription: (item: Omit<TranscriptionItem, 'id'>) => {
      const newItem: TranscriptionItem = {
        ...item,
        id: state.nextId++
      };
      state.transcriptions.unshift(newItem);
      return newItem;
    }
  };

  return mockAPI;
}

// ============================================================================
// Pre-configured Mock Factories
// ============================================================================

/**
 * Creates a mock configured for email app context
 */
export function createEmailAppMock(): MockElectronAPI {
  return createMockElectronAPI({
    defaultAppContext: {
      appName: 'Mail',
      bundleId: 'com.apple.mail',
      executablePath: '/System/Applications/Mail.app',
      windowTitle: 'Inbox - Mail',
      platform: 'darwin'
    }
  });
}

/**
 * Creates a mock configured for chat app context (Slack)
 */
export function createSlackAppMock(): MockElectronAPI {
  return createMockElectronAPI({
    defaultAppContext: {
      appName: 'Slack',
      bundleId: 'com.tinyspeck.slackmacgap',
      executablePath: '/Applications/Slack.app',
      windowTitle: '#general - Slack',
      platform: 'darwin'
    }
  });
}

/**
 * Creates a mock configured for chat app context (Discord)
 */
export function createDiscordAppMock(): MockElectronAPI {
  return createMockElectronAPI({
    defaultAppContext: {
      appName: 'Discord',
      bundleId: 'com.hnc.Discord',
      executablePath: '/Applications/Discord.app',
      windowTitle: 'Discord',
      platform: 'darwin'
    }
  });
}

/**
 * Creates a mock with connection not ready (for error testing)
 */
export function createDisconnectedMock(): MockElectronAPI {
  return createMockElectronAPI({
    connectionReady: false
  });
}

/**
 * Creates a mock with pre-populated transcriptions
 */
export function createMockWithTranscriptions(transcriptions: TranscriptionItem[]): MockElectronAPI {
  return createMockElectronAPI({
    initialTranscriptions: transcriptions
  });
}

/**
 * Creates a mock that simulates Bedrock errors
 */
export function createBedrockErrorMock(errorMessage: string = 'Bedrock invocation failed'): MockElectronAPI {
  const mock = createMockElectronAPI();
  
  // Override to reject with error
  mock.invokeBedrockModel.mockRejectedValue(new Error(errorMessage));
  
  return mock;
}

/**
 * Creates a mock that simulates transcription errors
 */
export function createTranscriptionErrorMock(errorMessage: string = 'Transcription failed'): MockElectronAPI {
  const mock = createMockElectronAPI({
    transcriptionEndHandler: () => ({ success: false, text: '' })
  });
  
  // Override to throw error
  mock.streamingTranscribeEnd.mockRejectedValue(new Error(errorMessage));
  
  return mock;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Installs a mock Electron API on the window object
 * 
 * @param mock - The mock to install (creates a new one if not provided)
 * @returns The installed mock
 */
export function installMockElectronAPI(mock?: MockElectronAPI): MockElectronAPI {
  const mockAPI = mock ?? createMockElectronAPI();
  
  Object.defineProperty(window, 'electronAPI', {
    value: mockAPI,
    writable: true,
    configurable: true
  });
  
  return mockAPI;
}

/**
 * Removes the mock Electron API from the window object
 */
export function uninstallMockElectronAPI(): void {
  if ('electronAPI' in window) {
    delete (window as { electronAPI?: unknown }).electronAPI;
  }
}

/**
 * Creates a partial mock that can be spread into an existing mock
 * Useful for overriding specific functions
 * 
 * @example
 * ```typescript
 * const baseMock = createMockElectronAPI();
 * const customMock = {
 *   ...baseMock,
 *   ...createPartialMock({
 *     getActiveAppContext: vi.fn().mockResolvedValue({ appName: 'Custom' })
 *   })
 * };
 * ```
 */
export function createPartialMock(overrides: Partial<MockElectronAPI>): Partial<MockElectronAPI> {
  return overrides;
}

// ============================================================================
// Default Export
// ============================================================================

export default createMockElectronAPI;
