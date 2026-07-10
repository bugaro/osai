import { PolicyRule } from '../../domain/entities/PolicyRule.js';

export interface AIExtractor {
  extractRules(policyText: string): Promise<PolicyRule[]>;
}
