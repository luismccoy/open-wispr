/**
 * Streaming Transcribe Manager - Real-time WebSocket streaming to AWS Transcribe
 * 
 * This replaces batch transcription with real-time streaming for sub-2-second latency.
 * Audio is streamed while recording, so transcript is ready almost immediately when recording stops.
 */

const { 
  TranscribeStreamingClient, 
  StartStreamTranscriptionCommand 
} = require('@aws-sdk/client-transcribe-streaming');
const { PassThrough } = require('stream');

class StreamingTranscribeManager {
  constructor() {
    this.client = null;
    this.region = 'us-east-1';
    this.audioStream = null;
    this.transcriptBuffer = [];
    this.partialTranscript = '';
    this.isActive = false;
    this.callbacks = null;
    this.responsePromise = null;
    this.responseResolve = null;
    this.detectedLanguage = null;  // Store detected language from auto-detect
  }

  setRegion(region) {
    this.region = region;
    this.client = null;
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  async getClient(credentials) {
    const config = { region: this.region };
    
    if (credentials) {
      config.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      };
    }
    
    return new TranscribeStreamingClient(config);
  }

  /**
   * Start a streaming transcription session
   * Call this when recording starts (on hotkey press)
   * 
   * By default, uses auto-detect language (IdentifyLanguage) for the best user experience.
   * To use a specific language, pass languageCode with a valid code (not 'auto').
   */
  async startSession(options = {}) {
    const {
      languageCode = 'auto',  // Default to auto-detect for best UX
      credentials = null,
      enableAutoLanguage = true  // Default to true for auto-detect
    } = options;

    if (this.isActive) {
      console.warn('[StreamingTranscribe] Session already active, ending previous session');
      await this.abortSession();
    }

    this.client = await this.getClient(credentials);
    this.transcriptBuffer = [];
    this.partialTranscript = '';
    this.isActive = true;
    this.detectedLanguage = null;  // Reset detected language for new session

    // Create a PassThrough stream for audio data
    this.audioStream = new PassThrough();

    // Create async generator from the PassThrough stream
    const audioStreamGenerator = this.createAudioStreamGenerator();

    // Build command options
    const commandOptions = {
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 16000,
      AudioStream: audioStreamGenerator
    };

    // Determine whether to use auto-detect or specific language
    // Auto-detect is used when:
    // 1. enableAutoLanguage is true (default), OR
    // 2. languageCode is 'auto' or not provided
    const useAutoDetect = enableAutoLanguage || languageCode === 'auto' || !languageCode;

    if (useAutoDetect) {
      // For auto-detect, use IdentifyLanguage (default behavior for best UX)
      commandOptions.IdentifyLanguage = true;
      commandOptions.LanguageOptions = 'en-US,es-US,pt-BR,fr-FR,de-DE,it-IT,ja-JP,ko-KR,zh-CN';
    } else {
      // Use specific language when explicitly provided
      commandOptions.LanguageCode = languageCode;
    }

    const command = new StartStreamTranscriptionCommand(commandOptions);

    // Create promise that will resolve when transcription is complete
    this.responsePromise = new Promise((resolve, reject) => {
      this.responseResolve = resolve;
    });

    try {
      console.log('[StreamingTranscribe] Starting session...', { 
        languageMode: useAutoDetect ? 'auto-detect' : languageCode,
        region: this.region 
      });
      
      const response = await this.client.send(command);
      
      // Process transcript stream in background
      this.processTranscriptStream(response.TranscriptResultStream)
        .then(() => {
          console.log('[StreamingTranscribe] Stream processing complete');
        })
        .catch((err) => {
          console.error('[StreamingTranscribe] Stream processing error:', err);
          this.callbacks?.onError?.(err);
        });

      console.log('[StreamingTranscribe] Session started successfully');
      return true;
    } catch (error) {
      console.error('[StreamingTranscribe] Failed to start session:', error);
      this.isActive = false;
      this.audioStream = null;
      throw error;
    }
  }

  /**
   * Create async generator that yields audio events from the PassThrough stream
   */
  async *createAudioStreamGenerator() {
    const chunkSize = 3200; // 100ms at 16kHz, 16-bit = 3200 bytes
    let buffer = Buffer.alloc(0);

    for await (const chunk of this.audioStream) {
      buffer = Buffer.concat([buffer, chunk]);
      
      while (buffer.length >= chunkSize) {
        const audioChunk = buffer.slice(0, chunkSize);
        buffer = buffer.slice(chunkSize);
        yield { AudioEvent: { AudioChunk: audioChunk } };
      }
    }

    // Send any remaining audio
    if (buffer.length > 0) {
      yield { AudioEvent: { AudioChunk: buffer } };
    }
  }

