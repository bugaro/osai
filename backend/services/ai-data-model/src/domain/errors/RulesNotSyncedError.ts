import { DomainError } from './DomainError.js';

export class RulesNotSyncedError extends DomainError {
  public readonly name = 'RulesNotSyncedError';

  constructor(message = 'Business rules have not been synced. Invariant cache is empty.') {
    super(message);
  }
}
