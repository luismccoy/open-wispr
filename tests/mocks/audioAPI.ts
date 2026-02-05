/**
 * Mock Audio API for testing
 * 
 * This module provides reusable, configurable mock implementations of the
 * Web Audio API used by the Ollie voice dictation app, including:
 * - MediaDevices.getUserMedia
 * - MediaDevices.enumerateDevices
 * - AudioContext
 * - AudioWorkletNode
 * - MediaStream
 * 
 * @module tests/mocks/audioAPI
 * 
 * Validates: Requirements 6.1-6.6 (Audio Recording System Testing)
 */

import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Audio device information
 */
export interface MockMediaDeviceInfo {
  deviceId: string;
  groupId: string;
  kind: MediaDeviceKind;
  label: string;
  toJSON: () => object;
}

/**
 * Audio track settings
 */
export interface MockAudioTrackSettings {
  deviceId: string;
  groupId: string;
  sampleRate: number;
  sampleSize: number;
  channelCount: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}


/**
 * Configuration for mock audio track
 */
export interface MockAudioTrackConfig {
  id?: string;
  label?: string;
  enabled?: boolean;
  muted?: boolean;
  readyState?: MediaStreamTrackState;
  settings?: Partial<MockAudioTrackSettings>;
}

/**
 * Configuration for mock media stream
 */
export interface MockMediaStreamConfig {
  id?: string;
  active?: boolean;
  tracks?: MockAudioTrackConfig[];
}

/**
 * Configuration for mock audio context
 */
export interface MockAudioContextConfig {
  sampleRate?: number;
  state?: AudioContextState;
  baseLatency?: number;
  outputLatency?: number;
}

/**
 * Configuration for mock audio worklet node
 */
export interface MockAudioWorkletNodeConfig {
  numberOfInputs?: number;
  numberOfOutputs?: number;
  channelCount?: number;
}

/**
 * Internal state for the audio API mock
 */
export interface MockAudioAPIState {
  permissionGranted: boolean;
  devices: MockMediaDeviceInfo[];
  activeStreams: Map<string, MockMediaStreamInstance>;
  activeContexts: Map<string, MockAudioContextInstance>;
  audioChunksGenerated: number;
}


/**
 * Configuration options for creating the audio API mock
 */
export interface MockAudioAPIOptions {
  /** Whether microphone permission is granted by default */
  permissionGranted?: boolean;
  /** Initial list of audio devices */
  devices?: MockMediaDeviceInfo[];
  /** Default sample rate for audio contexts */
  defaultSampleRate?: number;
  /** Whether to simulate audio data generation */
  simulateAudioData?: boolean;
  /** Interval for generating audio chunks (ms) */
  audioChunkInterval?: number;
}

// ============================================================================
// Mock MediaStreamTrack
// ============================================================================

/**
 * Mock implementation of MediaStreamTrack
 */
export interface MockMediaStreamTrackInstance extends MediaStreamTrack {
  __simulateEnd: () => void;
  __simulateMute: () => void;
  __simulateUnmute: () => void;
}

/**
 * Creates a mock MediaStreamTrack
 */
