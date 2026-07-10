import { InvariantContext } from '../value-objects/InvariantContext.js';
import { ValidationResult, passedValidation, failedValidation } from '../value-objects/ValidationResult.js';
import { RulesNotSyncedError } from '../errors/RulesNotSyncedError.js';

export type Invariant = (context: InvariantContext) => ValidationResult;

export function createCeilingInvariant(maxAmount: number): Invariant {
  return (context: InvariantContext): ValidationResult => {
    if (context.amount > maxAmount) {
      return failedValidation('MAX_REFUND_CEILING', context.amount, maxAmount);
    }
    return passedValidation();
  };
}

export function createZoneInvariant(zone: string): Invariant {
  return (context: InvariantContext): ValidationResult => {
    if (context.zone !== zone) {
      return failedValidation('ZONE_MISMATCH', context.amount, 0);
    }
    return passedValidation();
  };
}

export class InvariantEngine {
  private cache: Invariant[] = [];

  public loadFromNeo4j(invariants: Invariant[]): void {
    this.cache = [...invariants];
  }

  public isLoaded(): boolean {
    return this.cache.length > 0;
  }

  public validateAll(context: InvariantContext): ValidationResult {
    if (!this.isLoaded()) {
      throw new RulesNotSyncedError();
    }
    for (const invariant of this.cache) {
      const result = invariant(context);
      if (!result.passed) {
        return result;
      }
    }
    return passedValidation();
  }
}
