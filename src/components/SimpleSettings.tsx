/**
 * Simplified Settings Page - AWS-only transcription
 */

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RefreshCw, Mic, Shield, Keyboard } from "lucide-react";
import { AWS_TRANSCRIBE_LANGUAGES, BEDROCK_MODELS } from "../utils/awsLanguages";
import ConnectionStatusIndicator from "./ui/ConnectionStatusIndicator";

interface SimpleSettingsProps {
  onClose?: () => void;
}

export default function SimpleSettings({ onClose }: SimpleSettingsProps) {
  // AWS Settings
  const [awsRegion, setAwsRegion] = useState(() => 
    localStorage.getItem("awsRegion") || "us-east-1"
  );
  // Default to "auto" for auto-detect language (R4)
  const [transcribeLanguage, setTranscribeLanguage] = useState(() => 
    localStorage.getItem("transcribeLanguage") || "auto"
  );
  
  // Enhancement Settings - enabled by default (R2: text enhancement enabled by default)
  const [useEnhancement, setUseEnhancement] = useState(() => 
    localStorage.getItem("useTextEnhancement") !== "false"
  );
  const [enhancementModel, setEnhancementModel] = useState(() => 
    localStorage.getItem("enhancementModel") || "anthropic.claude-3-haiku-20240307-v1:0"
  );
  
  // Hotkey
  const [dictationKey, setDictationKey] = useState(() => 
    localStorage.getItem("dictationKey") || "`"
  );
  
  // Microphone
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(() => 
    localStorage.getItem("selectedMicrophoneId") || "default"
  );
  
  // Status
  const [status, setStatus] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<string>("");

  useEffect(() => {
    loadMicrophones();
    loadVersion();
  }, []);

  const loadMicrophones = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === "audioinput");
      setMicDevices(mics);
    } catch (error) {
      console.error("Failed to load microphones:", error);
    }
  };

  const loadVersion = async () => {
    const result = await window.electronAPI?.getAppVersion();
    if (result) setCurrentVersion(result.version);
  };

  const saveSettings = () => {
    localStorage.setItem("awsRegion", awsRegion);
    localStorage.setItem("transcribeLanguage", transcribeLanguage);
    localStorage.setItem("useTextEnhancement", String(useEnhancement));
    localStorage.setItem("enhancementModel", enhancementModel);
    localStorage.setItem("dictationKey", dictationKey);
    localStorage.setItem("selectedMicrophoneId", selectedMic);
    
    // Update hotkey
    window.electronAPI?.updateHotkey?.(dictationKey);
    
    setStatus("Settings saved!");
    setTimeout(() => setStatus(""), 2000);
  };

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setStatus("✓ Microphone access granted");
    } catch (error) {
      setStatus("✗ Microphone access denied");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const testAWSCredentials = async () => {
    try {
      // @ts-ignore - getAWSCredentials is defined in preload.js
      const creds = await window.electronAPI?.getAWSCredentials?.();
      if (creds?.accessKeyId) {
        setStatus("✓ AWS credentials found");
      } else {
        setStatus("✗ No AWS credentials - run 'aws configure' or set env vars");
      }
    } catch (error) {
      setStatus("✗ Failed to check AWS credentials");
    }
    setTimeout(() => setStatus(""), 5000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <span className="text-sm text-gray-500">v{currentVersion}</span>
      </div>

      {status && (
        <div className={`p-3 rounded-lg text-sm ${
          status.startsWith("✓") ? "bg-green-100 text-green-800" :
          status.startsWith("✗") ? "bg-red-100 text-red-800" :
          "bg-blue-100 text-blue-800"
        }`}>
          {status}
        </div>
      )}

      {/* AWS Transcribe Settings */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-orange-500">☁️</span> AWS Transcribe
          </h2>
          <ConnectionStatusIndicator />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region
            </label>
            <select
              value={awsRegion}
              onChange={(e) => setAwsRegion(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              <option value="us-east-1">US East (N. Virginia)</option>
              <option value="us-west-2">US West (Oregon)</option>
              <option value="eu-west-1">EU (Ireland)</option>
              <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
              <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              value={transcribeLanguage}
              onChange={(e) => setTranscribeLanguage(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              {AWS_TRANSCRIBE_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={testAWSCredentials} variant="outline" size="sm">
          Test AWS Credentials
        </Button>
        <p className="text-xs text-gray-500">
          Uses AWS credentials from ~/.aws/credentials or environment variables
        </p>
      </section>

      {/* Text Enhancement */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-purple-500">✨</span> Text Enhancement (Optional)
        </h2>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useEnhancement}
            onChange={(e) => setUseEnhancement(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            Enhance transcriptions with AI (fixes grammar, formatting)
          </span>
        </label>

        {useEnhancement && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enhancement Model (Bedrock)
            </label>
            <select
              value={enhancementModel}
              onChange={(e) => setEnhancementModel(e.target.value)}
              className="w-full p-2 border rounded-lg bg-white"
            >
              {BEDROCK_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} - {model.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Microphone */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Mic className="w-5 h-5 text-blue-500" /> Microphone
        </h2>
        
        <div className="flex gap-2">
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="flex-1 p-2 border rounded-lg bg-white"
          >
            <option value="default">System Default</option>
            {micDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
          <Button onClick={loadMicrophones} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Button onClick={testMicrophone} variant="outline" size="sm">
          <Mic className="w-4 h-4 mr-2" />
          Test Microphone
        </Button>
      </section>

      {/* Hotkey */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-green-500" /> Dictation Hotkey
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Press this key to start/stop dictation
          </label>
          <Input
            value={dictationKey}
            onChange={(e) => setDictationKey(e.target.value)}
            className="w-32 text-center text-lg font-mono"
            maxLength={1}
          />
          <p className="text-xs text-gray-500 mt-1">
            Default: ` (backtick)
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className="pt-4 border-t">
        <Button onClick={saveSettings} className="w-full">
          Save Settings
        </Button>
      </div>

      {/* Quick Actions */}
      <section className="space-y-3 pt-4 border-t">
        <h2 className="text-sm font-medium text-gray-600">Quick Actions</h2>
        
        <Button
          onClick={() => {
            if (confirm("Reset all settings to defaults?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          variant="outline"
          className="w-full text-amber-600 border-amber-300"
        >
          Reset to Defaults
        </Button>
      </section>
    </div>
  );
}
