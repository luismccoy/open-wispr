/**
 * usePython Hook
 * 
 * Hook for checking Python installation status (required for local Whisper).
 */

import { useState, useCallback } from 'react';

interface UsePythonProps {
  showAlertDialog?: (dialog: { title: string; description?: string }) => void;
}

export interface UsePythonReturn {
  isPythonInstalled: boolean;
  isChecking: boolean;
  pythonVersion: string | null;
  checkPythonInstalled: () => Promise<boolean>;
}

export function usePython(showAlertDialog?: UsePythonProps['showAlertDialog']): UsePythonReturn {
  const [isPythonInstalled, setIsPythonInstalled] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pythonVersion, setPythonVersion] = useState<string | null>(null);

  const checkPythonInstalled = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    
    try {
      // Stub implementation - would check for Python via IPC
      setIsPythonInstalled(true);
      setPythonVersion('3.10.0');
      return true;
    } catch (error) {
      setIsPythonInstalled(false);
      setPythonVersion(null);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    isPythonInstalled,
    isChecking,
    pythonVersion,
    checkPythonInstalled,
  };
}
