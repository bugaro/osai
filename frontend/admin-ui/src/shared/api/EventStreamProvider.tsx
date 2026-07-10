'use client';

import { useEventStream } from './useEventStream';

export function EventStreamProvider({ children }: { children: React.ReactNode }) {
  useEventStream();
  return <>{children}</>;
}
