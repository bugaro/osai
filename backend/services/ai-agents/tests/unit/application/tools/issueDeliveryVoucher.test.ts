import { describe, it, expect, vi } from 'vitest';
import { createIssueDeliveryVoucher } from '../../../../src/mastra/tools.js';
import type { TransactionExecutor } from '../../../../src/application/ports/TransactionExecutor.js';
import type { TransactionResult } from '../../../../src/domain/TransactionResult.js';

describe('issueDeliveryVoucher tool', () => {
  it('should call TransactionExecutor.execute and return success on 200', async () => {
    // Given
    const mockExecutor: TransactionExecutor = {
      execute: vi.fn().mockResolvedValue({ status: 'executed' } satisfies TransactionResult),
    };
    const tool = createIssueDeliveryVoucher(mockExecutor, 'Poznan', 'Prime');

    // When
    const result = await tool.execute({ amount: 10.0 });

    // Then
    expect(mockExecutor.execute).toHaveBeenCalledOnce();
    expect(mockExecutor.execute).toHaveBeenCalledWith(10.0, 'Poznan', 'Prime');
    expect(result).toEqual({ status: 'success' });
  });

  it('should handle 403 rejection gracefully without throwing', async () => {
    // Given
    const mockExecutor: TransactionExecutor = {
      execute: vi.fn().mockResolvedValue({
        status: 'rejected',
        violatedInvariant: 'MAX_REFUND_CEILING',
        attemptedValue: 25.0,
        maxAllowed: 15.0,
      } satisfies TransactionResult),
    };
    const tool = createIssueDeliveryVoucher(mockExecutor, 'Poznan', 'Prime');

    // When
    const result = await tool.execute({ amount: 25.0 });

    // Then
    expect(mockExecutor.execute).toHaveBeenCalledOnce();
    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.violatedInvariant).toBe('MAX_REFUND_CEILING');
      expect(result.attemptedValue).toBe(25.0);
      expect(result.maxAllowed).toBe(15.0);
    }
  });

  it('should reject negative amount input', async () => {
    // Given
    const mockExecutor: TransactionExecutor = {
      execute: vi.fn(),
    };
    const tool = createIssueDeliveryVoucher(mockExecutor, 'Poznan', 'Prime');

    // When / Then
    await expect(tool.execute({ amount: -5.0 })).rejects.toThrow();
  });

  it('should call TransactionExecutor with location and tier from factory', async () => {
    // Given
    const mockExecutor: TransactionExecutor = {
      execute: vi.fn().mockResolvedValue({ status: 'executed' } satisfies TransactionResult),
    };
    const tool = createIssueDeliveryVoucher(mockExecutor, 'Berlin', 'Standard');

    // When
    await tool.execute({ amount: 8.0 });

    // Then
    expect(mockExecutor.execute).toHaveBeenCalledWith(8.0, 'Berlin', 'Standard');
  });
});
