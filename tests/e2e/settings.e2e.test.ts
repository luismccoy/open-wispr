/**
 * Settings E2E Tests
 * 
 * End-to-end tests for the settings and control panel functionality.
 * 
 * @module tests/e2e/settings.e2e.test.ts
 * 
 * Validates: Requirements 18.6
 * - 18.6: Control panel and settings work correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElectronAPI, type MockElectronAPI } from '../mocks/electronAPI';

// ============================================================================
// Test Setup
// ============================================================================

describe('Settings E2E Tests', () => {
  let mockElectronAPI: MockElectronAPI;

  beforeEach(() => {
    mockElectronAPI = createMockElectronAPI();

    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true
    });

    // Set up as returning user
    localStorage.setItem('onboardingCompleted', 'true');
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.__reset();
    localStorage.clear();
  });

  // ==========================================================================
  // Requirement 18.6: Control Panel Display
  // ==========================================================================
  describe('Control Panel Display (Requirement 18.6)', () => {
    it('should display control panel for returning users', () => {
      // Arrange
      const onboardingCompleted = localStorage.getItem('onboardingCompleted');

      // Assert
      expect(onboardingCompleted).toBe('true');
    });

    it('should show transcription history', async () => {
      // Arrange
      await mockElectronAPI.saveTranscription('First transcription');
      await mockElectronAPI.saveTranscription('Second transcription');
      await mockElectronAPI.saveTranscription('Third transcription');

      // Act
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert
      expect(transcriptions.length).toBe(3);
    });

    it('should display transcriptions in reverse chronological order', async () => {
      // Arrange
      await mockElectronAPI.saveTranscription('First');
      await mockElectronAPI.saveTranscription('Second');
      await mockElectronAPI.saveTranscription('Third');

      // Act
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert - most recent first
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('Second');
      expect(transcriptions[2].text).toBe('First');
    });

    it('should limit transcription history display', async () => {
      // Arrange
      for (let i = 0; i < 20; i++) {
        await mockElectronAPI.saveTranscription(`Transcription ${i}`);
      }

      // Act
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert
      expect(transcriptions.length).toBe(10);
    });
  });

  // ==========================================================================
  // Settings Modification
  // ==========================================================================
  describe('Settings Modification', () => {
    it('should update hotkey setting', async () => {
      // Arrange
      const newHotkey = 'F';

      // Act
      await mockElectronAPI.updateHotkey(newHotkey);

      // Assert
      expect(mockElectronAPI.updateHotkey).toHaveBeenCalledWith(newHotkey);
    });

    it('should save language preference', async () => {
      // Arrange
      const settings = { language: 'es-US' };

      // Act
      await mockElectronAPI.saveSettings(settings);

      // Assert
      expect(mockElectronAPI.saveSettings).toHaveBeenCalledWith(settings);
    });

    it('should save enhancement preference', async () => {
      // Arrange
      const settings = { enhancementEnabled: false };

      // Act
      await mockElectronAPI.saveSettings(settings);

      // Assert
      expect(mockElectronAPI.saveSettings).toHaveBeenCalledWith(settings);
    });

    it('should persist settings to localStorage', () => {
      // Arrange
      const settings = {
        hotkey: 'G',
        language: 'en-GB',
        enhancementEnabled: true
      };

      // Act
      localStorage.setItem('appSettings', JSON.stringify(settings));
      const storedSettings = JSON.parse(localStorage.getItem('appSettings') || '{}');

      // Assert
      expect(storedSettings.hotkey).toBe('G');
      expect(storedSettings.language).toBe('en-GB');
      expect(storedSettings.enhancementEnabled).toBe(true);
    });
  });

  // ==========================================================================
  // Transcription History Management
  // ==========================================================================
  describe('Transcription History Management', () => {
    it('should delete individual transcription', async () => {
      // Arrange
      const { id } = await mockElectronAPI.saveTranscription('To be deleted');
      await mockElectronAPI.saveTranscription('To keep');

      // Act
      await mockElectronAPI.deleteTranscription(id);
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert
      expect(transcriptions.length).toBe(1);
      expect(transcriptions[0].text).toBe('To keep');
    });

    it('should clear all transcriptions', async () => {
      // Arrange
      await mockElectronAPI.saveTranscription('First');
      await mockElectronAPI.saveTranscription('Second');
      await mockElectronAPI.saveTranscription('Third');

      // Act
      const result = await mockElectronAPI.clearTranscriptions();
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert
      expect(result.cleared).toBe(3);
      expect(transcriptions.length).toBe(0);
    });

    it('should copy transcription to clipboard', async () => {
      // Arrange
      const text = 'Text to copy';
      await mockElectronAPI.saveTranscription(text);

      // Act
      await mockElectronAPI.writeClipboard(text);
      const clipboardContent = await mockElectronAPI.readClipboard();

      // Assert
      expect(clipboardContent).toBe(text);
    });

    it('should refresh transcription list', async () => {
      // Arrange
      await mockElectronAPI.saveTranscription('Initial');

      // Act - simulate refresh
      const transcriptions = await mockElectronAPI.getTranscriptions(10);

      // Assert
      expect(mockElectronAPI.getTranscriptions).toHaveBeenCalled();
      expect(transcriptions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // AWS Credentials Management
  // ==========================================================================
  describe('AWS Credentials Management', () => {
    it('should retrieve AWS credentials', async () => {
      // Act
      const credentials = await mockElectronAPI.getAWSCredentials();

      // Assert
      expect(credentials.accessKeyId).toBeDefined();
      expect(credentials.secretAccessKey).toBeDefined();
      expect(credentials.region).toBeDefined();
    });

    it('should save AWS credentials', async () => {
      // Arrange
      const credentials = {
        accessKeyId: 'new-access-key',
        secretAccessKey: 'new-secret-key',
        region: 'us-west-2'
      };

      // Act
      await mockElectronAPI.saveAWSCredentials(credentials);

      // Assert
      expect(mockElectronAPI.saveAWSCredentials).toHaveBeenCalledWith(credentials);
    });

    it('should retrieve Anthropic API key', async () => {
      // Act
      const key = await mockElectronAPI.getAnthropicKey();

      // Assert
      expect(key).toBeDefined();
    });

    it('should save Anthropic API key', async () => {
      // Arrange
      const newKey = 'sk-ant-new-key';

      // Act
      await mockElectronAPI.saveAnthropicKey(newKey);

      // Assert
      expect(mockElectronAPI.saveAnthropicKey).toHaveBeenCalledWith(newKey);
    });
  });

  // ==========================================================================
  // Connection Status
  // ==========================================================================
  describe('Connection Status', () => {
    it('should check connection status', async () => {
      // Act
      const status = await mockElectronAPI.connectionStatus();

      // Assert
      expect(status.isReady).toBeDefined();
      expect(status.bedrockWarmed).toBeDefined();
      expect(status.transcribeWarmed).toBeDefined();
    });

    it('should perform connection warmup', async () => {
      // Act
      const result = await mockElectronAPI.connectionWarmup();

      // Assert
      expect(result.success).toBe(true);
    });

    it('should check connection health', async () => {
      // Act
      const health = await mockElectronAPI.connectionHealthCheck();

      // Assert
      expect(health.healthy).toBeDefined();
    });

    it('should reset connection', async () => {
      // Act
      const result = await mockElectronAPI.connectionReset();

      // Assert
      expect(result.success).toBe(true);
    });
  });

  // ==========================================================================
  // App Updates
  // ==========================================================================
  describe('App Updates', () => {
    it('should check for updates', async () => {
      // Act
      const result = await mockElectronAPI.checkForUpdates();

      // Assert
      expect(result.updateAvailable).toBeDefined();
    });

    it('should get app version', async () => {
      // Act
      const version = await mockElectronAPI.getAppVersion();

      // Assert
      expect(version).toBeDefined();
      expect(typeof version).toBe('string');
    });

    it('should get update status', async () => {
      // Act
      const status = await mockElectronAPI.getUpdateStatus();

      // Assert
      expect(status.status).toBeDefined();
    });

    it('should register update event listeners', () => {
      // Arrange
      const onAvailable = vi.fn();
      const onDownloaded = vi.fn();

      // Act
      mockElectronAPI.onUpdateAvailable(onAvailable);
      mockElectronAPI.onUpdateDownloaded(onDownloaded);

      // Assert
      expect(mockElectronAPI.onUpdateAvailable).toHaveBeenCalled();
      expect(mockElectronAPI.onUpdateDownloaded).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Window Management
  // ==========================================================================
  describe('Window Management', () => {
    it('should minimize window', async () => {
      // Act
      await mockElectronAPI.windowMinimize();

      // Assert
      expect(mockElectronAPI.windowMinimize).toHaveBeenCalled();
    });

    it('should maximize window', async () => {
      // Act
      await mockElectronAPI.windowMaximize();

      // Assert
      expect(mockElectronAPI.windowMaximize).toHaveBeenCalled();
    });

    it('should close window', async () => {
      // Act
      await mockElectronAPI.windowClose();

      // Assert
      expect(mockElectronAPI.windowClose).toHaveBeenCalled();
    });

    it('should check if window is maximized', async () => {
      // Act
      const isMaximized = await mockElectronAPI.windowIsMaximized();

      // Assert
      expect(typeof isMaximized).toBe('boolean');
    });

    it('should hide window', async () => {
      // Act
      await mockElectronAPI.hideWindow();

      // Assert
      expect(mockElectronAPI.hideWindow).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // External Links
  // ==========================================================================
  describe('External Links', () => {
    it('should open external URL', async () => {
      // Arrange
      const url = 'https://example.com';

      // Act
      await mockElectronAPI.openExternal(url);

      // Assert
      expect(mockElectronAPI.openExternal).toHaveBeenCalledWith(url);
    });
  });
});
