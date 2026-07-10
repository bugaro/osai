import { describe, it, expect } from 'vitest';
import { PolicyFrame } from '../../../../src/domain/value-objects/PolicyFrame.js';
import { ValidationError } from '../../../../src/domain/errors/ValidationError.js';

describe('PolicyFrame', () => {
  it('should create a PolicyFrame with valid values', () => {
    // Given
    const baseRefund = 5.0;
    const primeBonus = 5.0;
    const ceiling = 15.0;

    // When
    const frame = PolicyFrame.create(baseRefund, primeBonus, ceiling);

    // Then
    expect(frame.baseRefund).toBe(5.0);
    expect(frame.primeBonus).toBe(5.0);
    expect(frame.ceiling).toBe(15.0);
  });

  it('should throw ValidationError when baseRefund is negative', () => {
    // Given
    const baseRefund = -1;
    const primeBonus = 5.0;
    const ceiling = 15.0;

    // When / Then
    expect(() => PolicyFrame.create(baseRefund, primeBonus, ceiling)).toThrow(ValidationError);
  });

  it('should throw ValidationError when primeBonus is negative', () => {
    // Given
    const baseRefund = 5.0;
    const primeBonus = -1;
    const ceiling = 15.0;

    // When / Then
    expect(() => PolicyFrame.create(baseRefund, primeBonus, ceiling)).toThrow(ValidationError);
  });

  it('should throw ValidationError when ceiling is negative', () => {
    // Given
    const baseRefund = 5.0;
    const primeBonus = 5.0;
    const ceiling = -1;

    // When / Then
    expect(() => PolicyFrame.create(baseRefund, primeBonus, ceiling)).toThrow(ValidationError);
  });

  it('should throw ValidationError when NaN is passed', () => {
    // Given
    const baseRefund = NaN;
    const primeBonus = 5.0;
    const ceiling = 15.0;

    // When / Then
    expect(() => PolicyFrame.create(baseRefund, primeBonus, ceiling)).toThrow(ValidationError);
  });
});
