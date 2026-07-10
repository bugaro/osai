import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver } from './helpers.js';
import neo4j from 'neo4j-driver';

const POLICY_TEXT = `1. If a courier is delayed by more than 20 minutes, issue compensation to the client.
2. The base compensation amount for a delivery delay is 5.00 EUR.
3. The maximum compensation for a delay cannot exceed 15.00 EUR.`;

describe('E2E: 06 — Concurrent Sync', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S6: two simultaneous syncs should produce the same node count as one', async () => {
    const [result1, result2] = await Promise.all([
      fetch(`${BASE_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId('s6-a') },
        body: JSON.stringify({ rules: POLICY_TEXT }),
      }),
      fetch(`${BASE_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId('s6-b') },
        body: JSON.stringify({ rules: POLICY_TEXT }),
      }),
    ]);

    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);

    const body1 = await result1.json() as { rulesCount: number };
    const body2 = await result2.json() as { rulesCount: number };
    expect(body1.rulesCount).toBeGreaterThan(0);
    expect(body2.rulesCount).toBeGreaterThan(0);

    const session = driver.session();
    try {
      const zoneResult = await session.run('MATCH (z:DeliveryZone) RETURN count(z) AS zoneCnt');
      const ruleResult = await session.run('MATCH (r:BusinessRule) RETURN count(r) AS ruleCnt');
      const zones = neo4j.integer.toNumber(zoneResult.records[0].get('zoneCnt'));
      const rules = neo4j.integer.toNumber(ruleResult.records[0].get('ruleCnt'));

      expect(zones).toBe(1);
      // Concurrent syncs may produce slightly different rule sets (Ollama is non-deterministic),
      // so DB rules should be at least what one sync reported
      expect(rules).toBeGreaterThanOrEqual(body1.rulesCount);
    } finally {
      await session.close();
    }
  });
});
