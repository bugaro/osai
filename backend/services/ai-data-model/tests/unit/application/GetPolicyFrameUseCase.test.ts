import { describe, it, expect, vi } from 'vitest';
import { GetPolicyFrameUseCase } from '../../../src/application/use-cases/GetPolicyFrameUseCase.js';
import { PolicyRepository } from '../../../src/application/ports/PolicyRepository.js';
import { PolicyFrame } from '../../../src/domain/value-objects/PolicyFrame.js';

describe('GetPolicyFrameUseCase', () => {
  it('should return policy frame when found', async () => {
    // Given
    const frame = PolicyFrame.create(5.0, 5.0, 15.0);
    const mockRepo: PolicyRepository = {
      getPolicyFrame: vi.fn().mockResolvedValue(frame),
      seedPolicyEntities: vi.fn(),
      getGraphTopology: vi.fn(),
      loadAllInvariants: vi.fn(),
    };
    const useCase = new GetPolicyFrameUseCase(mockRepo);

    // When
    const result = await useCase.execute({ location: 'Poznan', tier: 'Prime' });

    // Then
    expect(result).toEqual({ baseRefund: 5.0, primeBonus: 5.0, ceiling: 15.0 });
    expect(mockRepo.getPolicyFrame).toHaveBeenCalledWith('Poznan', 'Prime');
  });

  it('should return zeroed frame when not found', async () => {
    // Given
    const mockRepo: PolicyRepository = {
      getPolicyFrame: vi.fn().mockResolvedValue(null),
      seedPolicyEntities: vi.fn(),
      getGraphTopology: vi.fn(),
      loadAllInvariants: vi.fn(),
    };
    const useCase = new GetPolicyFrameUseCase(mockRepo);

    // When
    const result = await useCase.execute({ location: 'Warsaw', tier: 'Standard' });

    // Then
    expect(result).toEqual({ baseRefund: 0, primeBonus: 0, ceiling: 0 });
  });
});
