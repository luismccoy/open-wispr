/**
 * Streaming Audio Manager - Real-time transcription with sub-2-second latency
 * 
 * Key differences from batch AudioManager:
 * 1. Opens WebSocket to AWS Transcribe when recording STARTS (not after)
 * 2. Streams audio chunks in real-time during recording
 * 3. Transcript is ready almost immediately when recording stops
 * 4. Uses AudioWorklet for low-latency audio capture
 * 5. Context-aware styling based on target application
 */

import BedrockService from "../services/BedrockService.js";
import contextDetector from "./contextDetector.js";
import styleManager from "./styleManager.js";

class StreamingAudioManager {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.workletNode = null;
    this.sourceNode = null;
    
    this.isRecording = false;
    this.isProcessing = false;
    this.recordingStartTime = null;
    this.detectedLanguage = null;  // Store detected language from auto-detect
    
    // Callbacks
    this.onStateChange = null;
    this.onError = null;
    this.onTranscriptionComplete = null;
    this.onPartialTranscript = null;
    this.onLanguageDetected = null;  // New callback for language detection
    
    // Worklet URL - will be set based on environment
    this.workletUrl = null;
  }

  setCallbacks({ onStateChange, onError, onTranscriptionComplete, onPartialTranscript, onLanguageDetected }) {
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.onTranscriptionComplete = onTranscriptionComplete;
    this.onPartialTranscript = onPartialTranscript;
    this.onLanguageDetected = onLanguageDetected;
  }

  getState() {
    return {
      isRecording: this.isRecording,
      isProcessing: this.isProcessing,
      detectedLanguage: this.detectedLanguage
    };
  }

  /**
   * Start recording with real-time streaming transcription
   */
  async startRecording() {
    if (this.isRecording) {
      console.warn('[StreamingAudioManager] Already recording');
      return false;
    }

    const startTime = performance.now();
    console.log('[StreamingAudioManager] Starting recording...');

    try {
      // Get settings - default to "auto" for auto-detect language (R4)
      const language = localStorage.getItem("transcribeLanguage") || "auto";
      const region = localStorage.getItem("awsRegion") || "us-east-1";
      const selectedMicId = localStorage.getItem("selectedMicrophoneId") || "default";

      // 1. Start streaming transcription session FIRST (opens WebSocket)
      // When language is 'auto', use auto-detect (IdentifyLanguage)
      // Otherwise, use the specific language code
      const sessionResult = await window.electronAPI.streamingTranscribeStart({
        languageCode: language,  // Pass 'auto' or specific language code
        enableAutoLanguage: language === 'auto',
        region
      });

      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Failed to start transcription session');
      }

      console.log('[StreamingAudioManager] Transcription session started in', 
        (performance.now() - startTime).toFixed(0), 'ms');

      // 2. Set up event listeners for partial results
      this.setupStreamingListeners();

      // 3. Get microphone access
      const audioConstraints = selectedMicId === "default"
        ? { audio: { sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true } }
        : { audio: { deviceId: { exact: selectedMicId }, sampleRate: 48000, channelCount: 1, echoCancellation: true, noiseSuppression: true } };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      // 4. Set up AudioContext and Worklet for low-latency capture
      this.audioContext = new AudioContext({ sampleRate: 48000 });
      
      // Load the PCM processor worklet
      try {
        // In development, worklet is served by Vite
        // In production, it's in the app resources
        const workletPath = '/worklets/pcm-processor.js';
        await this.audioContext.audioWorklet.addModule(workletPath);
      } catch (workletError) {
        console.warn('[StreamingAudioManager] Worklet load failed, using fallback:', workletError);
        // Fallback to ScriptProcessor if AudioWorklet fails
        return this.startRecordingFallback();
      }

      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor');
      
      // Initialize worklet with sample rate
      this.workletNode.port.postMessage({
        type: 'init',
        sampleRate: this.audioContext.sampleRate
      });

      // Handle audio chunks from worklet
      this.workletNode.port.onmessage = async (event) => {
        if (event.data.type === 'audio' && this.isRecording) {
          // Send chunk to streaming transcription
          await window.electronAPI.streamingTranscribeChunk(event.data.pcmData);
        }
      };

      // Connect audio pipeline
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.workletNode);
      // Don't connect to destination - we don't want to hear ourselves

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.onStateChange?.({ isRecording: true, isProcessing: false });

      console.log('[StreamingAudioManager] Recording started in', 
        (performance.now() - startTime).toFixed(0), 'ms total');

      return true;
    } catch (error) {
      console.error('[StreamingAudioManager] Start recording error:', error);
      await this.cleanup();
      this.handleRecordingError(error);
      return false;
    }
  }

  /**
   * Fallback using ScriptProcessorNode if AudioWorklet is not available
   */
  async startRecordingFallback() {
    console.log('[StreamingAudioManager] Using ScriptProcessor fallback');
    
    const bufferSize = 4096;
    const scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    // Downsample buffer
    const targetSampleRate = 16000;
    const ratio = this.audioContext.sampleRate / targetSampleRate;
    
    scriptProcessor.onaudioprocess = async (event) => {
      if (!this.isRecording) return;
      
      const inputData = event.inputBuffer.getChannelData(0);
      const outputLength = Math.floor(inputData.length / ratio);
      const pcmData = new Int16Array(outputLength);
      
      for (let i = 0; i < outputLength; i++) {
        const sample = inputData[Math.floor(i * ratio)];
        const clamped = Math.max(-1, Math.min(1, sample));
        pcmData[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
      }
      
      await window.electronAPI.streamingTranscribeChunk(pcmData.buffer);
    };

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.sourceNode.connect(scriptProcessor);
    scriptProcessor.connect(this.audioContext.destination);
    
    this.workletNode = scriptProcessor; // Store for cleanup
    
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    this.onStateChange?.({ isRecording: true, isProcessing: false });
    
    return true;
  }

  /**
   * Set up listeners for streaming transcription events
   */
  setupStreamingListeners() {
    // Listen for partial transcription results
    window.electronAPI.onStreamingPartial?.((data) => {
      if (data.text) {
        this.onPartialTranscript?.(data.text);
      }
    });

    // Listen for final segment results
    window.electronAPI.onStreamingFinal?.((data) => {
      if (data.text) {
        this.onPartialTranscript?.(data.text);
      }
    });

    // Listen for detected language (when using auto-detect)
    window.electronAPI.onStreamingLanguage?.((data) => {
      if (data.languageCode) {
        this.detectedLanguage = data.languageCode;
        console.log('[StreamingAudioManager] Language detected:', data.languageCode);
        this.onLanguageDetected?.(data.languageCode);
      }
    });

    // Listen for errors
    window.electronAPI.onStreamingError?.((data) => {
      console.error('[StreamingAudioManager] Streaming error:', data.error);
    });
  }

  /**
   * Stop recording and get final transcript
   */
  async stopRecording() {
    if (!this.isRecording) {
      console.warn('[StreamingAudioManager] Not recording');
      return false;
    }

    const stopTime = performance.now();
    console.log('[StreamingAudioManager] Stopping recording...');

    this.isRecording = false;
    this.isProcessing = true;
    this.onStateChange?.({ isRecording: false, isProcessing: true });

    const recordingDuration = Date.now() - this.recordingStartTime;

    try {
      // 1. End streaming session and get final transcript
      const result = await window.electronAPI.streamingTranscribeEnd();
      
      const transcriptTime = performance.now();
      console.log('[StreamingAudioManager] Transcript ready in', 
        (transcriptTime - stopTime).toFixed(0), 'ms after stop');

      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }

      // Capture detected language from the result (if available)
      if (result.detectedLanguage) {
        this.detectedLanguage = result.detectedLanguage;
        console.log('[StreamingAudioManager] Final detected language:', this.detectedLanguage);
      }

      let text = result.text;

      if (!text || text.trim() === '') {
        this.onError?.({
          title: "No Speech Detected",
          description: "Could not detect any speech in the recording."
        });
        await this.cleanup();
        this.isProcessing = false;
        this.onStateChange?.({ isRecording: false, isProcessing: false });
        return false;
      }

      // 2. Optional: Enhance with Bedrock Claude (enabled by default per R2)
      const useEnhancement = localStorage.getItem("useTextEnhancement") !== "false";
      
      if (useEnhancement) {
        text = await this.enhanceWithTimeout(text);
      }

      // 3. Clean up text
      text = this.cleanText(text);

      const totalTime = performance.now() - stopTime;
      console.log('[StreamingAudioManager] Total processing time:', totalTime.toFixed(0), 'ms');

      // 4. Complete
      this.onTranscriptionComplete?.({ 
        success: true, 
        text,
        duration: recordingDuration,
        processingTime: totalTime,
        detectedLanguage: this.detectedLanguage  // Include detected language
      });

      // Auto-paste and save
      await this.safePaste(text);
      this.saveTranscription(text);

      return true;
    } catch (error) {
      console.error('[StreamingAudioManager] Stop recording error:', error);
      this.onError?.({
        title: "Transcription Failed",
        description: error.message
      });
      return false;
    } finally {
      await this.cleanup();
      this.isProcessing = false;
      this.onStateChange?.({ isRecording: false, isProcessing: false });
    }
  }

  /**
   * Enhance text with timeout - paste raw if too slow
   * Now with context-aware styling!
   */
  async enhanceWithTimeout(text) {
    const TIMEOUT_MS = 1500;
    const enhancementModel = localStorage.getItem("enhancementModel") || "anthropic.claude-3-haiku-20240307-v1:0";
    
    // Check if context-aware styling is enabled
    const contextAwareEnabled = styleManager.isEnabled();
    let style = 'neutral';
    let appContext = null;

    if (contextAwareEnabled) {
      try {
        // Detect the active application
        appContext = await contextDetector.detectActiveApp();
        style = styleManager.getStyleForApp(appContext);
        console.log(`[StreamingAudioManager] Context: ${appContext.appName} → Style: ${style}`);
      } catch (error) {
        console.warn('[StreamingAudioManager] Context detection failed:', error);
      }
    }

    try {
      // Use style-aware enhancement if context-aware is enabled
      const enhancePromise = contextAwareEnabled
        ? BedrockService.processTextWithStyle(text, style, enhancementModel)
        : BedrockService.processText(text, enhancementModel);
      
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve(null), TIMEOUT_MS)
      );

      const result = await Promise.race([enhancePromise, timeoutPromise]);

      if (result === null) {
        console.log('[StreamingAudioManager] Enhancement timeout, using raw text');
        // Could optionally continue enhancement in background here
        return text;
      }

      return result || text;
    } catch (error) {
      console.warn('[StreamingAudioManager] Enhancement failed:', error);
      return text;
    }
  }

  /**
   * Clean up audio resources
   */
  async cleanup() {
    // Remove streaming listeners
    window.electronAPI.removeAllListeners?.('streaming-transcribe-partial');
    window.electronAPI.removeAllListeners?.('streaming-transcribe-final');
    window.electronAPI.removeAllListeners?.('streaming-transcribe-error');

    // Disconnect audio nodes
    if (this.sourceNode) {
      try { this.sourceNode.disconnect(); } catch (e) {}
      this.sourceNode = null;
    }

    if (this.workletNode) {
      try { this.workletNode.disconnect(); } catch (e) {}
      this.workletNode = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { await this.audioContext.close(); } catch (e) {}
      this.audioContext = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  handleRecordingError(error) {
    let title = "Recording Error";
    let description = `Failed to access microphone: ${error.message}`;
    
    if (error.name === "NotAllowedError") {
      title = "Microphone Access Denied";
      description = "Please grant microphone permission in system settings.";
    } else if (error.name === "NotFoundError") {
      title = "No Microphone Found";
      description = "Please connect a microphone and try again.";
    } else if (error.name === "NotReadableError") {
      title = "Microphone In Use";
      description = "Close other apps using the microphone and try again.";
    } else if (error.message?.includes('credentials')) {
      title = "AWS Credentials Error";
      description = "Please configure AWS credentials. Run 'awsc' in terminal.";
    }
    
    this.onError?.({ title, description });
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\s+([.,!?])/g, '$1')
      .replace(/([.!?])\s*/g, '$1 ')
      .trim();
  }

  async safePaste(text) {
    try {
      await window.electronAPI?.pasteText?.(text);
    } catch (error) {
      console.error('[StreamingAudioManager] Paste error:', error);
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.error('[StreamingAudioManager] Clipboard fallback failed:', e);
      }
    }
  }

  saveTranscription(text) {
    try {
      window.electronAPI?.saveTranscription?.(text);
    } catch (error) {
      console.error('[StreamingAudioManager] Save error:', error);
    }
  }

  /**
   * Abort recording without processing
   */
  async abortRecording() {
    if (this.isRecording) {
      this.isRecording = false;
      await window.electronAPI.streamingTranscribeAbort?.();
      await this.cleanup();
      this.onStateChange?.({ isRecording: false, isProcessing: false });
    }
  }

  /**
   * Full cleanup on unmount
   */
  destroy() {
    this.abortRecording();
    this.onStateChange = null;
    this.onError = null;
    this.onTranscriptionComplete = null;
    this.onPartialTranscript = null;
  }
}

export default StreamingAudioManager;
