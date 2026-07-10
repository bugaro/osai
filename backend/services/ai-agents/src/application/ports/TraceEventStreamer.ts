import { TraceEvent } from '../../domain/TraceEvent.js';

export interface TraceEventStreamer {
  push(event: TraceEvent): Promise<void>;
}
