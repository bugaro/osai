import { Hono } from 'hono';
import { getMetricsContent, getMetricsContentType } from '../../infrastructure/observability/metrics.js';

export const metricsRoute = new Hono();

metricsRoute.get('/metrics', async (c) => {
  const content = await getMetricsContent();
  c.header('content-type', getMetricsContentType());
  return c.body(content);
});
