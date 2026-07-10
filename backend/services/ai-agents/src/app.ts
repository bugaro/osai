import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { healthApp } from './interface/routes/health.js';
import { metricsApp } from './interface/routes/metricsRoute.js';
import { createResolveApp } from './interface/routes/resolve.js';
import { DataModelClient } from './infrastructure/clients/DataModelClient.js';
import { createMastraInstance } from './mastra/index.js';
import { InvalidOperationError } from './domain/errors/InvalidOperationError.js';
import { ENV_AI_DATA_MODEL_URL } from './constants.js';

export async function createApp(): Promise<{ app: Hono; mastra: Awaited<ReturnType<typeof createMastraInstance>> }> {
  const dataModelUrl = process.env[ENV_AI_DATA_MODEL_URL];
  if (!dataModelUrl) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_AI_DATA_MODEL_URL}`);
  }
  const dataModelClient = new DataModelClient(dataModelUrl);
  const mastra = await createMastraInstance(dataModelClient);

  const resolveApp = createResolveApp(mastra, dataModelClient);

  const app = new Hono();

  app.use('*', cors());

  app.route('/', healthApp);
  app.route('/', metricsApp);
  app.route('/', resolveApp);

  return { app, mastra };
}
