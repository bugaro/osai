import { z } from 'zod';
import { TraceEventType } from '../enums/TraceEventType.js';
import { SystemNotificationPayloadSchema } from './SystemNotificationPayload.js';
import type { NotificationSeverity } from './Notification.js';

export const TraceEventSchema = z.object({
  type: z.nativeEnum(TraceEventType),
  payload: z.unknown(),
  timestamp: z.string(),
  correlationId: z.string().min(1),
});

export const SystemNotificationTraceEventSchema = TraceEventSchema.extend({
  type: z.literal(TraceEventType.SystemNotification),
  payload: SystemNotificationPayloadSchema,
});

export type TraceEvent = z.infer<typeof TraceEventSchema>;

export function createTraceEvent(
  type: TraceEventType,
  payload: unknown,
  correlationId: string,
): TraceEvent {
  return TraceEventSchema.parse({
    type,
    payload,
    timestamp: new Date().toISOString(),
    correlationId,
  });
}

export function createSystemNotification(
  kind: string,
  severity: NotificationSeverity,
  message: string,
  correlationId: string,
): TraceEvent {
  return createTraceEvent(
    TraceEventType.SystemNotification,
    { kind, type: severity, message },
    correlationId,
  );
}
