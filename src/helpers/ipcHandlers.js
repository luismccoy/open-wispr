const { ipcMain, app, shell } = require("electron");
const AppUtils = require("../utils");
const debugLogger = require("./debugLogger");
const TranscribeManager = require("./transcribeManager");
const StreamingTranscribeManager = require("./streamingTranscribeManager");
const connectionWarmupService = require("./connectionWarmup");

// Platform-specific active app detection
let activeWindow;
try {
  // Try to load active-win package for cross-platform support
  activeWindow = require('active-win');
} catch (e) {
  activeWindow = null;
}

class IPCHandlers {
  constructor(managers) {
    this.environmentManager = managers.environmentManager;
    this.databaseManager = managers.databaseManager;
    this.clipboardManager = managers.clipboardManager;
    this.windowManager = managers.windowManager;
    this.transcribeManager = new TranscribeManager();
    this.streamingTranscribeManager = new StreamingTranscribeManager();
    this.setupHandlers();
    
    // Perform connection warmup on initialization (non-blocking)
    this.performStartupWarmup();
  }

  /**
   * Perform connection warmup on app startup
   * This pre-initializes AWS connections to eliminate cold-start delays
   */
  async performStartupWarmup() {
    try {
      debugLogger.log('IPCHandlers: Starting connection warmup...');
      const result = await connectionWarmupService.warmup({ testConnection: false });
      
      if (result.success) {
        debugLogger.log('IPCHandlers: Connection warmup completed successfully', {
          duration: result.duration,
          credentials: result.credentials,
          bedrock: result.bedrock
        });
      } else {
        debugLogger.log('IPCHandlers: Connection warmup completed with issues', {
          error: result.error,
          credentials: result.credentials,
          bedrock: result.bedrock
        });
      }
    } catch (error) {
      debugLogger.error('IPCHandlers: Connection warmup failed', error);
      // Don't throw - warmup failure shouldn't prevent app from starting
    }
  }

