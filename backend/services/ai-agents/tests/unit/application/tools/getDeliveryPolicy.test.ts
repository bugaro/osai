import { describe, it, expect, vi } from 'vitest';
import { createGetDeliveryPolicy } from '../../../../src/mastra/tools.js';
import type { PolicyProvider } from '../../../../src/application/ports/PolicyProvider.js';
import { PolicyFrame } from '../../../../src/domain/PolicyFrame.js';

describe('getDeliveryPolicy tool', () => {
  it('should call PolicyProvider.getPolicyFrame and return the frame', async () => {
    // Given
    const mockFrame = PolicyFrame.create(5.0, 5.0, 15.0);
    const mockProvider: PolicyProvider = {
      getPolicyFrame: vi.fn().mockResolvedValue(mockFrame),
    };
    const tool = createGetDeliveryPolicy(mockProvider);

    // When
    const result = await tool.execute({ location: 'Poznan', tier: 'Prime' });

    // Then
    expect(mockProvider.getPolicyFrame).toHaveBeenCalledOnce();
    expect(mockProvider.getPolicyFrame).toHaveBeenCalledWith('Poznan', 'Prime');
    expect(result).toEqual({ baseRefund: 5.0, primeBonus: 5.0, ceiling: 15.0 });
  });

  it('should propagate errors from PolicyProvider', async () => {
    // Given
    const mockProvider: PolicyProvider = {
      getPolicyFrame: vi.fn().mockRejectedValue(new Error('Network error')),
    };
    const tool = createGetDeliveryPolicy(mockProvider);

    // When / Then
    await expect(tool.execute({ location: 'Poznan', tier: 'Prime' })).rejects.toThrow('Network error');
  });

  it('should call PolicyProvider with empty location boundary', async () => {
    // Given
    const mockFrame = PolicyFrame.create(5.0, 5.0, 15.0);
    const mockProvider: PolicyProvider = {
      getPolicyFrame: vi.fn().mockResolvedValue(mockFrame),
    };
    const tool = createGetDeliveryPolicy(mockProvider);

    // When
    await tool.execute({ location: '', tier: 'Prime' });

    // Then
    expect(mockProvider.getPolicyFrame).toHaveBeenCalledWith('', 'Prime');
  });
});
