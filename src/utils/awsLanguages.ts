/**
 * AWS Transcribe supported languages
 * https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html
 * 
 * Auto-detect is the default option (R4: Auto-detect Language)
 * Uses AWS Transcribe's automatic language identification feature
 */

export const AWS_TRANSCRIBE_LANGUAGES = [
  { value: "auto", label: "Auto-detect (Recommended)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-AU", label: "English (Australia)" },
  { value: "es-US", label: "Spanish (US)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "fr-CA", label: "French (Canada)" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "pt-PT", label: "Portuguese (Portugal)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "zh-TW", label: "Chinese (Traditional)" },
  { value: "ar-SA", label: "Arabic (Saudi Arabia)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "nl-NL", label: "Dutch" },
  { value: "pl-PL", label: "Polish" },
  { value: "ru-RU", label: "Russian" },
  { value: "sv-SE", label: "Swedish" },
  { value: "tr-TR", label: "Turkish" },
  { value: "da-DK", label: "Danish" },
  { value: "fi-FI", label: "Finnish" },
  { value: "no-NO", label: "Norwegian" },
  { value: "he-IL", label: "Hebrew" },
  { value: "id-ID", label: "Indonesian" },
  { value: "ms-MY", label: "Malay" },
  { value: "th-TH", label: "Thai" },
  { value: "vi-VN", label: "Vietnamese" },
];

export const getLanguageLabel = (code: string): string => {
  if (code === "auto") return "Auto-detect (Recommended)";
  const option = AWS_TRANSCRIBE_LANGUAGES.find((lang) => lang.value === code);
  return option?.label || code;
};

// Bedrock Claude models for text enhancement
export const BEDROCK_MODELS = [
  {
    value: "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    label: "Claude 3.5 Sonnet v2",
    description: "Latest, best quality",
  },
  {
    value: "anthropic.claude-3-haiku-20240307-v1:0",
    label: "Claude 3 Haiku",
    description: "Fast and affordable",
  },
];

export const getModelLabel = (modelId: string): string => {
  const model = BEDROCK_MODELS.find((m) => m.value === modelId);
  return model?.label || modelId;
};
