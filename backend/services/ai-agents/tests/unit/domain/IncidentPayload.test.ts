import { describe, it, expect } from 'vitest';
import { IncidentPayload } from '../../../src/domain/IncidentPayload.js';
import { ValidationError } from '../../../src/domain/errors/ValidationError.js';

describe('IncidentPayload', () => {
  it('should create an IncidentPayload with valid values', () => {
    // Given
    const userId = 'usr_99';
    const tier = 'Prime';
    const location = 'Poznan';
    const delayMinutes = 45;

    // When
    const payload = IncidentPayload.create(userId, tier, location, delayMinutes);

    // Then
    expect(payload.userId).toBe('usr_99');
    expect(payload.tier).toBe('Prime');
    expect(payload.location).toBe('Poznan');
    expect(payload.delayMinutes).toBe(45);
  });

  it('should throw ValidationError when delayMinutes is negative', () => {
    // Given
    const userId = 'usr_99';
    const tier = 'Standard';
    const location = 'Poznan';
    const delayMinutes = -1;

    // When / Then
    expect(() => IncidentPayload.create(userId, tier, location, delayMinutes)).toThrow(ValidationError);
  });

  it('should throw ValidationError when delayMinutes is NaN', () => {
    // Given
    const userId = 'usr_99';
    const tier = 'Standard';
    const location = 'Poznan';
    const delayMinutes = NaN;

    // When / Then
    expect(() => IncidentPayload.create(userId, tier, location, delayMinutes)).toThrow(ValidationError);
  });

  it('should create an IncidentPayload with zero delay', () => {
    // Given
    const userId = 'usr_1';
    const tier = 'Standard';
    const location = 'Berlin';
    const delayMinutes = 0;

    // When
    const payload = IncidentPayload.create(userId, tier, location, delayMinutes);

    // Then
    expect(payload.delayMinutes).toBe(0);
  });

  it('should throw ValidationError when userId is empty string', () => {
    // Given
    const userId = '';
    const tier = 'Standard';
    const location = 'Berlin';
    const delayMinutes = 10;

    // When / Then
    expect(() => IncidentPayload.create(userId, tier, location, delayMinutes)).toThrow(ValidationError);
  });

  it('should throw ValidationError when location is empty string', () => {
    // Given
    const userId = 'usr_1';
    const tier = 'Standard';
    const location = '';
    const delayMinutes = 10;

    // When / Then
    expect(() => IncidentPayload.create(userId, tier, location, delayMinutes)).toThrow(ValidationError);
  });
});