export function createMockMediaStreamTrack(config: MockAudioTrackConfig = {}): MockMediaStreamTrackInstance {
  const trackId = config.id ?? `mock-track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let enabled = config.enabled ?? true;
  let muted = config.muted ?? false;
  let readyState: MediaStreamTrackState = config.readyState ?? 'live';
  
  const settings: MockAudioTrackSettings = {
    deviceId: config.settings?.deviceId ?? 'default',
    groupId: config.settings?.groupId ?? 'default-group',
    sampleRate: config.settings?.sampleRate ?? 48000,
    sampleSize: config.settings?.sampleSize ?? 16,
    channelCount: config.settings?.channelCount ?? 1,
    echoCancellation: config.settings?.echoCancellation ?? true,
    noiseSuppression: config.settings?.noiseSuppression ?? true,
    autoGainControl: config.settings?.autoGainControl ?? true
  };


  // Event handlers
  let onended: ((this: MediaStreamTrack, ev: Event) => void) | null = null;
  let onmute: ((this: MediaStreamTrack, ev: Event) => void) | null = null;
  let onunmute: ((this: MediaStreamTrack, ev: Event) => void) | null = null;

  const track: MockMediaStreamTrackInstance = {
    kind: 'audio',
    id: trackId,
    label: config.label ?? 'Mock Microphone',
    get enabled() { return enabled; },
    set enabled(value: boolean) { enabled = value; },
    get muted() { return muted; },
    get readyState() { return readyState; },
    contentHint: '',
    get onended() { return onended; },
    set onended(handler) { onended = handler; },
    get onmute() { return onmute; },
    set onmute(handler) { onmute = handler; },
    get onunmute() { return onunmute; },
    set onunmute(handler) { onunmute = handler; },
    
    stop: vi.fn().mockImplementation(() => {
      readyState = 'ended';
      if (onended) {
        onended.call(track, new Event('ended'));
      }
    }),
    
    clone: vi.fn().mockImplementation(() => {
      return createMockMediaStreamTrack({ ...config, id: undefined });
    }),
    
    getCapabilities: vi.fn().mockReturnValue({
      deviceId: settings.deviceId,
      groupId: settings.groupId,
      sampleRate: { min: 8000, max: 96000 },
      sampleSize: { min: 8, max: 32 },
      channelCount: { min: 1, max: 2 },
      echoCancellation: [true, false],
      noiseSuppression: [true, false],
      autoGainControl: [true, false]
    }),
    
    getConstraints: vi.fn().mockReturnValue({}),
    getSettings: vi.fn().mockReturnValue({ ...settings }),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),

    
    // Test helpers
    __simulateEnd: () => {
      readyState = 'ended';
      if (onended) {
        onended.call(track, new Event('ended'));
      }
    },
    
    __simulateMute: () => {
      muted = true;
      if (onmute) {
        onmute.call(track, new Event('mute'));
      }
    },
    
    __simulateUnmute: () => {
      muted = false;
      if (onunmute) {
        onunmute.call(track, new Event('unmute'));
      }
    }
  };

  return track;
}

// ============================================================================
// Mock MediaStream
// ============================================================================

/**
 * Mock implementation of MediaStream
 */
export interface MockMediaStreamInstance extends MediaStream {
  __addTrack: (track: MediaStreamTrack) => void;
  __removeTrack: (track: MediaStreamTrack) => void;
  __setActive: (active: boolean) => void;
}

/**
 * Creates a mock MediaStream
 * Validates: Requirement 6.1 - Request microphone access and begin capture
 */
export function createMockMediaStream(config: MockMediaStreamConfig = {}): MockMediaStreamInstance {
  const streamId = config.id ?? `mock-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let active = config.active ?? true;
  
  // Create tracks from config or default to one audio track
  const tracks: MediaStreamTrack[] = config.tracks 
    ? config.tracks.map(tc => createMockMediaStreamTrack(tc))
    : [createMockMediaStreamTrack()];


  // Event handlers
  let onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;
  let onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;

  const stream: MockMediaStreamInstance = {
    id: streamId,
    get active() { return active; },
    get onaddtrack() { return onaddtrack; },
    set onaddtrack(handler) { onaddtrack = handler; },
    get onremovetrack() { return onremovetrack; },
    set onremovetrack(handler) { onremovetrack = handler; },
    
    getTracks: vi.fn().mockImplementation(() => [...tracks]),
    getAudioTracks: vi.fn().mockImplementation(() => tracks.filter(t => t.kind === 'audio')),
    getVideoTracks: vi.fn().mockImplementation(() => tracks.filter(t => t.kind === 'video')),
    getTrackById: vi.fn().mockImplementation((id: string) => tracks.find(t => t.id === id) ?? null),
    
    addTrack: vi.fn().mockImplementation((track: MediaStreamTrack) => {
      if (!tracks.includes(track)) {
        tracks.push(track);
        if (onaddtrack) {
          onaddtrack.call(stream, new MediaStreamTrackEvent('addtrack', { track }));
        }
      }
    }),
    
    removeTrack: vi.fn().mockImplementation((track: MediaStreamTrack) => {
      const index = tracks.indexOf(track);
      if (index !== -1) {
        tracks.splice(index, 1);
        if (onremovetrack) {
          onremovetrack.call(stream, new MediaStreamTrackEvent('removetrack', { track }));
        }
      }
    }),
    
    clone: vi.fn().mockImplementation(() => {
      return createMockMediaStream({
        active,
        tracks: tracks.map(() => ({}))
      });
    }),
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),

    
    // Test helpers
    __addTrack: (track: MediaStreamTrack) => {
      if (!tracks.includes(track)) {
        tracks.push(track);
      }
    },
    
    __removeTrack: (track: MediaStreamTrack) => {
      const index = tracks.indexOf(track);
      if (index !== -1) {
        tracks.splice(index, 1);
      }
    },
    
    __setActive: (isActive: boolean) => {
      active = isActive;
    }
  };

  return stream;
}

