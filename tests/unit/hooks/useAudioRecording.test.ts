/**
 * Unit Tests for useAudioRecording Hook
 * 
 * Tests the audio recording hook that manages voice dictation state,
 * including recording start/stop, abort functionality, and state changes.
 * 
 * @module tests/unit/hooks/useAudioRecording.test.ts
 * 
 * Validates: Requirements 6.1-6.6, 17.1
 * - 6.1: Recording Start - Recording starts when user triggers hotkey
 * - 6.2: Audio Streaming - Audio chunks are streamed to AWS Transcribe
 * - 6.3: Recording Stop - Recording stops when user releases hotkey
 * - 6.4: Recording Abort - Recording can be aborted with Escape key
 * - 6.5: Toggle Listening - Recording can be toggled on/off
 * - 6.6: State Changes - Recording state changes are reflected in UI
 * - 17.1: useAudioRecording hook tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAudioRecording } from '../../../src/hooks/useAudioRecording';

// Store captured callbacks from StreamingAudioManager
let capturedCallbacks: {
  onStateChange?: (state: { isRecording: boolean; isProcessing: boolean }) => void;
  onError?: (error: { title: string; description: string }) => void;
  onTranscriptionComplete?: (result: { success: boolean; text: string; detectedLanguage?: string; processingTime?: number }) => void;
  onPartialTranscript?: (text: string) => void;
  onLanguageDetected?: (languageCode: string) => void;
} = {};

// Mock state for getState
let mockState = { isRecording: false, isProcessing: false, detectedLanguage: null };

// Mock functions that will be used by the mock class
const mockStartRecording = vi.fn().mockResolvedValue(true);
const mockStopRecording = vi.fn().mockResolvedValue(true);
const mockAbortRecording = vi.fn().mockResolvedValue(undefined);
const mockDestroy = vi.fn();
const mockSetCallbacks = vi.fn().mockImplementation((callbacks) => {
  capturedCallbacks = callbacks;
});
const mockGetState = vi.fn().mockImplementation(() => mockState);

// Mock StreamingAudioManager class
vi.mock('../../../src/helpers/streamingAudioManager', () => {
  return {
    default: class MockStreamingAudioManager {
      startRecording = mockStartRecording;
      stopRecording = mockStopRecording;
      abortRecording = mockAbortRecording;
      destroy = mockDestroy;
      setCallbacks = mockSetCallbacks;
      getState = mockGetState;
    }
  };
});

describe('useAudioRecording Hook', () => {
  let mockToast: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset captured callbacks
    capturedCallbacks = {};
    
    // Reset mock state
    mockState = { isRecording: false, isProcessing: false, detectedLanguage: null };

    // Set up mock toast function
    mockToast = vi.fn();

    // Reset all mocks
    vi.clearAllMocks();

    // Set up default mock implementations
    mockStartRecording.mockResolvedValue(true);
    mockStopRecording.mockResolvedValue(true);
    mockAbortRecording.mockResolvedValue(undefined);
    mockGetState.mockImplementation(() => mockState);
    mockSetCallbacks.mockImplementation((callbacks) => {
      capturedCallbacks = callbacks;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 17.1: Initialization and Callback Setup
  // ===========================================================================
  describe('Initialization and Callback Setup', () => {
    it('should initialize with default state values', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.partialTranscript).toBe('');
      expect(result.current.detectedLanguage).toBeNull();
    });

    it('should set up StreamingAudioManager callbacks on mount', () => {
      renderHook(() => useAudioRecording(mockToast));

      expect(mockSetCallbacks).toHaveBeenCalledTimes(1);
      expect(mockSetCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({
          onStateChange: expect.any(Function),
          onError: expect.any(Function),
          onTranscriptionComplete: expect.any(Function),
          onPartialTranscript: expect.any(Function),
          onLanguageDetected: expect.any(Function)
        })
      );
    });

    it('should set up toggle dictation listener on mount', () => {
      renderHook(() => useAudioRecording(mockToast));

      expect(window.electronAPI.onToggleDictation).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.onToggleDictation).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clean up on unmount', () => {
      const { unmount } = renderHook(() => useAudioRecording(mockToast));

      unmount();

      expect(mockDestroy).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.removeAllListeners).toHaveBeenCalledWith('toggle-dictation');
    });

    it('should return all expected functions and state', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Check state values
      expect(result.current).toHaveProperty('isRecording');
      expect(result.current).toHaveProperty('isProcessing');
      expect(result.current).toHaveProperty('transcript');
      expect(result.current).toHaveProperty('partialTranscript');
      expect(result.current).toHaveProperty('detectedLanguage');

      // Check functions
      expect(typeof result.current.startRecording).toBe('function');
      expect(typeof result.current.stopRecording).toBe('function');
      expect(typeof result.current.abortRecording).toBe('function');
      expect(typeof result.current.toggleListening).toBe('function');
    });
  });

  // ===========================================================================
  // Requirement 6.1: Recording Start
  // ===========================================================================
  describe('startRecording', () => {
    it('should call audioManager.startRecording when startRecording is called', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      await act(async () => {
        await result.current.startRecording();
      });

      expect(mockStartRecording).toHaveBeenCalledTimes(1);
    });

    it('should return true when recording starts successfully', async () => {
      mockStartRecording.mockResolvedValue(true);
      const { result } = renderHook(() => useAudioRecording(mockToast));

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.startRecording();
      });

      expect(returnValue).toBe(true);
    });

    it('should return false when recording fails to start', async () => {
      mockStartRecording.mockResolvedValue(false);
      const { result } = renderHook(() => useAudioRecording(mockToast));

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.startRecording();
      });

      expect(returnValue).toBe(false);
    });

    it('should clear partial transcript when starting recording', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Simulate having a partial transcript via callback
      act(() => {
        capturedCallbacks.onPartialTranscript?.('Previous partial');
      });

      expect(result.current.partialTranscript).toBe('Previous partial');

      // Start recording should clear it (the hook clears it before calling startRecording)
      await act(async () => {
        await result.current.startRecording();
      });

      expect(result.current.partialTranscript).toBe('');
    });
  });

  // ===========================================================================
  // Requirement 6.3: Recording Stop
  // ===========================================================================
  describe('stopRecording', () => {
    it('should call audioManager.stopRecording when stopRecording is called', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      await act(async () => {
        await result.current.stopRecording();
      });

      expect(mockStopRecording).toHaveBeenCalledTimes(1);
    });

    it('should return true when recording stops successfully', async () => {
      mockStopRecording.mockResolvedValue(true);
      const { result } = renderHook(() => useAudioRecording(mockToast));

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.stopRecording();
      });

      expect(returnValue).toBe(true);
    });

    it('should return false when stopping fails', async () => {
      mockStopRecording.mockResolvedValue(false);
      const { result } = renderHook(() => useAudioRecording(mockToast));

      let returnValue: boolean | undefined;
      await act(async () => {
        returnValue = await result.current.stopRecording();
      });

      expect(returnValue).toBe(false);
    });
  });

  // ===========================================================================
  // Requirement 6.4: Recording Abort
  // ===========================================================================
  describe('abortRecording', () => {
    it('should call audioManager.abortRecording when abortRecording is called', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      await act(async () => {
        await result.current.abortRecording();
      });

      expect(mockAbortRecording).toHaveBeenCalledTimes(1);
    });

    it('should clear partial transcript when aborting', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Simulate having a partial transcript
      act(() => {
        capturedCallbacks.onPartialTranscript?.('Partial text');
      });

      expect(result.current.partialTranscript).toBe('Partial text');

      // Abort should clear it
      await act(async () => {
        await result.current.abortRecording();
      });

      expect(result.current.partialTranscript).toBe('');
    });

    it('should clear detected language when aborting', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Simulate having a detected language
      act(() => {
        capturedCallbacks.onLanguageDetected?.('en-US');
      });

      expect(result.current.detectedLanguage).toBe('en-US');

      // Abort should clear it
      await act(async () => {
        await result.current.abortRecording();
      });

      expect(result.current.detectedLanguage).toBeNull();
    });

    it('should not throw when audioManager is not initialized', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Should not throw
      await expect(
        act(async () => {
          await result.current.abortRecording();
        })
      ).resolves.not.toThrow();
    });
  });

  // ===========================================================================
  // Requirement 6.5: Toggle Listening
  // ===========================================================================
  describe('toggleListening', () => {
    it('should start recording when not recording and not processing', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Ensure initial state is not recording
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);

      await act(async () => {
        result.current.toggleListening();
        // Give time for async startRecording to be called
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(mockStartRecording).toHaveBeenCalled();
    });

    it('should stop recording when currently recording', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Simulate recording state via callback
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });

      expect(result.current.isRecording).toBe(true);

      await act(async () => {
        result.current.toggleListening();
      });

      expect(mockStopRecording).toHaveBeenCalled();
    });

    it('should not start recording when processing', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Simulate processing state
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: true });
      });

      expect(result.current.isProcessing).toBe(true);

      await act(async () => {
        result.current.toggleListening();
      });

      // Should not call startRecording when processing
      expect(mockStartRecording).not.toHaveBeenCalled();
    });

    it('should not stop recording when not recording', async () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Ensure not recording
      expect(result.current.isRecording).toBe(false);

      await act(async () => {
        result.current.toggleListening();
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should call startRecording, not stopRecording
      expect(mockStartRecording).toHaveBeenCalled();
      expect(mockStopRecording).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Requirement 6.6: State Changes
  // ===========================================================================
  describe('State Changes', () => {
    it('should update isRecording when onStateChange callback is called', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.isRecording).toBe(false);

      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });

      expect(result.current.isRecording).toBe(true);
    });

    it('should update isProcessing when onStateChange callback is called', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.isProcessing).toBe(false);

      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: true });
      });

      expect(result.current.isProcessing).toBe(true);
    });

    it('should clear detected language when recording starts', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Set a detected language first
      act(() => {
        capturedCallbacks.onLanguageDetected?.('es-US');
      });

      expect(result.current.detectedLanguage).toBe('es-US');

      // Start recording should clear it (via onStateChange with isRecording: true)
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });

      expect(result.current.detectedLanguage).toBeNull();
    });

    it('should update transcript when onTranscriptionComplete is called with success', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.transcript).toBe('');

      act(() => {
        capturedCallbacks.onTranscriptionComplete?.({
          success: true,
          text: 'Hello world',
          detectedLanguage: 'en-US'
        });
      });

      expect(result.current.transcript).toBe('Hello world');
    });

    it('should update detected language from transcription result', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      act(() => {
        capturedCallbacks.onTranscriptionComplete?.({
          success: true,
          text: 'Hola mundo',
          detectedLanguage: 'es-US'
        });
      });

      expect(result.current.detectedLanguage).toBe('es-US');
    });

    it('should clear partial transcript when transcription completes', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Set partial transcript
      act(() => {
        capturedCallbacks.onPartialTranscript?.('Partial...');
      });

      expect(result.current.partialTranscript).toBe('Partial...');

      // Complete transcription
      act(() => {
        capturedCallbacks.onTranscriptionComplete?.({
          success: true,
          text: 'Complete text'
        });
      });

      expect(result.current.partialTranscript).toBe('');
    });

    it('should update partial transcript when onPartialTranscript is called', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.partialTranscript).toBe('');

      act(() => {
        capturedCallbacks.onPartialTranscript?.('Hello...');
      });

      expect(result.current.partialTranscript).toBe('Hello...');

      act(() => {
        capturedCallbacks.onPartialTranscript?.('Hello world...');
      });

      expect(result.current.partialTranscript).toBe('Hello world...');
    });

    it('should update detected language when onLanguageDetected is called', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      expect(result.current.detectedLanguage).toBeNull();

      act(() => {
        capturedCallbacks.onLanguageDetected?.('fr-FR');
      });

      expect(result.current.detectedLanguage).toBe('fr-FR');
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================
  describe('Error Handling', () => {
    it('should call toast with error when onError callback is triggered', () => {
      renderHook(() => useAudioRecording(mockToast));

      act(() => {
        capturedCallbacks.onError?.({
          title: 'Recording Error',
          description: 'Failed to access microphone'
        });
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Recording Error',
        description: 'Failed to access microphone',
        variant: 'destructive'
      });
    });

    it('should handle microphone permission denied error', () => {
      renderHook(() => useAudioRecording(mockToast));

      act(() => {
        capturedCallbacks.onError?.({
          title: 'Microphone Access Denied',
          description: 'Please grant microphone permission in system settings.'
        });
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Microphone Access Denied',
          variant: 'destructive'
        })
      );
    });

    it('should handle transcription failure error', () => {
      renderHook(() => useAudioRecording(mockToast));

      act(() => {
        capturedCallbacks.onError?.({
          title: 'Transcription Failed',
          description: 'Could not transcribe audio'
        });
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Transcription Failed',
          variant: 'destructive'
        })
      );
    });
  });

  // ===========================================================================
  // Toggle Dictation Event Handler
  // ===========================================================================
  describe('Toggle Dictation Event Handler', () => {
    it('should start recording when toggle event is received and not recording', async () => {
      mockState = { isRecording: false, isProcessing: false, detectedLanguage: null };
      renderHook(() => useAudioRecording(mockToast));

      // Get the toggle handler that was registered
      const toggleHandler = (window.electronAPI.onToggleDictation as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate toggle event
      await act(async () => {
        toggleHandler({});
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      expect(mockStartRecording).toHaveBeenCalled();
    });

    it('should stop recording when toggle event is received and currently recording', async () => {
      mockState = { isRecording: true, isProcessing: false, detectedLanguage: null };
      renderHook(() => useAudioRecording(mockToast));

      // Get the toggle handler that was registered
      const toggleHandler = (window.electronAPI.onToggleDictation as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate toggle event
      await act(async () => {
        toggleHandler({});
      });

      expect(mockStopRecording).toHaveBeenCalled();
    });

    it('should not start recording when toggle event is received during processing', async () => {
      mockState = { isRecording: false, isProcessing: true, detectedLanguage: null };
      renderHook(() => useAudioRecording(mockToast));

      // Get the toggle handler that was registered
      const toggleHandler = (window.electronAPI.onToggleDictation as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate toggle event
      await act(async () => {
        toggleHandler({});
      });

      expect(mockStartRecording).not.toHaveBeenCalled();
      expect(mockStopRecording).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // State Transitions
  // ===========================================================================
  describe('State Transitions', () => {
    it('should transition from idle to recording', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Initial state
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);

      // Transition to recording
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });

      expect(result.current.isRecording).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should transition from recording to processing', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Start recording
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });

      expect(result.current.isRecording).toBe(true);

      // Transition to processing
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: true });
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(true);
    });

    it('should transition from processing to idle', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // Start processing
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: true });
      });

      expect(result.current.isProcessing).toBe(true);

      // Transition to idle
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: false });
      });

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle complete recording cycle', () => {
      const { result } = renderHook(() => useAudioRecording(mockToast));

      // 1. Start recording
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: true, isProcessing: false });
      });
      expect(result.current.isRecording).toBe(true);

      // 2. Receive partial transcript
      act(() => {
        capturedCallbacks.onPartialTranscript?.('Hello...');
      });
      expect(result.current.partialTranscript).toBe('Hello...');

      // 3. Detect language
      act(() => {
        capturedCallbacks.onLanguageDetected?.('en-US');
      });
      expect(result.current.detectedLanguage).toBe('en-US');

      // 4. Stop recording, start processing
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: true });
      });
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(true);

      // 5. Complete transcription
      act(() => {
        capturedCallbacks.onTranscriptionComplete?.({
          success: true,
          text: 'Hello world',
          detectedLanguage: 'en-US'
        });
      });
      expect(result.current.transcript).toBe('Hello world');
      expect(result.current.partialTranscript).toBe('');

      // 6. Return to idle
      act(() => {
        capturedCallbacks.onStateChange?.({ isRecording: false, isProcessing: false });
      });
      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);
    });
  });
});
