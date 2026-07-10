import neo4j from 'neo4j-driver';
import type { Driver, Session } from 'neo4j-driver';

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3002';
export const NEO4J_URI = process.env.E2E_NEO4J_URI ?? 'bolt://localhost:7687';
export const NEO4J_USER = process.env.E2E_NEO4J_USER ?? 'neo4j';
export const NEO4J_PASSWORD = process.env.E2E_NEO4J_PASSWORD ?? 'osai_password';
export const TEST_TIMEOUT = 180_000;

export function uid(): string {
  return crypto.randomUUID();
}

export function correlationId(scenario: string): string {
  return `e2e-${scenario}-${uid()}`;
}

export let driver: Driver;

export async function setupNeo4j(): Promise<void> {
  driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  await driver.verifyConnectivity();
}

export async function teardownNeo4j(): Promise<void> {
  if (driver) {
    const session = driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
    await driver.close();
  }
}

export async function wipeNeo4j(): Promise<void> {
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
  } finally {
    await session.close();
  }
}

export async function seedPolicy(session: Session, overrides?: {
  zone?: string;
  tier?: string;
  ceiling?: number;
}): Promise<void> {
  const {
    zone = 'Poznan',
    tier = 'Prime',
    ceiling = 15.00,
  } = overrides ?? {};

  const dbTier = tier === 'Prime' ? 'Prime' : 'Standard';

  // Match the Cypher query pattern used in Neo4jPolicyRepository:
  // (z:DeliveryZone)-[:HAS_RULE]->(r:BusinessRule)-[:HAS_LIMIT]->(m:MaxRefund)
  // (t:ClientTier)-[:RECEIVES_BONUS]->(b:MaxRefund)
  await session.run(
    `
    MERGE (z:DeliveryZone {name: $zone})
    MERGE (t:ClientTier {name: $tier})
    MERGE (b:BusinessRule {ruleNumber: 1})
    SET b.description = 'Test rule', b.type = 'DELAY_COMPENSATION'
    MERGE (m:MaxRefund {amount: $ceiling})
    MERGE (z)-[:HAS_RULE]->(b)
    MERGE (b)-[:HAS_LIMIT]->(m)
    MERGE (t)-[:RECEIVES_BONUS]->(m)
    `,
    { zone, tier: dbTier, ceiling },
  );
}
