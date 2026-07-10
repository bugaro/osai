export interface ExecuteTransactionInput {
  amount: number;
  location: string;
  tier: string;
}

export type ExecuteTransactionOutput =
  | { status: 'executed' }
  | { status: 'rejected'; violatedInvariant: string; attemptedValue: number; maxAllowed: number };
