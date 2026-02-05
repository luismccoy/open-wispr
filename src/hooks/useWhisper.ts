/**
 * useWhisper Hook
 * 
 * Hook for managing local Whisper model installation and usage.
 */

import { useState, useCallback } from 'react';

interface UseWhisperProps {
  showAlertDialog?: (dialog: { title: string; description?: string }) => void;
}

export interface UseWhisperReturn {
  isInstalling: boolean;
  installProgress: number;
  installStatus: string;
  isModelDownloading: boolean;
  modelDownloadProgress: number;
  modelDownloadStatus: string;
  checkWhisperInstalled: () => Promise<boolean>;
  installWhisper: () => Promise<boolean>;
  downloadModel: (model: string) => Promise<boolean>;
  setupProgressListener: () => void;
}

export function useWhisper(showAlertDialog?: UseWhisperProps['showAlertDialog']): UseWhisperReturn {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState('');
  const [isModelDownloading, setIsModelDownloading] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
  const [modelDownloadStatus, setModelDownloadStatus] = useState('');

  const checkWhisperInstalled = useCallback(async (): Promise<boolean> => {
    // Stub implementation
    return true;
  }, []);

  const installWhisper = useCallback(async (): Promise<boolean> => {
    setIsInstalling(true);
    setInstallProgress(0);
    setInstallStatus('Installing...');
    
    // Stub implementation
    setIsInstalling(false);
    setInstallProgress(100);
    setInstallStatus('Installed');
    return true;
  }, []);

  const downloadModel = useCallback(async (model: string): Promise<boolean> => {
    setIsModelDownloading(true);
    setModelDownloadProgress(0);
    setModelDownloadStatus(`Downloading ${model}...`);
    
    // Stub implementation
    setIsModelDownloading(false);
    setModelDownloadProgress(100);
    setModelDownloadStatus('Downloaded');
    return true;
  }, []);

  const setupProgressListener = useCallback(() => {
    // Stub implementation - set up IPC listeners for progress updates
  }, []);

  return {
    isInstalling,
    installProgress,
    installStatus,
    isModelDownloading,
    modelDownloadProgress,
    modelDownloadStatus,
    checkWhisperInstalled,
    installWhisper,
    downloadModel,
    setupProgressListener,
  };
}
