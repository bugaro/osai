import { z } from 'zod';

export const NOTIFICATION_TYPE = 'notification' as const;

export const NotificationSeverityEnum = z.enum(['info', 'warn', 'error', 'log', 'success']);
export type NotificationSeverity = z.infer<typeof NotificationSeverityEnum>;

export const NotificationSchema = z.object({
  type: z.literal(NOTIFICATION_TYPE),
  severity: NotificationSeverityEnum,
  title: z.string().min(1),
  message: z.string(),
  timestamp: z.string(),
  correlationId: z.string().min(1),
});

export type Notification = z.infer<typeof NotificationSchema>;

export function createNotification(
  severity: NotificationSeverity,
  title: string,
  message: string,
  correlationId: string,
): Notification {
  return NotificationSchema.parse({
    type: NOTIFICATION_TYPE,
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    correlationId,
  });
}
