export const AI_AGENTS_URL = process.env.E2E_AI_AGENTS_URL ?? 'http://localhost:3001';
export const AI_DATA_MODEL_URL = process.env.E2E_AI_DATA_MODEL_URL ?? 'http://localhost:3002';
export const TEST_TIMEOUT = 180_000;

export function uid(): string {
  return crypto.randomUUID();
}

export function correlationId(scenario: string): string {
  return `e2e-${scenario}-${uid()}`;
}
