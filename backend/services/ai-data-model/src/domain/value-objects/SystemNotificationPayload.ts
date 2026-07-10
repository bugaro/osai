import { z } from 'zod';
import type { NotificationSeverity } from './Notification.js';
import { NotificationSeverityEnum } from './Notification.js';

export interface SystemNotificationPayload {
  kind: string;
  type: NotificationSeverity;
  message: string;
}

export const SystemNotificationPayloadSchema = z.object({
  kind: z.string().min(1),
  type: NotificationSeverityEnum,
  message: z.string().min(1),
});
