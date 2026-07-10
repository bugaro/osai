import { describe, it, expect, vi } from 'vitest';
import { SyncPolicyUseCase } from '../../../src/application/use-cases/SyncPolicyUseCase.js';
import { AIExtractor } from '../../../src/application/ports/AIExtractor.js';
import { PolicyRepository } from '../../../src/application/ports/PolicyRepository.js';
import { InvariantEngine } from '../../../src/domain/invariants/InvariantEngine.js';
import { PolicyRule } from '../../../src/domain/entities/PolicyRule.js';
import { RuleType } from '../../../src/domain/enums/RuleType.js';
import { ValidationError } from '../../../src/domain/errors/ValidationError.js';
import { ExtractionError } from '../../../src/domain/errors/ExtractionError.js';
import type { SSEPublisher } from '../../../src/application/ports/SSEPublisher.js';

const mockPublisher: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };

describe('SyncPolicyUseCase', () => {
  it('should throw ValidationError when text is empty', async () => {
    // Given
    const mockExtractor: AIExtractor = { extractRules: vi.fn() };
    const mockRepo: PolicyRepository = {
      getPolicyFrame: vi.fn(),
      seedPolicyEntities: vi.fn(),
      getGraphTopology: vi.fn(),
      loadAllInvariants: vi.fn(),
    };
    const engine = new InvariantEngine();
    const useCase = new SyncPolicyUseCase(mockExtractor, mockRepo, engine, mockPublisher);

    // When / Then
    await expect(useCase.execute({ rules: '' }, 'corr-123')).rejects.toThrow(ValidationError);
    await expect(useCase.execute({ rules: '   ' }, 'corr-123')).rejects.toThrow(ValidationError);
  });

  it('should throw ExtractionError when extraction fails', async () => {
    // Given
    const mockExtractor: AIExtractor = {
      extractRules: vi.fn().mockRejectedValue(new ExtractionError('Ollama inference failed')),
    };
    const mockRepo: PolicyRepository = {
      getPolicyFrame: vi.fn(),
      seedPolicyEntities: vi.fn(),
      getGraphTopology: vi.fn(),
      loadAllInvariants: vi.fn(),
    };
    const engine = new InvariantEngine();
    const useCase = new SyncPolicyUseCase(mockExtractor, mockRepo, engine, mockPublisher);

    // When / Then
    await expect(useCase.execute({ rules: 'some policy text' }, 'corr-123')).rejects.toThrow(ExtractionError);
  });

  it('should seed entities, refresh cache, and emit event on success', async () => {
    // Given
    const rules = [
      new PolicyRule('1', RuleType.DELAY_COMPENSATION, 'Base compensation for delay over 20m', { delayMinutes: 20 }, { baseRefund: 5 }, 'Max: 5.00'),
    ];
    const mockExtractor: AIExtractor = {
      extractRules: vi.fn().mockResolvedValue(rules),
    };
    const mockRepo: PolicyRepository = {
      getPolicyFrame: vi.fn(),
      seedPolicyEntities: vi.fn().mockResolvedValue(undefined),
      getGraphTopology: vi.fn(),
      loadAllInvariants: vi.fn().mockResolvedValue([]),
    };
    const engine = new InvariantEngine();
    const useCase = new SyncPolicyUseCase(mockExtractor, mockRepo, engine, mockPublisher);

    // When
    const result = await useCase.execute({ rules: 'some policy text' }, 'corr-123');

    // Then
    expect(result.rulesCount).toBe(1);
    expect(mockExtractor.extractRules).toHaveBeenCalledWith('some policy text');
    expect(mockRepo.seedPolicyEntities).toHaveBeenCalledWith(rules);
    expect(mockRepo.loadAllInvariants).toHaveBeenCalled();
  });
});
