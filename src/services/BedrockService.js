/**
 * AWS Bedrock Service for Ollie
 */

import { getAgentName } from "../utils/agentName.ts";

const BEDROCK_MODELS = {
  // Short keys for convenience
  "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
  "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0", 
  "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  // Full model IDs (passed from languages.ts)
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0": "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
  "anthropic.claude-3-5-sonnet-20240620-v1:0": "anthropic.claude-3-5-sonnet-20240620-v1:0",
  "anthropic.claude-3-haiku-20240307-v1:0": "anthropic.claude-3-haiku-20240307-v1:0",
};

// Style-specific prompts for context-aware enhancement
const STYLE_PROMPTS = {
  formal: `You are a professional writing assistant. Clean up the following dictated text:
- Use professional, formal tone appropriate for business emails
- Use complete sentences with proper grammar
- Avoid contractions (use "do not" instead of "don't")
- Maintain a respectful, business-appropriate style
- Fix any transcription errors
- Do not add information not present in the original
- Keep the same meaning and intent

Text: {{text}}

Return only the cleaned text, nothing else.`,

  casual: `You are a friendly writing assistant. Clean up the following dictated text:
- Use a conversational, relaxed tone suitable for chat messages
- Contractions are fine (don't, can't, won't)
- Keep it natural and approachable
- Fix obvious transcription errors
- Preserve the speaker's personality and voice
- Do not add information not present in the original

Text: {{text}}

Return only the cleaned text, nothing else.`,

  neutral: `You are a writing assistant. Clean up the following dictated text:
- Fix grammar and punctuation errors
- Maintain the original tone and style
- Do not change formality level
- Fix transcription errors only
- Do not add information not present in the original

Text: {{text}}

Return only the cleaned text, nothing else.`
};

class BedrockService {
  constructor() {
    this.region = "us-east-1";
    this.credentials = null;
  }

  setCredentials(accessKeyId, secretAccessKey, sessionToken = null) {
    this.credentials = { accessKeyId, secretAccessKey, sessionToken };
  }

  setRegion(region) {
    this.region = region;
  }

  async getCredentials() {
    if (this.credentials) return this.credentials;
    if (window.electronAPI?.getAWSCredentials) {
      const creds = await window.electronAPI.getAWSCredentials();
      if (creds) return creds;
    }
    const stored = localStorage.getItem("awsCredentials");
    if (stored) return JSON.parse(stored);
    throw new Error("AWS credentials not configured");
  }

  async invokeModel(text, modelKey = "claude-3-haiku") {
    const modelId = BEDROCK_MODELS[modelKey] || modelKey; // Use key as-is if not in map
    window.electronAPI?.debugLog?.('BedrockService.invokeModel called', { modelKey, modelId, textLength: text?.length });
    if (window.electronAPI?.invokeBedrockModel) {
      window.electronAPI?.debugLog?.('Calling electronAPI.invokeBedrockModel', { modelId, region: this.region });
      return await window.electronAPI.invokeBedrockModel({
        modelId, text, region: this.region
      });
    }
    throw new Error("Bedrock requires electron backend");
  }

  async processText(text, model = "claude-3-haiku") {
    const agentName = getAgentName();
    const { DEFAULT_PROMPTS } = await import("./ReasoningService.js");
    const hasAgent = agentName && text.toLowerCase().includes(agentName.toLowerCase());
    const template = hasAgent ? DEFAULT_PROMPTS.agent : DEFAULT_PROMPTS.regular;
    const prompt = template.replace(/{{agentName}}/g, agentName).replace(/{{text}}/g, text);
    return await this.invokeModel(prompt, model);
  }

  /**
   * Process text with context-aware styling
   * @param {string} text - The transcribed text
   * @param {string} style - 'formal', 'casual', or 'neutral'
   * @param {string} model - The model to use
   * @returns {Promise<string>} - Enhanced text
   */
  async processTextWithStyle(text, style = 'neutral', model = "claude-3-haiku") {
    const agentName = getAgentName();
    const hasAgent = agentName && text.toLowerCase().includes(agentName.toLowerCase());
    
    // If agent name detected, use agent prompt instead
    if (hasAgent) {
      return this.processText(text, model);
    }
    
    // Use style-specific prompt
    const template = STYLE_PROMPTS[style] || STYLE_PROMPTS.neutral;
    const prompt = template.replace(/{{text}}/g, text);
    
    console.log(`[BedrockService] Processing with style: ${style}`);
    return await this.invokeModel(prompt, model);
  }

  /**
   * Get the prompt template for a style
   */
  getStylePrompt(style) {
    return STYLE_PROMPTS[style] || STYLE_PROMPTS.neutral;
  }

  async isAvailable() {
    try { await this.getCredentials(); return true; } catch { return false; }
  }

  getAvailableModels() {
    return Object.keys(BEDROCK_MODELS).map(k => ({ id: k, modelId: BEDROCK_MODELS[k] }));
  }
}

export default new BedrockService();
export { STYLE_PROMPTS };
