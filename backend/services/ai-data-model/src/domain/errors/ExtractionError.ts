import { DomainError } from './DomainError.js';

export class ExtractionError extends DomainError {
  public readonly name = 'ExtractionError';

  constructor(message: string) {
    super(message);
  }
}
