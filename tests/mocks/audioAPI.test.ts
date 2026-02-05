/**
 * Tests for Audio API Mock
 * 
 * Validates that the mock implementations correctly simulate the Web Audio API
 * for testing the Ollie voice dictation app's audio recording functionality.
 * 
 * @module tests/mocks/audioAPI.test
 * 
 * Validates: Requirements 6.1-6.6 (Audio Recording System Testing)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createMockAudioAPI,
  createMockMediaStream,
  createMockMediaStreamTrack,
  createMockAudioContext,
  createMockAudioWorkletNode,
  createMockMediaDevices,
  createMockAudioBuffer,
  createMockSpeechBuffer,
  createPermissionDeniedMock,
  createMultiDeviceMock,
  createNoDevicesMock,
  installMockAudioAPI,
  uninstallMockAudioAPI,
  type MockAudioAPI,
  type MockMediaStreamInstance,
  type MockAudioContextInstance
} from './audioAPI';

describe('Audio API Mock', () => {
  let audioAPI: MockAudioAPI;

  beforeEach(() => {
    audioAPI = createMockAudioAPI();
  });

  describe('MediaDevices Mock', () => {
    describe('getUserMedia', () => {
      it('should return a MediaStream when permission is granted', async () => {
        // Validates: Requirement 6.1 - Request microphone access and begin capture
        const stream = await audioAPI.mediaDevices.getUserMedia({ audio: true });
        
        expect(stream).toBeDefined();
        expect(stream.id).toBeDefined();
        expect(stream.active).toBe(true);
        expect(stream.getAudioTracks()).toHaveLength(1);
      });

      it('should throw NotAllowedError when permission is denied', async () => {
        // Validates: Requirement 6.5 - Emit error callback if access denied
        audioAPI.mediaDevices.__setPermissionGranted(false);
        
        await expect(
          audioAPI.mediaDevices.getUserMedia({ audio: true })
        ).rejects.toThrow('Permission denied');
      });

      it('should track active streams', async () => {
        const stream1 = await audioAPI.mediaDevices.getUserMedia({ audio: true });
        const stream2 = await audioAPI.mediaDevices.getUserMedia({ audio: true });
        
        const activeStreams = audioAPI.mediaDevices.__getActiveStreams();
        expect(activeStreams).toHaveLength(2);
        expect(activeStreams).toContain(stream1);
        expect(activeStreams).toContain(stream2);
      });
    });

    describe('enumerateDevices', () => {
      it('should return list of audio devices', async () => {
        const devices = await audioAPI.mediaDevices.enumerateDevices();
        
        expect(devices).toBeDefined();
        expect(devices.length).toBeGreaterThan(0);
        expect(devices[0]).toHaveProperty('deviceId');
        expect(devices[0]).toHaveProperty('kind');
        expect(devices[0]).toHaveProperty('label');
      });

      it('should include audioinput devices', async () => {
        const devices = await audioAPI.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        
        expect(audioInputs.length).toBeGreaterThan(0);
      });

      it('should allow adding devices dynamically', async () => {
        const initialDevices = await audioAPI.mediaDevices.enumerateDevices();
        
        audioAPI.mediaDevices.__addDevice({
          deviceId: 'test-device',
          groupId: 'test-group',
          kind: 'audioinput',
          label: 'Test Microphone',
          toJSON: () => ({
            deviceId: 'test-device',
            groupId: 'test-group',
            kind: 'audioinput',
            label: 'Test Microphone'
          })
        });
        
        const updatedDevices = await audioAPI.mediaDevices.enumerateDevices();
        expect(updatedDevices.length).toBe(initialDevices.length + 1);
      });

      it('should allow removing devices dynamically', async () => {
        const devices = await audioAPI.mediaDevices.enumerateDevices();
        const deviceToRemove = devices[0];
        
        audioAPI.mediaDevices.__removeDevice(deviceToRemove.deviceId);
        
        const updatedDevices = await audioAPI.mediaDevices.enumerateDevices();
        expect(updatedDevices.length).toBe(devices.length - 1);
        expect(updatedDevices.find(d => d.deviceId === deviceToRemove.deviceId)).toBeUndefined();
      });
    });

    describe('device change events', () => {
      it('should trigger ondevicechange callback', () => {
        const callback = vi.fn();
        audioAPI.mediaDevices.ondevicechange = callback;
        
        audioAPI.mediaDevices.__simulateDeviceChange();
        
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('MediaStream Mock', () => {
    let stream: MockMediaStreamInstance;

    beforeEach(() => {
      stream = createMockMediaStream();
    });

    it('should have a unique ID', () => {
      const stream2 = createMockMediaStream();
      expect(stream.id).toBeDefined();
      expect(stream.id).not.toBe(stream2.id);
    });

    it('should be active by default', () => {
      expect(stream.active).toBe(true);
    });

    it('should have audio tracks', () => {
      const tracks = stream.getAudioTracks();
      expect(tracks).toHaveLength(1);
      expect(tracks[0].kind).toBe('audio');
    });

    it('should allow adding tracks', () => {
      const newTrack = createMockMediaStreamTrack();
      stream.addTrack(newTrack);
      
      expect(stream.getTracks()).toHaveLength(2);
    });

    it('should allow removing tracks', () => {
      const tracks = stream.getTracks();
      const trackToRemove = tracks[0];
      
      stream.removeTrack(trackToRemove);
      
      expect(stream.getTracks()).toHaveLength(0);
    });

    it('should find track by ID', () => {
      const tracks = stream.getTracks();
      const track = stream.getTrackById(tracks[0].id);
      
      expect(track).toBe(tracks[0]);
    });

    it('should return null for non-existent track ID', () => {
      const track = stream.getTrackById('non-existent');
      expect(track).toBeNull();
    });

    it('should clone the stream', () => {
      const clone = stream.clone();
      
      expect(clone.id).not.toBe(stream.id);
      expect(clone.getTracks()).toHaveLength(stream.getTracks().length);
    });
  });

  describe('MediaStreamTrack Mock', () => {
    let track: ReturnType<typeof createMockMediaStreamTrack>;

    beforeEach(() => {
      track = createMockMediaStreamTrack();
    });

    it('should be audio kind', () => {
      expect(track.kind).toBe('audio');
    });

    it('should be enabled by default', () => {
      expect(track.enabled).toBe(true);
    });

    it('should be live by default', () => {
      expect(track.readyState).toBe('live');
    });

    it('should not be muted by default', () => {
      expect(track.muted).toBe(false);
    });

    it('should allow stopping', () => {
      track.stop();
      expect(track.readyState).toBe('ended');
    });

    it('should trigger onended callback when stopped', () => {
      const callback = vi.fn();
      track.onended = callback;
      
      track.stop();
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should simulate mute', () => {
      const callback = vi.fn();
      track.onmute = callback;
      
      track.__simulateMute();
      
      expect(track.muted).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should simulate unmute', () => {
      track.__simulateMute();
      const callback = vi.fn();
      track.onunmute = callback;
      
      track.__simulateUnmute();
      
      expect(track.muted).toBe(false);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return settings', () => {
      const settings = track.getSettings();
      
      expect(settings).toHaveProperty('deviceId');
      expect(settings).toHaveProperty('sampleRate');
      expect(settings).toHaveProperty('channelCount');
    });

    it('should return capabilities', () => {
      const capabilities = track.getCapabilities();
      
      expect(capabilities).toHaveProperty('sampleRate');
      expect(capabilities).toHaveProperty('channelCount');
    });

    it('should clone the track', () => {
      const clone = track.clone();
      
      expect(clone.id).not.toBe(track.id);
      expect(clone.kind).toBe(track.kind);
    });
  });

  describe('AudioContext Mock', () => {
    let context: MockAudioContextInstance;

    beforeEach(() => {
      context = createMockAudioContext();
    });

    it('should be running by default', () => {
      expect(context.state).toBe('running');
    });

    it('should have a sample rate', () => {
      expect(context.sampleRate).toBe(48000);
    });

    it('should have a destination', () => {
      expect(context.destination).toBeDefined();
      expect(context.destination.channelCount).toBe(2);
    });

    it('should have an audio worklet', () => {
      expect(context.audioWorklet).toBeDefined();
      expect(context.audioWorklet.addModule).toBeDefined();
    });

    it('should resume from suspended state', async () => {
      context.__setState('suspended');
      await context.resume();
      
      expect(context.state).toBe('running');
    });

    it('should suspend from running state', async () => {
      await context.suspend();
      
      expect(context.state).toBe('suspended');
    });

    it('should close', async () => {
      await context.close();
      
      expect(context.state).toBe('closed');
    });

    it('should trigger onstatechange callback', async () => {
      const callback = vi.fn();
      context.onstatechange = callback;
      
      await context.suspend();
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should create media stream source', () => {
      const stream = createMockMediaStream();
      const source = context.createMediaStreamSource(stream);
      
      expect(source).toBeDefined();
      expect(source.mediaStream).toBe(stream);
    });

    it('should create gain node', () => {
      const gain = context.createGain();
      
      expect(gain).toBeDefined();
      expect(gain.gain).toBeDefined();
      expect(gain.gain.value).toBe(1);
    });

    it('should create analyser node', () => {
      const analyser = context.createAnalyser();
      
      expect(analyser).toBeDefined();
      expect(analyser.fftSize).toBe(2048);
    });

    it('should create script processor', () => {
      const processor = context.createScriptProcessor(4096, 1, 1);
      
      expect(processor).toBeDefined();
      expect(processor.bufferSize).toBe(4096);
    });

    it('should create audio buffer', () => {
      const buffer = context.createBuffer(1, 1024, 48000);
      
      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(1);
      expect(buffer.length).toBe(1024);
      expect(buffer.sampleRate).toBe(48000);
    });

    it('should decode audio data', async () => {
      const audioData = new ArrayBuffer(1024);
      const buffer = await context.decodeAudioData(audioData);
      
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should track created nodes', () => {
      const stream = createMockMediaStream();
      context.createMediaStreamSource(stream);
      context.createGain();
      context.createAnalyser();
      context.createScriptProcessor();
      
      const nodes = context.__getCreatedNodes();
      expect(nodes.sources).toBe(1);
      expect(nodes.gains).toBe(1);
      expect(nodes.analysers).toBe(1);
      expect(nodes.scriptProcessors).toBe(1);
    });
  });

  describe('AudioWorkletNode Mock', () => {
    let context: MockAudioContextInstance;
    let node: ReturnType<typeof createMockAudioWorkletNode>;

    beforeEach(() => {
      context = createMockAudioContext();
      node = createMockAudioWorkletNode(context, 'test-processor');
    });

    it('should have a message port', () => {
      expect(node.port).toBeDefined();
      expect(node.port.postMessage).toBeDefined();
    });

    it('should have correct number of inputs/outputs', () => {
      expect(node.numberOfInputs).toBe(1);
      expect(node.numberOfOutputs).toBe(1);
    });

    it('should post messages through port', () => {
      const message = { type: 'test', data: 'hello' };
      node.port.postMessage(message);
      
      const messages = node.__getMessagesSent();
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(message);
    });

    it('should simulate audio chunk', () => {
      const callback = vi.fn();
      node.port.onmessage = callback;
      
      const pcmData = new Int16Array([1, 2, 3, 4]);
      node.__simulateAudioChunk(pcmData);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0].data.type).toBe('audio-chunk');
    });

    it('should simulate error', () => {
      const callback = vi.fn();
      node.onprocessorerror = callback;
      
      const error = new Error('Test error');
      node.__simulateError(error);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility Functions', () => {
    describe('createMockAudioBuffer', () => {
      it('should create buffer with correct duration', () => {
        const buffer = createMockAudioBuffer(1000, 16000);
        const view = new Int16Array(buffer);
        
        expect(view.length).toBe(16000); // 1 second at 16kHz
      });

      it('should create silent buffer', () => {
        const buffer = createMockAudioBuffer(100, 16000);
        const view = new Int16Array(buffer);
        
        // Check that all samples are zero (silence)
        const allZero = Array.from(view).every(sample => sample === 0);
        expect(allZero).toBe(true);
      });
    });

    describe('createMockSpeechBuffer', () => {
      it('should create buffer with noise', () => {
        const buffer = createMockSpeechBuffer(100, 16000);
        const view = new Int16Array(buffer);
        
        // Check that not all samples are zero (has noise)
        const hasNoise = Array.from(view).some(sample => sample !== 0);
        expect(hasNoise).toBe(true);
      });
    });
  });

  describe('Pre-configured Mock Factories', () => {
    it('should create permission denied mock', async () => {
      const deniedAPI = createPermissionDeniedMock();
      
      await expect(
        deniedAPI.mediaDevices.getUserMedia({ audio: true })
      ).rejects.toThrow('Permission denied');
    });

    it('should create multi-device mock', async () => {
      const multiDeviceAPI = createMultiDeviceMock();
      const devices = await multiDeviceAPI.mediaDevices.enumerateDevices();
      
      expect(devices.length).toBeGreaterThan(3); // More than default
    });

    it('should create no devices mock', async () => {
      const noDevicesAPI = createNoDevicesMock();
      const devices = await noDevicesAPI.mediaDevices.enumerateDevices();
      
      expect(devices).toHaveLength(0);
    });
  });

  describe('Global Installation', () => {
    it('should install mock globally', () => {
      const mock = installMockAudioAPI();
      
      expect(navigator.mediaDevices).toBeDefined();
      expect(window.AudioContext).toBeDefined();
      expect(window.AudioWorkletNode).toBeDefined();
    });

    it('should uninstall mock from globals', () => {
      installMockAudioAPI();
      uninstallMockAudioAPI();
      
      expect(navigator.mediaDevices).toBeUndefined();
      expect(window.AudioContext).toBeUndefined();
      expect(window.AudioWorkletNode).toBeUndefined();
    });
  });

  describe('Mock State Management', () => {
    it('should get current state', () => {
      const state = audioAPI.__getState();
      
      expect(state).toHaveProperty('permissionGranted');
      expect(state).toHaveProperty('devices');
      expect(state).toHaveProperty('activeStreams');
      expect(state).toHaveProperty('activeContexts');
    });

    it('should set permission state', () => {
      audioAPI.__setState({ permissionGranted: false });
      const state = audioAPI.__getState();
      
      expect(state.permissionGranted).toBe(false);
    });

    it('should reset to initial state', () => {
      audioAPI.__setState({ permissionGranted: false });
      audioAPI.__reset();
      
      const state = audioAPI.__getState();
      expect(state.permissionGranted).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should support complete recording workflow', async () => {
      // Validates: Requirement 6.1-6.3 - Complete recording cycle
      
      // 1. Request microphone access
      const stream = await audioAPI.mediaDevices.getUserMedia({ audio: true });
      expect(stream.active).toBe(true);
      
      // 2. Create audio context
      const context = new audioAPI.AudioContext();
      expect(context.state).toBe('running');
      
      // 3. Create media stream source
      const source = context.createMediaStreamSource(stream);
      expect(source).toBeDefined();
      
      // 4. Create worklet node for processing
      const worklet = new audioAPI.AudioWorkletNode(context, 'audio-processor');
      expect(worklet.port).toBeDefined();
      
      // 5. Stop recording
      stream.getTracks().forEach(track => track.stop());
      expect(stream.getTracks()[0].readyState).toBe('ended');
    });

    it('should handle permission denial gracefully', async () => {
      // Validates: Requirement 6.5 - Error handling for denied access
      audioAPI.mediaDevices.__setPermissionGranted(false);
      
      let errorCaught = false;
      try {
        await audioAPI.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(DOMException);
        expect((error as DOMException).name).toBe('NotAllowedError');
      }
      
      expect(errorCaught).toBe(true);
    });

    it('should support audio context state transitions', async () => {
      // Validates: Requirement 6.2 - Audio context lifecycle
      const context = new audioAPI.AudioContext();
      
      expect(context.state).toBe('running');
      
      await context.suspend();
      expect(context.state).toBe('suspended');
      
      await context.resume();
      expect(context.state).toBe('running');
      
      await context.close();
      expect(context.state).toBe('closed');
    });
  });
});
