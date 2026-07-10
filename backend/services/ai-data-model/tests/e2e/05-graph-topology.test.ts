import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver, seedPolicy } from './helpers.js';
import neo4j from 'neo4j-driver';

describe('E2E: 05 — Graph Topology', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S3: should return nodes and edges reflecting seeded graph', async () => {
    const session = driver.session();
    try {
      await seedPolicy(session, { zone: 'Poznan', tier: 'Prime', ceiling: 15.00 });
    } finally {
      await session.close();
    }

    const corrId = correlationId('s3-graph');
    const response = await fetch(`${BASE_URL}/api/graph`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { nodes: unknown[]; edges: unknown[] };

    expect(Array.isArray(body.nodes)).toBe(true);
    expect(Array.isArray(body.edges)).toBe(true);
    expect(body.nodes.length).toBeGreaterThanOrEqual(1);
    expect(body.edges.length).toBeGreaterThanOrEqual(1);

    const session2 = driver.session();
    try {
      const dbNodes = await session2.run('MATCH (n) WHERE NOT n:BusinessRule RETURN count(n) AS cnt');
      const dbEdges = await session2.run('MATCH (n)-[r]->(m) WHERE NOT n:BusinessRule AND NOT m:BusinessRule RETURN count(r) AS cnt');
      expect(body.nodes.length).toBe(neo4j.integer.toNumber(dbNodes.records[0].get('cnt')));
      expect(body.edges.length).toBe(neo4j.integer.toNumber(dbEdges.records[0].get('cnt')));
    } finally {
      await session2.close();
    }
  });
});
