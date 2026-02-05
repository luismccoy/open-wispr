/**
 * AWS Transcribe Manager - Main Process
 * Handles real-time speech-to-text using AWS Transcribe Streaming
 */

const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require('@aws-sdk/client-transcribe-streaming');

class TranscribeManager {
  constructor() {
    this.client = null;
    this.region = 'us-east-1';
  }

  setRegion(region) {
    this.region = region;
    this.client = null;
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
   * Transcribe audio buffer using AWS Transcribe Streaming
   * @param {Buffer} audioBuffer - PCM audio data (16-bit, 16kHz, mono)
   * @param {Object} options - Transcription options
   * @returns {Promise<string>} - Transcribed text
   */
  async transcribe(audioBuffer, options = {}) {
    const {
      languageCode = 'en-US',
      credentials = null
    } = options;

    const client = await this.getClient(credentials);
    
    // Create audio stream generator
    const audioStream = this.createAudioStream(audioBuffer);
    
    const command = new StartStreamTranscriptionCommand({
      LanguageCode: languageCode,
      MediaEncoding: 'pcm',
      MediaSampleRateHertz: 16000,
      AudioStream: audioStream
    });

    try {
      const response = await client.send(command);
      return await this.processTranscriptStream(response.TranscriptResultStream);
    } catch (error) {
      console.error('[TranscribeManager] Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Create async generator for audio chunks
   */
  async *createAudioStream(audioBuffer) {
    const chunkSize = 4096; // ~256ms at 16kHz
    
    for (let i = 0; i < audioBuffer.length; i += chunkSize) {
      const chunk = audioBuffer.slice(i, Math.min(i + chunkSize, audioBuffer.length));
      yield { AudioEvent: { AudioChunk: chunk } };
    }
  }

  /**
   * Process transcript stream and extract final text
   */
  async processTranscriptStream(transcriptStream) {
    const transcripts = [];
    
    for await (const event of transcriptStream) {
      if (event.TranscriptEvent) {
        const results = event.TranscriptEvent.Transcript?.Results || [];
        for (const result of results) {
          if (!result.IsPartial && result.Alternatives?.length > 0) {
            transcripts.push(result.Alternatives[0].Transcript);
          }
        }
      }
    }
    
    return transcripts.join(' ').trim();
  }
}

module.exports = TranscribeManager;
