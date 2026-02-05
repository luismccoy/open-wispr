export interface TranscriptionItem {
  id: number;
  text: string;
  timestamp: string;
  created_at: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  version?: string;
  releaseDate?: string;
  files?: any[];
  releaseNotes?: string;
  message?: string;
}

export interface UpdateStatusResult {
  updateAvailable: boolean;
  updateDownloaded: boolean;
  isDevelopment: boolean;
}

export interface UpdateResult {
  success: boolean;
  message: string;
}

export interface AppVersionResult {
  version: string;
}

// Additional interface for settings
export interface SaveSettings {
  apiKey: string;
  hotkey: string;
}

declare global {
  interface Window {
    electronAPI: {
      // Basic window operations
      pasteText: (text: string) => Promise<void>;
      hideWindow: () => Promise<void>;
      showDictationPanel: () => Promise<void>;
      onToggleDictation: (callback: () => void) => void;

      // Database operations
      saveTranscription: (
        text: string
      ) => Promise<{ id: number; success: boolean }>;
      getTranscriptions: (limit?: number) => Promise<TranscriptionItem[]>;
      clearTranscriptions: () => Promise<{ cleared: number; success: boolean }>;
      deleteTranscription: (id: number) => Promise<{ success: boolean }>;

      // API key management - OpenAI removed per R3, AWS is the sole provider
      // AWS credentials are managed via ~/.aws/credentials or environment variables

      // Clipboard operations
      readClipboard: () => Promise<string>;
      writeClipboard: (text: string) => Promise<{ success: boolean }>;

      // Window control operations
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
      windowIsMaximized: () => Promise<boolean>;

      // App management
      cleanupApp: () => Promise<void>;

      // Update operations
      checkForUpdates: () => Promise<UpdateCheckResult>;
      downloadUpdate: () => Promise<UpdateResult>;
      installUpdate: () => Promise<UpdateResult>;
      getAppVersion: () => Promise<AppVersionResult>;
      getUpdateStatus: () => Promise<UpdateStatusResult>;

      // Update event listeners
      onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
      onUpdateNotAvailable: (callback: (event: any, info: any) => void) => void;
      onUpdateDownloaded: (callback: (event: any, info: any) => void) => void;
      onUpdateDownloadProgress: (
        callback: (event: any, progressObj: any) => void
      ) => void;
      onUpdateError: (callback: (event: any, error: any) => void) => void;

      // Settings management (used by OnboardingFlow but not in preload.js)
      saveSettings?: (settings: SaveSettings) => Promise<void>;

      // External URL operations
      openExternal: (
        url: string
      ) => Promise<{ success: boolean; error?: string }>;

      // Event listener cleanup
      removeAllListeners?: (channel: string) => void;

      // Hotkey management
      updateHotkey?: (key: string) => Promise<void>;

      // AWS operations
      getAWSCredentials?: () => Promise<{
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string | null;
      } | null>;
      saveAWSCredentials?: (creds: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string | null;
      }) => Promise<{ success: boolean; error?: string }>;
      invokeBedrockModel?: (params: {
        modelId: string;
        text: string;
        region?: string;
      }) => Promise<string>;
      transcribeAWS?: (
        audioBuffer: ArrayBuffer,
        options?: { languageCode?: string; region?: string }
      ) => Promise<{ success: boolean; text?: string; error?: string }>;

      // Debug logging
      debugLog?: (message: string, data?: any) => Promise<boolean>;

      // Audio events
      onNoAudioDetected?: (callback: () => void) => void;
    };
  }
}