// ============================================================================
// Mock AudioContext
// ============================================================================

/**
 * Mock implementation of AudioContext
 */
export interface MockAudioContextInstance {
  state: AudioContextState;
  sampleRate: number;
  currentTime: number;
  baseLatency: number;
  outputLatency: number;
  destination: AudioDestinationNode;
  listener: AudioListener;
  audioWorklet: AudioWorklet;
  onstatechange: ((this: AudioContext, ev: Event) => void) | null;
  
  resume: ReturnType<typeof vi.fn>;
  suspend: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  createMediaStreamSource: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  createAnalyser: ReturnType<typeof vi.fn>;
  createScriptProcessor: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  decodeAudioData: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  
  // Test helpers
  __setState: (state: AudioContextState) => void;
  __getCreatedNodes: () => { sources: number; gains: number; analysers: number; scriptProcessors: number };
}


/**
 * Creates a mock AudioContext
 * Validates: Requirement 6.2 - Stream chunks to the transcription service
 */
export function createMockAudioContext(config: MockAudioContextConfig = {}): MockAudioContextInstance {
  let state: AudioContextState = config.state ?? 'running';
  const sampleRate = config.sampleRate ?? 48000;
  let currentTime = 0;
  
  // Track created nodes for testing
  let sourcesCreated = 0;
  let gainsCreated = 0;
  let analysersCreated = 0;
  let scriptProcessorsCreated = 0;
  
  let onstatechange: ((this: AudioContext, ev: Event) => void) | null = null;

  // Mock destination
  const destination = {
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    maxChannelCount: 2,
    numberOfInputs: 1,
    numberOfOutputs: 0,
    context: null as unknown,
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true)
  } as unknown as AudioDestinationNode;

  // Mock listener
  const listener = {
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
  const audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined)
  } as unknown as AudioWorklet;


  const context: MockAudioContextInstance = {
    get state() { return state; },
    sampleRate,
    get currentTime() { return currentTime; },
    baseLatency: config.baseLatency ?? 0.01,
    outputLatency: config.outputLatency ?? 0.01,
    destination,
    listener,
    audioWorklet,
    get onstatechange() { return onstatechange; },
    set onstatechange(handler) { onstatechange = handler; },

    resume: vi.fn().mockImplementation(async () => {
      state = 'running';
      if (onstatechange) {
        onstatechange.call(context as unknown as AudioContext, new Event('statechange'));
      }
    }),

    suspend: vi.fn().mockImplementation(async () => {
      state = 'suspended';
      if (onstatechange) {
        onstatechange.call(context as unknown as AudioContext, new Event('statechange'));
      }
    }),

    close: vi.fn().mockImplementation(async () => {
      state = 'closed';
      if (onstatechange) {
        onstatechange.call(context as unknown as AudioContext, new Event('statechange'));
      }
    }),

    createMediaStreamSource: vi.fn().mockImplementation((mediaStream: MediaStream) => {
      sourcesCreated++;
      return {
        mediaStream,
        context,
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
    }),


    createGain: vi.fn().mockImplementation(() => {
      gainsCreated++;
      return {
        gain: { value: 1, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
        context,
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
    }),

    createAnalyser: vi.fn().mockImplementation(() => {
      analysersCreated++;
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
        context,
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
    }),


    createScriptProcessor: vi.fn().mockImplementation((
      bufferSize?: number,
      numberOfInputChannels?: number,
      numberOfOutputChannels?: number
    ) => {
      scriptProcessorsCreated++;
      return {
        bufferSize: bufferSize || 4096,
        onaudioprocess: null,
        context,
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
    }),

    createBuffer: vi.fn().mockImplementation((
      numberOfChannels: number,
      length: number,
      bufferSampleRate: number
    ) => {
      const channelData = new Float32Array(length);
      return {
        sampleRate: bufferSampleRate,
        length,
        duration: length / bufferSampleRate,
        numberOfChannels,
        getChannelData: vi.fn().mockReturnValue(channelData),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn()
      } as unknown as AudioBuffer;
    }),

    decodeAudioData: vi.fn().mockImplementation(async (audioData: ArrayBuffer) => {
      const length = audioData.byteLength / 2;
      return context.createBuffer(1, length, sampleRate);
    }),

    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),


    // Test helpers
    __setState: (newState: AudioContextState) => {
      state = newState;
    },

    __getCreatedNodes: () => ({
      sources: sourcesCreated,
      gains: gainsCreated,
      analysers: analysersCreated,
      scriptProcessors: scriptProcessorsCreated
    })
  };

  // Set context reference on destination
  (destination as { context: unknown }).context = context;

  return context;
}

// ============================================================================
// Mock AudioWorkletNode
// ============================================================================

/**
 * Mock implementation of AudioWorkletNode
 * Validates: Requirement 6.2 - Stream chunks to the transcription service
 */
export interface MockAudioWorkletNodeInstance {
  port: MessagePort;
  parameters: AudioParamMap;
  context: BaseAudioContext;
  numberOfInputs: number;
  numberOfOutputs: number;
  channelCount: number;
  channelCountMode: ChannelCountMode;
  channelInterpretation: ChannelInterpretation;
  onprocessorerror: ((this: AudioWorkletNode, ev: Event) => void) | null;
  
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  
  // Test helpers
  __simulateAudioChunk: (pcmData: Int16Array) => void;
  __simulateError: (error: Error) => void;
  __getMessagesSent: () => unknown[];
}

/**
 * Creates a mock AudioWorkletNode
 */
export function createMockAudioWorkletNode(
  context: BaseAudioContext,
  name: string,
  config: MockAudioWorkletNodeConfig = {}
): MockAudioWorkletNodeInstance {
  const messagesSent: unknown[] = [];
  let onprocessorerror: ((this: AudioWorkletNode, ev: Event) => void) | null = null;
  
  // Mock MessagePort
  const port = {
    postMessage: vi.fn().mockImplementation((message: unknown) => {
      messagesSent.push(message);
    }),
    onmessage: null,
    onmessageerror: null,
    start: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true)
  } as unknown as MessagePort;

  const node: MockAudioWorkletNodeInstance = {
    port,
    parameters: new Map() as unknown as AudioParamMap,
    context,
    numberOfInputs: config.numberOfInputs ?? 1,
    numberOfOutputs: config.numberOfOutputs ?? 1,
    channelCount: config.channelCount ?? 1,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    get onprocessorerror() { return onprocessorerror; },
    set onprocessorerror(handler) { onprocessorerror = handler; },
    
    connect: vi.fn(),
    disconnect: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),
    
    // Test helpers
    __simulateAudioChunk: (pcmData: Int16Array) => {
      if (port.onmessage) {
        const event = new MessageEvent('message', {
          data: { type: 'audio-chunk', pcmData }
        });
        port.onmessage.call(port, event);
      }
    },
    
    __simulateError: (error: Error) => {
      if (onprocessorerror) {
        const event = new ErrorEvent('processorerror', { error });
        onprocessorerror.call(node as unknown as AudioWorkletNode, event);
      }
    },
    
    __getMessagesSent: () => [...messagesSent]
  };

  return node;
}

