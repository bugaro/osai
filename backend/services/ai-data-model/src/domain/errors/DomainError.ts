export abstract class DomainError extends Error {
  public abstract readonly name: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
