import { DomainError } from './DomainError.js';

export class ServiceUnavailableError extends DomainError {
  public readonly name = 'ServiceUnavailableError';

  constructor(message: string) {
    super(message);
  }
}