// ============================================================================
// Mock MediaDevices
// ============================================================================

/**
 * Mock implementation of MediaDevices
 */
export interface MockMediaDevicesInstance {
  getUserMedia: ReturnType<typeof vi.fn>;
  enumerateDevices: ReturnType<typeof vi.fn>;
  getDisplayMedia: ReturnType<typeof vi.fn>;
  getSupportedConstraints: ReturnType<typeof vi.fn>;
  ondevicechange: ((this: MediaDevices, ev: Event) => void) | null;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  
  // Test helpers
  __setPermissionGranted: (granted: boolean) => void;
  __addDevice: (device: MockMediaDeviceInfo) => void;
  __removeDevice: (deviceId: string) => void;
  __simulateDeviceChange: () => void;
  __getActiveStreams: () => MockMediaStreamInstance[];
}

/**
 * Creates a mock MediaDevices
 * Validates: Requirements 6.1, 6.5 - Microphone access and error handling
 */
export function createMockMediaDevices(
  options: Pick<MockAudioAPIOptions, 'permissionGranted' | 'devices'> = {}
): MockMediaDevicesInstance {
  let permissionGranted = options.permissionGranted ?? true;
  let devices: MockMediaDeviceInfo[] = options.devices ?? createDefaultDevices();
  const activeStreams: MockMediaStreamInstance[] = [];
  let ondevicechange: ((this: MediaDevices, ev: Event) => void) | null = null;

  const mediaDevices: MockMediaDevicesInstance = {
    /**
     * Request microphone access
     * Validates: Requirement 6.1 - Request microphone access and begin capture
     * Validates: Requirement 6.5 - Emit error callback if access denied
     */
    getUserMedia: vi.fn().mockImplementation(async (constraints: MediaStreamConstraints) => {
      if (!permissionGranted) {
        throw new DOMException('Permission denied', 'NotAllowedError');
      }
      
      const stream = createMockMediaStream();
      activeStreams.push(stream);
      return stream;
    }),

    /**
     * Enumerate available audio devices
     */
    enumerateDevices: vi.fn().mockImplementation(async () => {
      return [...devices];
    }),

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

    get ondevicechange() { return ondevicechange; },
    set ondevicechange(handler) { ondevicechange = handler; },
    
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn().mockReturnValue(true),

    // Test helpers
    __setPermissionGranted: (granted: boolean) => {
      permissionGranted = granted;
    },

    __addDevice: (device: MockMediaDeviceInfo) => {
      devices.push(device);
    },

    __removeDevice: (deviceId: string) => {
      devices = devices.filter(d => d.deviceId !== deviceId);
    },

    __simulateDeviceChange: () => {
      if (ondevicechange) {
        ondevicechange.call(mediaDevices as unknown as MediaDevices, new Event('devicechange'));
      }
    },

    __getActiveStreams: () => [...activeStreams]
  };

  return mediaDevices;
}

