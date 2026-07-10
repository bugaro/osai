import { DomainError } from './DomainError.js';

export class ConflictError extends DomainError {
  public readonly name = 'ConflictError';

  constructor(message: string) {
    super(message);
  }
}
