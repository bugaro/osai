import { Hono } from 'hono';
import { ROUTE_HEALTH, STATUS_OK } from '../../constants.js';

const app = new Hono();

app.get(ROUTE_HEALTH, (c) => {
  return c.json({ status: STATUS_OK });
});

export { app as healthApp };
