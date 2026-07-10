import crypto from 'node:crypto';
import type { Result } from 'neo4j-driver';
import { PolicyRepository } from '../../application/ports/PolicyRepository.js';
import { PolicyFrame } from '../../domain/value-objects/PolicyFrame.js';
import { PolicyRule } from '../../domain/entities/PolicyRule.js';
import { createCeilingInvariant, createZoneInvariant, type Invariant } from '../../domain/invariants/InvariantEngine.js';
import { getDriver } from './Neo4jConnection.js';
import { ServiceUnavailableError } from '../../domain/errors/ServiceUnavailableError.js';
import { logger } from '../observability/logger.js';

const COMPENSATION_TYPE = 'DELAY_COMPENSATION';
const CEILING_KEYWORDS = ['ceiling', 'max', 'limit', 'exceed'];

async function runQuery(query: string, params: Record<string, unknown> = {}): Promise<Result> {
  const session = getDriver().session();
  try {
    const result = await session.run(query, params);
    return result;
  } catch (err) {
    throw new ServiceUnavailableError(`Neo4j query failed: ${(err as Error).message}`);
  } finally {
    await session.close();
  }
}

export class Neo4jPolicyRepository implements PolicyRepository {
  async getPolicyFrame(location: string, tier: string): Promise<PolicyFrame | null> {
    const normalizedTier = tier === 'Prime' ? 'Prime' : 'Standard';

    const ceilingResult = await runQuery(
      `MATCH (z:DeliveryZone {name: $location})
       OPTIONAL MATCH (z)-[:HAS_RULE]->(:BusinessRule)-[:HAS_LIMIT]->(m:MaxRefund)
       RETURN max(m.amount) AS ceiling`,
      { location },
    );
    const ceiling = ceilingResult.records[0]?.get('ceiling') != null
      ? neo4jIntegerToNumber(ceilingResult.records[0].get('ceiling')) : 0;

    const [baseResult, bonusResult] = await Promise.all([
      runQuery(
        `MATCH (z:DeliveryZone {name: $location})
         OPTIONAL MATCH (z)-[:HAS_RULE]->(:BusinessRule)-[:HAS_LIMIT]->(m:MaxRefund)
         WHERE NOT (m)<-[:RECEIVES_BONUS]-(:ClientTier)
         RETURN max(m.amount) AS baseRefund`,
        { location },
      ),
      runQuery(
        `MATCH (t:ClientTier {name: $tier})-[:RECEIVES_BONUS]->(b:MaxRefund)
         WHERE b.amount < $ceiling
         RETURN max(b.amount) AS bonus`,
        { tier: normalizedTier, ceiling },
      ),
    ]);

    const baseRefund = baseResult.records[0]?.get('baseRefund') != null
      ? neo4jIntegerToNumber(baseResult.records[0].get('baseRefund')) : 0;
    const bonus = bonusResult.records[0]?.get('bonus') != null
      ? neo4jIntegerToNumber(bonusResult.records[0].get('bonus')) : 0;

    return PolicyFrame.create(baseRefund, bonus, ceiling);
  }

  async seedPolicyEntities(rules: PolicyRule[]): Promise<void> {
    await runQuery(`
      MATCH (n)
      WHERE n:BusinessRule OR n:MaxRefund OR n:ClientTier
      DETACH DELETE n
    `);
    for (const rule of rules) {
      const { id, type, description, conditions: cond, consequence: cons, label: ruleLabel } = rule;
      const zone = cond.zone as string | undefined;
      if (!zone) {
        logger.warn({ ruleNumber: id }, 'rule missing zone in conditions, skipping');
        continue;
      }

      const condJson = JSON.stringify(cond);
      const consJson = JSON.stringify(cons);
      const amount = typeof cons.amount === 'number' ? cons.amount : 0;
      const isPrime = /prime/i.test(condJson) || /prime/i.test(consJson);
      const isCeilingLabel = CEILING_KEYWORDS.some((kw) => ruleLabel.toLowerCase().includes(kw));
      const uid = crypto.randomUUID();
      const params = { uid, ruleNumber: id, amount, label: ruleLabel, zone, description, type, conditions: condJson, consequence: consJson };

      await runQuery(
        `CREATE (r:BusinessRule {uid: $uid})
         SET r.ruleNumber = $ruleNumber, r.description = $description, r.conditions = $conditions, r.type = $type, r.consequence = $consequence
         MERGE (z:DeliveryZone {name: $zone})
         MERGE (z)-[:HAS_RULE]->(r)`,
        params,
      );

      if (type !== COMPENSATION_TYPE || amount <= 0) {
        continue;
      }

      await runQuery(
        `MATCH (r:BusinessRule {uid: $uid})
         MATCH (z:DeliveryZone {name: $zone})
         CREATE (m:MaxRefund {amount: $amount, label: $label})
         MERGE (r)-[:HAS_LIMIT]->(m)
         MERGE (z)-[:HAS_LIMIT]->(m)`,
        params,
      );

      const tiers = isCeilingLabel ? ['Prime', 'Standard'] : [isPrime ? 'Prime' : 'Standard'];

      for (const tierName of tiers) {
        const tierLabel = `Tier: ${tierName}`;
        const linkBonus = isCeilingLabel || (tierName === 'Prime' && isPrime);

        if (linkBonus) {
          await runQuery(
            `MATCH (r:BusinessRule {uid: $uid})
             MATCH (z:DeliveryZone {name: $zone})
             MERGE (t:ClientTier {name: $tierName})
             ON CREATE SET t.label = $tierLabel
             MERGE (r)-[:APPLIES_TO_TIER]->(t)
             WITH r, z, t
             MATCH (m:MaxRefund {amount: $amount, label: $label})
             MERGE (t)-[:RECEIVES_BONUS]->(m)
             MERGE (z)-[:HAS_TIER]->(t)`,
            { ...params, tierName, tierLabel },
          );
        } else {
          await runQuery(
            `MATCH (r:BusinessRule {uid: $uid})
             MATCH (z:DeliveryZone {name: $zone})
             MERGE (t:ClientTier {name: $tierName})
             ON CREATE SET t.label = $tierLabel
             MERGE (r)-[:APPLIES_TO_TIER]->(t)
             MERGE (z)-[:HAS_TIER]->(t)`,
            { ...params, tierName, tierLabel },
          );
        }
      }
    }
  }