  /**
   * Send an audio chunk to the stream
   * Call this every ~100ms during recording
   * @param {Buffer|Int16Array|ArrayBuffer} pcmData - PCM audio data (16-bit, 16kHz, mono)
   */
  sendAudioChunk(pcmData) {
    if (!this.isActive || !this.audioStream) {
      console.warn('[StreamingTranscribe] Cannot send chunk - session not active');
      return false;
    }

    let buffer;
    if (pcmData instanceof Int16Array) {
      buffer = Buffer.from(pcmData.buffer);
    } else if (pcmData instanceof ArrayBuffer) {
      buffer = Buffer.from(pcmData);
    } else if (Buffer.isBuffer(pcmData)) {
      buffer = pcmData;
    } else {
      console.error('[StreamingTranscribe] Invalid audio data type');
      return false;
    }

    try {
      this.audioStream.write(buffer);
      return true;
    } catch (error) {
      console.error('[StreamingTranscribe] Error writing audio chunk:', error);
      return false;
    }
  }

  /**
   * End the streaming session and get final transcript
   * Call this when recording stops
   * @returns {Promise<string>} Final transcript text
   */
  async endSession() {
    if (!this.isActive) {
      console.warn('[StreamingTranscribe] No active session to end');
      return this.getFinalTranscript();
    }

    console.log('[StreamingTranscribe] Ending session...');

    // Signal end of audio stream
    if (this.audioStream) {
      this.audioStream.end();
    }

    // Wait for final results with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        console.log('[StreamingTranscribe] Timeout waiting for final results');
        resolve(null);
      }, 2000); // 2 second max wait
    });

    await Promise.race([this.responsePromise, timeoutPromise]);

    this.isActive = false;
    this.audioStream = null;

    const finalText = this.getFinalTranscript();
    console.log('[StreamingTranscribe] Session ended, transcript length:', finalText.length);
    
    return finalText;
  }

  /**
   * Abort session without waiting for results
   */
  abortSession() {
    console.log('[StreamingTranscribe] Aborting session');
    
    if (this.audioStream) {
      this.audioStream.destroy();
      this.audioStream = null;
    }
    
    this.isActive = false;
    this.transcriptBuffer = [];
    this.partialTranscript = '';
    this.detectedLanguage = null;
    
    if (this.responseResolve) {
      this.responseResolve();
    }
  }

  /**
   * Process the transcript result stream
   */
  async processTranscriptStream(transcriptStream) {
    try {
      for await (const event of transcriptStream) {
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript?.Results || [];
          
          for (const result of results) {
            // Capture detected language from auto-detect (IdentifyLanguage)
            // AWS Transcribe returns LanguageCode in each result when using IdentifyLanguage
            if (result.LanguageCode && !this.detectedLanguage) {
              this.detectedLanguage = result.LanguageCode;
              console.log('[StreamingTranscribe] Detected language:', this.detectedLanguage);
              this.callbacks?.onLanguageDetected?.(this.detectedLanguage);
            }
            
            if (result.Alternatives?.length > 0) {
              const transcript = result.Alternatives[0].Transcript;
              
              if (result.IsPartial) {
                // Update partial transcript for real-time display
                this.partialTranscript = transcript;
                this.callbacks?.onPartialResult?.(this.getCurrentTranscript());
              } else {
                // Final result for this segment
                this.transcriptBuffer.push(transcript);
                this.partialTranscript = '';
                this.callbacks?.onFinalResult?.(this.getFinalTranscript());
              }
            }
          }
        }
      }
    } catch (error) {
      // Stream closed errors are expected when session ends
      if (!error.message?.includes('closed') && !error.message?.includes('aborted')) {
        throw error;
      }
    } finally {
      // Resolve the response promise when stream ends
      if (this.responseResolve) {
        this.responseResolve();
      }
    }
  }

  /**
   * Get current transcript including partial results
   */
  getCurrentTranscript() {
    const final = this.transcriptBuffer.join(' ');
    if (this.partialTranscript) {
      return final ? `${final} ${this.partialTranscript}` : this.partialTranscript;
    }
    return final;
  }

  /**
   * Get final transcript (only confirmed results)
   */
  getFinalTranscript() {
    return this.transcriptBuffer.join(' ').trim();
  }

  /**
   * Check if session is currently active
   */
  isSessionActive() {
    return this.isActive;
  }

  /**
   * Get the detected language (when using auto-detect)
   * @returns {string|null} Language code (e.g., 'en-US', 'es-US') or null if not detected
   */
  getDetectedLanguage() {
    return this.detectedLanguage;
  }
}

module.exports = StreamingTranscribeManager;
