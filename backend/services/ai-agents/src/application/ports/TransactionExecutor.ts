import { TransactionResult } from '../../domain/TransactionResult.js';

export interface TransactionExecutor {
  execute(amount: number, location: string, tier: string): Promise<TransactionResult>;
}
