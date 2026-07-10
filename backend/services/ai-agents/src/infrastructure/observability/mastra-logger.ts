import type { IMastraLogger, LogLevel, BaseLogMessage, LoggerTransport } from '@mastra/core/logger';
import { logger } from './logger.js';

export class PinoMastraLogger implements IMastraLogger {
  debug(message: string, ...args: unknown[]): void {
    logger.debug({ msg: message, args });
  }

  info(message: string, ...args: unknown[]): void {
    logger.info({ msg: message, args });
  }

  warn(message: string, ...args: unknown[]): void {
    logger.warn({ msg: message, args });
  }

  error(message: string, ...args: unknown[]): void {
    logger.error({ msg: message, args });
  }

  trackException(error: Error, metadata?: Record<string, unknown>): void {
    logger.error({ msg: error.message, error: error.stack, metadata });
  }

  getTransports(): Map<string, LoggerTransport> {
    return new Map();
  }

  async listLogs(
    _transportId: string,
    _params?: {
      fromDate?: Date;
      toDate?: Date;
      logLevel?: LogLevel;
      filters?: Record<string, unknown>;
      page?: number;
      perPage?: number;
    },
  ): Promise<{ logs: BaseLogMessage[]; total: number; page: number; perPage: number; hasMore: boolean }> {
    return { logs: [], total: 0, page: 1, perPage: 10, hasMore: false };
  }

  async listLogsByRunId(_options: {
    runId: string;
    transportId: string;
    fromDate?: Date;
    toDate?: Date;
    logLevel?: LogLevel;
    filters?: Record<string, unknown>;
    page?: number;
    perPage?: number;
  }): Promise<{ logs: BaseLogMessage[]; total: number; page: number; perPage: number; hasMore: boolean }> {
    return { logs: [], total: 0, page: 1, perPage: 10, hasMore: false };
  }
}
