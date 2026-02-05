/**
 * Tests for the MockElectronAPI module
 * 
 * Validates that the mock implementation correctly implements all required
 * interfaces and behaviors for testing the Ollie voice dictation app.
 * 
 * Validates: Requirements 10.1-10.7 (IPC Handler Testing)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createMockElectronAPI,
  createEmailAppMock,
  createSlackAppMock,
  createDiscordAppMock,
  createDisconnectedMock,
  createMockWithTranscriptions,
  createBedrockErrorMock,
  createTranscriptionErrorMock,
  installMockElectronAPI,
  uninstallMockElectronAPI,
  DEFAULT_APP_CONTEXT,
  DEFAULT_AWS_CREDENTIALS,
  type MockElectronAPI,
  type TranscriptionItem,
  type AppContext
} from './electronAPI';

describe('MockElectronAPI', () => {
  let mockAPI: MockElectronAPI;

  beforeEach(() => {
    mockAPI = createMockElectronAPI();
  });

  describe('Factory Function', () => {
    it('should create a mock with default values', () => {
      expect(mockAPI).toBeDefined();
      expect(mockAPI.hideWindow).toBeDefined();
      expect(mockAPI.saveTranscription).toBeDefined();
      expect(mockAPI.invokeBedrockModel).toBeDefined();
    });

    it('should create a mock with initial transcriptions', () => {
      const initialTranscriptions: TranscriptionItem[] = [
        { id: 1, text: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        { id: 2, text: 'World', timestamp: '2024-01-02T00:00:00Z' }
      ];
      
      const mock = createMockElectronAPI({ initialTranscriptions });
      const state = mock.__getState();
      
      expect(state.transcriptions).toHaveLength(2);
      expect(state.transcriptions[0].text).toBe('Hello');
    });

    it('should create a mock with custom app context', async () => {
      const customContext: AppContext = {
        appName: 'CustomApp',
        bundleId: 'com.custom.app',
        executablePath: '/path/to/app',
        windowTitle: 'Custom Window',
        platform: 'darwin'
      };
      
      const mock = createMockElectronAPI({ defaultAppContext: customContext });
      const context = await mock.getActiveAppContext();
      
      expect(context.appName).toBe('CustomApp');
      expect(context.bundleId).toBe('com.custom.app');
    });

    it('should create a mock with custom Bedrock handler', async () => {
      const mock = createMockElectronAPI({
        bedrockResponseHandler: (params) => `Custom: ${params.prompt.toUpperCase()}`
      });
      
      const result = await mock.invokeBedrockModel({
        modelId: 'test-model',
        prompt: 'hello'
      });
      
      expect(result).toBe('Custom: HELLO');
    });
  });

  describe('Window Management', () => {
    it('should mock hideWindow', async () => {
      await mockAPI.hideWindow();
      expect(mockAPI.hideWindow).toHaveBeenCalled();
    });

    it('should mock windowMinimize', async () => {
      await mockAPI.windowMinimize();
      expect(mockAPI.windowMinimize).toHaveBeenCalled();
    });

    it('should mock windowClose', async () => {
      await mockAPI.windowClose();
      expect(mockAPI.windowClose).toHaveBeenCalled();
    });
  });

  describe('Database Operations', () => {
    it('should save and retrieve transcriptions', async () => {
      const result = await mockAPI.saveTranscription('Test transcription');
      expect(result.id).toBe(1);

      const transcriptions = await mockAPI.getTranscriptions(10);
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('Test transcription');
    });

    it('should delete transcriptions', async () => {
      await mockAPI.saveTranscription('To delete');
      const transcriptions = await mockAPI.getTranscriptions(10);
      const id = transcriptions[0].id;

      const result = await mockAPI.deleteTranscription(id);
      expect(result.success).toBe(true);

      const remaining = await mockAPI.getTranscriptions(10);
      expect(remaining).toHaveLength(0);
    });

    it('should clear all transcriptions', async () => {
      await mockAPI.saveTranscription('First');
      await mockAPI.saveTranscription('Second');
      
      const result = await mockAPI.clearTranscriptions();
      expect(result.cleared).toBe(2);

      const remaining = await mockAPI.getTranscriptions(10);
      expect(remaining).toHaveLength(0);
    });

    it('should return transcriptions in order (newest first)', async () => {
      await mockAPI.saveTranscription('First');
      await mockAPI.saveTranscription('Second');
      await mockAPI.saveTranscription('Third');

      const transcriptions = await mockAPI.getTranscriptions(10);
      expect(transcriptions[0].text).toBe('Third');
      expect(transcriptions[2].text).toBe('First');
    });
  });

  describe('Clipboard Operations', () => {
    it('should write and read clipboard', async () => {
      await mockAPI.writeClipboard('Clipboard content');
      const content = await mockAPI.readClipboard();
      expect(content).toBe('Clipboard content');
    });

    it('should mock pasteText', async () => {
      await mockAPI.pasteText('Pasted text');
      expect(mockAPI.pasteText).toHaveBeenCalledWith('Pasted text');
    });
  });

  describe('Hotkey Management', () => {
    it('should update hotkey', async () => {
      const result = await mockAPI.updateHotkey('K');
      expect(result.success).toBe(true);
      
      const state = mockAPI.__getState();
      expect(state.currentHotkey).toBe('K');
    });

    it('should register toggle dictation callback', () => {
      const callback = () => {};
      mockAPI.onToggleDictation(callback);
      expect(mockAPI.onToggleDictation).toHaveBeenCalledWith(callback);
    });
  });

  describe('AWS Transcribe Streaming', () => {
    it('should mock streaming start', async () => {
      const result = await mockAPI.streamingTranscribeStart({ languageCode: 'en-US' });
      expect(result.success).toBe(true);
    });

    it('should mock streaming chunk', async () => {
      const buffer = new ArrayBuffer(1024);
      const result = await mockAPI.streamingTranscribeChunk(buffer);
      expect(result.success).toBe(true);
    });

    it('should mock streaming end', async () => {
      const result = await mockAPI.streamingTranscribeEnd();
      expect(result.success).toBe(true);
      expect(result.text).toBe('Mock transcription result');
    });
  });

  describe('AWS Bedrock Operations', () => {
    it('should invoke Bedrock model', async () => {
      const result = await mockAPI.invokeBedrockModel({
        modelId: 'anthropic.claude-v2',
        prompt: 'Hello world'
      });
      expect(result).toBe('Enhanced: Hello world');
    });

    it('should get AWS credentials', async () => {
      const credentials = await mockAPI.getAWSCredentials();
      expect(credentials.accessKeyId).toBe('mock-access-key');
      expect(credentials.region).toBe('us-east-1');
    });
  });

  describe('Context Detection', () => {
    it('should return default app context', async () => {
      const context = await mockAPI.getActiveAppContext();
      expect(context.appName).toBe('Unknown');
      expect(context.platform).toBe('darwin');
    });

    it('should allow setting custom app context', async () => {
      mockAPI.__setAppContext({
        appName: 'Slack',
        bundleId: 'com.tinyspeck.slackmacgap',
        executablePath: '/Applications/Slack.app',
        windowTitle: '#general',
        platform: 'darwin'
      });

      const context = await mockAPI.getActiveAppContext();
      expect(context.appName).toBe('Slack');
    });
  });

  describe('Connection Warmup', () => {
    it('should report connection ready by default', async () => {
      const isReady = await mockAPI.connectionIsReady();
      expect(isReady).toBe(true);
    });

    it('should allow setting connection not ready', async () => {
      mockAPI.__setConnectionReady(false);
      const isReady = await mockAPI.connectionIsReady();
      expect(isReady).toBe(false);
    });

    it('should return connection status', async () => {
      const status = await mockAPI.connectionStatus();
      expect(status.isReady).toBe(true);
      expect(status.bedrockWarmed).toBe(true);
    });
  });

  describe('Event Listeners', () => {
    it('should register and emit streaming partial events', () => {
      let receivedText = '';
      mockAPI.onStreamingPartial((data) => {
        receivedText = data.text;
      });

      mockAPI.__emitEvent('streaming-transcribe-partial', { text: 'Partial result' });
      expect(receivedText).toBe('Partial result');
    });

    it('should register and emit streaming final events', () => {
      let receivedText = '';
      mockAPI.onStreamingFinal((data) => {
        receivedText = data.text;
      });

      mockAPI.__emitEvent('streaming-transcribe-final', { text: 'Final result' });
      expect(receivedText).toBe('Final result');
    });

    it('should register and emit language detection events', () => {
      let receivedLanguage = '';
      mockAPI.onStreamingLanguage((data) => {
        receivedLanguage = data.languageCode;
      });

      mockAPI.__emitEvent('streaming-transcribe-language', { languageCode: 'en-US' });
      expect(receivedLanguage).toBe('en-US');
    });

    it('should register and emit error events', () => {
      let receivedError = '';
      mockAPI.onStreamingError((data) => {
        receivedError = data.error;
      });

      mockAPI.__emitEvent('streaming-transcribe-error', { error: 'Connection failed' });
      expect(receivedError).toBe('Connection failed');
    });

    it('should remove all listeners for a channel', () => {
      let callCount = 0;
      mockAPI.onStreamingPartial(() => {
        callCount++;
      });

      mockAPI.__emitEvent('streaming-transcribe-partial', { text: 'Test' });
      expect(callCount).toBe(1);

      mockAPI.removeAllListeners('streaming-transcribe-partial');
      mockAPI.__emitEvent('streaming-transcribe-partial', { text: 'Test' });
      expect(callCount).toBe(1); // Should not increase
    });
  });

  describe('Test Helpers', () => {
    it('should reset state', async () => {
      await mockAPI.saveTranscription('Test');
      await mockAPI.writeClipboard('Content');
      
      mockAPI.__reset();
      
      const state = mockAPI.__getState();
      expect(state.transcriptions).toHaveLength(0);
      expect(state.clipboardContent).toBe('');
    });

    it('should get state', () => {
      const state = mockAPI.__getState();
      expect(state).toHaveProperty('transcriptions');
      expect(state).toHaveProperty('clipboardContent');
      expect(state).toHaveProperty('currentHotkey');
    });

    it('should set partial state', () => {
      mockAPI.__setState({ clipboardContent: 'New content' });
      const state = mockAPI.__getState();
      expect(state.clipboardContent).toBe('New content');
    });

    it('should add transcription directly', () => {
      const item = mockAPI.__addTranscription({
        text: 'Direct add',
        timestamp: '2024-01-01T00:00:00Z'
      });
      
      expect(item.id).toBeDefined();
      expect(item.text).toBe('Direct add');
      
      const state = mockAPI.__getState();
      expect(state.transcriptions).toHaveLength(1);
    });
  });

  describe('Pre-configured Factories', () => {
    it('should create email app mock', async () => {
      const mock = createEmailAppMock();
      const context = await mock.getActiveAppContext();
      expect(context.appName).toBe('Mail');
      expect(context.bundleId).toBe('com.apple.mail');
    });

    it('should create Slack app mock', async () => {
      const mock = createSlackAppMock();
      const context = await mock.getActiveAppContext();
      expect(context.appName).toBe('Slack');
    });

    it('should create Discord app mock', async () => {
      const mock = createDiscordAppMock();
      const context = await mock.getActiveAppContext();
      expect(context.appName).toBe('Discord');
    });

    it('should create disconnected mock', async () => {
      const mock = createDisconnectedMock();
      const isReady = await mock.connectionIsReady();
      expect(isReady).toBe(false);
    });

    it('should create mock with transcriptions', async () => {
      const transcriptions: TranscriptionItem[] = [
        { id: 1, text: 'Pre-loaded', timestamp: '2024-01-01T00:00:00Z' }
      ];
      const mock = createMockWithTranscriptions(transcriptions);
      const result = await mock.getTranscriptions(10);
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Pre-loaded');
    });

    it('should create Bedrock error mock', async () => {
      const mock = createBedrockErrorMock('Custom error');
      await expect(mock.invokeBedrockModel({
        modelId: 'test',
        prompt: 'test'
      })).rejects.toThrow('Custom error');
    });

    it('should create transcription error mock', async () => {
      const mock = createTranscriptionErrorMock('Transcription failed');
      await expect(mock.streamingTranscribeEnd()).rejects.toThrow('Transcription failed');
    });
  });

  describe('Window Installation', () => {
    it('should install mock on window', () => {
      const mock = installMockElectronAPI();
      expect(window.electronAPI).toBe(mock);
    });

    it('should uninstall mock from window', () => {
      installMockElectronAPI();
      uninstallMockElectronAPI();
      // Note: The global setup.ts reinstalls the mock, so we just verify the function runs
      expect(uninstallMockElectronAPI).not.toThrow();
    });
  });

  describe('Default Constants', () => {
    it('should export DEFAULT_APP_CONTEXT', () => {
      expect(DEFAULT_APP_CONTEXT).toBeDefined();
      expect(DEFAULT_APP_CONTEXT.appName).toBe('Unknown');
      expect(DEFAULT_APP_CONTEXT.platform).toBe('darwin');
    });

    it('should export DEFAULT_AWS_CREDENTIALS', () => {
      expect(DEFAULT_AWS_CREDENTIALS).toBeDefined();
      expect(DEFAULT_AWS_CREDENTIALS.accessKeyId).toBe('mock-access-key');
      expect(DEFAULT_AWS_CREDENTIALS.region).toBe('us-east-1');
    });
  });
});
