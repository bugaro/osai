import type { TraceEvent } from '../value-objects/TraceEvent.js';
import type { Notification, NotificationSeverity } from '../value-objects/Notification.js';
import { createNotification } from '../value-objects/Notification.js';
import { TraceEventType } from '../enums/TraceEventType.js';

const SYSTEM_NOTIFICATION_TITLES: Record<string, string> = {
  connected: 'Connected',
  server_shutting_down: 'Server Shutdown',
  rules_not_synced: 'Rules Not Synced',
  rules_extracting: 'Extracting Rules',
  rules_synced: 'Rules Synced',
  action_executed: 'Action Executed',
};

function severityFromSystemNotificationType(type: string): NotificationSeverity {
  switch (type) {
    case 'error': return 'error';
    case 'warn': return 'warn';
    case 'info': return 'info';
    case 'log': return 'log';
    default: return 'info';
  }
}

function formatToolCall(payload: Record<string, unknown>): string {
  const tool = payload.tool ?? 'unknown';
  const args = payload.args as Record<string, unknown> | undefined;
  if (args && typeof args === 'object') {
    const formatted = Object.entries(args)
      .map(([k, v]) => `${k}: "${v}"`)
      .join(', ');
    return `${String(tool)}(${formatted})`;
  }
  return String(tool);
}

function formatToolResult(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
}

function formatFinalAnswer(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  if (payload.amount !== undefined) parts.push(`Amount: ${payload.amount} EUR`);
  if (payload.reason) parts.push(String(payload.reason));
  if (parts.length === 0) {
    const userId = payload.userId ?? 'unknown';
    const tier = payload.tier ?? '';
    return `Incident resolved for ${userId} [${tier}]`;
  }
  return parts.join(' — ');
}

export function traceEventToNotification(event: TraceEvent): Notification | null {
  const { type, payload: rawPayload, correlationId } = event;
  const payload = rawPayload as Record<string, unknown> | undefined ?? {};

  switch (type) {
    case TraceEventType.Reasoning:
      return createNotification(
        'info',
        'Agent Reasoning',
        String(payload.step ?? payload.thought ?? ''),
        correlationId,
      );

    case TraceEventType.ToolCall:
      return createNotification(
        'log',
        'Tool Called',
        formatToolCall(payload),
        correlationId,
      );

    case TraceEventType.ToolResult:
      return createNotification(
        'info',
        'Tool Result',
        formatToolResult(payload),
        correlationId,
      );

    case TraceEventType.FinalAnswer:
      return createNotification(
        'success',
        'Resolution Complete',
        formatFinalAnswer(payload),
        correlationId,
      );

    case TraceEventType.SecurityViolation:
      return createNotification(
        'error',
        'Security Violation',
        String(payload.error ?? payload.message ?? ''),
        correlationId,
      );

    case TraceEventType.SystemNotification: {
      const kind = payload.kind as string | undefined;
      const severity = severityFromSystemNotificationType(payload.type as string);
      const title = (kind && SYSTEM_NOTIFICATION_TITLES[kind]) ?? 'System Notification';
      return createNotification(
        severity,
        title,
        String(payload.message ?? ''),
        correlationId,
      );
    }

    case TraceEventType.Heartbeat:
      return null;

    default:
      return createNotification('info', 'Event', JSON.stringify(payload), correlationId);
  }
}
