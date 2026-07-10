import { describe, it, expect } from 'vitest';
import { AI_AGENTS_URL, TEST_TIMEOUT, correlationId } from './helpers.js';

describe('E2E: 01 — Resolution Flow', { timeout: TEST_TIMEOUT }, () => {

  it('S1: should return 202 Accepted for a valid resolution request', async () => {
    const corrId = correlationId('s1-valid-resolve');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_1',
        tier: 'Prime',
        location: 'Poznan',
        delayMinutes: 45,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S2: should return 400 when userId is missing', async () => {
    const corrId = correlationId('s2-missing-userid');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        tier: 'Standard',
        location: 'Poznan',
        delayMinutes: 30,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string; message: string };
    expect(body.error).toBe('ValidationError');
  });

  it('S3: should return 400 when delayMinutes is negative', async () => {
    const corrId = correlationId('s3-negative-delay');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_2',
        tier: 'Standard',
        location: 'Warsaw',
        delayMinutes: -5,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string; message: string };
    expect(body.error).toBe('ValidationError');
    expect(body.message).toMatch(/delayMinutes|negative/i);
  });

  it('S4: should return 400 when tier is invalid', async () => {
    const corrId = correlationId('s4-invalid-tier');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_3',
        tier: 'InvalidTier',
        location: 'Krakow',
        delayMinutes: 10,
      }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string; message: string };
    expect(body.error).toBe('ValidationError');
  });
});
