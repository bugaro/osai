export type TransactionResult =
  | { status: 'executed' }
  | { status: 'rejected'; violatedInvariant: string; attemptedValue: number; maxAllowed: number };
