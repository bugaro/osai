import { describe, it, expect } from 'vitest';
import { AI_AGENTS_URL, AI_DATA_MODEL_URL, TEST_TIMEOUT, correlationId } from './helpers.js';

describe('E2E: 04 — Infrastructure Health & Metrics', { timeout: TEST_TIMEOUT }, () => {

  it('S1: ai-agents health endpoint returns 200', async () => {
    const corrId = correlationId('s1-agents-health');
    const response = await fetch(`${AI_AGENTS_URL}/health`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('S2: ai-data-model health endpoint returns 200', async () => {
    const corrId = correlationId('s2-dm-health');
    const response = await fetch(`${AI_DATA_MODEL_URL}/health`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('healthy');
  });

  it('S3: ai-agents metrics endpoint returns Prometheus format', async () => {
    const corrId = correlationId('s3-agents-metrics');
    const response = await fetch(`${AI_AGENTS_URL}/metrics`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/plain/);
    const text = await response.text();

    expect(text).toContain('http_requests_total');
    expect(text).toContain('http_request_duration_seconds');
    expect(text).toContain('agent_resolution_total');
    expect(text).toContain('agent_resolution_duration_seconds');
    expect(text).toMatch(/^[^#\s]/m);
  });

  it('S4: ai-data-model metrics endpoint returns Prometheus format', async () => {
    const corrId = correlationId('s4-dm-metrics');
    const response = await fetch(`${AI_DATA_MODEL_URL}/metrics`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/text\/plain/);
    const text = await response.text();

    expect(text).toContain('http_requests_total');
    expect(text).toContain('http_request_duration_seconds');
    expect(text).toMatch(/^[^#\s]/m);
  });

  it('S5: ai-agents metrics counters increment after resolve request', async () => {
    const corrId = correlationId('s5-metrics-increment');

    const beforeText = await (await fetch(`${AI_AGENTS_URL}/metrics`)).text();
    const beforeMatch = beforeText.match(/^agent_resolution_total\{result="validation_error"\} (\d+)/m);
    const beforeCount = beforeMatch ? Number(beforeMatch[1]) : 0;

    await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ userId: '', tier: 'Standard', location: 'Poznan', delayMinutes: 10 }),
    });

    const afterText = await (await fetch(`${AI_AGENTS_URL}/metrics`)).text();
    const afterMatch = afterText.match(/^agent_resolution_total\{result="validation_error"\} (\d+)/m);
    const afterCount = afterMatch ? Number(afterMatch[1]) : 0;

    expect(afterCount).toBe(beforeCount + 1);
  });
});
