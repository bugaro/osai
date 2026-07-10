import { SSEPublisher } from '../ports/SSEPublisher.js';
import { TraceEventSchema, SystemNotificationTraceEventSchema } from '../../domain/value-objects/TraceEvent.js';
import { TraceEventType } from '../../domain/enums/TraceEventType.js';
import { traceEventToNotification } from '../../domain/services/TraceEventTransformer.js';
import { logger } from '../../infrastructure/observability/logger.js';

export class ProcessTraceEventUseCase {
  constructor(private readonly ssePublisher: SSEPublisher) {}

  async execute(event: unknown): Promise<void> {
    const parsed = TraceEventSchema.safeParse(event);
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'ProcessTraceEventUseCase: invalid event dropped');
      return;
    }

    if (parsed.data.type === TraceEventType.SystemNotification) {
      const refined = SystemNotificationTraceEventSchema.safeParse(parsed.data);
      if (!refined.success) {
        logger.warn({ issues: refined.error.issues }, 'ProcessTraceEventUseCase: invalid system_notification payload dropped');
        return;
      }
      const notification = traceEventToNotification(refined.data);
      if (notification) {
        this.ssePublisher.publish(notification);
      }
      return;
    }

    const notification = traceEventToNotification(parsed.data);
    if (notification) {
      this.ssePublisher.publish(notification);
    }
  }
}