// ============================================================================
// Complete Mock Audio API
// ============================================================================

/**
 * Complete mock audio API interface
 */
export interface MockAudioAPI {
  mediaDevices: MockMediaDevicesInstance;
  AudioContext: typeof MockAudioContextClass;
  AudioWorkletNode: typeof MockAudioWorkletNodeClass;
  
  // Test helpers
  __reset: () => void;
  __getState: () => MockAudioAPIState;
  __setState: (state: Partial<MockAudioAPIState>) => void;
}

/**
 * Mock AudioContext class for global installation
 */
class MockAudioContextClass {
  private instance: MockAudioContextInstance;

  constructor(options?: AudioContextOptions) {
    this.instance = createMockAudioContext({
      sampleRate: options?.sampleRate,
      state: 'running'
    });
    
    // Bind methods after instance is created
    this.resume = this.instance.resume;
    this.suspend = this.instance.suspend;
    this.close = this.instance.close;
    this.createMediaStreamSource = this.instance.createMediaStreamSource;
    this.createGain = this.instance.createGain;
    this.createAnalyser = this.instance.createAnalyser;
    this.createScriptProcessor = this.instance.createScriptProcessor;
    this.createBuffer = this.instance.createBuffer;
    this.decodeAudioData = this.instance.decodeAudioData;
    this.addEventListener = this.instance.addEventListener;
    this.removeEventListener = this.instance.removeEventListener;
    this.dispatchEvent = this.instance.dispatchEvent;
  }

  get state() { return this.instance.state; }
  get sampleRate() { return this.instance.sampleRate; }
  get currentTime() { return this.instance.currentTime; }
  get baseLatency() { return this.instance.baseLatency; }
  get outputLatency() { return this.instance.outputLatency; }
  get destination() { return this.instance.destination; }
  get listener() { return this.instance.listener; }
  get audioWorklet() { return this.instance.audioWorklet; }
  get onstatechange() { return this.instance.onstatechange; }
  set onstatechange(handler) { this.instance.onstatechange = handler; }

  resume!: MockAudioContextInstance['resume'];
  suspend!: MockAudioContextInstance['suspend'];
  close!: MockAudioContextInstance['close'];
  createMediaStreamSource!: MockAudioContextInstance['createMediaStreamSource'];
  createGain!: MockAudioContextInstance['createGain'];
  createAnalyser!: MockAudioContextInstance['createAnalyser'];
  createScriptProcessor!: MockAudioContextInstance['createScriptProcessor'];
  createBuffer!: MockAudioContextInstance['createBuffer'];
  decodeAudioData!: MockAudioContextInstance['decodeAudioData'];
  addEventListener!: MockAudioContextInstance['addEventListener'];
  removeEventListener!: MockAudioContextInstance['removeEventListener'];
  dispatchEvent!: MockAudioContextInstance['dispatchEvent'];
}

