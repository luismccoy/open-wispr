import { useState, useEffect, useCallback } from "react";

export interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

export const useMicrophone = () => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    return localStorage.getItem("selectedMicrophoneId") || "default";
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshDevices = useCallback(async () => {
    setIsLoading(true);
    try {
      // Request permission first to get device labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => stream.getTracks().forEach(t => t.stop()));

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices
        .filter(d => d.kind === "audioinput")
        .map((d, idx) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${idx + 1}`,
          isDefault: d.deviceId === "default" || idx === 0,
        }));

      // Add "System Default" option at the top
      const devicesWithDefault: AudioDevice[] = [
        { deviceId: "default", label: "System Default", isDefault: true },
        ...audioInputs.filter(d => d.deviceId !== "default"),
      ];

      setDevices(devicesWithDefault);
    } catch (error) {
      console.error("Failed to enumerate audio devices:", error);
      setDevices([{ deviceId: "default", label: "System Default", isDefault: true }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();

    // Listen for device changes (plug/unplug)
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem("selectedMicrophoneId", deviceId);
  }, []);

  return {
    devices,
    selectedDeviceId,
    selectDevice,
    refreshDevices,
    isLoading,
  };
};
