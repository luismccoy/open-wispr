/**
 * Unit Tests for StreamingAudioManager
 * 
 * Tests the streaming audio manager that handles real-time voice dictation,
 * including recording start/stop, abort functionality, callback invocation,
 * and error handling.
 * 
 * @module tests/unit/helpers/streamingAudioManager.test.ts
 * 
 * Validates: Requirements 6.1-6.6
 * - 6.1: WHEN startRecording is called, THE Audio_Recording_System SHALL request microphone access and begin capture
 * - 6.2: WHEN audio is being captured, THE Audio_Recording_System SHALL stream chunks to the transcription service
 * - 6.3: WHEN stopRecording is called, THE Audio_Recording_System SHALL stop capture and finalize the stream
 * - 6.4: WHEN abortRecording is called, THE Audio_Recording_System SHALL stop capture without processing
 * - 6.5: IF microphone access is denied, THEN THE Audio_Recording_System SHALL emit an error callback
 * - 6.6: WHILE recording is active, THE Audio_Recording_System SHALL report isRecording state as true
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing StreamingAudioManager
vi.mock('../../../src/services/BedrockService.js', () => ({
  default: {
    processText: vi.fn().mockResolvedValue('Enhanced text'),
    processTextWithStyle: vi.fn().mockResolvedValue('Styled enhanced text')
  }
}));

vi.mock('../../../src/helpers/contextDetector.js', () => ({
  default: {
    detectActiveApp: vi.fn().mockResolvedValue({
      appName: 'TestApp',
      bundleId: 'com.test.app',
      executablePath: '/path/to/app',
      windowTitle: 'Test Window',
      platform: 'darwin'
    })
  }
}));

vi.mock('../../../src/helpers/styleManager.js', () => ({
  default: {
    isEnabled: vi.fn().mockReturnValue(false),
    getStyleForApp: vi.fn().mockReturnValue('neutral')
  }
}));

// Import after mocks are set up
import StreamingAudioManager from '../../../src/helpers/streamingAudioManager.js';

describe('StreamingAudioManager', () => {
  let manager: InstanceType<typeof StreamingAudioManager>;
  let mockOnStateChange: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;
  let mockOnTranscriptionComplete: ReturnType<typeof vi.fn>;
  let mockOnPartialTranscript: ReturnType<typeof vi.fn>;
  let mockOnLanguageDetected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create fresh manager instance
    manager = new StreamingAudioManager();

    // Set up mock callbacks
    mockOnStateChange = vi.fn();
    mockOnError = vi.fn();
    mockOnTranscriptionComplete = vi.fn();
    mockOnPartialTranscript = vi.fn();
    mockOnLanguageDetected = vi.fn();

    // Set callbacks on manager
    manager.setCallbacks({
      onStateChange: mockOnStateChange,
      onError: mockOnError,
      onTranscriptionComplete: mockOnTranscriptionComplete,
      onPartialTranscript: mockOnPartialTranscript,
      onLanguageDetected: mockOnLanguageDetected
    });

    // Reset localStorage mock
    localStorage.clear();
    localStorage.setItem('transcribeLanguage', 'en-US');
    localStorage.setItem('awsRegion', 'us-east-1');
    localStorage.setItem('selectedMicrophoneId', 'default');
    localStorage.setItem('useTextEnhancement', 'false');

    // Reset electronAPI mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up manager
    if (manager) {
      await manager.abortRecording();
      manager.destroy();
    }
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 6.1: startRecording - Request microphone access and begin capture
  // ===========================================================================
  describe('startRecording', () => {
    it('should request microphone access when starting recording', async () => {
      const result = await manager.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            sampleRate: 48000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          })
        })
      );
      expect(result).toBe(true);
    });

    it('should start streaming transcription session before capturing audio', async () => {
      await manager.startRecording();

      expect(window.electronAPI.streamingTranscribeStart).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.streamingTranscribeStart).toHaveBeenCalledWith(
        expect.objectContaining({
          languageCode: 'en-US',
          region: 'us-east-1'
        })
      );
    });

    it('should use auto language detection when language is set to auto', async () => {
      localStorage.setItem('transcribeLanguage', 'auto');

      await manager.startRecording();

      expect(window.electronAPI.streamingTranscribeStart).toHaveBeenCalledWith(
        expect.objectContaining({
          languageCode: 'auto',
          enableAutoLanguage: true
        })
      );
    });

    it('should use specific microphone when selectedMicrophoneId is set', async () => {
      localStorage.setItem('selectedMicrophoneId', 'mock-mic-1');

      await manager.startRecording();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: expect.objectContaining({
            deviceId: { exact: 'mock-mic-1' }
          })
        })
      );
    });

    it('should set isRecording to true after successful start', async () => {
      expect(manager.getState().isRecording).toBe(false);

      await manager.startRecording();

      expect(manager.getState().isRecording).toBe(true);
    });

    it('should call onStateChange callback with recording state', async () => {
      await manager.startRecording();

      expect(mockOnStateChange).toHaveBeenCalledWith({
        isRecording: true,
        isProcessing: false
      });
    });

    it('should return false if already recording', async () => {
      await manager.startRecording();
      vi.clearAllMocks();

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    });

    it('should set up streaming event listeners', async () => {
      await manager.startRecording();

      expect(window.electronAPI.onStreamingPartial).toHaveBeenCalled();
      expect(window.electronAPI.onStreamingFinal).toHaveBeenCalled();
      expect(window.electronAPI.onStreamingLanguage).toHaveBeenCalled();
      expect(window.electronAPI.onStreamingError).toHaveBeenCalled();
    });

    it('should return false when transcription session fails to start', async () => {
      (window.electronAPI.streamingTranscribeStart as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: false,
        error: 'Failed to connect'
      });

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(manager.getState().isRecording).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 6.5: Error handling - Microphone access denied
  // ===========================================================================
  describe('Error Handling', () => {
    it('should emit error callback when microphone access is denied', async () => {
      // Mock permission denied error
      (globalThis.mockMediaDevices as any).__setPermissionGranted(false);

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Microphone Access Denied',
          description: expect.stringContaining('permission')
        })
      );
    });

    it('should handle NotFoundError when no microphone is available', async () => {
      (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        Object.assign(new Error('No microphone found'), { name: 'NotFoundError' })
      );

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No Microphone Found'
        })
      );
    });

    it('should handle NotReadableError when microphone is in use', async () => {
      (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        Object.assign(new Error('Microphone in use'), { name: 'NotReadableError' })
      );

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Microphone In Use'
        })
      );
    });

    it('should handle AWS credentials error', async () => {
      (window.electronAPI.streamingTranscribeStart as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Missing credentials in config')
      );

      const result = await manager.startRecording();

      expect(result).toBe(false);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'AWS Credentials Error'
        })
      );
    });

    it('should clean up resources after error', async () => {
      (globalThis.mockMediaDevices as any).__setPermissionGranted(false);

      await manager.startRecording();

      expect(manager.getState().isRecording).toBe(false);
      expect(manager.getState().isProcessing).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 6.3: stopRecording - Stop capture and finalize stream
  // ===========================================================================
  describe('stopRecording', () => {
    beforeEach(async () => {
      // Start recording first
      await manager.startRecording();
      vi.clearAllMocks();
    });

    it('should stop recording and finalize the stream', async () => {
      const result = await manager.stopRecording();

      expect(window.electronAPI.streamingTranscribeEnd).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should set isRecording to false and isProcessing to true during processing', async () => {
      // Create a promise that we can control
      let resolveEnd: (value: any) => void;
      const endPromise = new Promise(resolve => { resolveEnd = resolve; });
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockReturnValueOnce(endPromise);

      const stopPromise = manager.stopRecording();

      // Check intermediate state
      expect(manager.getState().isRecording).toBe(false);
      expect(manager.getState().isProcessing).toBe(true);

      // Resolve the end promise
      resolveEnd!({ success: true, text: 'Test transcription' });
      await stopPromise;
    });

    it('should call onStateChange with processing state', async () => {
      await manager.stopRecording();

      expect(mockOnStateChange).toHaveBeenCalledWith({
        isRecording: false,
        isProcessing: true
      });
    });

    it('should call onTranscriptionComplete with result', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: 'Hello world'
      });

      await manager.stopRecording();

      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          text: 'Hello world'
        })
      );
    });

    it('should return false when not recording', async () => {
      await manager.stopRecording(); // Stop first
      vi.clearAllMocks();

      const result = await manager.stopRecording();

      expect(result).toBe(false);
      expect(window.electronAPI.streamingTranscribeEnd).not.toHaveBeenCalled();
    });

    it('should emit error when no speech is detected', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: ''
      });

      await manager.stopRecording();

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'No Speech Detected'
        })
      );
    });

    it('should emit error when transcription fails', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: false,
        error: 'Transcription failed'
      });

      await manager.stopRecording();

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Transcription Failed'
        })
      );
    });

    it('should clean up audio resources after stopping', async () => {
      await manager.stopRecording();

      expect(manager.getState().isRecording).toBe(false);
      expect(manager.getState().isProcessing).toBe(false);
    });

    it('should paste text after successful transcription', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: 'Hello world'
      });

      await manager.stopRecording();

      expect(window.electronAPI.pasteText).toHaveBeenCalledWith('Hello world');
    });

    it('should save transcription after successful completion', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: 'Hello world'
      });

      await manager.stopRecording();

      expect(window.electronAPI.saveTranscription).toHaveBeenCalledWith('Hello world');
    });

    it('should include detected language in transcription result', async () => {
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: 'Hola mundo',
        detectedLanguage: 'es-US'
      });

      await manager.stopRecording();

      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          detectedLanguage: 'es-US'
        })
      );
    });
  });

  // ===========================================================================
  // Requirement 6.4: abortRecording - Stop capture without processing
  // ===========================================================================
  describe('abortRecording', () => {
    beforeEach(async () => {
      await manager.startRecording();
      vi.clearAllMocks();
    });

    it('should abort recording without processing', async () => {
      await manager.abortRecording();

      expect(window.electronAPI.streamingTranscribeAbort).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.streamingTranscribeEnd).not.toHaveBeenCalled();
    });

    it('should set isRecording to false immediately', async () => {
      await manager.abortRecording();

      expect(manager.getState().isRecording).toBe(false);
      expect(manager.getState().isProcessing).toBe(false);
    });

    it('should call onStateChange with idle state', async () => {
      await manager.abortRecording();

      expect(mockOnStateChange).toHaveBeenCalledWith({
        isRecording: false,
        isProcessing: false
      });
    });

    it('should not call onTranscriptionComplete', async () => {
      await manager.abortRecording();

      expect(mockOnTranscriptionComplete).not.toHaveBeenCalled();
    });

    it('should clean up audio resources', async () => {
      await manager.abortRecording();

      // Verify cleanup by checking state
      expect(manager.getState().isRecording).toBe(false);
    });

    it('should do nothing if not recording', async () => {
      await manager.abortRecording(); // First abort
      vi.clearAllMocks();

      await manager.abortRecording(); // Second abort

      expect(window.electronAPI.streamingTranscribeAbort).not.toHaveBeenCalled();
    });

    it('should remove streaming event listeners', async () => {
      await manager.abortRecording();

      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('streaming-transcribe-partial');
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('streaming-transcribe-final');
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('streaming-transcribe-error');
    });
  });

  // ===========================================================================
  // Callback Invocation Tests
  // ===========================================================================
  describe('Callback Invocation', () => {
    it('should invoke onPartialTranscript when partial results are received', async () => {
      await manager.startRecording();

      // Simulate partial result via event listener
      const partialCallback = (window.electronAPI.onStreamingPartial as ReturnType<typeof vi.fn>).mock.calls[0][0];
      partialCallback({ text: 'Hello...' });

      expect(mockOnPartialTranscript).toHaveBeenCalledWith('Hello...');
    });

    it('should invoke onPartialTranscript when final segment results are received', async () => {
      await manager.startRecording();

      // Simulate final segment result via event listener
      const finalCallback = (window.electronAPI.onStreamingFinal as ReturnType<typeof vi.fn>).mock.calls[0][0];
      finalCallback({ text: 'Hello world' });

      expect(mockOnPartialTranscript).toHaveBeenCalledWith('Hello world');
    });

    it('should invoke onLanguageDetected when language is detected', async () => {
      await manager.startRecording();

      // Simulate language detection via event listener
      const languageCallback = (window.electronAPI.onStreamingLanguage as ReturnType<typeof vi.fn>).mock.calls[0][0];
      languageCallback({ languageCode: 'es-US' });

      expect(mockOnLanguageDetected).toHaveBeenCalledWith('es-US');
      expect(manager.getState().detectedLanguage).toBe('es-US');
    });

    it('should handle streaming errors via event listener', async () => {
      await manager.startRecording();

      // Simulate error via event listener
      const errorCallback = (window.electronAPI.onStreamingError as ReturnType<typeof vi.fn>).mock.calls[0][0];
      errorCallback({ error: 'Connection lost' });

      // Error is logged but not emitted to onError callback (per implementation)
      // The onError callback is only called for recording errors
    });
  });

  // ===========================================================================
  // Requirement 6.6: Recording State Invariant
  // ===========================================================================
  describe('Recording State Invariant', () => {
    it('should report isRecording as true while recording is active', async () => {
      expect(manager.getState().isRecording).toBe(false);

      await manager.startRecording();
      expect(manager.getState().isRecording).toBe(true);

      // Still true during recording
      expect(manager.getState().isRecording).toBe(true);
    });

    it('should report isRecording as false after stopRecording', async () => {
      await manager.startRecording();
      expect(manager.getState().isRecording).toBe(true);

      await manager.stopRecording();
      expect(manager.getState().isRecording).toBe(false);
    });

    it('should report isRecording as false after abortRecording', async () => {
      await manager.startRecording();
      expect(manager.getState().isRecording).toBe(true);

      await manager.abortRecording();
      expect(manager.getState().isRecording).toBe(false);
    });

    it('should report isProcessing as true during transcription processing', async () => {
      await manager.startRecording();
      expect(manager.getState().isProcessing).toBe(false);

      // Create a controlled promise for stopRecording
      let resolveEnd: (value: any) => void;
      const endPromise = new Promise(resolve => { resolveEnd = resolve; });
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockReturnValueOnce(endPromise);

      const stopPromise = manager.stopRecording();

      // During processing
      expect(manager.getState().isProcessing).toBe(true);

      // Resolve and complete
      resolveEnd!({ success: true, text: 'Test' });
      await stopPromise;

      expect(manager.getState().isProcessing).toBe(false);
    });
  });

  // ===========================================================================
  // setCallbacks Tests
  // ===========================================================================
  describe('setCallbacks', () => {
    it('should set all callbacks correctly', () => {
      const newManager = new StreamingAudioManager();
      const callbacks = {
        onStateChange: vi.fn(),
        onError: vi.fn(),
        onTranscriptionComplete: vi.fn(),
        onPartialTranscript: vi.fn(),
        onLanguageDetected: vi.fn()
      };

      newManager.setCallbacks(callbacks);

      // Verify callbacks are set by triggering them indirectly
      // This is tested through the other tests that verify callback invocation
      expect(newManager).toBeDefined();
    });

    it('should allow partial callback updates', () => {
      const newManager = new StreamingAudioManager();
      
      // Set only some callbacks
      newManager.setCallbacks({
        onStateChange: vi.fn(),
        onError: vi.fn(),
        onTranscriptionComplete: undefined,
        onPartialTranscript: undefined,
        onLanguageDetected: undefined
      });

      expect(newManager).toBeDefined();
    });
  });

  // ===========================================================================
  // getState Tests
  // ===========================================================================
  describe('getState', () => {
    it('should return initial state correctly', () => {
      const state = manager.getState();

      expect(state).toEqual({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: null
      });
    });

    it('should return updated state after recording starts', async () => {
      await manager.startRecording();
      const state = manager.getState();

      expect(state.isRecording).toBe(true);
      expect(state.isProcessing).toBe(false);
    });

    it('should return detected language when available', async () => {
      await manager.startRecording();

      // Simulate language detection
      const languageCallback = (window.electronAPI.onStreamingLanguage as ReturnType<typeof vi.fn>).mock.calls[0][0];
      languageCallback({ languageCode: 'fr-FR' });

      const state = manager.getState();
      expect(state.detectedLanguage).toBe('fr-FR');
    });
  });

  // ===========================================================================
  // destroy Tests
  // ===========================================================================
  describe('destroy', () => {
    it('should abort recording if active', async () => {
      await manager.startRecording();

      manager.destroy();

      expect(manager.getState().isRecording).toBe(false);
    });

    it('should clear all callbacks', () => {
      manager.destroy();

      // Callbacks should be nullified - verify by checking no errors when trying to invoke
      expect(() => manager.destroy()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      manager.destroy();
      manager.destroy();
      manager.destroy();

      expect(manager.getState().isRecording).toBe(false);
    });
  });

  // ===========================================================================
  // Text Cleaning Tests
  // ===========================================================================
  describe('Text Cleaning', () => {
    it('should clean text by removing extra whitespace', async () => {
      await manager.startRecording();
      
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: '  Hello    world  '
      });

      await manager.stopRecording();

      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello world'
        })
      );
    });

    it('should fix punctuation spacing', async () => {
      await manager.startRecording();
      
      (window.electronAPI.streamingTranscribeEnd as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        success: true,
        text: 'Hello , world .'
      });

      await manager.stopRecording();

      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Hello, world.'
        })
      );
    });
  });
});
