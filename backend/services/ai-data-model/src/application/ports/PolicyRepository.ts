import { PolicyFrame } from '../../domain/value-objects/PolicyFrame.js';
import { PolicyRule } from '../../domain/entities/PolicyRule.js';
import { Invariant } from '../../domain/invariants/InvariantEngine.js';

export interface PolicyRepository {
  getPolicyFrame(location: string, tier: string): Promise<PolicyFrame | null>;
  seedPolicyEntities(entities: PolicyRule[]): Promise<void>;
  getGraphTopology(): Promise<{ nodes: unknown[]; edges: unknown[] }>;
  loadAllInvariants(): Promise<Invariant[]>;
}
