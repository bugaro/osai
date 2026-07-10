import { DomainError } from './DomainError.js';

export class InvalidOperationError extends DomainError {
  public readonly name = 'InvalidOperationError';

  constructor(message: string) {
    super(message);
  }
}
