import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j } from './helpers.js';

describe('E2E: 08 — Rules Not Synced', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S9: should return 503 RulesNotSyncedError when transaction is attempted before sync', async () => {
    const corrId = correlationId('s9-not-synced');

    const response = await fetch(`${BASE_URL}/api/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ amount: 10.00, location: 'Poznan', tier: 'Standard' }),
    });

    expect(response.status).toBe(503);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string };
    expect(body.error).toBe('RulesNotSyncedError');
  });
});
