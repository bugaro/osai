import { z } from 'zod';
import { AIExtractor } from '../../application/ports/AIExtractor.js';
import { PolicyRule } from '../../domain/entities/PolicyRule.js';
import { RuleType } from '../../domain/enums/RuleType.js';
import { ExtractionError } from '../../domain/errors/ExtractionError.js';
import { generate } from './OllamaClient.js';
import { logger } from '../observability/logger.js';

const ExtractedRuleSchema = z.object({
  ruleNumber: z.number(),
  description: z.string(),
  label: z.string(),
  type: z.nativeEnum(RuleType),
  conditions: z.record(z.unknown()).optional().default({}),
  consequence: z.record(z.unknown()).optional().default({}),
});

const ExtractedRulesSchema = z.array(ExtractedRuleSchema);

const EXTRACTION_PROMPT = `Extract business rules from policy text as JSON array. Raw JSON only.

Schema:
{
  ruleNumber: <line number>,
  description: "<short summary>",
  label: "<UI label, e.g. 'Base: 5.00 EUR'>",
  type: "DELAY_COMPENSATION",
  conditions: {
    zone: "<required zone, e.g. Poznan>",
    delayMinutes?: <number>,
    tier?: "Prime" | "Standard",
    triggerEvent?: "delayed"
  },
  consequence: {
    action: "payout",
    amount?: <EUR value, NEVER percentage>
  }
}

Type — DELAY_COMPENSATION: delay payouts, base/Prime/caps.

Example (complex line → multiple rules):
Input: "1. In Poznan, delay >20m triggers 5.00 EUR base, 10.00 EUR for Prime, capped at 15.00 EUR."
Output:
[
  { "ruleNumber": 1, "description": "Base 5.00 EUR for delay >20m", "label": "Base: 5.00 EUR", "type": "DELAY_COMPENSATION", "conditions": { "zone": "Poznan", "delayMinutes": 20, "triggerEvent": "delayed" }, "consequence": { "action": "payout", "amount": 5.00 } },
  { "ruleNumber": 1, "description": "Prime gets 10.00 EUR for delay >20m", "label": "Prime: 10.00 EUR", "type": "DELAY_COMPENSATION", "conditions": { "zone": "Poznan", "delayMinutes": 20, "tier": "Prime", "triggerEvent": "delayed" }, "consequence": { "action": "payout", "amount": 10.00 } },
  { "ruleNumber": 1, "description": "Hard ceiling at 15.00 EUR", "label": "Ceiling: 15.00 EUR", "type": "DELAY_COMPENSATION", "conditions": { "zone": "Poznan", "triggerEvent": "delayed" }, "consequence": { "action": "payout", "amount": 15.00 } }
]

Rules:
- Each numbered line is a separate context. Never merge lines.
- Complex lines (base + tier + cap) → split into multiple objects, same ruleNumber.
- Every rule must include "zone" in conditions.
- Skip lines that are pure global zone declarations — zone is already captured per-rule.

Policy:
`;

export class OllamaExtractorAdapter implements AIExtractor {
  async extractRules(policyText: string): Promise<PolicyRule[]> {
    const response = await generate(EXTRACTION_PROMPT + policyText);

    const raw = response.response.trim();

    if (!raw) {
      throw new ExtractionError('Empty response from Ollama');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ExtractionError('Malformed JSON response from Ollama');
    }

    const validated = ExtractedRulesSchema.safeParse(parsed);
    if (!validated.success) {
      throw new ExtractionError(`Extracted rules failed validation: ${validated.error.message}`);
    }

    logger.info({ rulesCount: validated.data.length }, 'rules extracted successfully');

    return validated.data.map(
      (r) => new PolicyRule(String(r.ruleNumber), r.type, r.description, r.conditions, r.consequence, r.label),
    );
  }
}
