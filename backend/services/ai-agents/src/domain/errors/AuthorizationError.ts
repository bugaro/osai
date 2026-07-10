import { DomainError } from './DomainError.js';

export class AuthorizationError extends DomainError {
  public readonly name = 'AuthorizationError';

  constructor(message: string) {
    super(message);
  }
}
