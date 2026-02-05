/**
 * Integration Tests for IPC Handlers
 * 
 * Tests the inter-process communication handlers that bridge the Electron main
 * process and renderer process. These tests verify that IPC messages are properly
 * handled and that the correct operations are performed.
 * 
 * @module tests/integration/ipcHandlers.test.ts
 * 
 * Validates: Requirements 10.1-10.7
 * - 10.1: WHEN window-minimize is invoked, THE IPC_Handler SHALL minimize the control panel window
 * - 10.2: WHEN window-close is invoked, THE IPC_Handler SHALL close the control panel window
 * - 10.3: WHEN db-save-transcription is invoked, THE IPC_Handler SHALL save the transcription to the database
 * - 10.4: WHEN db-get-transcriptions is invoked, THE IPC_Handler SHALL return transcriptions from the database
 * - 10.5: WHEN paste-text is invoked, THE IPC_Handler SHALL paste text using the clipboard manager
 * - 10.6: WHEN get-active-app-context is invoked, THE IPC_Handler SHALL return the current active application info
 * - 10.7: WHEN invoke-bedrock-model is invoked, THE IPC_Handler SHALL call AWS Bedrock and return the response
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockElectronAPI, type MockElectronAPI, type AppContext, type TranscriptionItem } from '../mocks/electronAPI';
import { createMockDatabaseManager, type MockDatabaseManager } from '../mocks/database';

// ============================================================================
// Test Setup
// ============================================================================

describe('IPC Handlers Integration Tests', () => {
  let mockElectronAPI: MockElectronAPI;
  let mockDatabaseManager: MockDatabaseManager;

  beforeEach(() => {
    // Create fresh mock instances for each test
    mockElectronAPI = createMockElectronAPI();
    mockDatabaseManager = createMockDatabaseManager();
    
    // Install mock on window
    Object.defineProperty(window, 'electronAPI', {
      value: mockElectronAPI,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.__reset();
    mockDatabaseManager.__reset();
  });

  // ==========================================================================
  // Requirement 10.1: window-minimize handler
  // ==========================================================================
  describe('window-minimize handler', () => {
    it('should minimize the control panel window when invoked', async () => {
      // Act
      await window.electronAPI.windowMinimize();

      // Assert
      expect(mockElectronAPI.windowMinimize).toHaveBeenCalledTimes(1);
    });

    it('should resolve successfully after minimizing', async () => {
      // Act & Assert
      await expect(window.electronAPI.windowMinimize()).resolves.toBeUndefined();
    });

    it('should be callable multiple times', async () => {
      // Act
      await window.electronAPI.windowMinimize();
      await window.electronAPI.windowMinimize();
      await window.electronAPI.windowMinimize();

      // Assert
      expect(mockElectronAPI.windowMinimize).toHaveBeenCalledTimes(3);
    });

    it('should not affect other window operations', async () => {
      // Act
      await window.electronAPI.windowMinimize();

      // Assert - other operations should not be called
      expect(mockElectronAPI.windowClose).not.toHaveBeenCalled();
      expect(mockElectronAPI.windowMaximize).not.toHaveBeenCalled();
      expect(mockElectronAPI.hideWindow).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Requirement 10.2: window-close handler
  // ==========================================================================
  describe('window-close handler', () => {
    it('should close the control panel window when invoked', async () => {
      // Act
      await window.electronAPI.windowClose();

      // Assert
      expect(mockElectronAPI.windowClose).toHaveBeenCalledTimes(1);
    });

    it('should resolve successfully after closing', async () => {
      // Act & Assert
      await expect(window.electronAPI.windowClose()).resolves.toBeUndefined();
    });

    it('should be independent of minimize operation', async () => {
      // Act
      await window.electronAPI.windowMinimize();
      await window.electronAPI.windowClose();

      // Assert
      expect(mockElectronAPI.windowMinimize).toHaveBeenCalledTimes(1);
      expect(mockElectronAPI.windowClose).toHaveBeenCalledTimes(1);
    });

    it('should not affect window maximize state', async () => {
      // Act
      await window.electronAPI.windowClose();

      // Assert
      expect(mockElectronAPI.windowMaximize).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Requirement 10.3: db-save-transcription handler
  // ==========================================================================
  describe('db-save-transcription handler', () => {
    it('should save a transcription to the database', async () => {
      // Arrange
      const text = 'Hello, this is a test transcription';

      // Act
      const result = await window.electronAPI.saveTranscription(text);

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(text);
      expect(result).toHaveProperty('id');
      expect(typeof result.id).toBe('number');
    });

    it('should return a unique ID for each saved transcription', async () => {
      // Act
      const result1 = await window.electronAPI.saveTranscription('First transcription');
      const result2 = await window.electronAPI.saveTranscription('Second transcription');
      const result3 = await window.electronAPI.saveTranscription('Third transcription');

      // Assert
      expect(result1.id).not.toBe(result2.id);
      expect(result2.id).not.toBe(result3.id);
      expect(result1.id).not.toBe(result3.id);
    });

    it('should save empty text', async () => {
      // Act
      const result = await window.electronAPI.saveTranscription('');

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith('');
      expect(result).toHaveProperty('id');
    });

    it('should save text with special characters', async () => {
      // Arrange
      const specialText = 'Hello! @#$%^&*() "quotes" \'apostrophes\' <tags> 日本語';

      // Act
      const result = await window.electronAPI.saveTranscription(specialText);

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(specialText);
      expect(result).toHaveProperty('id');
    });

    it('should save long text', async () => {
      // Arrange
      const longText = 'A'.repeat(10000);

      // Act
      const result = await window.electronAPI.saveTranscription(longText);

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(longText);
      expect(result).toHaveProperty('id');
    });

    it('should save text with newlines', async () => {
      // Arrange
      const multilineText = 'Line 1\nLine 2\nLine 3';

      // Act
      const result = await window.electronAPI.saveTranscription(multilineText);

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(multilineText);
      expect(result).toHaveProperty('id');
    });

    it('should add transcription to internal state', async () => {
      // Arrange
      const text = 'Test transcription';

      // Act
      await window.electronAPI.saveTranscription(text);

      // Assert
      const state = mockElectronAPI.__getState();
      expect(state.transcriptions.length).toBe(1);
      expect(state.transcriptions[0].text).toBe(text);
    });
  });

  // ==========================================================================
  // Requirement 10.4: db-get-transcriptions handler
  // ==========================================================================
  describe('db-get-transcriptions handler', () => {
    it('should return transcriptions from the database', async () => {
      // Arrange - add some transcriptions first
      await window.electronAPI.saveTranscription('First');
      await window.electronAPI.saveTranscription('Second');
      await window.electronAPI.saveTranscription('Third');

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(mockElectronAPI.getTranscriptions).toHaveBeenCalledWith(50);
      expect(transcriptions).toHaveLength(3);
    });

    it('should return empty array when no transcriptions exist', async () => {
      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(transcriptions).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      // Arrange - add more transcriptions than the limit
      for (let i = 0; i < 10; i++) {
        await window.electronAPI.saveTranscription(`Transcription ${i}`);
      }

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(5);

      // Assert
      expect(transcriptions).toHaveLength(5);
    });

    it('should return transcriptions in descending order (newest first)', async () => {
      // Arrange
      await window.electronAPI.saveTranscription('First');
      await window.electronAPI.saveTranscription('Second');
      await window.electronAPI.saveTranscription('Third');

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert - newest should be first
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[1].text).toBe('Second');
      expect(transcriptions[2].text).toBe('First');
    });

    it('should return transcriptions with required fields', async () => {
      // Arrange
      await window.electronAPI.saveTranscription('Test transcription');

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(transcriptions[0]).toHaveProperty('id');
      expect(transcriptions[0]).toHaveProperty('text');
      expect(transcriptions[0]).toHaveProperty('timestamp');
    });

    it('should handle limit of 0', async () => {
      // Arrange
      await window.electronAPI.saveTranscription('Test');

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(0);

      // Assert
      expect(transcriptions).toEqual([]);
    });

    it('should handle limit greater than available transcriptions', async () => {
      // Arrange
      await window.electronAPI.saveTranscription('Only one');

      // Act
      const transcriptions = await window.electronAPI.getTranscriptions(100);

      // Assert
      expect(transcriptions).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Requirement 10.5: paste-text handler
  // ==========================================================================
  describe('paste-text handler', () => {
    it('should paste text using the clipboard manager', async () => {
      // Arrange
      const text = 'Text to paste';

      // Act
      await window.electronAPI.pasteText(text);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(text);
      expect(mockElectronAPI.pasteText).toHaveBeenCalledTimes(1);
    });

    it('should resolve successfully after pasting', async () => {
      // Act & Assert
      await expect(window.electronAPI.pasteText('Test')).resolves.toBeUndefined();
    });

    it('should paste empty text', async () => {
      // Act
      await window.electronAPI.pasteText('');

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith('');
    });

    it('should paste text with special characters', async () => {
      // Arrange
      const specialText = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';

      // Act
      await window.electronAPI.pasteText(specialText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(specialText);
    });

    it('should paste multiline text', async () => {
      // Arrange
      const multilineText = 'Line 1\nLine 2\nLine 3\n\nLine 5';

      // Act
      await window.electronAPI.pasteText(multilineText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(multilineText);
    });

    it('should paste unicode text', async () => {
      // Arrange
      const unicodeText = '日本語 中文 한국어 العربية 🎉🚀💻';

      // Act
      await window.electronAPI.pasteText(unicodeText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(unicodeText);
    });

    it('should paste long text', async () => {
      // Arrange
      const longText = 'Lorem ipsum '.repeat(1000);

      // Act
      await window.electronAPI.pasteText(longText);

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(longText);
    });

    it('should be callable multiple times in sequence', async () => {
      // Act
      await window.electronAPI.pasteText('First');
      await window.electronAPI.pasteText('Second');
      await window.electronAPI.pasteText('Third');

      // Assert
      expect(mockElectronAPI.pasteText).toHaveBeenCalledTimes(3);
      expect(mockElectronAPI.pasteText).toHaveBeenNthCalledWith(1, 'First');
      expect(mockElectronAPI.pasteText).toHaveBeenNthCalledWith(2, 'Second');
      expect(mockElectronAPI.pasteText).toHaveBeenNthCalledWith(3, 'Third');
    });
  });

  // ==========================================================================
  // Requirement 10.6: get-active-app-context handler
  // ==========================================================================
  describe('get-active-app-context handler', () => {
    it('should return the current active application info', async () => {
      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(mockElectronAPI.getActiveAppContext).toHaveBeenCalledTimes(1);
      expect(context).toHaveProperty('appName');
      expect(context).toHaveProperty('bundleId');
      expect(context).toHaveProperty('executablePath');
      expect(context).toHaveProperty('windowTitle');
      expect(context).toHaveProperty('platform');
    });

    it('should return default context when no app is detected', async () => {
      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(context.appName).toBe('Unknown');
      expect(context.platform).toBe('darwin');
    });

    it('should return email app context when configured', async () => {
      // Arrange
      const emailContext: AppContext = {
        appName: 'Mail',
        bundleId: 'com.apple.mail',
        executablePath: '/System/Applications/Mail.app',
        windowTitle: 'Inbox - Mail',
        platform: 'darwin'
      };
      mockElectronAPI.__setAppContext(emailContext);

      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(context.appName).toBe('Mail');
      expect(context.bundleId).toBe('com.apple.mail');
    });

    it('should return chat app context when configured', async () => {
      // Arrange
      const slackContext: AppContext = {
        appName: 'Slack',
        bundleId: 'com.tinyspeck.slackmacgap',
        executablePath: '/Applications/Slack.app',
        windowTitle: '#general - Slack',
        platform: 'darwin'
      };
      mockElectronAPI.__setAppContext(slackContext);

      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(context.appName).toBe('Slack');
      expect(context.bundleId).toBe('com.tinyspeck.slackmacgap');
    });

    it('should return context with null values for unknown apps', async () => {
      // Arrange
      const unknownContext: AppContext = {
        appName: 'CustomApp',
        bundleId: null,
        executablePath: null,
        windowTitle: null,
        platform: 'darwin'
      };
      mockElectronAPI.__setAppContext(unknownContext);

      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(context.appName).toBe('CustomApp');
      expect(context.bundleId).toBeNull();
      expect(context.executablePath).toBeNull();
      expect(context.windowTitle).toBeNull();
    });

    it('should return correct platform', async () => {
      // Arrange
      const windowsContext: AppContext = {
        appName: 'Notepad',
        bundleId: null,
        executablePath: 'C:\\Windows\\System32\\notepad.exe',
        windowTitle: 'Untitled - Notepad',
        platform: 'win32'
      };
      mockElectronAPI.__setAppContext(windowsContext);

      // Act
      const context = await window.electronAPI.getActiveAppContext();

      // Assert
      expect(context.platform).toBe('win32');
    });

    it('should be callable multiple times', async () => {
      // Act
      await window.electronAPI.getActiveAppContext();
      await window.electronAPI.getActiveAppContext();
      await window.electronAPI.getActiveAppContext();

      // Assert
      expect(mockElectronAPI.getActiveAppContext).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // Requirement 10.7: invoke-bedrock-model handler
  // ==========================================================================
  describe('invoke-bedrock-model handler', () => {
    it('should call AWS Bedrock and return the response', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Enhance this text: Hello world'
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should return enhanced text', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Test prompt'
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(response).toContain('Enhanced:');
    });

    it('should handle different model IDs', async () => {
      // Arrange
      const params1 = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Test'
      };
      const params2 = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
        prompt: 'Test'
      };

      // Act
      await window.electronAPI.invokeBedrockModel(params1);
      await window.electronAPI.invokeBedrockModel(params2);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenNthCalledWith(1, params1);
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenNthCalledWith(2, params2);
    });

    it('should handle empty prompt', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: ''
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should handle long prompts', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Please enhance this text: ' + 'Lorem ipsum '.repeat(500)
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should handle prompts with special characters', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Enhance: Hello! @#$%^&*() "quotes" \'apostrophes\' <tags>'
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should handle prompts with unicode characters', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Enhance: 日本語 中文 한국어 العربية 🎉'
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should handle optional parameters', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Test',
        maxTokens: 1000,
        temperature: 0.7
      };

      // Act
      const response = await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledWith(params);
      expect(typeof response).toBe('string');
    });

    it('should reject when Bedrock invocation fails', async () => {
      // Arrange
      const errorMessage = 'Bedrock invocation failed';
      mockElectronAPI.invokeBedrockModel.mockRejectedValueOnce(new Error(errorMessage));
      
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Test'
      };

      // Act & Assert
      await expect(window.electronAPI.invokeBedrockModel(params)).rejects.toThrow(errorMessage);
    });

    it('should be callable multiple times in sequence', async () => {
      // Arrange
      const params = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: 'Test'
      };

      // Act
      await window.electronAPI.invokeBedrockModel(params);
      await window.electronAPI.invokeBedrockModel(params);
      await window.electronAPI.invokeBedrockModel(params);

      // Assert
      expect(mockElectronAPI.invokeBedrockModel).toHaveBeenCalledTimes(3);
    });
  });

  // ==========================================================================
  // Additional Integration Tests
  // ==========================================================================
  describe('Combined IPC Operations', () => {
    it('should handle save and retrieve transcription workflow', async () => {
      // Arrange
      const text = 'Test transcription for workflow';

      // Act - Save
      const saveResult = await window.electronAPI.saveTranscription(text);
      
      // Act - Retrieve
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(saveResult.id).toBeDefined();
      expect(transcriptions.length).toBe(1);
      expect(transcriptions[0].text).toBe(text);
      expect(transcriptions[0].id).toBe(saveResult.id);
    });

    it('should handle delete transcription workflow', async () => {
      // Arrange
      const saveResult = await window.electronAPI.saveTranscription('To be deleted');
      
      // Act - Delete
      const deleteResult = await window.electronAPI.deleteTranscription(saveResult.id);
      
      // Act - Verify deletion
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(deleteResult.success).toBe(true);
      expect(transcriptions.length).toBe(0);
    });

    it('should handle clear all transcriptions workflow', async () => {
      // Arrange
      await window.electronAPI.saveTranscription('First');
      await window.electronAPI.saveTranscription('Second');
      await window.electronAPI.saveTranscription('Third');

      // Act - Clear
      const clearResult = await window.electronAPI.clearTranscriptions();
      
      // Act - Verify
      const transcriptions = await window.electronAPI.getTranscriptions(50);

      // Assert
      expect(clearResult.cleared).toBe(3);
      expect(transcriptions.length).toBe(0);
    });

    it('should handle context detection and Bedrock enhancement workflow', async () => {
      // Arrange
      const emailContext: AppContext = {
        appName: 'Mail',
        bundleId: 'com.apple.mail',
        executablePath: '/System/Applications/Mail.app',
        windowTitle: 'Compose',
        platform: 'darwin'
      };
      mockElectronAPI.__setAppContext(emailContext);

      // Act - Get context
      const context = await window.electronAPI.getActiveAppContext();
      
      // Act - Enhance text based on context
      const enhancedText = await window.electronAPI.invokeBedrockModel({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        prompt: `Enhance for ${context.appName}: Hello`
      });

      // Assert
      expect(context.appName).toBe('Mail');
      expect(enhancedText).toBeDefined();
    });

    it('should handle transcription and paste workflow', async () => {
      // Arrange
      const transcribedText = 'This is the transcribed text';

      // Act - Save transcription
      await window.electronAPI.saveTranscription(transcribedText);
      
      // Act - Paste text
      await window.electronAPI.pasteText(transcribedText);

      // Assert
      expect(mockElectronAPI.saveTranscription).toHaveBeenCalledWith(transcribedText);
      expect(mockElectronAPI.pasteText).toHaveBeenCalledWith(transcribedText);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================
  describe('Error Handling', () => {
    it('should handle delete of non-existent transcription', async () => {
      // Act
      const result = await window.electronAPI.deleteTranscription(999);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should handle Bedrock error gracefully', async () => {
      // Arrange
      mockElectronAPI.invokeBedrockModel.mockRejectedValueOnce(new Error('Service unavailable'));

      // Act & Assert
      await expect(
        window.electronAPI.invokeBedrockModel({
          modelId: 'test',
          prompt: 'test'
        })
      ).rejects.toThrow('Service unavailable');
    });
  });
});