/**
 * Mock AudioWorkletNode class for global installation
 */
class MockAudioWorkletNodeClass {
  private instance: MockAudioWorkletNodeInstance;

  constructor(context: BaseAudioContext, name: string, options?: AudioWorkletNodeOptions) {
    this.instance = createMockAudioWorkletNode(context, name, {
      numberOfInputs: options?.numberOfInputs,
      numberOfOutputs: options?.numberOfOutputs,
      channelCount: options?.outputChannelCount?.[0]
    });
    
    // Bind methods after instance is created
    this.connect = this.instance.connect;
    this.disconnect = this.instance.disconnect;
    this.addEventListener = this.instance.addEventListener;
    this.removeEventListener = this.instance.removeEventListener;
    this.dispatchEvent = this.instance.dispatchEvent;
  }

  get port() { return this.instance.port; }
  get parameters() { return this.instance.parameters; }
  get context() { return this.instance.context; }
  get numberOfInputs() { return this.instance.numberOfInputs; }
  get numberOfOutputs() { return this.instance.numberOfOutputs; }
  get channelCount() { return this.instance.channelCount; }
  get channelCountMode() { return this.instance.channelCountMode; }
  get channelInterpretation() { return this.instance.channelInterpretation; }
  get onprocessorerror() { return this.instance.onprocessorerror; }
  set onprocessorerror(handler) { this.instance.onprocessorerror = handler; }

  connect!: MockAudioWorkletNodeInstance['connect'];
  disconnect!: MockAudioWorkletNodeInstance['disconnect'];
  addEventListener!: MockAudioWorkletNodeInstance['addEventListener'];
  removeEventListener!: MockAudioWorkletNodeInstance['removeEventListener'];
  dispatchEvent!: MockAudioWorkletNodeInstance['dispatchEvent'];
}

/**
 * Creates a complete mock audio API
 * 
 * @param options - Configuration options
 * @returns Mock audio API
 * 
 * @example
 * ```typescript
 * const audioAPI = createMockAudioAPI();
 * 
 * // Request microphone access
 * const stream = await audioAPI.mediaDevices.getUserMedia({ audio: true });
 * 
 * // Create audio context
 * const context = new audioAPI.AudioContext();
 * const source = context.createMediaStreamSource(stream);
 * 
 * // Simulate permission denial
 * audioAPI.mediaDevices.__setPermissionGranted(false);
 * await audioAPI.mediaDevices.getUserMedia({ audio: true }); // Throws NotAllowedError
 * ```
 */
