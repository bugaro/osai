import { MastraModelGateway } from '@mastra/core/llm';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  OLLAMA_GATEWAY_ID,
  OLLAMA_GATEWAY_NAME,
  OLLAMA_DEFAULT_MODEL,
  OLLAMA_DEFAULT_API_KEY,
  OLLAMA_API_KEY_ENV_VAR,
  ENV_OLLAMA_BASE_URL,
  ENV_OLLAMA_MODELS,
  DEFAULT_OLLAMA_BASE_URL,
} from '../../constants.js';

export class OllamaGateway extends MastraModelGateway {
  readonly id = OLLAMA_GATEWAY_ID;
  readonly name = OLLAMA_GATEWAY_NAME;

  async fetchProviders(): Promise<Record<string, { name: string; models: string[]; apiKeyEnvVar: string; gateway: string }>> {
    const modelsEnv = process.env[ENV_OLLAMA_MODELS] || OLLAMA_DEFAULT_MODEL;
    const models = modelsEnv.split(',').map(m => m.trim());
    return {
      [OLLAMA_GATEWAY_ID]: {
        name: OLLAMA_GATEWAY_NAME,
        models,
        apiKeyEnvVar: OLLAMA_API_KEY_ENV_VAR,
        gateway: OLLAMA_GATEWAY_ID,
      },
    };
  }

  buildUrl(): string {
    return process.env[ENV_OLLAMA_BASE_URL] || DEFAULT_OLLAMA_BASE_URL;
  }

  async getApiKey(): Promise<string> {
    return OLLAMA_DEFAULT_API_KEY;
  }

  resolveLanguageModel(args: { modelId: string; providerId: string; apiKey: string }) {
    const baseURL = this.buildUrl();
    return createOpenAICompatible({
      name: OLLAMA_GATEWAY_ID,
      baseURL,
      apiKey: args.apiKey,
    }).chatModel(args.modelId);
  }
}
