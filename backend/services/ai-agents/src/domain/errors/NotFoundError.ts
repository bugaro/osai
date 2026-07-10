import { DomainError } from './DomainError.js';

export class NotFoundError extends DomainError {
  public readonly name = 'NotFoundError';

  constructor(message: string) {
    super(message);
  }
}
