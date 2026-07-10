import { describe, it, expect } from 'vitest';
import { AI_AGENTS_URL, AI_DATA_MODEL_URL, TEST_TIMEOUT, correlationId } from './helpers.js';

describe('E2E: 02 — Correlation ID Propagation', { timeout: TEST_TIMEOUT }, () => {

  it('S1: should echo x-correlation-id header back in response', async () => {
    const corrId = correlationId('s1-echo');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_10',
        tier: 'Prime',
        location: 'Poznan',
        delayMinutes: 20,
      }),
    });

    expect(response.headers.get('x-correlation-id')).toBe(corrId);
  });

  it('S2: should propagate correlationId to downstream ai-data-model policy calls', async () => {
    const corrId = correlationId('s2-policy-prop');
    const policyResponse = await fetch(`${AI_DATA_MODEL_URL}/api/policy?location=Poznan&tier=Prime`, {
      headers: {
        'x-correlation-id': corrId,
      },
    });

    expect(policyResponse.status).toBe(200);
    expect(policyResponse.headers.get('x-correlation-id')).toBe(corrId);
    const body = await policyResponse.json() as {
      baseRefund: number;
      primeBonus: number;
      ceiling: number;
    };
    expect(body).toHaveProperty('baseRefund');
    expect(body).toHaveProperty('primeBonus');
    expect(body).toHaveProperty('ceiling');
  });

  it('S3: should propagate correlationId to downstream ai-data-model transaction calls', async () => {
    const corrId = correlationId('s3-txn-prop');
    const txnResponse = await fetch(`${AI_DATA_MODEL_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 10.00, location: 'Poznan', tier: 'Standard' }),
    });

    expect(txnResponse.status).toBe(200);
    expect(txnResponse.headers.get('x-correlation-id')).toBe(corrId);
  });

  it('S4: should propagate correlationId to downstream ai-data-model events calls', async () => {
    const corrId = correlationId('s4-events-prop');
    const eventsResponse = await fetch(`${AI_DATA_MODEL_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        type: 'reasoning',
        payload: { step: 'test' },
        timestamp: new Date().toISOString(),
        correlationId: corrId,
      }),
    });

    expect(eventsResponse.status).toBe(200);
    expect(eventsResponse.headers.get('x-correlation-id')).toBe(corrId);
    const body = await eventsResponse.json() as { status: string };
    expect(body.status).toBe('ok');
  });

  it('S5: should accept custom correlation ID format and propagate through full resolve flow', async () => {
    const corrId = 'e2e-test-custom-format-' + crypto.randomUUID();
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_11',
        tier: 'Prime',
        location: 'Poznan',
        delayMinutes: 15,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
  });

  it('S6: should handle resolve request without x-correlation-id', async () => {
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'usr_12',
        tier: 'Standard',
        location: 'Gdansk',
        delayMinutes: 10,
      }),
    });

    expect(response.status).toBe(202);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });
});
