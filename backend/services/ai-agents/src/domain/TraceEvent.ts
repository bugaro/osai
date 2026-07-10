import { z } from 'zod';
import { TraceEventType } from './enums/TraceEventType.js';

export const TraceEventSchema = z.object({
  type: z.nativeEnum(TraceEventType),
  payload: z.record(z.unknown()),
  timestamp: z.string(),
  correlationId: z.string().min(1),
});

export type TraceEvent = z.infer<typeof TraceEventSchema>;
