import { describe, it, expect } from 'vitest';
import { CompensationProposal } from '../../../src/domain/CompensationProposal.js';
import { ValidationError } from '../../../src/domain/errors/ValidationError.js';

describe('CompensationProposal', () => {
  it('should create a CompensationProposal with valid amount', () => {
    // Given
    const amount = 10.0;

    // When
    const proposal = CompensationProposal.create(amount);

    // Then
    expect(proposal.amount).toBe(10.0);
  });

  it('should throw ValidationError when amount is negative', () => {
    // Given
    const amount = -5.0;

    // When / Then
    expect(() => CompensationProposal.create(amount)).toThrow(ValidationError);
  });

  it('should throw ValidationError when amount is NaN', () => {
    // Given
    const amount = NaN;

    // When / Then
    expect(() => CompensationProposal.create(amount)).toThrow(ValidationError);
  });

  it('should create a CompensationProposal with zero amount', () => {
    // Given
    const amount = 0;

    // When
    const proposal = CompensationProposal.create(amount);

    // Then
    expect(proposal.amount).toBe(0);
  });

  it('should throw ValidationError when amount is not a number', () => {
    // Given
    const amount = 'not-a-number' as unknown as number;

    // When / Then
    expect(() => CompensationProposal.create(amount)).toThrow(ValidationError);
  });
});
