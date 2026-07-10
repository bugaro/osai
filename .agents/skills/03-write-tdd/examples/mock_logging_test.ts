import { vi, describe, it, expect, beforeEach } from "vitest";

// Interfaces
interface Logger {
  info(msg: string, context?: Record<string, unknown>): void;
}

interface ContextStore {
  getCorrelationId(): string | undefined;
}

// System Under Test (SUT)
class RegisterUserUseCase {
  constructor(
    private logger: Logger,
    private context: ContextStore
  ) {}

  execute(email: string): void {
    const correlationId = this.context.getCorrelationId();
    this.logger.info("Processing registration", { email, correlationId });
  }
}

describe("RegisterUserUseCase Observability", () => {
  let mockLogger: Logger;
  let mockContext: ContextStore;

  beforeEach(() => {
    mockLogger = { info: vi.fn() };
    mockContext = { getCorrelationId: () => "test-correlation-uuid-123" };
  });

  it("should log the registration execution carrying the correlationId from context store", () => {
    // Given
    const useCase = new RegisterUserUseCase(mockLogger, mockContext);
    
    // When
    useCase.execute("test@user.com");

    // Then
    expect(mockLogger.info).toHaveBeenCalledWith(
      "Processing registration",
      expect.objectContaining({
        email: "test@user.com",
        correlationId: "test-correlation-uuid-123"
      })
    );
  });
});
