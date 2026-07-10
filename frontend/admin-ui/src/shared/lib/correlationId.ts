/**
 * Generates a UUID v4 correlation ID for request tracing.
 *
 * Used to attach `x-correlation-id` headers to all outbound requests,
 * enabling cross-service trace correlation in Grafana Loki and OpenTelemetry.
 *
 * Uses the Web Crypto API's `crypto.randomUUID()` — zero external dependencies.
 * Compatible with both browser (Next.js client) and Node.js (SSR) environments.
 *
 * @returns A UUID v4 string, e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}