  async getGraphTopology(): Promise<{ nodes: unknown[]; edges: unknown[] }> {
    const result = await runQuery(
      `MATCH (n)
       WHERE n:DeliveryZone
          OR n:MaxRefund
          OR n:ClientTier
       OPTIONAL MATCH (n)-[r]->(m)
       WHERE m:DeliveryZone
          OR m:MaxRefund
          OR m:ClientTier
       RETURN n, r, m`,
    );
    const nodeMap = new Map<string, GraphNodeDTO>();
    const edges: GraphEdgeDTO[] = [];

    for (const record of result.records) {
      const source = record.get('n');
      const rel = record.get('r');
      const target = record.get('m');

      const pushNode = (node: Record<string, unknown>): void => {
        const key = String(node.identity);
        if (!nodeMap.has(key)) {
          nodeMap.set(key, mapNeo4jNode(node));
        }
      };

      if (source) pushNode(source);
      if (target) pushNode(target);
      if (rel) edges.push(mapNeo4jEdge(rel));
    }

    return { nodes: [...nodeMap.values()], edges };
  }

  async loadAllInvariants(): Promise<Invariant[]> {
    const invariants: Invariant[] = [];

    const ceilingResult = await runQuery(
      `MATCH (m:MaxRefund) RETURN max(m.amount) AS amount`,
    );
    for (const record of ceilingResult.records) {
      const amount = neo4jIntegerToNumber(record.get('amount'));
      if (amount > 0) {
        invariants.push(createCeilingInvariant(amount));
      }
    }

    const zoneResult = await runQuery(
      `MATCH (z:DeliveryZone) RETURN z.name AS name`,
    );
    for (const record of zoneResult.records) {
      invariants.push(createZoneInvariant(record.get('name')));
    }

    return invariants;
  }
}

type GraphNodeType = 'zone' | 'tier' | 'limit';

interface GraphNodeDTO {
  id: string;
  label: string;
  type: GraphNodeType;
}

interface GraphEdgeDTO {
  source: string;
  target: string;
  label: string;
}

const NODE_LABEL_TO_TYPE: Record<string, GraphNodeType> = {
  DeliveryZone: 'zone',
  ClientTier: 'tier',
  MaxRefund: 'limit',
  Limit: 'limit',
};

function neo4jIdentityToString(id: unknown): string {
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return String(id);
  if (id && typeof id === 'object' && 'toNumber' in id && typeof (id as { toNumber(): number }).toNumber === 'function') {
    return String((id as { toNumber(): number }).toNumber());
  }
  if (id && typeof id === 'object' && 'low' in id) {
    return String((id as { low: number }).low);
  }
  return String(id);
}

function mapNeo4jNode(node: Record<string, unknown>): GraphNodeDTO {
  const labels = (node.labels as string[]) || [];
  const properties = (node.properties as Record<string, unknown>) || {};

  let type: GraphNodeType = 'zone';
  for (const label of labels) {
    if (NODE_LABEL_TO_TYPE[label]) {
      type = NODE_LABEL_TO_TYPE[label];
      break;
    }
  }

  const storedLabel = properties.label as string | undefined;
  let label = storedLabel;

  if (!label || type === 'limit') {
    if (type === 'limit') {
      label = `Max: ${properties.amount != null ? Number(properties.amount).toFixed(2) : 'Unknown'}`;
    } else if (type === 'tier') {
      label = `Tier: ${properties.name || 'Unknown'}`;
    } else {
      label = `Zone: ${properties.name || 'Unknown'}`;
    }
  }

  return {
    id: neo4jIdentityToString(node.identity),
    label,
    type,
  };
}

function mapNeo4jEdge(rel: Record<string, unknown>): GraphEdgeDTO {
  return {
    source: neo4jIdentityToString(rel.start),
    target: neo4jIdentityToString(rel.end),
    label: (rel.type as string) || '',
  };
}

function neo4jIntegerToNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toNumber' in value && typeof (value as { toNumber(): number }).toNumber === 'function') {
    return (value as { toNumber(): number }).toNumber();
  }
  const coerced = Number(value);
  if (Number.isNaN(coerced)) {
    throw new ServiceUnavailableError(`Neo4j returned a non-numeric value: ${value}`);
  }
  return coerced;
}
