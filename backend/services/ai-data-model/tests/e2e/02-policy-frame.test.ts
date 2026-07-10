import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BASE_URL, TEST_TIMEOUT, correlationId, setupNeo4j, teardownNeo4j, wipeNeo4j, driver, seedPolicy } from './helpers.js';

describe('E2E: 02 — Policy Frame', { timeout: TEST_TIMEOUT }, () => {
  beforeAll(async () => {
    await setupNeo4j();
  });

  afterAll(async () => {
    await teardownNeo4j();
  });

  beforeEach(async () => {
    await wipeNeo4j();
  });

  it('S3: should return policy frame for a known zone and tier', async () => {
    const session = driver.session();
    try {
      await seedPolicy(session, { zone: 'Poznan', tier: 'Prime', ceiling: 15.00 });
    } finally {
      await session.close();
    }

    const corrId = correlationId('s3-known-zone');
    const response = await fetch(`${BASE_URL}/api/policy?location=Poznan&tier=Prime`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { baseRefund: number; primeBonus: number; ceiling: number };
    expect(body.ceiling).toBe(15.00);
    expect(body.baseRefund).toBeGreaterThanOrEqual(0);
    expect(body.primeBonus).toBeGreaterThanOrEqual(0);
  });

  it('S3: should return zeroed frame for an unknown zone', async () => {
    const corrId = correlationId('s3-unknown-zone');
    const response = await fetch(`${BASE_URL}/api/policy?location=Warsaw&tier=Standard`, {
      headers: { 'x-correlation-id': corrId },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe(corrId);
    const body = await response.json() as { baseRefund: number; primeBonus: number; ceiling: number };
    expect(body).toEqual({ baseRefund: 0, primeBonus: 0, ceiling: 0 });
  });
});
