import { describe, it, expect, vi } from 'vitest';
import { ExecuteTransactionUseCase } from '../../../src/application/use-cases/ExecuteTransactionUseCase.js';
import { InvariantEngine, createCeilingInvariant } from '../../../src/domain/invariants/InvariantEngine.js';
import { SSEPublisher } from '../../../src/application/ports/SSEPublisher.js';
import { ValidationError } from '../../../src/domain/errors/ValidationError.js';
import { RulesNotSyncedError } from '../../../src/domain/errors/RulesNotSyncedError.js';

describe('ExecuteTransactionUseCase', () => {
  it('should execute when amount passes invariants', async () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ExecuteTransactionUseCase(engine, mockSSE);

    // When
    const result = await useCase.execute({ amount: 14.0, location: 'Poznan', tier: 'Standard' }, 'corr-123');

    // Then
    expect(result).toEqual({ status: 'executed' });
  });

  it('should reject when amount exceeds ceiling', async () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ExecuteTransactionUseCase(engine, mockSSE);

    // When
    const result = await useCase.execute({ amount: 50.0, location: 'Poznan', tier: 'Standard' }, 'corr-123');

    // Then
    expect(result.status).toBe('rejected');
    if (result.status === 'rejected') {
      expect(result.violatedInvariant).toBe('MAX_REFUND_CEILING');
      expect(result.attemptedValue).toBe(50);
      expect(result.maxAllowed).toBe(15);
    }
  });

  it('should throw ValidationError for negative amount', async () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ExecuteTransactionUseCase(engine, mockSSE);

    // When / Then
    await expect(
      useCase.execute({ amount: -5, location: 'Poznan', tier: 'Standard' }, 'corr-123'),
    ).rejects.toThrow(ValidationError);
  });

  it('should throw RulesNotSyncedError when cache not loaded and emit notification', async () => {
    // Given
    const engine = new InvariantEngine();
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ExecuteTransactionUseCase(engine, mockSSE);

    // When / Then
    await expect(
      useCase.execute({ amount: 10.0, location: 'Poznan', tier: 'Standard' }, 'corr-123'),
    ).rejects.toThrow(RulesNotSyncedError);

    expect(mockSSE.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notification',
        severity: 'warn',
        title: 'Rules Not Synced',
        correlationId: 'corr-123',
      }),
    );
  });
});
