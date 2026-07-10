import { describe, it, expect } from 'vitest';
import {
  InvariantEngine,
  createCeilingInvariant,
  createZoneInvariant,
} from '../../../../src/domain/invariants/InvariantEngine.js';
import { InvariantContext } from '../../../../src/domain/value-objects/InvariantContext.js';
import { ClientTier } from '../../../../src/domain/enums/ClientTier.js';
import { RulesNotSyncedError } from '../../../../src/domain/errors/RulesNotSyncedError.js';

describe('InvariantEngine', () => {
  it('should start empty and isLoaded returns false', () => {
    // Given
    const engine = new InvariantEngine();

    // Then
    expect(engine.isLoaded()).toBe(false);
  });

  it('should be loaded after loadFromNeo4j with invariants', () => {
    // Given
    const engine = new InvariantEngine();
    const invariants = [createCeilingInvariant(15)];

    // When
    engine.loadFromNeo4j(invariants);

    // Then
    expect(engine.isLoaded()).toBe(true);
  });

  it('should pass validation when amount is within ceiling', () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);
    const context: InvariantContext = { zone: 'Poznan', tier: ClientTier.Standard, amount: 14 };

    // When
    const result = engine.validateAll(context);

    // Then
    expect(result.passed).toBe(true);
  });

  it('should reject validation when amount exceeds ceiling', () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);
    const context: InvariantContext = { zone: 'Poznan', tier: ClientTier.Standard, amount: 16 };

    // When
    const result = engine.validateAll(context);

    // Then
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violatedInvariant).toBe('MAX_REFUND_CEILING');
      expect(result.attemptedValue).toBe(16);
      expect(result.maxAllowed).toBe(15);
    }
  });

  it('should pass zone invariant when zone matches', () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createZoneInvariant('Poznan')]);

    // When
    const result = engine.validateAll({ zone: 'Poznan', tier: ClientTier.Standard, amount: 10 });

    // Then
    expect(result.passed).toBe(true);
  });

  it('should reject zone invariant when zone does not match', () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createZoneInvariant('Poznan')]);

    // When
    const result = engine.validateAll({ zone: 'Warsaw', tier: ClientTier.Standard, amount: 10 });

    // Then
    expect(result.passed).toBe(false);
    if (!result.passed) {
      expect(result.violatedInvariant).toBe('ZONE_MISMATCH');
    }
  });

  it('should atomically replace cache on loadFromNeo4j', () => {
    // Given
    const engine = new InvariantEngine();
    engine.loadFromNeo4j([createCeilingInvariant(15)]);

    // When — replace with new invariants
    engine.loadFromNeo4j([createCeilingInvariant(30)]);

    // Then — old ceiling (15) should no longer apply; 25 should pass with new ceiling (30)
    const result = engine.validateAll({ zone: 'Poznan', tier: ClientTier.Standard, amount: 25 });
    expect(result.passed).toBe(true);
  });

  it('should throw RulesNotSyncedError when validateAll called without loading', () => {
    // Given
    const engine = new InvariantEngine();

    // When / Then
    expect(() =>
      engine.validateAll({ zone: 'Poznan', tier: ClientTier.Standard, amount: 10 }),
    ).toThrow(RulesNotSyncedError);
  });

});
