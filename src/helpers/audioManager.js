/**
 * Simplified Audio Manager - AWS-only transcription
 * Uses AWS Transcribe Streaming for fast, accurate speech-to-text
 * Optional Bedrock Claude enhancement for text cleanup
 */

import BedrockService from "../services/BedrockService.js";

class AudioManager {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.isProcessing = false;
    this.onStateChange = null;
    this.onError = null;
    this.onTranscriptionComplete = null;
  }

  setCallbacks({ onStateChange, onError, onTranscriptionComplete }) {
    this.onStateChange = onStateChange;
    this.onError = onError;
    this.onTranscriptionComplete = onTranscriptionComplete;
  }

  getState() {
    return {
      isRecording: this.isRecording,
      isProcessing: this.isProcessing
    };
  }

  async startRecording() {
    try {
      if (this.isRecording) {
        return false;
      }

      const selectedMicId = localStorage.getItem("selectedMicrophoneId") || "default";
      
      const audioConstraints = selectedMicId === "default" 
        ? { audio: { sampleRate: 16000, channelCount: 1 } }
        : { audio: { deviceId: { exact: selectedMicId }, sampleRate: 16000, channelCount: 1 } };

      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        this.isProcessing = true;
        this.onStateChange?.({ isRecording: false, isProcessing: true });

        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        
        if (audioBlob.size === 0) {
          this.onError?.({
            title: "No Audio",
            description: "Recording was empty. Please try again."
          });
          this.isProcessing = false;
          this.onStateChange?.({ isRecording: false, isProcessing: false });
          return;
        }

        try {
          await this.processAudio(audioBlob);
        } catch (err) {
          console.error('[AudioManager] processAudio error:', err);
          this.onError?.({
            title: "Processing Error",
            description: err.message
          });
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      this.onStateChange?.({ isRecording: true, isProcessing: false });
      return true;
    } catch (error) {
      console.error('[AudioManager] startRecording error:', error);
      this.handleRecordingError(error);
      return false;
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      return true;
    }
    return false;
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
    }
    
    this.onError?.({ title, description });
  }

  async processAudio(audioBlob) {
    try {
      // Text enhancement enabled by default per R2
      const useEnhancement = localStorage.getItem("useTextEnhancement") !== "false";
      // Default to "auto" for auto-detect language (R4)
      const language = localStorage.getItem("transcribeLanguage") || "auto";
      const region = localStorage.getItem("awsRegion") || "us-east-1";
      
      // Convert blob to PCM for AWS Transcribe
      let pcmBuffer;
      try {
        pcmBuffer = await this.convertToPCM(audioBlob);
      } catch (pcmError) {
        console.error('[AudioManager] PCM conversion failed:', pcmError);
        throw new Error(`Audio conversion failed: ${pcmError.message}`);
      }
      
      // Transcribe with AWS Transcribe
      const result = await window.electronAPI.transcribeAWS(pcmBuffer, {
        languageCode: language,
        region: region
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }
      
      let text = result.text;
      
      if (!text || text.trim() === '') {
        this.onError?.({
          title: "No Speech Detected",
          description: "Could not detect any speech in the recording."
        });
        this.isProcessing = false;
        this.onStateChange?.({ isRecording: false, isProcessing: false });
        return;
      }

      // Optional: Enhance with Bedrock Claude
      if (useEnhancement) {
        try {
          const enhancementModel = localStorage.getItem("enhancementModel") || "anthropic.claude-3-haiku-20240307-v1:0";
          const enhancedText = await BedrockService.processText(text, enhancementModel);
          if (enhancedText) {
            text = enhancedText;
          }
        } catch (enhanceError) {
          console.warn('[AudioManager] Enhancement failed, using raw transcription:', enhanceError);
        }
      }

      // Clean up basic formatting
      text = this.cleanText(text);

      this.onTranscriptionComplete?.({ success: true, text });
      
      // Auto-paste and save
      await this.safePaste(text);
      this.saveTranscription(text);
      
    } catch (error) {
      console.error('[AudioManager] Processing error:', error);
      this.onError?.({
        title: "Transcription Failed",
        description: error.message
      });
    } finally {
      this.isProcessing = false;
      this.onStateChange?.({ isRecording: false, isProcessing: false });
    }
  }

  async convertToPCM(audioBlob) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    let audioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (decodeError) {
      await audioContext.close();
      throw new Error(`Cannot decode audio: ${decodeError.message}`);
    }
    
    // Resample to 16kHz mono
    const targetSampleRate = 16000;
    const offlineContext = new OfflineAudioContext(
      1, // mono
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    const resampledBuffer = await offlineContext.startRendering();
    await audioContext.close();
    
    // Convert to PCM Int16
    const channelData = resampledBuffer.getChannelData(0);
    const pcmData = new Int16Array(channelData.length);
    
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    return pcmData.buffer;
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
      console.error('[AudioManager] Paste error:', error);
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        console.error('[AudioManager] Clipboard fallback failed:', e);
      }
    }
  }

  saveTranscription(text) {
    try {
      window.electronAPI?.saveTranscription?.(text);
    } catch (error) {
      console.error('[AudioManager] Save error:', error);
    }
  }

  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.stopRecording();
    }
    this.onStateChange = null;
    this.onError = null;
    this.onTranscriptionComplete = null;
  }
}

export default AudioManager;
