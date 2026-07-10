import { describe, it, expect } from 'vitest';
import { AI_AGENTS_URL, TEST_TIMEOUT, correlationId } from './helpers.js';

describe('E2E: 05 — Edge Cases & Payload Validation', { timeout: TEST_TIMEOUT }, () => {

  it('S1: empty body returns 400', async () => {
    const corrId = correlationId('s1-empty-body');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: '{}',
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('ValidationError');
  });

  it('S2: invalid JSON returns 400', async () => {
    const corrId = correlationId('s2-invalid-json');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: 'not valid json',
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
  });

  it('S3: missing all required fields returns 400', async () => {
    const corrId = correlationId('s3-missing-all');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('ValidationError');
  });

  it('S4: extra fields are ignored and returns 202', async () => {
    const corrId = correlationId('s4-extra-fields');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_99',
        tier: 'Prime',
        location: 'Poznan',
        delayMinutes: 30,
        extraField: 'should be ignored',
        anotherExtra: 42,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S5: zero delayMinutes boundary is accepted', async () => {
    const corrId = correlationId('s5-zero-delay');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_1',
        tier: 'Standard',
        location: 'Berlin',
        delayMinutes: 0,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S6: very large delayMinutes is accepted', async () => {
    const corrId = correlationId('s6-large-delay');
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_1',
        tier: 'Standard',
        location: 'Warsaw',
        delayMinutes: 999999,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S7: long userId and location strings are accepted', async () => {
    const corrId = correlationId('s7-long-strings');
    const longUserId = 'usr_' + 'a'.repeat(250);
    const longLocation = 'City_' + 'b'.repeat(250);
    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: longUserId,
        tier: 'Prime',
        location: longLocation,
        delayMinutes: 10,
      }),
    });

    expect(response.status).toBe(202);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('accepted');
  });

  it('S8: response time is under acceptable threshold', async () => {
    const corrId = correlationId('s8-response-time');
    const start = performance.now();

    const response = await fetch(`${AI_AGENTS_URL}/api/agents/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({
        userId: 'usr_1',
        tier: 'Standard',
        location: 'Gdansk',
        delayMinutes: 10,
      }),
    });

    const duration = performance.now() - start;

    expect(response.status).toBe(202);
    expect(duration).toBeLessThan(5000);
  });
});
