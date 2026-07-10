import { ValidationError, InvalidOperationError } from "../../../docs/coding_standards.md"; // Pseudo path for import reference

export class UserEmail {
  private constructor(public readonly value: string) {}

  public static create(email: string): UserEmail {
    if (!email || !email.includes("@")) {
      throw new ValidationError("Invalid email format");
    }
    return new UserEmail(email);
  }
}

export class User {
  private _verified = false;

  constructor(
    public readonly id: string,
    public readonly email: UserEmail
  ) {}

  public get isVerified(): boolean {
    return this._verified;
  }

  public verify(): void {
    if (this._verified) {
      throw new InvalidOperationError("User is already verified");
    }
    this._verified = true;
  }
}
