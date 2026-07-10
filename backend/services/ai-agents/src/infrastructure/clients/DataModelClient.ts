import { PolicyFrame } from '../../domain/PolicyFrame.js';
import type { PolicyProvider } from '../../application/ports/PolicyProvider.js';
import type { TransactionExecutor } from '../../application/ports/TransactionExecutor.js';
import type { TraceEventStreamer } from '../../application/ports/TraceEventStreamer.js';
import type { TransactionResult } from '../../domain/TransactionResult.js';
import type { TraceEvent } from '../../domain/TraceEvent.js';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.js';
import { getCorrelationId } from '../observability/correlation.js';
import { HEADER_CORRELATION_ID, HEADER_CONTENT_TYPE, MEDIA_TYPE_JSON, API_POLICY, API_TRANSACTION, API_EVENTS } from '../../constants.js';

export class DataModelClient implements PolicyProvider, TransactionExecutor, TraceEventStreamer {
  constructor(private readonly baseUrl: string) {}

  async getPolicyFrame(location: string, tier: string): Promise<PolicyFrame> {
    const url = `${this.baseUrl}${API_POLICY}?location=${encodeURIComponent(location)}&tier=${encodeURIComponent(tier)}`;
    const response = await fetch(url, {
      headers: this.buildHeaders(),
    });
    if (!response.ok) {
      throw new InvalidOperationError(`PolicyProvider request failed: ${response.status}`);
    }
    const data = (await response.json()) as { baseRefund: number; primeBonus: number; ceiling: number };
    return PolicyFrame.create(data.baseRefund, data.primeBonus, data.ceiling);
  }

  async execute(amount: number, location: string, tier: string): Promise<TransactionResult> {
    const response = await fetch(`${this.baseUrl}${API_TRANSACTION}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ amount, location, tier }),
    });

    if (response.status === 200) {
      return { status: 'executed' };
    }

    if (response.status === 403) {
      const body = (await response.json()) as {
        error: string;
        violatedInvariant: string;
        attemptedValue: number;
        maxAllowed: number;
      };
      return {
        status: 'rejected',
        violatedInvariant: body.violatedInvariant,
        attemptedValue: body.attemptedValue,
        maxAllowed: body.maxAllowed,
      };
    }

    throw new InvalidOperationError(`Transaction request failed: ${response.status}`);
  }

  async push(event: TraceEvent): Promise<void> {
    const response = await fetch(`${this.baseUrl}${API_EVENTS}`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new InvalidOperationError(`TraceEvent push failed: ${response.status}`);
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      [HEADER_CONTENT_TYPE]: MEDIA_TYPE_JSON,
    };
    const correlationId = getCorrelationId();
    if (correlationId) {
      headers[HEADER_CORRELATION_ID] = correlationId;
    }
    return headers;
  }
}
