import { describe, it, expect } from 'vitest';
import { TraceEventSchema, createTraceEvent } from '../../../../src/domain/value-objects/TraceEvent.js';
import { TraceEventType } from '../../../../src/domain/enums/TraceEventType.js';

describe('TraceEvent', () => {
  it('should create a valid TraceEvent with reasoning type', () => {
    // Given
    const payload = { thought: 'Calculating compensation' };

    // When
    const event = createTraceEvent(TraceEventType.Reasoning, payload, 'corr-123');

    // Then
    expect(event.type).toBe('reasoning');
    expect(event.payload).toEqual(payload);
    expect(event.correlationId).toBe('corr-123');
    expect(typeof event.timestamp).toBe('string');
  });

  it('should reject TraceEvent with missing correlationId', () => {
    // Given
    const invalidPayload = {
      type: TraceEventType.Reasoning,
      payload: {},
      timestamp: '2026-01-01T00:00:00.000Z',
    };

    // When / Then
    expect(() => TraceEventSchema.parse(invalidPayload)).toThrow();
  });

  it('should reject TraceEvent with unknown type', () => {
    // Given
    const invalidPayload = {
      type: 'unknown_type',
      payload: {},
      timestamp: '2026-01-01T00:00:00.000Z',
      correlationId: 'corr-123',
    };

    // When / Then
    expect(() => TraceEventSchema.parse(invalidPayload)).toThrow();
  });

});
