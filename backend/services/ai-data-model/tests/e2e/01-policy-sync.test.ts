import neo4j from 'neo4j-driver';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver } from './helpers.js';

const POLICY_TEXT = `1. If a courier is delayed by more than 20 minutes, issue compensation to the client.
2. The base compensation amount for a delivery delay is 5.00 EUR.
3. If the client has a Prime status, the compensation amount increases to 10.00 EUR.
4. The maximum compensation for a delay cannot exceed 15.00 EUR for any client.`;

describe('E2E: 01 — Policy Sync', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S4: should return 400 when policy text is empty', async () => {
    const corrId = correlationId('s4-empty-text');
    const response = await fetch(`${BASE_URL}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': corrId,
      },
      body: JSON.stringify({ rules: '' }),
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { error: string; message: string };
    expect(body.error).toBe('ValidationError');
    expect(body.message).toMatch(/empty/i);
  });

  it('S1: should sync policy text and create Neo4j nodes', async () => {
    // Retry up to 2 times for Ollama non-determinism
    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const corrId = correlationId(`s1-sync-${attempt}`);
      response = await fetch(`${BASE_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': corrId,
        },
        body: JSON.stringify({ rules: POLICY_TEXT }),
      });
      if (response.status === 200) break;
    }

    expect(response!.status).toBe(200);
    expect(response!.headers.get('x-correlation-id')).toMatch(/e2e-s1-sync-/);
    const body = await response!.json() as { rulesCount: number };
    expect(body.rulesCount).toBeGreaterThan(0);

    const session = driver.session();
    try {
      const zoneResult = await session.run('MATCH (z:DeliveryZone) RETURN count(z) AS cnt');
      expect(neo4j.integer.toNumber(zoneResult.records[0].get('cnt'))).toBeGreaterThanOrEqual(1);

      const ruleResult = await session.run('MATCH (r:BusinessRule) RETURN count(r) AS cnt');
      expect(neo4j.integer.toNumber(ruleResult.records[0].get('cnt'))).toBe(body.rulesCount);
    } finally {
      await session.close();
    }
  });
});
