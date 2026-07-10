import { ValidationError } from './errors/ValidationError.js';

export class PolicyFrame {
  private constructor(
    public readonly baseRefund: number,
    public readonly primeBonus: number,
    public readonly ceiling: number,
  ) {}

  public static create(baseRefund: number, primeBonus: number, ceiling: number): PolicyFrame {
    if (typeof baseRefund !== 'number' || typeof primeBonus !== 'number' || typeof ceiling !== 'number') {
      throw new ValidationError('All PolicyFrame values must be numbers');
    }
    if (Number.isNaN(baseRefund) || Number.isNaN(primeBonus) || Number.isNaN(ceiling)) {
      throw new ValidationError('PolicyFrame values must not be NaN');
    }
    if (baseRefund < 0) {
      throw new ValidationError('baseRefund must not be negative');
    }
    if (primeBonus < 0) {
      throw new ValidationError('primeBonus must not be negative');
    }
    if (ceiling < 0) {
      throw new ValidationError('ceiling must not be negative');
    }
    return new PolicyFrame(baseRefund, primeBonus, ceiling);
  }
}
