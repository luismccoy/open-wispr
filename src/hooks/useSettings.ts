import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { getModelProvider } from "../utils/languages";

export interface TranscriptionSettings {
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
  anthropicApiKey: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  awsRegion: string;
}

export function useSettings() {
  const [preferredLanguage, setPreferredLanguage] = useLocalStorage(
    "preferredLanguage",
    "auto",
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

  // API keys - AWS and Anthropic only (OpenAI removed per R3)
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
      if (settings.preferredLanguage !== undefined)
        setPreferredLanguage(settings.preferredLanguage);
    },
    [
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
      if (keys.anthropicApiKey !== undefined)
        setAnthropicApiKey(keys.anthropicApiKey);
      if (keys.awsAccessKeyId !== undefined)
        setAwsAccessKeyId(keys.awsAccessKeyId);
      if (keys.awsSecretAccessKey !== undefined)
        setAwsSecretAccessKey(keys.awsSecretAccessKey);
      if (keys.awsRegion !== undefined)
        setAwsRegion(keys.awsRegion);
    },
    [setAnthropicApiKey, setAwsAccessKeyId, setAwsSecretAccessKey, setAwsRegion]
  );

  return {
    preferredLanguage,
    useReasoningModel,
    reasoningModel,
    reasoningProvider,
    anthropicApiKey,
    awsAccessKeyId,
    awsSecretAccessKey,
    awsRegion,
    dictationKey,
    setPreferredLanguage,
    setUseReasoningModel,
    setReasoningModel,
    setReasoningProvider: (provider: string) => {
      // OpenAI removed per R3 - only Bedrock and Anthropic supported
      const providerModels = {
        bedrock: "anthropic.claude-3-haiku-20240307-v1:0",
        anthropic: "claude-3-haiku-20240307",
      };
      setReasoningModel(
        providerModels[provider as keyof typeof providerModels] ||
          "anthropic.claude-3-haiku-20240307-v1:0"
      );
    },
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
