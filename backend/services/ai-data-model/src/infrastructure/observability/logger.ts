import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';
import { SERVICE_NAME, DEFAULT_LOG_LEVEL, ENV_LOG_LEVEL, ENV_OTEL_SERVICE_NAME } from '../../constants.js';

export const correlationIdStorage = new AsyncLocalStorage<string>();

export const logger = pino({
  level: process.env[ENV_LOG_LEVEL] || DEFAULT_LOG_LEVEL,
  mixin() {
    const correlationId = correlationIdStorage.getStore();
    return {
      correlationId: correlationId || 'unknown',
      service: process.env[ENV_OTEL_SERVICE_NAME] || SERVICE_NAME,
    };
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'secret'],
    censor: '[REDACTED]',
  },
});
