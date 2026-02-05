/**
 * Tests to verify the global mocks in setup.ts are working correctly
 */

import { describe, it, expect, vi } from 'vitest';
import {
  mockElectronAPI,
  mockLocalStorage,
  mockMediaDevices,
  MockAudioContext,
  MockAudioWorkletNode
} from './setup';

describe('Global Mock Setup', () => {
  describe('window.electronAPI mock', () => {
    it('should be defined on window', () => {
      expect(window.electronAPI).toBeDefined();
    });

    it('should have all window management functions', () => {
      expect(window.electronAPI.hideWindow).toBeDefined();
      expect(window.electronAPI.showDictationPanel).toBeDefined();
      expect(window.electronAPI.windowMinimize).toBeDefined();
      expect(window.electronAPI.windowClose).toBeDefined();
    });

    it('should have all database functions', async () => {
      const result = await window.electronAPI.saveTranscription('test text');
      expect(result).toHaveProperty('id');
      expect(result.id).toBe(1);

      const transcriptions = await window.electronAPI.getTranscriptions(10);
      expect(transcriptions).toHaveLength(1);
      expect(transcriptions[0].text).toBe('test text');
    });

    it('should have all streaming transcription functions', () => {
      expect(window.electronAPI.streamingTranscribeStart).toBeDefined();
      expect(window.electronAPI.streamingTranscribeChunk).toBeDefined();
      expect(window.electronAPI.streamingTranscribeEnd).toBeDefined();
      expect(window.electronAPI.onStreamingPartial).toBeDefined();
      expect(window.electronAPI.onStreamingFinal).toBeDefined();
      expect(window.electronAPI.onStreamingLanguage).toBeDefined();
      expect(window.electronAPI.onStreamingError).toBeDefined();
    });

    it('should have clipboard functions', async () => {
      await window.electronAPI.writeClipboard('test clipboard');
      const content = await window.electronAPI.readClipboard();
      expect(content).toBe('test clipboard');
    });

    it('should have hotkey functions', async () => {
      const result = await window.electronAPI.updateHotkey('F');
      expect(result.success).toBe(true);
    });

    it('should have Bedrock functions', async () => {
      const result = await window.electronAPI.invokeBedrockModel({
        modelId: 'test-model',
        prompt: 'test prompt'
      });
      expect(result).toBe('Enhanced: test prompt');
    });

    it('should have context detection function', async () => {
      const context = await window.electronAPI.getActiveAppContext();
      expect(context).toHaveProperty('appName');
      expect(context).toHaveProperty('platform');
    });

    it('should support event listener registration', () => {
      const callback = vi.fn();
      window.electronAPI.onToggleDictation(callback);
      
      // Emit event using test helper
      mockElectronAPI.__emitEvent('toggle-dictation');
      expect(callback).toHaveBeenCalled();
    });

    it('should reset state between tests', () => {
      // This test verifies that the beforeEach hook resets state
      // The transcription from the previous test should not exist
      expect(mockElectronAPI.__getState().transcriptions).toHaveLength(0);
    });
  });

  describe('localStorage mock', () => {
    it('should be defined on window', () => {
      expect(window.localStorage).toBeDefined();
    });

    it('should store and retrieve values', () => {
      window.localStorage.setItem('testKey', 'testValue');
      expect(window.localStorage.getItem('testKey')).toBe('testValue');
    });

    it('should return null for non-existent keys', () => {
      expect(window.localStorage.getItem('nonExistent')).toBeNull();
    });

    it('should remove items', () => {
      window.localStorage.setItem('toRemove', 'value');
      window.localStorage.removeItem('toRemove');
      expect(window.localStorage.getItem('toRemove')).toBeNull();
    });

    it('should clear all items', () => {
      window.localStorage.setItem('key1', 'value1');
      window.localStorage.setItem('key2', 'value2');
      window.localStorage.clear();
      expect(window.localStorage.length).toBe(0);
    });
  });

  describe('navigator.mediaDevices mock', () => {
    it('should be defined on navigator', () => {
      expect(navigator.mediaDevices).toBeDefined();
    });

    it('should return a MediaStream from getUserMedia', async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      expect(stream).toBeDefined();
      expect(stream.getAudioTracks()).toHaveLength(1);
    });

    it('should enumerate devices', async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices.some(d => d.kind === 'audioinput')).toBe(true);
    });

    it('should reject getUserMedia when permission denied', async () => {
      mockMediaDevices.__setPermissionGranted(false);
      await expect(navigator.mediaDevices.getUserMedia({ audio: true }))
        .rejects.toThrow('Permission denied');
    });
  });

  describe('AudioContext mock', () => {
    it('should be defined on window', () => {
      expect(window.AudioContext).toBeDefined();
    });

    it('should create an AudioContext instance', () => {
      const ctx = new AudioContext();
      expect(ctx.state).toBe('running');
      expect(ctx.sampleRate).toBe(48000);
    });

    it('should create MediaStreamSource', async () => {
      const ctx = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = ctx.createMediaStreamSource(stream);
      expect(source).toBeDefined();
      expect(source.mediaStream).toBe(stream);
    });

    it('should create GainNode', () => {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      expect(gain).toBeDefined();
      expect(gain.gain.value).toBe(1);
    });

    it('should create AnalyserNode', () => {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      expect(analyser).toBeDefined();
      expect(analyser.fftSize).toBe(2048);
    });

    it('should support audioWorklet.addModule', async () => {
      const ctx = new AudioContext();
      await expect(ctx.audioWorklet.addModule('test-processor.js')).resolves.toBeUndefined();
    });

    it('should support suspend and resume', async () => {
      const ctx = new AudioContext();
      await ctx.suspend();
      expect(ctx.state).toBe('suspended');
      await ctx.resume();
      expect(ctx.state).toBe('running');
    });

    it('should support close', async () => {
      const ctx = new AudioContext();
      await ctx.close();
      expect(ctx.state).toBe('closed');
    });
  });

  describe('AudioWorkletNode mock', () => {
    it('should be defined on window', () => {
      expect(window.AudioWorkletNode).toBeDefined();
    });

    it('should create an AudioWorkletNode instance', () => {
      const ctx = new AudioContext();
      const node = new AudioWorkletNode(ctx, 'test-processor');
      expect(node).toBeDefined();
      expect(node.port).toBeDefined();
      expect(node.port.postMessage).toBeDefined();
    });

    it('should have connect and disconnect methods', () => {
      const ctx = new AudioContext();
      const node = new AudioWorkletNode(ctx, 'test-processor');
      expect(node.connect).toBeDefined();
      expect(node.disconnect).toBeDefined();
    });
  });
});
