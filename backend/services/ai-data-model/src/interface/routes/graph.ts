import { Hono } from 'hono';
import { GetGraphTopologyUseCase } from '../../application/use-cases/GetGraphTopologyUseCase.js';
import { ServiceUnavailableError } from '../../domain/errors/ServiceUnavailableError.js';

export function createGraphRoute(useCase: GetGraphTopologyUseCase): Hono {
  const route = new Hono();

  route.get('/api/graph', async (c) => {
    try {
      const result = await useCase.execute();
      return c.json(result);
    } catch (err) {
      if (err instanceof ServiceUnavailableError) {
        return c.json({ error: 'ServiceUnavailable', message: err.message }, 503);
      }
      throw err;
    }
  });

  return route;
}
