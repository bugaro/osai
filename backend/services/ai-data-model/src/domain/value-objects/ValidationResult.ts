export type ValidationResult =
  | { passed: true }
  | { passed: false; violatedInvariant: string; attemptedValue: number; maxAllowed: number };

export function passedValidation(): ValidationResult {
  return { passed: true };
}

export function failedValidation(
  violatedInvariant: string,
  attemptedValue: number,
  maxAllowed: number,
): ValidationResult {
  return { passed: false, violatedInvariant, attemptedValue, maxAllowed };
}
