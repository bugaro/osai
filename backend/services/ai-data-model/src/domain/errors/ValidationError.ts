import { DomainError } from './DomainError.js';

export class ValidationError extends DomainError {
  public readonly name = 'ValidationError';

  constructor(message: string) {
    super(message);
  }
}
