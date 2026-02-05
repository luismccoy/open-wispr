const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  pasteText: (text) => ipcRenderer.invoke("paste-text", text),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  showDictationPanel: () => ipcRenderer.invoke("show-dictation-panel"),
  onToggleDictation: (callback) => ipcRenderer.on("toggle-dictation", callback),

  // Database functions
  saveTranscription: (text) =>
    ipcRenderer.invoke("db-save-transcription", text),
  getTranscriptions: (limit) =>
    ipcRenderer.invoke("db-get-transcriptions", limit),
  clearTranscriptions: () => ipcRenderer.invoke("db-clear-transcriptions"),
  deleteTranscription: (id) =>
    ipcRenderer.invoke("db-delete-transcription", id),

  // Environment variables - OpenAI removed per R3, AWS is the sole provider
  // AWS credentials are managed via ~/.aws/credentials or environment variables

  // Settings management
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // Clipboard functions
  readClipboard: () => ipcRenderer.invoke("read-clipboard"),
  writeClipboard: (text) => ipcRenderer.invoke("write-clipboard", text),

  // Window control functions
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowClose: () => ipcRenderer.invoke("window-close"),
  windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // Cleanup function
  cleanupApp: () => ipcRenderer.invoke("cleanup-app"),
  updateHotkey: (hotkey) => ipcRenderer.invoke("update-hotkey", hotkey),
  startWindowDrag: () => ipcRenderer.invoke("start-window-drag"),
  stopWindowDrag: () => ipcRenderer.invoke("stop-window-drag"),

  // Update functions
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getUpdateStatus: () => ipcRenderer.invoke("get-update-status"),

  // Update event listeners
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  onUpdateDownloadProgress: (callback) =>
    ipcRenderer.on("update-download-progress", callback),
  onUpdateError: (callback) => ipcRenderer.on("update-error", callback),

  // Audio event listeners
  onNoAudioDetected: (callback) =>
    ipcRenderer.on("no-audio-detected", callback),

  // External link opener
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  // AWS Bedrock functions
  getAWSCredentials: () => ipcRenderer.invoke("get-aws-credentials"),
  saveAWSCredentials: (creds) => ipcRenderer.invoke("save-aws-credentials", creds),
  invokeBedrockModel: (params) => ipcRenderer.invoke("invoke-bedrock-model", params),
  getAnthropicKey: () => ipcRenderer.invoke("get-anthropic-key"),
  saveAnthropicKey: (key) => ipcRenderer.invoke("save-anthropic-key", key),
  debugLog: (message, data) => ipcRenderer.invoke("debug-log", message, data),
  
  // AWS Transcribe functions
  transcribeAWS: (audioBuffer, options) => ipcRenderer.invoke("transcribe-aws", audioBuffer, options),
  
  // Streaming Transcription functions (real-time, low-latency)
  streamingTranscribeStart: (options) => ipcRenderer.invoke("streaming-transcribe-start", options),
  streamingTranscribeChunk: (audioBuffer) => ipcRenderer.invoke("streaming-transcribe-chunk", audioBuffer),
  streamingTranscribeEnd: () => ipcRenderer.invoke("streaming-transcribe-end"),
  streamingTranscribeAbort: () => ipcRenderer.invoke("streaming-transcribe-abort"),
  streamingTranscribeStatus: () => ipcRenderer.invoke("streaming-transcribe-status"),
  
  // Streaming transcription event listeners
  onStreamingPartial: (callback) => ipcRenderer.on("streaming-transcribe-partial", (_, data) => callback(data)),
  onStreamingFinal: (callback) => ipcRenderer.on("streaming-transcribe-final", (_, data) => callback(data)),
  onStreamingLanguage: (callback) => ipcRenderer.on("streaming-transcribe-language", (_, data) => callback(data)),
  onStreamingError: (callback) => ipcRenderer.on("streaming-transcribe-error", (_, data) => callback(data)),
  
  // Context detection for style selection
  getActiveAppContext: () => ipcRenderer.invoke("get-active-app-context"),
  
  // Connection warmup functions (for pre-initializing AWS connections)
  connectionWarmup: (options) => ipcRenderer.invoke("connection-warmup", options),
  connectionStatus: () => ipcRenderer.invoke("connection-status"),
  connectionHealthCheck: () => ipcRenderer.invoke("connection-health-check"),
  connectionIsReady: () => ipcRenderer.invoke("connection-is-ready"),
  connectionReset: () => ipcRenderer.invoke("connection-reset"),
  
  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
