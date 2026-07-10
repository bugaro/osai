import { PolicyRepository } from '../ports/PolicyRepository.js';
import type { GetPolicyFrameInput, GetPolicyFrameOutput } from '../dto/GetPolicyFrameDTO.js';

export class GetPolicyFrameUseCase {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(input: GetPolicyFrameInput): Promise<GetPolicyFrameOutput> {
    const frame = await this.policyRepository.getPolicyFrame(input.location, input.tier);

    if (!frame) {
      return { baseRefund: 0, primeBonus: 0, ceiling: 0 };
    }

    return {
      baseRefund: frame.baseRefund,
      primeBonus: frame.primeBonus,
      ceiling: frame.ceiling,
    };
  }
}
