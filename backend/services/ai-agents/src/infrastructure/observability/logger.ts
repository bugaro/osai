import pino from 'pino';
import { getCorrelationId } from './correlation.js';
import { SERVICE_NAME, ENV_LOG_LEVEL, DEFAULT_LOG_LEVEL } from '../../constants.js';

export const logger = pino({
  level: process.env[ENV_LOG_LEVEL] || DEFAULT_LOG_LEVEL,
  mixin() {
    return {
      correlationId: getCorrelationId(),
      service: SERVICE_NAME,
    };
  },
});
