/**
 * AWS Bedrock Service for Open Whispr
 */

import { getAgentName } from "../utils/agentName.ts";

const BEDROCK_MODELS = {
  "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0",
  "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0", 
  "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
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
    const modelId = BEDROCK_MODELS[modelKey] || BEDROCK_MODELS["claude-3-haiku"];
    const credentials = await this.getCredentials();
    if (window.electronAPI?.invokeBedrockModel) {
      return await window.electronAPI.invokeBedrockModel({
        modelId, text, region: this.region, credentials
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

  async isAvailable() {
    try { await this.getCredentials(); return true; } catch { return false; }
  }

  getAvailableModels() {
    return Object.keys(BEDROCK_MODELS).map(k => ({ id: k, modelId: BEDROCK_MODELS[k] }));
  }
}

export default new BedrockService();
