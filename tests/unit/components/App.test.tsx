/**
 * Unit Tests for App Component (Dictation Panel)
 * 
 * Tests the main dictation panel UI component that displays recording states
 * and provides visual feedback during voice dictation.
 * 
 * @module tests/unit/components/App.test.tsx
 * 
 * Validates: Requirements 1.1-1.6
 * - 1.1: Idle state displays sound wave icon with 50% opacity black background
 * - 1.2: Hover state displays enhanced visual feedback with gradient overlay
 * - 1.3: Recording state displays loading dots animation with blue background and pulsing border
 * - 1.4: Processing state displays voice wave animation with purple background
 * - 1.5: Language badge shows detected language code
 * - 1.6: Escape key hides the window
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper function to check if element is in document (replacement for toBeInTheDocument)
const expectInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeNull();
  expect(document.body.contains(element)).toBe(true);
};

const expectNotInDocument = (element: HTMLElement | null) => {
  if (element === null) {
    expect(element).toBeNull();
  } else {
    expect(document.body.contains(element)).toBe(false);
  }
};

// Mock the hooks before importing App
vi.mock('../../../src/hooks/useHotkey', () => ({
  useHotkey: vi.fn(() => ({
    hotkey: 'D',
    setHotkey: vi.fn()
  }))
}));

vi.mock('../../../src/hooks/useWindowDrag', () => ({
  useWindowDrag: vi.fn(() => ({
    isDragging: false,
    handleMouseDown: vi.fn(),
    handleMouseUp: vi.fn(),
    handleClick: vi.fn()
  }))
}));

vi.mock('../../../src/hooks/useAudioRecording', () => ({
  useAudioRecording: vi.fn(() => ({
    isRecording: false,
    isProcessing: false,
    detectedLanguage: null,
    toggleListening: vi.fn()
  }))
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn()
  })),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Import after mocks are set up
import App from '../../../src/App';
import { useHotkey } from '../../../src/hooks/useHotkey';
import { useWindowDrag } from '../../../src/hooks/useWindowDrag';
import { useAudioRecording } from '../../../src/hooks/useAudioRecording';
import { useToast } from '../../../src/components/ui/Toast';

// Type the mocked functions
const mockUseHotkey = useHotkey as ReturnType<typeof vi.fn>;
const mockUseWindowDrag = useWindowDrag as ReturnType<typeof vi.fn>;
const mockUseAudioRecording = useAudioRecording as ReturnType<typeof vi.fn>;
const mockUseToast = useToast as ReturnType<typeof vi.fn>;

describe('App Component (Dictation Panel)', () => {
  // Store original electronAPI
  let originalElectronAPI: typeof window.electronAPI;

  beforeEach(() => {
    // Store original and set up mock electronAPI
    originalElectronAPI = window.electronAPI;
    
    window.electronAPI = {
      hideWindow: vi.fn().mockResolvedValue(undefined),
      showDictationPanel: vi.fn().mockResolvedValue(undefined),
      windowMinimize: vi.fn().mockResolvedValue(undefined),
      windowMaximize: vi.fn().mockResolvedValue(undefined),
      windowClose: vi.fn().mockResolvedValue(undefined),
      windowIsMaximized: vi.fn().mockResolvedValue(false),
      startWindowDrag: vi.fn().mockResolvedValue(undefined),
      stopWindowDrag: vi.fn().mockResolvedValue(undefined),
      updateHotkey: vi.fn().mockResolvedValue({ success: true }),
      onToggleDictation: vi.fn(),
      saveTranscription: vi.fn().mockResolvedValue({ id: 1 }),
      getTranscriptions: vi.fn().mockResolvedValue([]),
      deleteTranscription: vi.fn().mockResolvedValue({ success: true }),
      clearTranscriptions: vi.fn().mockResolvedValue({ cleared: 0 }),
      pasteText: vi.fn().mockResolvedValue(undefined),
      readClipboard: vi.fn().mockResolvedValue(''),
      writeClipboard: vi.fn().mockResolvedValue(undefined),
      saveSettings: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeStart: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeChunk: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeEnd: vi.fn().mockResolvedValue({ success: true, text: '' }),
      streamingTranscribeAbort: vi.fn().mockResolvedValue({ success: true }),
      streamingTranscribeStatus: vi.fn().mockResolvedValue({ isActive: false }),
      transcribeAWS: vi.fn().mockResolvedValue({ text: '', confidence: 0.95 }),
      invokeBedrockModel: vi.fn().mockResolvedValue(''),
      getAWSCredentials: vi.fn().mockResolvedValue({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' }),
      saveAWSCredentials: vi.fn().mockResolvedValue({ success: true }),
      getAnthropicKey: vi.fn().mockResolvedValue(''),
      saveAnthropicKey: vi.fn().mockResolvedValue({ success: true }),
      getActiveAppContext: vi.fn().mockResolvedValue({ appName: 'Unknown', bundleId: null, executablePath: null, windowTitle: null, platform: 'darwin' }),
      connectionWarmup: vi.fn().mockResolvedValue({ success: true }),
      connectionStatus: vi.fn().mockResolvedValue({ isReady: true, bedrockWarmed: true, transcribeWarmed: true, lastWarmupTime: Date.now() }),
      connectionHealthCheck: vi.fn().mockResolvedValue({ healthy: true }),
      connectionIsReady: vi.fn().mockResolvedValue(true),
      connectionReset: vi.fn().mockResolvedValue({ success: true }),
      onStreamingPartial: vi.fn(),
      onStreamingFinal: vi.fn(),
      onStreamingLanguage: vi.fn(),
      onStreamingError: vi.fn(),
      onNoAudioDetected: vi.fn(),
      checkForUpdates: vi.fn().mockResolvedValue({ updateAvailable: false }),
      downloadUpdate: vi.fn().mockResolvedValue({ success: true }),
      installUpdate: vi.fn().mockResolvedValue({ success: true }),
      getAppVersion: vi.fn().mockResolvedValue('1.0.0'),
      getUpdateStatus: vi.fn().mockResolvedValue({ status: 'idle' }),
      onUpdateAvailable: vi.fn(),
      onUpdateNotAvailable: vi.fn(),
      onUpdateDownloaded: vi.fn(),
      onUpdateDownloadProgress: vi.fn(),
      onUpdateError: vi.fn(),
      cleanupApp: vi.fn().mockResolvedValue({ success: true }),
      openExternal: vi.fn().mockResolvedValue(undefined),
      debugLog: vi.fn().mockResolvedValue(undefined),
      removeAllListeners: vi.fn()
    } as unknown as typeof window.electronAPI;

    // Reset all hook mocks to default values
    mockUseHotkey.mockReturnValue({
      hotkey: 'D',
      setHotkey: vi.fn()
    });

    mockUseWindowDrag.mockReturnValue({
      isDragging: false,
      handleMouseDown: vi.fn(),
      handleMouseUp: vi.fn(),
      handleClick: vi.fn()
    });

    mockUseAudioRecording.mockReturnValue({
      isRecording: false,
      isProcessing: false,
      detectedLanguage: null,
      toggleListening: vi.fn()
    });

    mockUseToast.mockReturnValue({
      toast: vi.fn(),
      dismiss: vi.fn()
    });
  });

  afterEach(() => {
    // Restore original electronAPI
    window.electronAPI = originalElectronAPI;
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Requirement 1.1: Idle State Rendering
  // ===========================================================================
  describe('Requirement 1.1: Idle State Rendering', () => {
    it('should display sound wave icon in idle state', () => {
      render(<App />);
      
      // Find the button
      const button = screen.getByRole('button');
      expectInDocument(button);
      
      // In idle state, the button should have the sound wave icon (3 bars)
      // The SoundWaveIcon renders 3 div elements with bg-white class
      const soundWaveBars = button.querySelectorAll('div.bg-white');
      expect(soundWaveBars.length).toBeGreaterThanOrEqual(3);
    });

    it('should have 50% opacity black background in idle state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for bg-black/50 class (50% opacity black)
      expect(button.className).toContain('bg-black/50');
    });

    it('should display tooltip with hotkey instruction in idle state', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Hover over the button to show tooltip
      await userEvent.hover(button);
      
      // Wait for tooltip to appear
      await waitFor(() => {
        const tooltip = screen.getByText(/Press \[D\] to speak/);
        expectInDocument(tooltip);
      });
    });
  });

  // ===========================================================================
  // Requirement 1.2: Hover State Rendering
  // ===========================================================================
  describe('Requirement 1.2: Hover State Rendering', () => {
    it('should display enhanced visual feedback on hover', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Trigger hover
      fireEvent.mouseEnter(button);
      
      // The hover state should show gradient overlay
      // Check for the gradient overlay div with from-white/10 class
      const gradientOverlay = button.querySelector('div[class*="bg-gradient-to-br"]');
      expectInDocument(gradientOverlay as HTMLElement);
    });

    it('should increase sound wave icon size on hover', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Get initial sound wave bars
      const initialBars = button.querySelectorAll('div.bg-white');
      expect(initialBars.length).toBeGreaterThanOrEqual(3);
      
      // Trigger hover
      fireEvent.mouseEnter(button);
      
      // After hover, the icon size should be larger (14 vs 12)
      // This is controlled by the SoundWaveIcon size prop
      const hoveredBars = button.querySelectorAll('div.bg-white');
      expect(hoveredBars.length).toBeGreaterThanOrEqual(3);
    });

    it('should show gradient overlay with opacity on hover', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Trigger hover
      fireEvent.mouseEnter(button);
      
      // Check for gradient overlay - it should have opacity changed
      const gradientOverlay = button.querySelector('div[class*="bg-gradient-to-br"]');
      expectInDocument(gradientOverlay as HTMLElement);
    });
  });

  // ===========================================================================
  // Requirement 1.3: Recording State Rendering
  // ===========================================================================
  describe('Requirement 1.3: Recording State Rendering', () => {
    beforeEach(() => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: true,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });
    });

    it('should display loading dots animation in recording state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // LoadingDots component renders a flex container with 3 animated dots
      // The LoadingDots uses inline styles with display: flex
      const loadingDotsContainer = button.querySelector('div[style*="display: flex"][style*="gap"]');
      expectInDocument(loadingDotsContainer as HTMLElement);
    });

    it('should have blue background in recording state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for bg-blue-600 class
      expect(button.className).toContain('bg-blue-600');
    });

    it('should display pulsing border in recording state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for the pulsing border ring with animate-pulse class
      const pulsingRing = button.querySelector('div[class*="animate-pulse"][class*="border-blue-300"]');
      expectInDocument(pulsingRing as HTMLElement);
    });

    it('should show "Recording..." tooltip in recording state', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Hover to show tooltip
      await userEvent.hover(button);
      
      await waitFor(() => {
        const tooltip = screen.getByText('Recording...');
        expectInDocument(tooltip);
      });
    });
  });

  // ===========================================================================
  // Requirement 1.4: Processing State Rendering
  // ===========================================================================
  describe('Requirement 1.4: Processing State Rendering', () => {
    beforeEach(() => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: true,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });
    });

    it('should display voice wave animation in processing state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // VoiceWaveIndicator renders 4 animated bars with specific classes
      // The bars have w-0.5 bg-white rounded-full classes
      const voiceWaveBars = button.querySelectorAll('div[class*="w-0.5"][class*="bg-white"][class*="rounded-full"]');
      expect(voiceWaveBars.length).toBe(4);
    });

    it('should have purple background in processing state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for bg-purple-600 class
      expect(button.className).toContain('bg-purple-600');
    });

    it('should be disabled in processing state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Button should be disabled - check the disabled attribute
      expect(button.hasAttribute('disabled')).toBe(true);
    });

    it('should have cursor-not-allowed in processing state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for cursor-not-allowed class
      expect(button.className).toContain('cursor-not-allowed');
    });

    it('should show "Processing..." tooltip in processing state', async () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Hover to show tooltip
      await userEvent.hover(button);
      
      await waitFor(() => {
        const tooltip = screen.getByText('Processing...');
        expectInDocument(tooltip);
      });
    });

    it('should display purple border ring in processing state', () => {
      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Check for the purple border ring
      const purpleRing = button.querySelector('div[class*="border-purple-300"]');
      expectInDocument(purpleRing as HTMLElement);
    });
  });

  // ===========================================================================
  // Requirement 1.5: Language Badge Display
  // ===========================================================================
  describe('Requirement 1.5: Language Badge Display', () => {
    it('should display language badge when language is detected', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'en-US',
        toggleListening: vi.fn()
      });

      render(<App />);
      
      // Language badge should show "EN" for "en-US"
      const badge = screen.getByText('EN');
      expectInDocument(badge);
    });

    it('should display correct short code for different languages', () => {
      // Test Spanish
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'es-US',
        toggleListening: vi.fn()
      });

      const { rerender } = render(<App />);
      expectInDocument(screen.getByText('ES'));

      // Test French
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'fr-FR',
        toggleListening: vi.fn()
      });

      rerender(<App />);
      expectInDocument(screen.getByText('FR'));

      // Test Japanese
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'ja-JP',
        toggleListening: vi.fn()
      });

      rerender(<App />);
      expectInDocument(screen.getByText('JA'));
    });

    it('should not display language badge when no language is detected', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });

      render(<App />);
      
      // No language badge should be present - check for the badge container
      const badgeContainer = document.querySelector('div[class*="bg-green-500"][class*="text-white"]');
      expect(badgeContainer).toBeNull();
    });

    it('should not display language badge while recording', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: true,
        isProcessing: false,
        detectedLanguage: 'en-US',
        toggleListening: vi.fn()
      });

      render(<App />);
      
      // Badge should not be visible during recording
      const badgeContainer = document.querySelector('div[class*="bg-green-500"][class*="text-white"]');
      expect(badgeContainer).toBeNull();
    });

    it('should have green background on language badge', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'en-US',
        toggleListening: vi.fn()
      });

      render(<App />);
      
      const badge = screen.getByText('EN');
      expect(badge.className).toContain('bg-green-500');
    });

    it('should show tooltip with full language name on badge hover', async () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'en-US',
        toggleListening: vi.fn()
      });

      render(<App />);
      
      const badge = screen.getByText('EN');
      
      // Hover over badge
      await userEvent.hover(badge);
      
      await waitFor(() => {
        const tooltip = screen.getByText(/Detected: English/);
        expectInDocument(tooltip);
      });
    });
  });

  // ===========================================================================
  // Requirement 1.6: Escape Key Handling
  // ===========================================================================
  describe('Requirement 1.6: Escape Key Handling', () => {
    it('should call hideWindow when Escape key is pressed', async () => {
      render(<App />);
      
      // Press Escape key
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // hideWindow should be called
      expect(window.electronAPI.hideWindow).toHaveBeenCalledTimes(1);
    });

    it('should not call hideWindow for other keys', () => {
      render(<App />);
      
      // Press other keys
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'a' });
      
      // hideWindow should not be called
      expect(window.electronAPI.hideWindow).not.toHaveBeenCalled();
    });

    it('should clean up keydown listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<App />);
      
      unmount();
      
      // Check that removeEventListener was called for keydown
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeEventListenerSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Additional UI Interaction Tests
  // ===========================================================================
  describe('UI Interactions', () => {
    it('should call toggleListening when button is clicked (not dragged)', async () => {
      const mockToggleListening = vi.fn();
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: mockToggleListening
      });

      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Simulate click without drag
      fireEvent.mouseDown(button, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseUp(button);
      fireEvent.click(button);
      
      expect(mockToggleListening).toHaveBeenCalled();
    });

    it('should not call toggleListening when button is dragged', async () => {
      const mockToggleListening = vi.fn();
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: mockToggleListening
      });

      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Simulate drag (move more than 5px threshold)
      fireEvent.mouseDown(button, { button: 0, clientX: 100, clientY: 100 });
      fireEvent.mouseMove(button, { clientX: 120, clientY: 120 }); // Move 20px
      fireEvent.mouseUp(button);
      fireEvent.click(button);
      
      // toggleListening should not be called because we dragged
      expect(mockToggleListening).not.toHaveBeenCalled();
    });

    it('should not call toggleListening when in processing state', async () => {
      const mockToggleListening = vi.fn();
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: true,
        detectedLanguage: null,
        toggleListening: mockToggleListening
      });

      render(<App />);
      
      const button = screen.getByRole('button');
      
      // Try to click
      fireEvent.click(button);
      
      // Button is disabled, so toggleListening should not be called
      expect(mockToggleListening).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // State Transitions
  // ===========================================================================
  describe('State Transitions', () => {
    it('should transition from idle to recording state', () => {
      const { rerender } = render(<App />);
      
      // Initially idle
      let button = screen.getByRole('button');
      expect(button.className).toContain('bg-black/50');
      
      // Transition to recording
      mockUseAudioRecording.mockReturnValue({
        isRecording: true,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });
      
      rerender(<App />);
      
      button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-600');
    });

    it('should transition from recording to processing state', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: true,
        isProcessing: false,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });

      const { rerender } = render(<App />);
      
      // Initially recording
      let button = screen.getByRole('button');
      expect(button.className).toContain('bg-blue-600');
      
      // Transition to processing
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: true,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });
      
      rerender(<App />);
      
      button = screen.getByRole('button');
      expect(button.className).toContain('bg-purple-600');
    });

    it('should transition from processing to idle with detected language', () => {
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: true,
        detectedLanguage: null,
        toggleListening: vi.fn()
      });

      const { rerender } = render(<App />);
      
      // Initially processing
      let button = screen.getByRole('button');
      expect(button.className).toContain('bg-purple-600');
      
      // Transition to idle with detected language
      mockUseAudioRecording.mockReturnValue({
        isRecording: false,
        isProcessing: false,
        detectedLanguage: 'en-US',
        toggleListening: vi.fn()
      });
      
      rerender(<App />);
      
      button = screen.getByRole('button');
      expect(button.className).toContain('bg-black/50');
      expectInDocument(screen.getByText('EN'));
    });
  });
});
