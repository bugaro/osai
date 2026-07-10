import { describe, it, expect } from 'vitest';
import { TraceEventSchema } from '../../../src/domain/TraceEvent.js';
import { TraceEventType } from '../../../src/domain/enums/TraceEventType.js';

describe('TraceEvent', () => {
  it('should validate a correct reasoning trace event', () => {
    // Given
    const input = {
      type: TraceEventType.Reasoning,
      payload: { step: 'analyzing incident', thought: 'checking policy' },
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: 'corr-123',
    };

    // When
    const result = TraceEventSchema.parse(input);

    // Then
    expect(result.type).toBe('reasoning');
    expect(result.correlationId).toBe('corr-123');
  });

  it('should validate a tool_call trace event', () => {
    // Given
    const input = {
      type: TraceEventType.ToolCall,
      payload: { tool: 'get_delivery_policy', args: { location: 'Poznan', tier: 'Prime' } },
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: 'corr-456',
    };

    // When
    const result = TraceEventSchema.parse(input);

    // Then
    expect(result.type).toBe('tool_call');
  });

  it('should validate a final_answer trace event', () => {
    // Given
    const input = {
      type: TraceEventType.FinalAnswer,
      payload: { amount: 10.0, reason: 'standard refund' },
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: 'corr-789',
    };

    // When
    const result = TraceEventSchema.parse(input);

    // Then
    expect(result.type).toBe('final_answer');
  });

  it('should reject trace event with empty correlationId', () => {
    // Given
    const input = {
      type: TraceEventType.Reasoning,
      payload: {},
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: '',
    };

    // When / Then
    expect(() => TraceEventSchema.parse(input)).toThrow();
  });

  it('should reject trace event with missing type', () => {
    // Given
    const input = {
      payload: {},
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: 'corr-123',
    };

    // When / Then
    expect(() => TraceEventSchema.parse(input)).toThrow();
  });

  it('should reject trace event with invalid type', () => {
    // Given
    const input = {
      type: 'invalid_type',
      payload: {},
      timestamp: '2025-01-01T00:00:00.000Z',
      correlationId: 'corr-123',
    };

    // When / Then
    expect(() => TraceEventSchema.parse(input)).toThrow();
  });
});
