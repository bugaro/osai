import './infrastructure/observability/otel.js';

import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { logger } from './infrastructure/observability/logger.js';
import { ENV_AI_AGENTS_PORT } from './constants.js';

const portEnv = process.env[ENV_AI_AGENTS_PORT];
if (!portEnv) {
  logger.fatal({ msg: `Missing required environment variable: ${ENV_AI_AGENTS_PORT}` });
  process.exit(1);
}
const port = Number(portEnv);
if (Number.isNaN(port)) {
  logger.fatal({ msg: `Invalid ${ENV_AI_AGENTS_PORT} value: ${portEnv}` });
  process.exit(1);
}

async function main() {
  const { app } = await createApp();

  serve({
    fetch: app.fetch,
    port,
  });

  logger.info({ msg: 'App initialized successfully', port });
}

main().catch((error) => {
  logger.error({ msg: 'Failed to start server', error: String(error) });
  process.exit(1);
});
