import './infrastructure/observability/otel.js';

import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { logger } from './infrastructure/observability/logger.js';
import { REQUEST_TIMEOUT_MS, KEEPALIVE_TIMEOUT_MS, ENV_PORT } from './constants.js';

const portEnv = process.env[ENV_PORT];
if (!portEnv) {
  logger.fatal({ msg: `Missing required environment variable: ${ENV_PORT}` });
  process.exit(1);
}
const port = Number(portEnv);
if (Number.isNaN(port)) {
  logger.fatal({ msg: `Invalid ${ENV_PORT} value: ${portEnv}` });
  process.exit(1);
}

const app = createApp();

const server = serve(
  { fetch: app.fetch, port },
  (info) => {
    logger.info({ port: info.port }, 'server started');
  },
) as unknown as { requestTimeout: number; timeout: number; keepAliveTimeout: number };

server.requestTimeout = REQUEST_TIMEOUT_MS;
server.timeout = REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = KEEPALIVE_TIMEOUT_MS;
