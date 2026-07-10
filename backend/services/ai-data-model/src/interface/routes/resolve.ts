import { Hono } from 'hono';
import { ResolveIncidentUseCase } from '../../application/use-cases/ResolveIncidentUseCase.js';

export function createResolveRoute(useCase: ResolveIncidentUseCase): Hono {
  const route = new Hono();

  route.post('/api/resolve', async (c) => {
    try {
      const body = await c.req.json();
      await useCase.execute(body);
      return c.json({ status: 'accepted' }, 202);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return c.json({ error: 'InternalError', message }, 500);
    }
  });

  return route;
}
