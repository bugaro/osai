import { vi, describe, it, expect } from "vitest";

// Port (Interface)
interface UserRepository {
  save(user: { id: string; email: string }): Promise<void>;
}

// System Under Test (SUT)
class RegistrationService {
  constructor(private userRepo: UserRepository) {}

  async run(id: string, email: string): Promise<void> {
    try {
      await this.userRepo.save({ id, email });
    } catch (err) {
      throw new Error("Repository timeout error");
    }
  }
}

describe("RegistrationService Infrastructure Integration Mocks", () => {
  it("should bubble up database connection timeouts as standard error formats", async () => {
    // Given
    const mockRepo: UserRepository = {
      save: vi.fn().mockRejectedValue(new Error("Timeout"))
    };
    const service = new RegistrationService(mockRepo);

    // When & Then
    await expect(service.run("1", "user@test.com")).rejects.toThrow("Repository timeout error");
  });
});
