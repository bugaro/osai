import { AgentClient } from '../ports/AgentClient.js';
import type { ResolveIncidentInput } from '../dto/ResolveIncidentDTO.js';

export class ResolveIncidentUseCase {
  constructor(private readonly agentClient: AgentClient) {}

  async execute(input: ResolveIncidentInput): Promise<void> {
    await this.agentClient.triggerResolution({
      userId: input.userId,
      tier: input.tier,
      location: input.location,
      delayMinutes: input.delayMinutes,
    });
  }
}
