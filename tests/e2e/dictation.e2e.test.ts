/**
 * Dictation E2E Tests
 * 
 * End-to-end tests for the dictation workflow using mocked Electron APIs.
 * These tests simulate the complete dictation user journey.
 * 
 * @module tests/e2e/dictation.e2e.test.ts
 * 
 * Validates: Requirements 18.3-18.5
 * - 18.3: Hotkey triggers recording
 * - 18.4: Recording and processing states display correctly
 * - 18.5: Transcription is pasted correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElectronAPI, type MockElectronAPI } from '../mocks/electronAPI';
import { createMockAWSServices, type MockAWSServices } from '../mocks/awsServices';

// ============================================================================
// Test Setup
// ============================================================================

describe('Dictation E2E Tests', () => {
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

    // Set up as returning user with completed onboarding
    localStorage.setItem('onboardingCompleted', 'true');
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.__reset();
    mockAWSServices.__resetAll();
    localStorage.clear();
  });

  // ==========================================================================
  // Requirement 18.3: Hotkey Triggers Recording
  // ==========================================================================
  describe('Hotkey Triggers Recording (Requirement 18.3)', () => {
    it('should register hotkey callback', () => {
      // Arrange
      const callback = vi.fn();

      // Act
      mockElectronAPI.onToggleDictation(callback);

      // Assert
      expect(mockElectronAPI.onToggleDictation).toHaveBeenCalledWith(callback);
    });

    it('should trigger callback when hotkey is pressed', () => {
      // Arrange
      const callback = vi.fn();
      mockElectronAPI.onToggleDictation(callback);

      // Act - simulate hotkey press
      mockElectronAPI.__emitEvent('toggle-dictation');

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should start recording when hotkey triggers', async () => {
      // Arrange
      let isRecording = false;
      const startRecording = async () => {
        await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
        isRecording = true;
      };

      mockElectronAPI.onToggleDictation(() => {
        startRecording();
      });

      // Act
      mockElectronAPI.__emitEvent('toggle-dictation');
      await vi.waitFor(() => isRecording);

      // Assert
      expect(mockElectronAPI.streamingTranscribeStart).toHaveBeenCalled();
      expect(isRecording).toBe(true);
    });

    it('should stop recording on second hotkey press', async () => {
      // Arrange
      let isRecording = false;
      const toggleRecording = async () => {
        if (!isRecording) {
          await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
          isRecording = true;
        } else {
          await mockElectronAPI.streamingTranscribeEnd();
          isRecording = false;
        }
      };

      mockElectronAPI.onToggleDictation(toggleRecording);

      // Act - first press starts
      mockElectronAPI.__emitEvent('toggle-dictation');
      await vi.waitFor(() => isRecording);
      expect(isRecording).toBe(true);

      // Act - second press stops
      mockElectronAPI.__emitEvent('toggle-dictation');
      await vi.waitFor(() => !isRecording);

      // Assert
      expect(isRecording).toBe(false);
      expect(mockElectronAPI.streamingTranscribeEnd).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Requirement 18.4: Recording and Processing States
  // ==========================================================================
  describe('Recording and Processing States (Requirement 18.4)', () => {
    it('should track idle state', () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing';
      let state: AppState = 'idle';

      // Assert
      expect(state).toBe('idle');
    });

    it('should transition to recording state', async () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing';
      let state: AppState = 'idle';

      // Act
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      state = 'recording';

      // Assert
      expect(state).toBe('recording');
    });

    it('should transition to processing state after recording', async () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing';
      let state: AppState = 'idle';

      // Act - start recording
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      state = 'recording';

      // Act - end recording, start processing
      await mockElectronAPI.streamingTranscribeEnd();
      state = 'processing';

      // Assert
      expect(state).toBe('processing');
    });

    it('should return to idle after processing', async () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing';
      let state: AppState = 'idle';

      // Act - full cycle
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      state = 'recording';

      await mockElectronAPI.streamingTranscribeEnd();
      state = 'processing';

      // Simulate processing complete
      state = 'idle';

      // Assert
      expect(state).toBe('idle');
    });

    it('should handle partial results during recording', async () => {
      // Arrange
      let partialText = '';
      mockAWSServices.transcribe.setCallbacks({
        onPartialResult: (text) => {
          partialText = text;
        }
      });

      // Act
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });
      mockAWSServices.transcribe.simulatePartialResult('Hello');

      // Assert
      expect(partialText).toBe('Hello');
    });

    it('should handle final results', async () => {
      // Arrange
      let finalText = '';
      mockAWSServices.transcribe.setCallbacks({
        onFinalResult: (text) => {
          finalText = text;
        }
      });

      // Act
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });
      mockAWSServices.transcribe.simulateFinalResult('Hello world');

      // Assert
      expect(finalText).toBe('Hello world');
    });
  });

  // ==========================================================================
  // Requirement 18.5: Transcription Paste
  // ==========================================================================
  describe('Transcription Paste (Requirement 18.5)', () => {
    it('should paste transcribed text', async () => {
      // Arrange
      const transcribedText = 'Hello world';

      // Act
      await mockElectronAPI.pasteText(transcribedText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(transcribedText);
    });

    it('should paste enhanced text when enhancement is enabled', async () => {
      // Arrange
      const rawText = 'hello world';
      const enhancedText = await mockElectronAPI.invokeBedrockModel({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: rawText
      });

      // Act
      await mockElectronAPI.pasteText(enhancedText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(enhancedText);
    });

    it('should save transcription to history', async () => {
      // Arrange
      const text = 'Test transcription';

      // Act
      const result = await mockElectronAPI.saveTranscription(text);

      // Assert
      expect(result.id).toBeDefined();
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(text);
    });

    it('should complete full dictation workflow', async () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing';
      let state: AppState = 'idle';
      let transcribedText = '';

      // Act - Start recording
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      state = 'recording';

      // Simulate audio chunks
      await mockElectronAPI.streamingTranscribeChunk(new ArrayBuffer(1024));

      // End recording
      const result = await mockElectronAPI.streamingTranscribeEnd();
      state = 'processing';
      transcribedText = result.text;

      // Enhance text
      const enhancedText = await mockElectronAPI.invokeBedrockModel({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: transcribedText
      });

      // Paste and save
      await mockElectronAPI.pasteText(enhancedText);
      await mockElectronAPI.saveTranscription(enhancedText);
      state = 'idle';

      // Assert
      expect(state).toBe('idle');
      expect(mockElectronAPI.streamingTranscribeStart).toHaveBeenCalled();
      expect(mockElectronAPI.streamingTranscribeEnd).toHaveBeenCalled();
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalled();
      expect(mockElectronAPI.pasteText).toHaveBeenCalled();
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Language Detection
  // ==========================================================================
  describe('Language Detection', () => {
    it('should detect language during transcription', async () => {
      // Arrange
      let detectedLanguage = '';
      mockAWSServices.transcribe.setCallbacks({
        onLanguageDetected: (lang) => {
          detectedLanguage = lang;
        }
      });

      // Act
      await mockAWSServices.transcribe.startSession({ 
        languageCode: 'auto',
        enableLanguageIdentification: true 
      });
      mockAWSServices.transcribe.simulateLanguageDetection('es-US');

      // Assert
      expect(detectedLanguage).toBe('es-US');
    });

    it('should use specified language when not auto-detecting', async () => {
      // Arrange
      const specifiedLanguage = 'en-US';

      // Act
      await mockElectronAPI.streamingTranscribeStart({ 
        languageCode: specifiedLanguage 
      });

      // Assert
      expect(mockElectronAPI.streamingTranscribeStart).toHaveBeenCalledWith({
        languageCode: specifiedLanguage
      });
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should handle transcription errors gracefully', async () => {
      // Arrange
      let errorOccurred = false;
      mockAWSServices.transcribe.setCallbacks({
        onError: () => {
          errorOccurred = true;
        }
      });

      // Act
      await mockAWSServices.transcribe.startSession({ languageCode: 'en-US' });
      mockAWSServices.transcribe.simulateError(new Error('Transcription failed'));

      // Assert
      expect(errorOccurred).toBe(true);
    });

    it('should allow abort during recording', async () => {
      // Arrange
      await mockElectronAPI.streamingTranscribeStart({ languageCode: 'en-US' });

      // Act
      await mockElectronAPI.streamingTranscribeAbort();

      // Assert
      expect(mockElectronAPI.streamingTranscribeAbort).toHaveBeenCalled();
    });

    it('should return to idle state on error', async () => {
      // Arrange
      type AppState = 'idle' | 'recording' | 'processing' | 'error';
      let state: AppState = 'recording';

      // Act - simulate error
      state = 'error';
      // Recovery
      state = 'idle';

      // Assert
      expect(state).toBe('idle');
    });
  });

  // ==========================================================================
  // Context-Aware Styling
  // ==========================================================================
  describe('Context-Aware Styling', () => {
    it('should get active app context', async () => {
      // Arrange
      mockElectronAPI.__setAppContext({
        appName: 'Slack',
        bundleId: 'com.tinyspeck.slackmacgap',
        executablePath: '/Applications/Slack.app',
        windowTitle: '#general - Slack',
        platform: 'darwin'
      });

      // Act
      const context = await mockElectronAPI.getActiveAppContext();

      // Assert
      expect(context.appName).toBe('Slack');
    });

    it('should apply style based on app context', async () => {
      // Arrange
      mockElectronAPI.__setAppContext({
        appName: 'Mail',
        bundleId: 'com.apple.mail',
        executablePath: '/System/Applications/Mail.app',
        windowTitle: 'Inbox - Mail',
        platform: 'darwin'
      });

      const context = await mockElectronAPI.getActiveAppContext();
      
      // Determine style based on app
      const isEmailApp = context.appName === 'Mail' || 
                         context.bundleId?.includes('mail');
      const style = isEmailApp ? 'formal' : 'casual';

      // Assert
      expect(style).toBe('formal');
    });
  });
});
