import { AgentClient, IncidentPayload } from '../../application/ports/AgentClient.js';
import { ServiceUnavailableError } from '../../domain/errors/ServiceUnavailableError.js';
import { logger } from '../observability/logger.js';

export class AgentHttpClient implements AgentClient {
  constructor(private readonly agentsUrl: string) {}

  async triggerResolution(incident: IncidentPayload): Promise<void> {
    const url = `${this.agentsUrl}/api/agents/resolve`;

    logger.info({ url, incident }, 'forwarding resolution to ai-agents');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new ServiceUnavailableError(
          `Agent service returned ${response.status}: ${response.statusText} — ${body}`
        );
      }
    } catch (err) {
      if (err instanceof ServiceUnavailableError) throw err;
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error({ url, error: message }, 'agent service unreachable');
      throw new ServiceUnavailableError(`Agent service unreachable: ${message}`);
    }
  }
}
