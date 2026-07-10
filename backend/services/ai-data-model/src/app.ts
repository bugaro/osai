import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { correlationIdMiddleware } from './infrastructure/observability/correlationId.js';
import { httpRequestDurationSeconds, httpRequestsTotal } from './infrastructure/observability/metrics.js';
import { healthRoute } from './interface/routes/health.js';
import { metricsRoute } from './interface/routes/metrics.js';
import { createSyncRoute } from './interface/routes/sync.js';
import { createPolicyRoute } from './interface/routes/policy.js';
import { createTransactionRoute } from './interface/routes/transaction.js';
import { createGraphRoute } from './interface/routes/graph.js';
import { createResolveRoute } from './interface/routes/resolve.js';
import { createEventsRoute } from './interface/routes/events.js';
import { SSEStreamManager } from './interface/sse/SSEStreamManager.js';
import { SyncPolicyUseCase } from './application/use-cases/SyncPolicyUseCase.js';
import { GetPolicyFrameUseCase } from './application/use-cases/GetPolicyFrameUseCase.js';
import { ExecuteTransactionUseCase } from './application/use-cases/ExecuteTransactionUseCase.js';
import { GetGraphTopologyUseCase } from './application/use-cases/GetGraphTopologyUseCase.js';
import { ResolveIncidentUseCase } from './application/use-cases/ResolveIncidentUseCase.js';
import { ProcessTraceEventUseCase } from './application/use-cases/ProcessTraceEventUseCase.js';
import { InvariantEngine } from './domain/invariants/InvariantEngine.js';
import { Neo4jPolicyRepository } from './infrastructure/neo4j/Neo4jPolicyRepository.js';
import { OllamaExtractorAdapter } from './infrastructure/ollama/OllamaExtractorAdapter.js';
import { AgentHttpClient } from './infrastructure/clients/AgentHttpClient.js';
import { InvalidOperationError } from './domain/errors/InvalidOperationError.js';
import { ENV_AI_AGENTS_URL } from './constants.js';

export function createApp(): Hono {
  const app = new Hono();

  app.use('*', cors());
  app.use('*', correlationIdMiddleware);

  app.use('*', async (c, next) => {
    const start = Date.now();
    await next();
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: c.req.method, path: new URL(c.req.url).pathname, status: c.res.status });
    httpRequestDurationSeconds.observe({ method: c.req.method, path: new URL(c.req.url).pathname }, duration);
  });

  app.route('/', healthRoute);
  app.route('/', metricsRoute);

  const invariantEngine = new InvariantEngine();
  const policyRepository = new Neo4jPolicyRepository();
  const aiExtractor = new OllamaExtractorAdapter();
  const streamManager = new SSEStreamManager();

  const syncUseCase = new SyncPolicyUseCase(aiExtractor, policyRepository, invariantEngine, streamManager);
  const policyUseCase = new GetPolicyFrameUseCase(policyRepository);
  const transactionUseCase = new ExecuteTransactionUseCase(invariantEngine, streamManager, policyRepository);
  const graphUseCase = new GetGraphTopologyUseCase(policyRepository);
  const agentsUrl = process.env[ENV_AI_AGENTS_URL];
  if (!agentsUrl) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_AI_AGENTS_URL}`);
  }
  const agentClient = new AgentHttpClient(agentsUrl);
  const resolveUseCase = new ResolveIncidentUseCase(agentClient);
  const processUseCase = new ProcessTraceEventUseCase(streamManager);

  app.route('/', createSyncRoute(syncUseCase));
  app.route('/', createPolicyRoute(policyUseCase));
  app.route('/', createTransactionRoute(transactionUseCase));
  app.route('/', createGraphRoute(graphUseCase));
  app.route('/', createResolveRoute(resolveUseCase));
  app.route('/', createEventsRoute(streamManager, processUseCase));

  return app;
}
