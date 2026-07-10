import { ValidationError } from './errors/ValidationError.js';

export class CompensationProposal {
  private constructor(
    public readonly amount: number,
  ) {}

  public static create(amount: number): CompensationProposal {
    if (typeof amount !== 'number' || Number.isNaN(amount)) {
      throw new ValidationError('amount must be a valid number');
    }
    if (amount < 0) {
      throw new ValidationError('amount must be >= 0');
    }
    return new CompensationProposal(amount);
  }
}
