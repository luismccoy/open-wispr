import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getModelProvider } from "../utils/languages";

export interface TranscriptionSettings {
  useLocalWhisper: boolean;
  whisperModel: string;
  allowOpenAIFallback: boolean;
  allowLocalFallback: boolean;
  fallbackWhisperModel: string;
  preferredLanguage: string;
}

export interface ReasoningSettings {
  useReasoningModel: boolean;
  reasoningModel: string;
  reasoningProvider: string;
}

export interface HotkeySettings {
  dictationKey: string;
}

export interface ApiKeySettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
}

export function useSettings() {
  const [useLocalWhisper, setUseLocalWhisper] = useLocalStorage(
    "useLocalWhisper",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [whisperModel, setWhisperModel] = useLocalStorage(
    "whisperModel",
    "base",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [allowOpenAIFallback, setAllowOpenAIFallback] = useLocalStorage(
    "allowOpenAIFallback",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [allowLocalFallback, setAllowLocalFallback] = useLocalStorage(
    "allowLocalFallback",
    false,
    {
      serialize: String,
      deserialize: (value) => value === "true",
    }
  );

  const [fallbackWhisperModel, setFallbackWhisperModel] = useLocalStorage(
    "fallbackWhisperModel",
    "base",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [preferredLanguage, setPreferredLanguage] = useLocalStorage(
    "preferredLanguage",
    "en",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // Reasoning settings - default to Bedrock with Claude 3.5 Sonnet v2
  const [useReasoningModel, setUseReasoningModel] = useLocalStorage(
    "useReasoningModel",
    true,
    {
      serialize: String,
      deserialize: (value) => value !== "false", // Default true
    }
  );

  const [reasoningModel, setReasoningModel] = useLocalStorage(
    "reasoningModel",
    "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // API keys
  const [openaiApiKey, setOpenaiApiKey] = useLocalStorage("openaiApiKey", "", {
    serialize: String,
    deserialize: String,
  });

  const [anthropicApiKey, setAnthropicApiKey] = useLocalStorage(
    "anthropicApiKey",
    "",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // AWS credentials for Bedrock
  const [awsAccessKeyId, setAwsAccessKeyId] = useLocalStorage(
    "awsAccessKeyId",
    "",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [awsSecretAccessKey, setAwsSecretAccessKey] = useLocalStorage(
    "awsSecretAccessKey",
    "",
    {
      serialize: String,
      deserialize: String,
    }
  );

  const [awsRegion, setAwsRegion] = useLocalStorage(
    "awsRegion",
    "us-east-1",
    {
      serialize: String,
      deserialize: String,
    }
  );

  // Hotkey
  const [dictationKey, setDictationKey] = useLocalStorage("dictationKey", "", {
    serialize: String,
    deserialize: String,
  });

  // Computed values
  const reasoningProvider = getModelProvider(reasoningModel);

  // Batch operations
  const updateTranscriptionSettings = useCallback(
    (settings: Partial<TranscriptionSettings>) => {
      if (settings.useLocalWhisper !== undefined)
        setUseLocalWhisper(settings.useLocalWhisper);
      if (settings.whisperModel !== undefined)
        setWhisperModel(settings.whisperModel);
      if (settings.allowOpenAIFallback !== undefined)
        setAllowOpenAIFallback(settings.allowOpenAIFallback);
      if (settings.allowLocalFallback !== undefined)
        setAllowLocalFallback(settings.allowLocalFallback);
      if (settings.fallbackWhisperModel !== undefined)
        setFallbackWhisperModel(settings.fallbackWhisperModel);
      if (settings.preferredLanguage !== undefined)
        setPreferredLanguage(settings.preferredLanguage);
    },
    [
      setUseLocalWhisper,
      setWhisperModel,
      setAllowOpenAIFallback,
      setAllowLocalFallback,
      setFallbackWhisperModel,
      setPreferredLanguage,
    ]
  );

  const updateReasoningSettings = useCallback(
    (settings: Partial<ReasoningSettings>) => {
      if (settings.useReasoningModel !== undefined)
        setUseReasoningModel(settings.useReasoningModel);
      if (settings.reasoningModel !== undefined)
        setReasoningModel(settings.reasoningModel);
    },
    [setUseReasoningModel, setReasoningModel]
  );

  const updateApiKeys = useCallback(
    (keys: Partial<ApiKeySettings>) => {
      if (keys.openaiApiKey !== undefined) setOpenaiApiKey(keys.openaiApiKey);
      if (keys.anthropicApiKey !== undefined)
        setAnthropicApiKey(keys.anthropicApiKey);
      if (keys.awsAccessKeyId !== undefined)
        setAwsAccessKeyId(keys.awsAccessKeyId);
      if (keys.awsSecretAccessKey !== undefined)
        setAwsSecretAccessKey(keys.awsSecretAccessKey);
      if (keys.awsRegion !== undefined)
        setAwsRegion(keys.awsRegion);
    },
    [setOpenaiApiKey, setAnthropicApiKey, setAwsAccessKeyId, setAwsSecretAccessKey, setAwsRegion]
  );

  return {
    useLocalWhisper,
    whisperModel,
    allowOpenAIFallback,
    allowLocalFallback,
    fallbackWhisperModel,
    preferredLanguage,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    openaiApiKey,
    anthropicApiKey,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    dictationKey,
    setUseLocalWhisper,
    setWhisperModel,
    setAllowOpenAIFallback,
    setAllowLocalFallback,
    setFallbackWhisperModel,
    setPreferredLanguage,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider: (provider: string) => {
      const providerModels = {
        bedrock: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
        openai: "gpt-3.5-turbo",
        anthropic: "claude-3-haiku-20240307",
      };
      setReasoningModel(
        providerModels[provider as keyof typeof providerModels] ||
          "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
      );
    },
    setOpenaiApiKey,
    setAnthropicApiKey,
    setAwsAccessKeyId,
    setAwsSecretAccessKey,
    setAwsRegion,
    setDictationKey,
    updateTranscriptionSettings,
    updateReasoningSettings,
    updateApiKeys,
  };
}
