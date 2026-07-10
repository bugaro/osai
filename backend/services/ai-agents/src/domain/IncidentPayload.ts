import { ValidationError } from './errors/ValidationError.js';

export class IncidentPayload {
  private constructor(
    public readonly userId: string,
    public readonly tier: string,
    public readonly location: string,
    public readonly delayMinutes: number,
  ) {}

  public static create(userId: string, tier: string, location: string, delayMinutes: number): IncidentPayload {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('userId must be a non-empty string');
    }
    if (typeof delayMinutes !== 'number' || Number.isNaN(delayMinutes)) {
      throw new ValidationError('delayMinutes must be a valid number');
    }
    if (delayMinutes < 0) {
      throw new ValidationError('delayMinutes must be >= 0');
    }
    if (!location || typeof location !== 'string') {
      throw new ValidationError('location must be a non-empty string');
    }
    return new IncidentPayload(userId, tier, location, delayMinutes);
  }
}
