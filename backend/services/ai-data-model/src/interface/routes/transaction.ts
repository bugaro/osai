import { Hono } from 'hono';
import { z } from 'zod';
import { ExecuteTransactionUseCase } from '../../application/use-cases/ExecuteTransactionUseCase.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { RulesNotSyncedError } from '../../domain/errors/RulesNotSyncedError.js';

const TransactionRequestSchema = z.object({
  amount: z.number().nonnegative('Amount must not be negative'),
  location: z.string().min(1, 'location is required'),
  tier: z.string().min(1, 'tier is required'),
});

export function createTransactionRoute(useCase: ExecuteTransactionUseCase): Hono {
  const route = new Hono();

  route.post('/api/transaction', async (c) => {
    try {
      const body = await c.req.json();
      const parsed = TransactionRequestSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: 'ValidationError', message: parsed.error.errors[0].message }, 400);
      }

      const correlationId = c.req.header('x-correlation-id') || 'unknown';
      const result = await useCase.execute(parsed.data, correlationId);

      if (result.status === 'rejected') {
        return c.json(
          {
            error: 'SecurityException',
            violatedInvariant: result.violatedInvariant,
            attemptedValue: result.attemptedValue,
            maxAllowed: result.maxAllowed,
          },
          403,
        );
      }

      return c.json({ status: 'executed' });
    } catch (err) {
      if (err instanceof ValidationError) {
        return c.json({ error: 'ValidationError', message: err.message }, 400);
      }
      if (err instanceof RulesNotSyncedError) {
        return c.json({ error: 'RulesNotSyncedError', message: err.message }, 503);
      }
      throw err;
    }
  });

  return route;
}
