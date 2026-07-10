import { randomUUID } from 'node:crypto';
import { TraceEventType } from '../../domain/enums/TraceEventType.js';
import { createNotification } from '../../domain/value-objects/Notification.js';
import { createTraceEvent } from '../../domain/value-objects/TraceEvent.js';
import { SSEPublisher, SSEClient } from '../../application/ports/SSEPublisher.js';
import { sseConnectionsActive, sseEventsProcessedTotal } from '../../infrastructure/observability/metrics.js';
import { logger } from '../../infrastructure/observability/logger.js';
import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.js';
import { HEARTBEAT_INTERVAL_MS, SHUTDOWN_DELAY_MS, SYSTEM_CORRELATION_ID, DEFAULT_MAX_CLIENTS, ENV_SSE_MAX_CLIENTS } from '../../constants.js';

const MAX_CLIENTS = parseInt(process.env[ENV_SSE_MAX_CLIENTS] || String(DEFAULT_MAX_CLIENTS), 10);

export class SSEStreamManager implements SSEPublisher {
  private clients = new Map<string, SSEClient>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      for (const client of this.clients.values()) {
        client.send(createTraceEvent(TraceEventType.Heartbeat, {}, SYSTEM_CORRELATION_ID));
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  publish(data: Record<string, unknown>): void {
    for (const client of this.clients.values()) {
      client.send(data);
    }
    sseEventsProcessedTotal.inc({ event_type: data.type as string });
  }

  connect(client: SSEClient): void {
    if (this.clients.size >= MAX_CLIENTS) {
      throw new InvalidOperationError('Maximum SSE connections reached');
    }

    this.clients.set(client.id, client);
    sseConnectionsActive.set(this.clients.size);
    logger.info({ clientId: client.id }, 'sse client connected');
  }

  disconnect(clientId: string): void {
    this.clients.delete(clientId);
    sseConnectionsActive.set(this.clients.size);
    logger.info({ clientId }, 'sse client disconnected');
  }

  addAdminClient(sendFn: (data: Record<string, unknown>) => void): SSEClient {
    const id = randomUUID();
    const client: SSEClient = { id, send: sendFn };
    this.connect(client);

    client.send(createNotification('info', 'Connected', 'SSE client connected', SYSTEM_CORRELATION_ID));

    return client;
  }

  async shutdown(): Promise<void> {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    for (const client of this.clients.values()) {
      client.send(createNotification('warn', 'Server Shutdown', `Server is shutting down in ${SHUTDOWN_DELAY_MS / 1000} seconds...`, SYSTEM_CORRELATION_ID));
    }

    await new Promise((resolve) => setTimeout(resolve, SHUTDOWN_DELAY_MS));

    this.clients.clear();
    sseConnectionsActive.set(0);
  }
}
