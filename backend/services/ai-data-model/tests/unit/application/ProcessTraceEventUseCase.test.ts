import { describe, it, expect, vi } from 'vitest';
import { ProcessTraceEventUseCase } from '../../../src/application/use-cases/ProcessTraceEventUseCase.js';
import { SSEPublisher } from '../../../src/application/ports/SSEPublisher.js';
import { TraceEventType } from '../../../src/domain/enums/TraceEventType.js';

describe('ProcessTraceEventUseCase', () => {
  it('should transform and publish a valid trace event as notification', async () => {
    // Given
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ProcessTraceEventUseCase(mockSSE);
    const validEvent = {
      type: TraceEventType.ToolCall,
      payload: { tool: 'get_delivery_policy', args: { location: 'Poznan', tier: 'Prime' } },
      timestamp: '2026-07-08T00:00:00.000Z',
      correlationId: 'corr-123',
    };

    // When
    await useCase.execute(validEvent);

    // Then
    expect(mockSSE.publish).toHaveBeenCalledTimes(1);
    expect(mockSSE.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'notification',
        severity: 'log',
        title: 'Tool Called',
        correlationId: 'corr-123',
      }),
    );
  });

  it('should drop invalid event without publishing', async () => {
    // Given
    const mockSSE: SSEPublisher = { publish: vi.fn(), connect: vi.fn(), disconnect: vi.fn() };
    const useCase = new ProcessTraceEventUseCase(mockSSE);
    const invalidEvent = { type: 'invalid', payload: {} };

    // When
    await useCase.execute(invalidEvent);

    // Then
    expect(mockSSE.publish).not.toHaveBeenCalled();
  });

});
