import { Hono } from 'hono';
import { GetPolicyFrameUseCase } from '../../application/use-cases/GetPolicyFrameUseCase.js';

export function createPolicyRoute(useCase: GetPolicyFrameUseCase): Hono {
  const route = new Hono();

  route.get('/api/policy', async (c) => {
    const location = c.req.query('location');
    const tier = c.req.query('tier');

    if (!location || !tier) {
      return c.json({ error: 'ValidationError', message: 'location and tier are required' }, 400);
    }

    const result = await useCase.execute({ location, tier });
    return c.json(result);
  });

  return route;
}
