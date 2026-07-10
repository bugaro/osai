import { z } from 'zod';
import { loadOllamaConfig } from './OllamaConfig.js';
import { ExtractionError } from '../../domain/errors/ExtractionError.js';
import { logger } from '../observability/logger.js';
import { ollamaInferenceDurationSeconds } from '../observability/metrics.js';
import { MAX_RETRIES, BACKOFF_BASE_MS, BACKOFF_FACTOR, BACKOFF_JITTER, TEMPERATURE } from '../../constants.js';

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

const OllamaResponseSchema = z.object({
  model: z.string(),
  response: z.string(),
  done: z.boolean(),
});

export async function generate(prompt: string): Promise<OllamaGenerateResponse> {
  const config = loadOllamaConfig();
  const url = `${config.baseUrl}/api/generate`;

  const start = Date.now();
  let retries = 0;

  while (true) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          prompt,
          stream: false,
          temperature: TEMPERATURE,
        }),
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        throw new ExtractionError(`Ollama returned ${response.status}: ${response.statusText}`);
      }

      const raw = (await response.json()) as unknown;
      const parsed = OllamaResponseSchema.safeParse(raw);
      if (!parsed.success) {
        throw new ExtractionError(`Unexpected Ollama response shape: ${parsed.error.message}`);
      }

      const duration = (Date.now() - start) / 1000;
      ollamaInferenceDurationSeconds.observe(duration);
      logger.info({ durationMs: Date.now() - start, retryCount: retries }, 'ollama inference');

      return parsed.data;
    } catch (err) {
      const message = (err as Error).message;

      if (err instanceof DOMException && (err as DOMException).name === 'AbortError') {
        throw new ExtractionError(`Ollama request timed out after ${config.timeout}ms`);
      }

      if (/returned 4\d{2}/.test(message)) {
        throw new ExtractionError(`Ollama rejected the request: ${message}`);
      }

      retries++;
      if (retries > MAX_RETRIES) {
        throw new ExtractionError(`Ollama inference failed after ${MAX_RETRIES} retries: ${message}`);
      }

      logger.warn({ retryCount: retries, err: message }, 'retrying ollama inference');
      const backoff = BACKOFF_BASE_MS * Math.pow(BACKOFF_FACTOR, retries - 1) * (1 + Math.random() * BACKOFF_JITTER);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }
}
