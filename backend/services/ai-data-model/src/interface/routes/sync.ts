import { Hono } from 'hono';
import { z } from 'zod';
import { SyncPolicyUseCase } from '../../application/use-cases/SyncPolicyUseCase.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { ExtractionError } from '../../domain/errors/ExtractionError.js';

const SyncRequestSchema = z.object({
  rules: z.string().min(1, 'Policy text must not be empty'),
});

export function createSyncRoute(useCase: SyncPolicyUseCase): Hono {
  const route = new Hono();

  route.post('/api/sync', async (c) => {
    try {
      const body = await c.req.json();
      const parsed = SyncRequestSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: 'ValidationError', message: parsed.error.errors[0].message }, 400);
      }

      const correlationId = c.req.header('x-correlation-id') || 'unknown';
      const result = await useCase.execute(parsed.data, correlationId);

      return c.json({ rulesCount: result.rulesCount });
    } catch (err) {
      if (err instanceof ValidationError) {
        return c.json({ error: 'ValidationError', message: err.message }, 400);
      }
      if (err instanceof ExtractionError) {
        return c.json({ error: 'ExtractionError', message: err.message }, 422);
      }
      throw err;
    }
  });

  return route;
}
