import client from 'prom-client';
import {
  METRIC_HTTP_REQUESTS_TOTAL,
  METRIC_HTTP_REQUEST_DURATION_SECONDS,
  METRIC_AGENT_RESOLUTION_TOTAL,
  METRIC_AGENT_RESOLUTION_DURATION_SECONDS,
  METRIC_AGENT_INPUT_TOKENS,
  METRIC_AGENT_OUTPUT_TOKENS,
  METRIC_GEN_AI_CLIENT_TOKEN_USAGE,
  METRIC_GEN_AI_INVOKE_AGENT_DURATION,
} from '../../constants.js';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: METRIC_HTTP_REQUESTS_TOTAL,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'] as const,
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: METRIC_HTTP_REQUEST_DURATION_SECONDS,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'] as const,
  registers: [register],
});

export const agentResolutionTotal = new client.Counter({
  name: METRIC_AGENT_RESOLUTION_TOTAL,
  help: 'Total number of agent resolutions',
  labelNames: ['result'] as const,
  registers: [register],
});

export const agentResolutionDurationSeconds = new client.Histogram({
  name: METRIC_AGENT_RESOLUTION_DURATION_SECONDS,
  help: 'Agent resolution duration in seconds',
  registers: [register],
});

export const agentInputTokensTotal = new client.Counter({
  name: METRIC_AGENT_INPUT_TOKENS,
  help: 'Total input (prompt) tokens used by agent resolutions',
  registers: [register],
});

export const agentOutputTokensTotal = new client.Counter({
  name: METRIC_AGENT_OUTPUT_TOKENS,
  help: 'Total output (completion) tokens used by agent resolutions',
  registers: [register],
});

export const genAiClientTokenUsage = new client.Histogram({
  name: METRIC_GEN_AI_CLIENT_TOKEN_USAGE,
  help: 'Token usage per agent resolution aligned with OTel GenAI conventions',
  labelNames: ['gen_ai_token_type'] as const,
  buckets: [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1048576],
  registers: [register],
});

export const genAiInvokeAgentDuration = new client.Histogram({
  name: METRIC_GEN_AI_INVOKE_AGENT_DURATION,
  help: 'Agent invocation duration in seconds aligned with OTel GenAI conventions',
  labelNames: ['gen_ai_agent_name', 'error_type'] as const,
  registers: [register],
});

export { register };
