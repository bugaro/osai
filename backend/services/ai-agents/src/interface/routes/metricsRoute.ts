import { Hono } from 'hono';
import { register } from '../../infrastructure/observability/metrics.js';
import { ROUTE_METRICS } from '../../constants.js';

const app = new Hono();

app.get(ROUTE_METRICS, async (c) => {
  const metrics = await register.metrics();
  return c.text(metrics);
});

export { app as metricsApp };
