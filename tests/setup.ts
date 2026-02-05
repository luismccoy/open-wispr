/**
 * Global test setup file for Ollie voice dictation app
 * This file is run before each test file via vitest.config.ts setupFiles
 * 
 * Provides comprehensive mocks for:
 * - window.electronAPI (Electron IPC communication)
 * - localStorage (browser storage)
 * - navigator.mediaDevices (audio capture)
 * - AudioContext and AudioWorkletNode (Web Audio API)
 */

import { vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

interface TranscriptionItem {
  id: number;
  text: string;
  timestamp: string;
  duration?: number;
  language?: string;
}

interface AppContext {
  appName: string;
  bundleId: string | null;
  executablePath: string | null;
  windowTitle: string | null;
  platform: 'darwin' | 'win32' | 'linux';
}

interface TranscribeOptions {
  languageCode?: string;
  region?: string;
  enableLanguageIdentification?: boolean;
}

interface BedrockParams {
  modelId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface ConnectionStatus {
  isReady: boolean;
  bedrockWarmed: boolean;
  transcribeWarmed: boolean;
  lastWarmupTime: number | null;
}

// ============================================================================
// Mock Electron API
// ============================================================================

/**
 * Creates a mock implementation of the Electron API
 * All functions return resolved promises with sensible defaults
 */
function createMockElectronAPI() {
  // Internal state for mock
  let transcriptions: TranscriptionItem[] = [];
  let nextId = 1;
  let clipboardContent = '';
  let currentHotkey = 'D';
  
  // Event listener storage
  const eventListeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  return {
    // Window management
    hideWindow: vi.fn().mockResolvedValue(undefined),
    showDictationPanel: vi.fn().mockResolvedValue(undefined),
    windowMinimize: vi.fn().mockResolvedValue(undefined),
    windowMaximize: vi.fn().mockResolvedValue(undefined),
    windowClose: vi.fn().mockResolvedValue(undefined),
    windowIsMaximized: vi.fn().mockResolvedValue(false),
    startWindowDrag: vi.fn().mockResolvedValue(undefined),
    stopWindowDrag: vi.fn().mockResolvedValue(undefined),

    // Hotkey management
    updateHotkey: vi.fn().mockImplementation((key: string) => {
      currentHotkey = key;
      return Promise.resolve({ success: true });
    }),
    onToggleDictation: vi.fn().mockImplementation((callback: () => void) => {
      if (!eventListeners['toggle-dictation']) {
        eventListeners['toggle-dictation'] = [];
      }
      eventListeners['toggle-dictation'].push(callback);
    }),

    // Database operations
    saveTranscription: vi.fn().mockImplementation((text: string) => {
      const item: TranscriptionItem = {
        id: nextId++,
        text,
        timestamp: new Date().toISOString(),
      };
      transcriptions.unshift(item);
      return Promise.resolve({ id: item.id });
    }),
    getTranscriptions: vi.fn().mockImplementation((limit: number) => {
      return Promise.resolve(transcriptions.slice(0, limit));
    }),
    deleteTranscription: vi.fn().mockImplementation((id: number) => {
      const index = transcriptions.findIndex(t => t.id === id);
      if (index !== -1) {
        transcriptions.splice(index, 1);
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({ success: false });
    }),
    clearTranscriptions: vi.fn().mockImplementation(() => {
      const count = transcriptions.length;
      transcriptions = [];
      return Promise.resolve({ cleared: count });
    }),

    // Clipboard operations
    pasteText: vi.fn().mockResolvedValue(undefined),
    readClipboard: vi.fn().mockImplementation(() => {
      return Promise.resolve(clipboardContent);
    }),
    writeClipboard: vi.fn().mockImplementation((text: string) => {
      clipboardContent = text;
      return Promise.resolve(undefined);
    }),

    // Settings management
    saveSettings: vi.fn().mockResolvedValue({ success: true }),

    // AWS Transcribe streaming operations
    streamingTranscribeStart: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeChunk: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeEnd: vi.fn().mockResolvedValue({ success: true, text: 'Mock transcription result' }),
    streamingTranscribeAbort: vi.fn().mockResolvedValue({ success: true }),
    streamingTranscribeStatus: vi.fn().mockResolvedValue({ isActive: false }),
    
    // Legacy transcribe function
    transcribeAWS: vi.fn().mockResolvedValue({ text: 'Mock transcription', confidence: 0.95 }),

    // AWS Bedrock operations
    invokeBedrockModel: vi.fn().mockImplementation((params: BedrockParams) => {
      return Promise.resolve(`Enhanced: ${params.prompt}`);
    }),
    getAWSCredentials: vi.fn().mockResolvedValue({ 
      accessKeyId: 'mock-access-key',
      secretAccessKey: 'mock-secret-key',
      region: 'us-east-1'
    }),
    saveAWSCredentials: vi.fn().mockResolvedValue({ success: true }),
    getAnthropicKey: vi.fn().mockResolvedValue('mock-anthropic-key'),
    saveAnthropicKey: vi.fn().mockResolvedValue({ success: true }),

    // Context detection
    getActiveAppContext: vi.fn().mockResolvedValue({
      appName: 'Unknown',
      bundleId: null,
      executablePath: null,
      windowTitle: null,
      platform: 'darwin'
    } as AppContext),

    // Connection warmup
    connectionWarmup: vi.fn().mockResolvedValue({ success: true }),
    connectionStatus: vi.fn().mockResolvedValue({
      isReady: true,
      bedrockWarmed: true,
      transcribeWarmed: true,
      lastWarmupTime: Date.now()
    } as ConnectionStatus),
    connectionHealthCheck: vi.fn().mockResolvedValue({ healthy: true }),
    connectionIsReady: vi.fn().mockResolvedValue(true),
    connectionReset: vi.fn().mockResolvedValue({ success: true }),

    // Streaming transcription event listeners
    onStreamingPartial: vi.fn().mockImplementation((callback: (data: { text: string }) => void) => {
      if (!eventListeners['streaming-transcribe-partial']) {
        eventListeners['streaming-transcribe-partial'] = [];
      }
      eventListeners['streaming-transcribe-partial'].push(callback);
    }),
    onStreamingFinal: vi.fn().mockImplementation((callback: (data: { text: string }) => void) => {
      if (!eventListeners['streaming-transcribe-final']) {
        eventListeners['streaming-transcribe-final'] = [];
      }
      eventListeners['streaming-transcribe-final'].push(callback);
    }),
    onStreamingLanguage: vi.fn().mockImplementation((callback: (data: { languageCode: string }) => void) => {
      if (!eventListeners['streaming-transcribe-language']) {
        eventListeners['streaming-transcribe-language'] = [];
      }
      eventListeners['streaming-transcribe-language'].push(callback);
    }),
    onStreamingError: vi.fn().mockImplementation((callback: (data: { error: string }) => void) => {
      if (!eventListeners['streaming-transcribe-error']) {
        eventListeners['streaming-transcribe-error'] = [];
      }
      eventListeners['streaming-transcribe-error'].push(callback);
    }),

    // Audio event listeners
    onNoAudioDetected: vi.fn().mockImplementation((callback: () => void) => {
      if (!eventListeners['no-audio-detected']) {
        eventListeners['no-audio-detected'] = [];
      }
      eventListeners['no-audio-detected'].push(callback);
    }),

    // Update functions
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

    // Utility functions
    cleanupApp: vi.fn().mockResolvedValue({ success: true }),
    openExternal: vi.fn().mockResolvedValue(undefined),
    debugLog: vi.fn().mockResolvedValue(undefined),

    // Remove all listeners for a channel
    removeAllListeners: vi.fn().mockImplementation((channel: string) => {
      if (eventListeners[channel]) {
        eventListeners[channel] = [];
      }
    }),

    // Test helper: emit event to registered listeners
    __emitEvent: (channel: string, ...args: unknown[]) => {
      const listeners = eventListeners[channel] || [];
      listeners.forEach(listener => listener(...args));
    },

    // Test helper: reset internal state
    __reset: () => {
      transcriptions = [];
      nextId = 1;
      clipboardContent = '';
      currentHotkey = 'D';
      Object.keys(eventListeners).forEach(key => {
        eventListeners[key] = [];
      });
    },

    // Test helper: get internal state
    __getState: () => ({
      transcriptions: [...transcriptions],
      clipboardContent,
      currentHotkey,
      eventListeners: { ...eventListeners }
    })
  };
}

// ============================================================================
// Mock localStorage
// ============================================================================

/**
 * Creates a mock implementation of localStorage
 */
function createMockLocalStorage() {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
    // Test helper: get all stored data
    __getStore: () => ({ ...store }),
    // Test helper: set initial data
    __setStore: (data: Record<string, string>) => {
      store = { ...data };
    }
  };
}

// ============================================================================
// Mock navigator.mediaDevices
// ============================================================================

/**
 * Creates a mock MediaStream
 */
function createMockMediaStream(): MediaStream {
  const tracks: MediaStreamTrack[] = [
    {
      kind: 'audio',
      id: 'mock-audio-track-id',
      label: 'Mock Microphone',
      enabled: true,
      muted: false,
      readyState: 'live',
      contentHint: '',
      onended: null,
      onmute: null,
      onunmute: null,
      stop: vi.fn(),
      clone: vi.fn(),
      getCapabilities: vi.fn().mockReturnValue({}),
      getConstraints: vi.fn().mockReturnValue({}),
      getSettings: vi.fn().mockReturnValue({
        deviceId: 'mock-device-id',
        groupId: 'mock-group-id',
        sampleRate: 48000,
        sampleSize: 16,
        channelCount: 1
      }),
      applyConstraints: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as MediaStreamTrack
  ];

  return {
    id: 'mock-stream-id',
    active: true,
    onaddtrack: null,
    onremovetrack: null,
    getTracks: vi.fn().mockReturnValue(tracks),
    getAudioTracks: vi.fn().mockReturnValue(tracks),
    getVideoTracks: vi.fn().mockReturnValue([]),
    getTrackById: vi.fn((id: string) => tracks.find(t => t.id === id) ?? null),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true)
  } as unknown as MediaStream;
}

/**
 * Creates mock MediaDeviceInfo objects
 */
function createMockMediaDevices(): MediaDeviceInfo[] {
  return [
    {
      deviceId: 'default',
      groupId: 'default-group',
      kind: 'audioinput',
      label: 'Default Microphone',
      toJSON: vi.fn().mockReturnValue({
        deviceId: 'default',
        groupId: 'default-group',
        kind: 'audioinput',
        label: 'Default Microphone'
      })
    } as MediaDeviceInfo,
    {
      deviceId: 'mock-mic-1',
      groupId: 'mock-group-1',
      kind: 'audioinput',
      label: 'Mock USB Microphone',
      toJSON: vi.fn().mockReturnValue({
        deviceId: 'mock-mic-1',
        groupId: 'mock-group-1',
        kind: 'audioinput',
        label: 'Mock USB Microphone'
      })
    } as MediaDeviceInfo,
    {
      deviceId: 'mock-speaker-1',
      groupId: 'mock-group-1',
      kind: 'audiooutput',
      label: 'Mock Speakers',
      toJSON: vi.fn().mockReturnValue({
        deviceId: 'mock-speaker-1',
        groupId: 'mock-group-1',
        kind: 'audiooutput',
        label: 'Mock Speakers'
      })
    } as MediaDeviceInfo
  ];
}

/**
 * Creates a mock implementation of navigator.mediaDevices
 */
function createMockNavigatorMediaDevices() {
  let permissionGranted = true;

  return {
    getUserMedia: vi.fn().mockImplementation((constraints: MediaStreamConstraints) => {
      if (!permissionGranted) {
        return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
      }
      return Promise.resolve(createMockMediaStream());
    }),
    enumerateDevices: vi.fn().mockResolvedValue(createMockMediaDevices()),
    getDisplayMedia: vi.fn().mockRejectedValue(new Error('Not implemented in tests')),
    getSupportedConstraints: vi.fn().mockReturnValue({
      deviceId: true,
      groupId: true,
      autoGainControl: true,
      channelCount: true,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: true,
      sampleSize: true
    }),
    ondevicechange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
    // Test helper: control permission state
    __setPermissionGranted: (granted: boolean) => {
      permissionGranted = granted;
    }
  };
}

// ============================================================================
// Mock AudioContext and AudioWorkletNode
// ============================================================================

/**
 * Creates a mock AudioContext
 */
class MockAudioContext {
  public state: AudioContextState = 'running';
  public sampleRate = 48000;
  public currentTime = 0;
  public baseLatency = 0.01;
  public outputLatency = 0.01;
  public destination: AudioDestinationNode;
  public listener: AudioListener;
  public audioWorklet: AudioWorklet;

  private _onstatechange: ((this: AudioContext, ev: Event) => void) | null = null;

  constructor(options?: AudioContextOptions) {
    if (options?.sampleRate) {
      this.sampleRate = options.sampleRate;
    }

    // Mock destination
    this.destination = {
      channelCount: 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      maxChannelCount: 2,
      numberOfInputs: 1,
      numberOfOutputs: 0,
      context: this,
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as AudioDestinationNode;

    // Mock listener
    this.listener = {
      positionX: { value: 0 },
      positionY: { value: 0 },
      positionZ: { value: 0 },
      forwardX: { value: 0 },
      forwardY: { value: 0 },
      forwardZ: { value: -1 },
      upX: { value: 0 },
      upY: { value: 1 },
      upZ: { value: 0 }
    } as unknown as AudioListener;

    // Mock audioWorklet
    this.audioWorklet = {
      addModule: vi.fn().mockResolvedValue(undefined)
    } as unknown as AudioWorklet;
  }

  get onstatechange() {
    return this._onstatechange;
  }

  set onstatechange(handler: ((this: AudioContext, ev: Event) => void) | null) {
    this._onstatechange = handler;
  }

  resume = vi.fn().mockImplementation(() => {
    this.state = 'running';
    return Promise.resolve();
  });

  suspend = vi.fn().mockImplementation(() => {
    this.state = 'suspended';
    return Promise.resolve();
  });

  close = vi.fn().mockImplementation(() => {
    this.state = 'closed';
    return Promise.resolve();
  });

  createMediaStreamSource = vi.fn().mockImplementation((mediaStream: MediaStream) => {
    return {
      mediaStream,
      context: this,
      numberOfInputs: 0,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as MediaStreamAudioSourceNode;
  });

  createGain = vi.fn().mockImplementation(() => {
    return {
      gain: { value: 1, setValueAtTime: vi.fn() },
      context: this,
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as GainNode;
  });

  createAnalyser = vi.fn().mockImplementation(() => {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      getFloatFrequencyData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
      context: this,
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 2,
      channelCountMode: 'max',
      channelInterpretation: 'speakers',
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as AnalyserNode;
  });

  createScriptProcessor = vi.fn().mockImplementation((bufferSize?: number, numberOfInputChannels?: number, numberOfOutputChannels?: number) => {
    return {
      bufferSize: bufferSize || 4096,
      onaudioprocess: null,
      context: this,
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: numberOfInputChannels || 2,
      channelCountMode: 'explicit',
      channelInterpretation: 'speakers',
      connect: vi.fn(),
      disconnect: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as ScriptProcessorNode;
  });

  createBuffer = vi.fn().mockImplementation((numberOfChannels: number, length: number, sampleRate: number) => {
    const channelData = new Float32Array(length);
    return {
      sampleRate,
      length,
      duration: length / sampleRate,
      numberOfChannels,
      getChannelData: vi.fn().mockReturnValue(channelData),
      copyFromChannel: vi.fn(),
      copyToChannel: vi.fn()
    } as unknown as AudioBuffer;
  });

  decodeAudioData = vi.fn().mockImplementation((audioData: ArrayBuffer) => {
    return Promise.resolve(this.createBuffer(1, audioData.byteLength / 2, this.sampleRate));
  });

  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn().mockReturnValue(true);
}

/**
 * Creates a mock AudioWorkletNode
 */
class MockAudioWorkletNode {
  public port: MessagePort;
  public parameters: AudioParamMap;
  public context: BaseAudioContext;
  public numberOfInputs = 1;
  public numberOfOutputs = 1;
  public channelCount = 1;
  public channelCountMode: ChannelCountMode = 'explicit';
  public channelInterpretation: ChannelInterpretation = 'speakers';

  private _onprocessorerror: ((this: AudioWorkletNode, ev: Event) => void) | null = null;

  constructor(context: BaseAudioContext, name: string, options?: AudioWorkletNodeOptions) {
    this.context = context;

    // Mock MessagePort
    this.port = {
      postMessage: vi.fn(),
      onmessage: null,
      onmessageerror: null,
      start: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn().mockReturnValue(true)
    } as unknown as MessagePort;

    // Mock AudioParamMap
    this.parameters = new Map() as unknown as AudioParamMap;
  }

  get onprocessorerror() {
    return this._onprocessorerror;
  }

  set onprocessorerror(handler: ((this: AudioWorkletNode, ev: Event) => void) | null) {
    this._onprocessorerror = handler;
  }

  connect = vi.fn();
  disconnect = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn().mockReturnValue(true);
}

// ============================================================================
// Global Mock Setup
// ============================================================================

// Create mock instances
const mockElectronAPI = createMockElectronAPI();
const mockLocalStorage = createMockLocalStorage();
const mockMediaDevices = createMockNavigatorMediaDevices();

// Expose mocks globally for test access
declare global {
  interface Window {
    electronAPI: ReturnType<typeof createMockElectronAPI>;
  }
  var mockElectronAPI: ReturnType<typeof createMockElectronAPI>;
  var mockLocalStorage: ReturnType<typeof createMockLocalStorage>;
  var mockMediaDevices: ReturnType<typeof createMockNavigatorMediaDevices>;
}

// Set up global mocks
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
  configurable: true
});

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
});

Object.defineProperty(navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true,
  configurable: true
});

// Mock AudioContext globally
Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true,
  configurable: true
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: MockAudioContext,
  writable: true,
  configurable: true
});

// Mock AudioWorkletNode globally
Object.defineProperty(window, 'AudioWorkletNode', {
  value: MockAudioWorkletNode,
  writable: true,
  configurable: true
});

// Expose mock instances globally for test access
globalThis.mockElectronAPI = mockElectronAPI;
globalThis.mockLocalStorage = mockLocalStorage;
globalThis.mockMediaDevices = mockMediaDevices;

// ============================================================================
// Test Lifecycle Hooks
// ============================================================================

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset internal state of mocks
  mockElectronAPI.__reset();
  mockLocalStorage.clear();
  mockMediaDevices.__setPermissionGranted(true);
});

afterEach(() => {
  // Clean up after each test
  vi.restoreAllMocks();
});

// ============================================================================
// Export utilities for tests
// ============================================================================

export {
  createMockElectronAPI,
  createMockLocalStorage,
  createMockNavigatorMediaDevices,
  createMockMediaStream,
  createMockMediaDevices,
  MockAudioContext,
  MockAudioWorkletNode,
  mockElectronAPI,
  mockLocalStorage,
  mockMediaDevices
};

// Export types for tests
export type {
  TranscriptionItem,
  AppContext,
  TranscribeOptions,
  BedrockParams,
  ConnectionStatus
};
