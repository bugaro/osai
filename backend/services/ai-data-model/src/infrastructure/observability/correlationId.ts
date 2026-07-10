import { randomUUID } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import { correlationIdStorage } from './logger.js';

export const correlationIdMiddleware: MiddlewareHandler = async (c, next) => {
  const correlationId = c.req.header('x-correlation-id') || randomUUID();
  c.res.headers.set('x-correlation-id', correlationId);
  return correlationIdStorage.run(correlationId, next);
};
