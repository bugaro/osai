import prometheus from 'prom-client';

const registry = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'] as const,
  registers: [registry],
});

export const httpRequestDurationSeconds = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'] as const,
  registers: [registry],
});

export const sseEventsProcessedTotal = new prometheus.Counter({
  name: 'sse_events_processed_total',
  help: 'Total SSE events processed',
  labelNames: ['event_type'] as const,
  registers: [registry],
});

export const sseConnectionsActive = new prometheus.Gauge({
  name: 'sse_connections_active',
  help: 'Active SSE connections',
  registers: [registry],
});

export const ollamaInferenceDurationSeconds = new prometheus.Histogram({
  name: 'ollama_inference_duration_seconds',
  help: 'Ollama inference duration in seconds',
  registers: [registry],
});

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function getMetricsContent(): Promise<string> {
  return registry.metrics();
}
