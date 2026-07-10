import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.js';
import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_TIMEOUT_MS, ENV_OLLAMA_URL, ENV_OLLAMA_MODEL, ENV_OLLAMA_TIMEOUT } from '../../constants.js';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  timeout: number;
}

export function loadOllamaConfig(): OllamaConfig {
  const baseUrl = process.env[ENV_OLLAMA_URL];
  if (!baseUrl) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_OLLAMA_URL}`);
  }
  const timeoutRaw = process.env[ENV_OLLAMA_TIMEOUT];
  const timeout = timeoutRaw ? parseInt(timeoutRaw, 10) : DEFAULT_OLLAMA_TIMEOUT_MS;
  if (timeoutRaw !== undefined && (isNaN(timeout) || timeout <= 0)) {
    throw new InvalidOperationError(`Invalid ${ENV_OLLAMA_TIMEOUT}: "${timeoutRaw}". Must be a positive integer.`);
  }
  return {
    baseUrl,
    model: process.env[ENV_OLLAMA_MODEL] || DEFAULT_OLLAMA_MODEL,
    timeout,
  };
}
