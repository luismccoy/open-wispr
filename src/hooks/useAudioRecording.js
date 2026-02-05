import { useState, useEffect, useRef } from "react";
import StreamingAudioManager from "../helpers/streamingAudioManager";

export const useAudioRecording = (toast) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const audioManagerRef = useRef(null);

  useEffect(() => {
    // Initialize StreamingAudioManager for real-time transcription
    audioManagerRef.current = new StreamingAudioManager();

    // Set up callbacks
    audioManagerRef.current.setCallbacks({
      onStateChange: ({ isRecording, isProcessing }) => {
        setIsRecording(isRecording);
        setIsProcessing(isProcessing);
        // Clear detected language when starting a new recording
        if (isRecording) {
          setDetectedLanguage(null);
        }
      },
      onError: (error) => {
        console.error('[useAudioRecording] Error:', error);
        toast({
          title: error.title,
          description: error.description,
          variant: "destructive",
        });
      },
      onTranscriptionComplete: (result) => {
        if (result.success) {
          setTranscript(result.text);
          setPartialTranscript(""); // Clear partial on complete
          // Capture detected language from result
          if (result.detectedLanguage) {
            setDetectedLanguage(result.detectedLanguage);
          }
          console.log(`[useAudioRecording] Transcription complete in ${result.processingTime?.toFixed(0)}ms`);
        }
      },
      onPartialTranscript: (text) => {
        // Real-time partial transcript updates during recording
        setPartialTranscript(text);
      },
      onLanguageDetected: (languageCode) => {
        // Real-time language detection callback
        setDetectedLanguage(languageCode);
        console.log(`[useAudioRecording] Language detected: ${languageCode}`);
      },
    });

    // Set up hotkey listener
    let recording = false;
    const handleToggle = (_event) => {
      const currentState = audioManagerRef.current.getState();

      if (!recording && !currentState.isRecording && !currentState.isProcessing) {
        audioManagerRef.current.startRecording().then(result => {
          if (result) {
            recording = true;
          }
        }).catch(err => {
          console.error('[useAudioRecording] startRecording error:', err);
        });
      } else if (currentState.isRecording) {
        audioManagerRef.current.stopRecording();
        recording = false;
      }
    };

    window.electronAPI.onToggleDictation(handleToggle);

    // Cleanup
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.destroy();
      }
      window.electronAPI?.removeAllListeners?.("toggle-dictation");
    };
  }, [toast]);

  const startRecording = async () => {
    if (audioManagerRef.current) {
      setPartialTranscript(""); // Clear any previous partial
      return await audioManagerRef.current.startRecording();
    }
    return false;
  };

  const stopRecording = async () => {
    if (audioManagerRef.current) {
      return await audioManagerRef.current.stopRecording();
    }
    return false;
  };

  const abortRecording = async () => {
    if (audioManagerRef.current) {
      await audioManagerRef.current.abortRecording();
      setPartialTranscript("");
      setDetectedLanguage(null);
    }
  };

  const toggleListening = () => {
    if (!isRecording && !isProcessing) {
      startRecording();
    } else if (isRecording) {
      stopRecording();
    }
  };

  return {
    isRecording,
    isProcessing,
    transcript,
    partialTranscript, // New: real-time partial transcript
    detectedLanguage,  // New: detected language from auto-detect
    startRecording,
    stopRecording,
    abortRecording,    // New: abort without processing
    toggleListening,
  };
};
