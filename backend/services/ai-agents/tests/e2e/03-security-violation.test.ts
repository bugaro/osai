import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AI_AGENTS_URL, AI_DATA_MODEL_URL, TEST_TIMEOUT, correlationId } from './helpers.js';

describe('E2E: 03 — Security Violation (Graceful 403 Handling)', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    // Seed ai-data-model with a policy that has a low ceiling so the agent can test
    // violations. This requires ai-data-model to be running and accessible.
    const corrId = correlationId('setup-seed');
    await fetch(`${AI_DATA_MODEL_URL}/api/policy?location=Gdansk&tier=Standard`, {
      headers: { 'x-correlation-id': corrId },
    });
  });

  afterAll(async () => {
  });

  it('S1: should return 403 SecurityException when transaction amount exceeds ceiling', async () => {
    const corrId = correlationId('s1-over-ceiling');
    const response = await fetch(`${AI_DATA_MODEL_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 50.00, location: 'Poznan', tier: 'Standard' }),
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as {
      error: string;
      violatedInvariant: string;
      attemptedValue: number;
      maxAllowed: number;
    };
    expect(body.error).toBe('SecurityException');
    expect(body.violatedInvariant).toBe('MAX_REFUND_CEILING');
    expect(body.attemptedValue).toBe(50);
    expect(body.maxAllowed).toBeGreaterThanOrEqual(0);
  });

  it('S2: should handle resolve with amount that triggers security violation gracefully', async () => {
    const corrId = correlationId('s2-agent-violation');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_20',
        tier: 'Standard',
        location: 'Poznan',
        delayMinutes: 90,
      }),
    });

    // Agent must not crash — it should return 202 and handle the 403 internally
    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S3: should return 403 for Prime tier exceeding ceiling', async () => {
    const corrId = correlationId('s3-prime-ceiling');
    const response = await fetch(`${AI_DATA_MODEL_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 100.00, location: 'Warsaw', tier: 'Prime' }),
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('SecurityException');
  });

  it('S4: should accept transaction within ceiling limits', async () => {
    const corrId = correlationId('s4-within-limit');
    const response = await fetch(`${AI_DATA_MODEL_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 5.00, location: 'Poznan', tier: 'Standard' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('executed');
  });
});
