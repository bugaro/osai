import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver, seedPolicy } from './helpers.js';

describe('E2E: 03 — Transaction Validation', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S1: should execute transaction when amount is within limits', async () => {
    const session = driver.session();
    try {
      await seedPolicy(session, { zone: 'Poznan', tier: 'Standard', ceiling: 15.00 });
    } finally {
      await session.close();
    }

    const corrId = correlationId('s1-valid');
    const response = await fetch(`${BASE_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 10.00, location: 'Poznan', tier: 'Standard' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { status: string };
    expect(body.status).toBe('executed');
  });
});
