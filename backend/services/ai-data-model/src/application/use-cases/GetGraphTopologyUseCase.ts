import { PolicyRepository } from '../ports/PolicyRepository.js';

export class GetGraphTopologyUseCase {
  constructor(private readonly policyRepository: PolicyRepository) {}

  async execute(): Promise<{ nodes: unknown[]; edges: unknown[] }> {
    return this.policyRepository.getGraphTopology();
  }
}