  setupHandlers() {
    // Window control handlers
    ipcMain.handle("window-minimize", () => {
      if (this.windowManager.controlPanelWindow) {
        this.windowManager.controlPanelWindow.minimize();
      }
    });

    ipcMain.handle("window-maximize", () => {
      if (this.windowManager.controlPanelWindow) {
        if (this.windowManager.controlPanelWindow.isMaximized()) {
          this.windowManager.controlPanelWindow.unmaximize();
        } else {
          this.windowManager.controlPanelWindow.maximize();
        }
      }
    });

    ipcMain.handle("window-close", () => {
      if (this.windowManager.controlPanelWindow) {
        this.windowManager.controlPanelWindow.close();
      }
    });

    ipcMain.handle("window-is-maximized", () => {
      if (this.windowManager.controlPanelWindow) {
        return this.windowManager.controlPanelWindow.isMaximized();
      }
      return false;
    });

    ipcMain.handle("hide-window", () => {
      if (process.platform === "darwin") {
        this.windowManager.mainWindow.minimize();
        if (app.dock) app.dock.show();
      } else {
        this.windowManager.mainWindow.hide();
      }
    });

    ipcMain.handle("show-dictation-panel", () => {
      this.windowManager.showDictationPanel();
    });

    // Environment handlers - OpenAI handlers removed per R3
    // AWS credentials are managed via ~/.aws/credentials or environment variables

    ipcMain.handle("save-settings", async (event, settings) => {
      try {
        // Save settings to localStorage (API keys handled separately)
        return { success: true };
      } catch (error) {
        console.error("Failed to save settings:", error);
        return { success: false, error: error.message };
      }
    });

    // Database handlers
    ipcMain.handle("db-save-transcription", async (event, text) => {
      return this.databaseManager.saveTranscription(text);
    });

    ipcMain.handle("db-get-transcriptions", async (event, limit = 50) => {
      return this.databaseManager.getTranscriptions(limit);
    });

    ipcMain.handle("db-clear-transcriptions", async (event) => {
      return this.databaseManager.clearTranscriptions();
    });

    ipcMain.handle("db-delete-transcription", async (event, id) => {
      return this.databaseManager.deleteTranscription(id);
    });

    // Clipboard handlers
    ipcMain.handle("paste-text", async (event, text) => {
      return this.clipboardManager.pasteText(text);
    });

    ipcMain.handle("read-clipboard", async (event) => {
      return this.clipboardManager.readClipboard();
    });

    ipcMain.handle("write-clipboard", async (event, text) => {
      return this.clipboardManager.writeClipboard(text);
    });

    // AWS Transcribe handler
    ipcMain.handle("transcribe-aws", async (event, audioBuffer, options = {}) => {
      debugLogger.log('transcribe-aws called', {
        audioBufferSize: audioBuffer?.byteLength || audioBuffer?.length || 0,
        options
      });
      
      try {
        // Get AWS credentials
        const credentials = await this.getAWSCredentials();
        
        // Set region if provided
        if (options.region) {
          this.transcribeManager.setRegion(options.region);
        }
        
        const text = await this.transcribeManager.transcribe(
          Buffer.from(audioBuffer),
          {
            languageCode: options.languageCode || 'en-US',
            credentials
          }
        );
        
        debugLogger.log('AWS Transcribe result', { textLength: text?.length });
        
        return { success: true, text };
      } catch (error) {
        debugLogger.error('AWS Transcribe error', error);
        return { success: false, error: error.message };
      }
    });

    // ============================================
    // STREAMING TRANSCRIPTION HANDLERS (Real-time)
    // ============================================

    // Start streaming transcription session
    ipcMain.handle("streaming-transcribe-start", async (event, options = {}) => {
      debugLogger.log('streaming-transcribe-start called', options);
      
      try {
        const credentials = await this.getAWSCredentials();
        
        if (options.region) {
          this.streamingTranscribeManager.setRegion(options.region);
        }

        // Set up callbacks to forward events to renderer
        this.streamingTranscribeManager.setCallbacks({
          onPartialResult: (text) => {
            event.sender.send('streaming-transcribe-partial', { text });
          },
          onFinalResult: (text) => {
            event.sender.send('streaming-transcribe-final', { text });
          },
          onLanguageDetected: (languageCode) => {
            event.sender.send('streaming-transcribe-language', { languageCode });
          },
          onError: (error) => {
            event.sender.send('streaming-transcribe-error', { error: error.message });
          }
        });

        await this.streamingTranscribeManager.startSession({
          languageCode: options.languageCode || 'auto',  // Default to auto-detect
          credentials,
          enableAutoLanguage: options.enableAutoLanguage !== false  // Default to true for auto-detect
        });

        return { success: true };
      } catch (error) {
        debugLogger.error('streaming-transcribe-start error', error);
        return { success: false, error: error.message };
      }
    });

    // Send audio chunk during streaming
    ipcMain.handle("streaming-transcribe-chunk", async (event, audioBuffer) => {
      try {
        const buffer = Buffer.from(audioBuffer);
        const success = this.streamingTranscribeManager.sendAudioChunk(buffer);
        return { success };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // End streaming session and get final transcript
    ipcMain.handle("streaming-transcribe-end", async (event) => {
      debugLogger.log('streaming-transcribe-end called');
      
      try {
        const text = await this.streamingTranscribeManager.endSession();
        const detectedLanguage = this.streamingTranscribeManager.getDetectedLanguage();
        debugLogger.log('streaming-transcribe-end result', { 
          textLength: text?.length,
          detectedLanguage 
        });
        return { success: true, text, detectedLanguage };
      } catch (error) {
        debugLogger.error('streaming-transcribe-end error', error);
        return { success: false, error: error.message };
      }
    });

    // Abort streaming session
    ipcMain.handle("streaming-transcribe-abort", async (event) => {
      debugLogger.log('streaming-transcribe-abort called');
      this.streamingTranscribeManager.abortSession();
      return { success: true };
    });

    // Check if streaming session is active
    ipcMain.handle("streaming-transcribe-status", async (event) => {
      return { 
        active: this.streamingTranscribeManager.isSessionActive(),
        currentTranscript: this.streamingTranscribeManager.getCurrentTranscript()
      };
    });

    // Helper method to get AWS credentials
    this.getAWSCredentials = async () => {
      // Check environment variables first
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        debugLogger.log('Using AWS credentials from environment variables');
        return {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN || null
        };
      }

      // Try AWS credentials file
      const os = require('os');
      const path = require('path');
      const fs = require('fs');
      const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
      
      if (fs.existsSync(credentialsPath)) {
        const content = fs.readFileSync(credentialsPath, 'utf8');
        const profile = process.env.AWS_PROFILE || 'default';
        const lines = content.split('\n');
        let inProfile = false;
        const creds = {};
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            inProfile = trimmed === `[${profile}]`;
          } else if (inProfile && trimmed.includes('=')) {
            const [key, ...valueParts] = trimmed.split('=');
            const value = valueParts.join('=').trim();
            if (key.trim() === 'aws_access_key_id') creds.accessKeyId = value;
            if (key.trim() === 'aws_secret_access_key') creds.secretAccessKey = value;
            if (key.trim() === 'aws_session_token') creds.sessionToken = value;
          }
        }
        
        if (creds.accessKeyId && creds.secretAccessKey) {
          debugLogger.log('Using AWS credentials from ~/.aws/credentials', { profile });
          return creds;
        }
      }

      debugLogger.log('No AWS credentials found');
      return null;
    };

    // Utility handlers
    ipcMain.handle("cleanup-app", async (event) => {
      try {
        AppUtils.cleanup(this.windowManager.mainWindow);
        return { success: true, message: "Cleanup completed successfully" };
      } catch (error) {
        throw error;
      }
    });

    ipcMain.handle("update-hotkey", async (event, hotkey) => {
      return await this.windowManager.updateHotkey(hotkey);
    });

    ipcMain.handle("start-window-drag", async (event) => {
      return await this.windowManager.startWindowDrag();
    });

    ipcMain.handle("stop-window-drag", async (event) => {
      return await this.windowManager.stopWindowDrag();
    });

    // External link handler
    ipcMain.handle("open-external", async (event, url) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Context detection handler - detects active application for style selection
    ipcMain.handle("get-active-app-context", async (event) => {
      try {
        if (activeWindow) {
          const result = await activeWindow();
          if (result) {
            return {
              appName: result.owner?.name || 'Unknown',
              bundleId: result.owner?.bundleId || null,
              executablePath: result.owner?.path || null,
              windowTitle: result.title || null,
              platform: process.platform
            };
          }
        }
        
        // Fallback: try macOS-specific detection
        if (process.platform === 'darwin') {
          const { execSync } = require('child_process');
          try {
            // Use AppleScript to get frontmost app
            const script = 'tell application "System Events" to get name of first application process whose frontmost is true';
            const appName = execSync(`osascript -e '${script}'`, { encoding: 'utf8' }).trim();
            
            // Get bundle ID
            const bundleScript = `osascript -e 'id of app "${appName}"'`;
            let bundleId = null;
            try {
              bundleId = execSync(bundleScript, { encoding: 'utf8' }).trim();
            } catch (e) {
              // Bundle ID not available for all apps
            }
            
            return {
              appName,
              bundleId,
              executablePath: null,
              windowTitle: null,
              platform: 'darwin'
            };
          } catch (e) {
            debugLogger.log('macOS app detection failed', e.message);
          }
        }
        
        return {
          appName: 'Unknown',
          bundleId: null,
          executablePath: null,
          windowTitle: null,
          platform: process.platform
        };
      } catch (error) {
        debugLogger.error('Context detection error', error);
        return {
          appName: 'Unknown',
          bundleId: null,
          executablePath: null,
          windowTitle: null,
          platform: process.platform
        };
      }
    });

    // Debug logging from renderer
    ipcMain.handle("debug-log", async (event, message, data) => {
      console.log(`[RENDERER] ${message}`, JSON.stringify(data || {}, null, 2));
      return true;
    });

    // Get localStorage value from renderer
    ipcMain.handle("get-local-storage", async (event, key) => {
      // This needs to be called from renderer, so we'll send a message and wait for response
      return new Promise((resolve) => {
        const channel = `get-local-storage-response-${Date.now()}`;
        ipcMain.once(channel, (_, value) => resolve(value));
        event.sender.send('get-local-storage-request', { key, responseChannel: channel });
      });
    });

    console.log('[IPC] Debug-log handler registered');

    // AWS Bedrock handler - uses pre-warmed client when available for faster first request
    ipcMain.handle("invoke-bedrock-model", async (event, params) => {
      const { modelId, text, region } = params;
      console.log('[IPC] invoke-bedrock-model called', { modelId, region, textLength: text?.length });
      
      try {
        const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
        
        // Try to use pre-warmed client from connectionWarmupService for faster response
        // This eliminates cold-start delays for the first enhancement request (R13)
        let client = connectionWarmupService.getBedrockClient();
        
        if (client) {
          console.log('[IPC] Using pre-warmed Bedrock client');
        } else {
          // Fallback: create new client if warmup hasn't completed
          console.log('[IPC] Pre-warmed client not available, creating new client');
          client = new BedrockRuntimeClient({
            region: region || "us-east-1",
          });
        }

        const payload = {
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: Math.max(200, text.length * 2),
          messages: [{ role: "user", content: text }],
          temperature: 0.3,
        };

        const command = new InvokeModelCommand({
          modelId,
          contentType: "application/json",
          accept: "application/json",
          body: JSON.stringify(payload),
        });

        console.log('[IPC] Sending Bedrock request', { modelId, usingPrewarmedClient: !!connectionWarmupService.getBedrockClient() });
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        console.log('[IPC] Bedrock response received', { 
          hasContent: !!responseBody.content,
          stopReason: responseBody.stop_reason 
        });

        return responseBody.content?.[0]?.text || "";
      } catch (error) {
        console.error('[IPC] Bedrock invocation error:', error.message);
        throw new Error(`Bedrock error: ${error.message}`);
      }
    });

    // AWS credentials handlers - checks multiple sources
    ipcMain.handle("get-aws-credentials", async (event) => {
      try {
        // 1. Check environment variables first (highest priority)
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          return {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN || null
          };
        }

        // 2. Try to load from AWS credentials file (~/.aws/credentials)
        const os = require('os');
        const path = require('path');
        const fs = require('fs');
        const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
        
        if (fs.existsSync(credentialsPath)) {
          const content = fs.readFileSync(credentialsPath, 'utf8');
          const profile = process.env.AWS_PROFILE || 'default';
          
          // Simple INI parser for AWS credentials
          const lines = content.split('\n');
          let inProfile = false;
          const creds = {};
          
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              inProfile = trimmed === `[${profile}]`;
            } else if (inProfile && trimmed.includes('=')) {
              const [key, ...valueParts] = trimmed.split('=');
              const value = valueParts.join('=').trim();
              if (key.trim() === 'aws_access_key_id') creds.accessKeyId = value;
              if (key.trim() === 'aws_secret_access_key') creds.secretAccessKey = value;
              if (key.trim() === 'aws_session_token') creds.sessionToken = value;
            }
          }
          
          if (creds.accessKeyId && creds.secretAccessKey) {
            return creds;
          }
        }

        return null;
      } catch (error) {
        console.error('[IPC] Error getting AWS credentials:', error);
        return null;
      }
    });

    ipcMain.handle("save-aws-credentials", async (event, creds) => {
      // AWS credentials are managed via ~/.aws/credentials file or environment variables
      // This handler is kept for API compatibility but doesn't persist
      console.log('[IPC] save-aws-credentials called - credentials should be set via AWS CLI or environment');
      return { success: true, message: 'Use AWS CLI or environment variables to set credentials' };
    });

    // ============================================
    // CONNECTION WARMUP HANDLERS
    // ============================================

    // Perform connection warmup (call on app startup)
    ipcMain.handle("connection-warmup", async (event, options = {}) => {
      debugLogger.log('connection-warmup called', options);
      try {
        const result = await connectionWarmupService.warmup(options);
        return result;
      } catch (error) {
        debugLogger.error('connection-warmup error', error);
        return { success: false, error: error.message };
      }
    });

    // Get connection status
    ipcMain.handle("connection-status", async (event) => {
      return connectionWarmupService.getStatus();
    });

    // Perform health check
    ipcMain.handle("connection-health-check", async (event) => {
      try {
        const health = await connectionWarmupService.healthCheck();
        return health;
      } catch (error) {
        debugLogger.error('connection-health-check error', error);
        return { healthy: false, error: error.message };
      }
    });

    // Check if connections are ready
    ipcMain.handle("connection-is-ready", async (event) => {
      return connectionWarmupService.isReady();
    });

    // Reset connection warmup service
    ipcMain.handle("connection-reset", async (event) => {
      connectionWarmupService.reset();
      return { success: true };
    });
  }
}

module.exports = IPCHandlers;
