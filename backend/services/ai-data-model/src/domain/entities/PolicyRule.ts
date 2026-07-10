import { RuleType } from '../enums/RuleType.js';

export class PolicyRule {
  constructor(
    public readonly id: string,
    public readonly type: RuleType,
    public readonly description: string,
    public readonly conditions: Record<string, unknown>,
    public readonly consequence: Record<string, unknown>,
    public readonly label: string,
  ) {}
}
