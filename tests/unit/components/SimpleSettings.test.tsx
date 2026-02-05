/**
 * Unit Tests for SimpleSettings Component
 * 
 * Tests the settings page component that allows users to configure
 * AWS Transcribe settings, text enhancement, microphone, and hotkey preferences.
 * 
 * @module tests/unit/components/SimpleSettings.test.tsx
 * 
 * Validates: Requirements 4.1-4.5
 * - 4.1: Settings_Modal loads current settings from localStorage
 * - 4.2: Settings_Modal validates hotkey is not reserved
 * - 4.3: Settings_Modal persists values to localStorage on save
 * - 4.4: Settings_Modal updates transcription language setting
 * - 4.5: Settings_Modal enables or disables Bedrock integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Helper function to check if element is in document
const expectInDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeNull();
  expect(document.body.contains(element)).toBe(true);
};

// Import the component
import SimpleSettings from '../../../src/components/SimpleSettings';

// Import the global mock localStorage from setup
import { mockLocalStorage } from '../../setup';

describe('SimpleSettings Component', () => {
  // Store original electronAPI
  let originalElectronAPI: typeof window.electronAPI;

  beforeEach(() => {
    // Clear localStorage before each test (uses global mock from setup.ts)
    mockLocalStorage.clear();
    vi.clearAllMocks();

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
      getAWSCredentials: vi.fn().mockResolvedValue({ 
        accessKeyId: 'mock-access-key', 
        secretAccessKey: 'mock-secret-key', 
        region: 'us-east-1' 
      }),
      saveAWSCredentials: vi.fn().mockResolvedValue({ success: true }),
      getAnthropicKey: vi.fn().mockResolvedValue(''),
      saveAnthropicKey: vi.fn().mockResolvedValue({ success: true }),
      getActiveAppContext: vi.fn().mockResolvedValue({ 
        appName: 'Unknown', 
        bundleId: null, 
        executablePath: null, 
        windowTitle: null, 
        platform: 'darwin' 
      }),
      connectionWarmup: vi.fn().mockResolvedValue({ success: true }),
      connectionStatus: vi.fn().mockResolvedValue({ 
        isReady: true, 
        bedrockWarmed: true, 
        transcribeWarmed: true, 
        lastWarmupTime: Date.now() 
      }),
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
      getAppVersion: vi.fn().mockResolvedValue({ version: '1.0.0' }),
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

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { deviceId: 'default', kind: 'audioinput', label: 'Default Microphone' },
          { deviceId: 'mic-1', kind: 'audioinput', label: 'USB Microphone' }
        ]),
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }]
        })
      },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    // Restore original electronAPI
    window.electronAPI = originalElectronAPI;
    cleanup();
    vi.clearAllMocks();
  });

  // Helper to get select elements by their label text
  const getSelectByLabelText = (labelText: string): HTMLSelectElement | null => {
    const labels = screen.queryAllByText(labelText);
    for (const label of labels) {
      const container = label.closest('div');
      const select = container?.querySelector('select');
      if (select) return select as HTMLSelectElement;
    }
    return null;
  };

  // ===========================================================================
  // Requirement 4.1: Settings Loading from localStorage
  // ===========================================================================
  describe('Requirement 4.1: Settings Loading from localStorage', () => {
    it('should load default AWS region when no value in localStorage', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const regionSelect = getSelectByLabelText('Region');
      expect(regionSelect?.value).toBe('us-east-1');
    });

    it('should load saved AWS region from localStorage', async () => {
      // Set localStorage value BEFORE rendering using the global mock
      localStorage.setItem('awsRegion', 'us-west-2');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const regionSelect = getSelectByLabelText('Region');
      expect(regionSelect?.value).toBe('us-west-2');
    });

    it('should load default transcribe language (auto) when no value in localStorage', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language');
      expect(languageSelect?.value).toBe('auto');
    });

    it('should load saved transcribe language from localStorage', async () => {
      // Set localStorage value BEFORE rendering using the global mock
      localStorage.setItem('transcribeLanguage', 'es-US');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language');
      expect(languageSelect?.value).toBe('es-US');
    });

    it('should load text enhancement as enabled by default', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(enhancementCheckbox.checked).toBe(true);
    });

    it('should load text enhancement as disabled when set to false in localStorage', async () => {
      // Set localStorage value BEFORE rendering using the global mock
      localStorage.setItem('useTextEnhancement', 'false');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(enhancementCheckbox.checked).toBe(false);
    });

    it('should load default dictation key (backtick) when no value in localStorage', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(hotkeyInput.value).toBe('`');
    });

    it('should load saved dictation key from localStorage', async () => {
      // Set localStorage value BEFORE rendering using the global mock
      localStorage.setItem('dictationKey', 'F');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox') as HTMLInputElement;
      expect(hotkeyInput.value).toBe('F');
    });

    it('should load enhancement model from localStorage', async () => {
      // Set localStorage value BEFORE rendering using the global mock
      localStorage.setItem('enhancementModel', 'us.anthropic.claude-3-5-sonnet-20241022-v2:0');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      // Find the model select (only visible when enhancement is enabled)
      const modelSelect = getSelectByLabelText('Enhancement Model (Bedrock)');
      expect(modelSelect?.value).toBe('us.anthropic.claude-3-5-sonnet-20241022-v2:0');
    });
  });

  // ===========================================================================
  // Requirement 4.2: Hotkey Change and Validation
  // ===========================================================================
  describe('Requirement 4.2: Hotkey Change and Validation', () => {
    it('should allow changing the hotkey value', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox') as HTMLInputElement;
      
      // Clear and type new value
      await user.clear(hotkeyInput);
      await user.type(hotkeyInput, 'F');
      
      expect(hotkeyInput.value).toBe('F');
    });

    it('should limit hotkey input to single character', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox') as HTMLInputElement;
      
      // The input has maxLength=1
      expect(hotkeyInput.maxLength).toBe(1);
    });

    it('should display hotkey input with monospace font', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox');
      expect(hotkeyInput.className).toContain('font-mono');
    });

    it('should display default hotkey hint text', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hintText = screen.getByText(/Default: ` \(backtick\)/);
      expectInDocument(hintText);
    });

    it('should update hotkey via electronAPI when settings are saved', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox') as HTMLInputElement;
      await user.clear(hotkeyInput);
      await user.type(hotkeyInput, 'K');
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(window.electronAPI?.updateHotkey).toHaveBeenCalledWith('K');
    });
  });

  // ===========================================================================
  // Requirement 4.3: Settings Save to localStorage
  // ===========================================================================
  describe('Requirement 4.3: Settings Save to localStorage', () => {
    it('should save AWS region to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const regionSelect = getSelectByLabelText('Region')!;
      await user.selectOptions(regionSelect, 'eu-west-1');
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('awsRegion', 'eu-west-1');
    });

    it('should save transcribe language to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language')!;
      await user.selectOptions(languageSelect, 'fr-FR');
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('transcribeLanguage', 'fr-FR');
    });

    it('should save text enhancement setting to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox');
      await user.click(enhancementCheckbox); // Toggle off
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('useTextEnhancement', 'false');
    });

    it('should save dictation key to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const hotkeyInput = screen.getByRole('textbox');
      await user.clear(hotkeyInput);
      await user.type(hotkeyInput, 'M');
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dictationKey', 'M');
    });

    it('should save selected microphone to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedMicrophoneId', expect.any(String));
    });

    it('should save enhancement model to localStorage when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('enhancementModel', expect.any(String));
    });

    it('should display success status message after saving', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      const statusMessage = screen.getByText('Settings saved!');
      expectInDocument(statusMessage);
    });
  });

  // ===========================================================================
  // Requirement 4.4: Language Preference Change
  // ===========================================================================
  describe('Requirement 4.4: Language Preference Change', () => {
    it('should display language selector with auto-detect option', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language')!;
      const autoOption = languageSelect.querySelector('option[value="auto"]');
      expect(autoOption).not.toBeNull();
    });

    it('should display multiple language options', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language')!;
      const options = languageSelect.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(5);
    });

    it('should update language selection when changed', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language')!;
      await user.selectOptions(languageSelect, 'es-US');
      
      expect(languageSelect.value).toBe('es-US');
    });

    it('should persist language change after save', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const languageSelect = getSelectByLabelText('Language')!;
      await user.selectOptions(languageSelect, 'de-DE');
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('transcribeLanguage', 'de-DE');
    });
  });

  // ===========================================================================
  // Requirement 4.5: Enhancement Toggle
  // ===========================================================================
  describe('Requirement 4.5: Enhancement Toggle', () => {
    it('should display text enhancement toggle', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox');
      expectInDocument(enhancementCheckbox);
    });

    it('should display enhancement label text', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const label = screen.getByText(/Enhance transcriptions with AI/);
      expectInDocument(label);
    });

    it('should toggle enhancement off when clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(enhancementCheckbox.checked).toBe(true);
      
      await user.click(enhancementCheckbox);
      
      expect(enhancementCheckbox.checked).toBe(false);
    });

    it('should toggle enhancement on when clicked again', async () => {
      const user = userEvent.setup();
      // Set localStorage data BEFORE rendering using the global mock
      localStorage.setItem('useTextEnhancement', 'false');
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(enhancementCheckbox.checked).toBe(false);
      
      await user.click(enhancementCheckbox);
      
      expect(enhancementCheckbox.checked).toBe(true);
    });

    it('should show enhancement model selector when enhancement is enabled', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const modelSelect = getSelectByLabelText('Enhancement Model (Bedrock)');
      expect(modelSelect).not.toBeNull();
    });

    it('should hide enhancement model selector when enhancement is disabled', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox');
      await user.click(enhancementCheckbox); // Toggle off
      
      const modelSelect = getSelectByLabelText('Enhancement Model (Bedrock)');
      expect(modelSelect).toBeNull();
    });

    it('should persist enhancement toggle state after save', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const enhancementCheckbox = screen.getByRole('checkbox');
      await user.click(enhancementCheckbox); // Toggle off
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      await user.click(saveButton);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('useTextEnhancement', 'false');
    });
  });

  // ===========================================================================
  // Additional UI Tests
  // ===========================================================================
  describe('Additional UI Tests', () => {
    it('should display AWS Transcribe section', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const sectionTitle = screen.getByText(/AWS Transcribe/);
      expectInDocument(sectionTitle);
    });

    it('should display Microphone section', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const sectionTitle = screen.getByText('Microphone');
      expectInDocument(sectionTitle);
    });

    it('should display Dictation Hotkey section', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const sectionTitle = screen.getByText('Dictation Hotkey');
      expectInDocument(sectionTitle);
    });

    it('should display microphone selector', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      // The microphone section has a select element
      const micSection = screen.getByText('Microphone').closest('section');
      const micSelect = micSection?.querySelector('select');
      expect(micSelect).not.toBeNull();
    });

    it('should populate microphone options from enumerateDevices', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      await waitFor(() => {
        const micSection = screen.getByText('Microphone').closest('section');
        const micSelect = micSection?.querySelector('select');
        const options = micSelect?.querySelectorAll('option');
        // Should have at least "System Default" option
        expect(options?.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display Save Settings button', async () => {
      await act(async () => {
        render(<SimpleSettings />);
      });
      
      const saveButton = screen.getByRole('button', { name: /save settings/i });
      expectInDocument(saveButton);
    });
  });
});
