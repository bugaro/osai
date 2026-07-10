import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver, seedPolicy } from './helpers.js';

describe('E2E: 04 — Security Violation (Ceiling Breach)', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S2: should return 403 SecurityException when amount exceeds ceiling', async () => {
    const session = driver.session();
    try {
      await seedPolicy(session, { zone: 'Poznan', tier: 'Standard', ceiling: 15.00 });
    } finally {
      await session.close();
    }

    const corrId = correlationId('s2-ceiling');
    const response = await fetch(`${BASE_URL}/api/transaction`, {
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
    expect(body.maxAllowed).toBe(15);
  });
});