export function createMockAudioAPI(options: MockAudioAPIOptions = {}): MockAudioAPI {
  const mediaDevices = createMockMediaDevices({
    permissionGranted: options.permissionGranted,
    devices: options.devices
  });

  const state: MockAudioAPIState = {
    permissionGranted: options.permissionGranted ?? true,
    devices: options.devices ?? createDefaultDevices(),
    activeStreams: new Map(),
    activeContexts: new Map(),
    audioChunksGenerated: 0
  };

  return {
    mediaDevices,
    AudioContext: MockAudioContextClass,
    AudioWorkletNode: MockAudioWorkletNodeClass,

    // Test helpers
    __reset: () => {
      state.permissionGranted = options.permissionGranted ?? true;
      state.devices = options.devices ?? createDefaultDevices();
      state.activeStreams.clear();
      state.activeContexts.clear();
      state.audioChunksGenerated = 0;
      
      mediaDevices.__setPermissionGranted(state.permissionGranted);
    },

    __getState: () => ({ ...state }),

    __setState: (newState: Partial<MockAudioAPIState>) => {
      if (newState.permissionGranted !== undefined) {
        state.permissionGranted = newState.permissionGranted;
        mediaDevices.__setPermissionGranted(newState.permissionGranted);
      }
      if (newState.devices !== undefined) {
        state.devices = [...newState.devices];
      }
      if (newState.audioChunksGenerated !== undefined) {
        state.audioChunksGenerated = newState.audioChunksGenerated;
      }
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates default audio devices for testing
 */
export function createDefaultDevices(): MockMediaDeviceInfo[] {
  return [
    {
      deviceId: 'default',
      groupId: 'default-group',
      kind: 'audioinput',
      label: 'Default Microphone',
      toJSON: () => ({
        deviceId: 'default',
        groupId: 'default-group',
        kind: 'audioinput',
        label: 'Default Microphone'
      })
    },
    {
      deviceId: 'mock-mic-1',
      groupId: 'mock-group-1',
      kind: 'audioinput',
      label: 'Mock USB Microphone',
      toJSON: () => ({
        deviceId: 'mock-mic-1',
        groupId: 'mock-group-1',
        kind: 'audioinput',
        label: 'Mock USB Microphone'
      })
    },
    {
      deviceId: 'mock-speaker-1',
      groupId: 'mock-group-1',
      kind: 'audiooutput',
      label: 'Mock Speakers',
      toJSON: () => ({
        deviceId: 'mock-speaker-1',
        groupId: 'mock-group-1',
        kind: 'audiooutput',
        label: 'Mock Speakers'
      })
    }
  ];
}

/**
 * Creates a mock audio buffer with silence
 * 
 * @param durationMs - Duration in milliseconds
 * @param sampleRate - Sample rate (default: 16000)
 * @returns ArrayBuffer containing PCM audio data
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
 * @returns ArrayBuffer containing PCM audio data with noise
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

/**
 * Installs the mock audio API globally
 * 
 * @param mock - The mock to install (creates a new one if not provided)
 * @returns The installed mock
 */
export function installMockAudioAPI(mock?: MockAudioAPI): MockAudioAPI {
  const audioAPI = mock ?? createMockAudioAPI();
  
  Object.defineProperty(navigator, 'mediaDevices', {
    value: audioAPI.mediaDevices,
    writable: true,
    configurable: true
  });
  
  Object.defineProperty(window, 'AudioContext', {
    value: audioAPI.AudioContext,
    writable: true,
    configurable: true
  });
  
  Object.defineProperty(window, 'webkitAudioContext', {
    value: audioAPI.AudioContext,
    writable: true,
    configurable: true
  });
  
  Object.defineProperty(window, 'AudioWorkletNode', {
    value: audioAPI.AudioWorkletNode,
    writable: true,
    configurable: true
  });
  
  return audioAPI;
}

/**
 * Removes the mock audio API from globals
 */
export function uninstallMockAudioAPI(): void {
  // Note: Cannot truly delete navigator.mediaDevices, but can set to undefined
  Object.defineProperty(navigator, 'mediaDevices', {
    value: undefined,
    writable: true,
    configurable: true
  });
  
  if ('AudioContext' in window) {
    delete (window as { AudioContext?: unknown }).AudioContext;
  }
  
  if ('webkitAudioContext' in window) {
    delete (window as { webkitAudioContext?: unknown }).webkitAudioContext;
  }
  
  if ('AudioWorkletNode' in window) {
    delete (window as { AudioWorkletNode?: unknown }).AudioWorkletNode;
  }
}

// ============================================================================
// Pre-configured Mock Factories
// ============================================================================

/**
 * Creates a mock with permission denied (for error testing)
 */
export function createPermissionDeniedMock(): MockAudioAPI {
  return createMockAudioAPI({
    permissionGranted: false
  });
}

/**
 * Creates a mock with multiple audio devices
 */
export function createMultiDeviceMock(): MockAudioAPI {
  const devices: MockMediaDeviceInfo[] = [
    ...createDefaultDevices(),
    {
      deviceId: 'mock-mic-2',
      groupId: 'mock-group-2',
      kind: 'audioinput',
      label: 'Mock Bluetooth Headset',
      toJSON: () => ({
        deviceId: 'mock-mic-2',
        groupId: 'mock-group-2',
        kind: 'audioinput',
        label: 'Mock Bluetooth Headset'
      })
    }
  ];
  
  return createMockAudioAPI({ devices });
}

/**
 * Creates a mock with no audio devices (for error testing)
 */
export function createNoDevicesMock(): MockAudioAPI {
  return createMockAudioAPI({
    devices: []
  });
}

// ============================================================================
// Default Export
// ============================================================================

export default createMockAudioAPI;
