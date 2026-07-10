'use client';

import { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import { readSSEStream } from './sseReader';
import type { TraceEntry, TraceEntrySeverity } from '@/shared/types';
import { RECONNECT_BASE_MS, RECONNECT_MAX_MS, MIN_CONNECTED_MS, EVENTS_URL } from '@/shared/lib/constants';

const EVENT_STREAM_TAG = '[event-stream]';

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function timestampFromISO(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB');
}

interface ParsedNotification {
  type: string;
  severity: TraceEntrySeverity;
  title: string;
  message: string;
  timestamp: string;
}

function processSSELine(line: string): TraceEntry | null {
  let parsed: ParsedNotification;
  try {
    parsed = JSON.parse(line) as ParsedNotification;
  } catch {
    return null;
  }

  if (parsed.type === 'heartbeat') return null;

  if (parsed.type === 'notification') {
    return {
      id: crypto.randomUUID(),
      timestamp: timestampFromISO(parsed.timestamp),
      severity: parsed.severity,
      title: parsed.title,
      message: parsed.message,
    };
  }

  return null;
}

export function useEventStream(): void {
  const appendTraceEntryRef = useRef(useDashboardStore.getState().appendTraceEntry);
  const setEventStreamConnectedRef = useRef(useDashboardStore.getState().setEventStreamConnected);
  const setIsStreamingRef = useRef(useDashboardStore.getState().setIsStreaming);

  useEffect(() => {
    const appendTraceEntry = appendTraceEntryRef.current;
    const setEventStreamConnected = setEventStreamConnectedRef.current;
    const setIsStreaming = setIsStreamingRef.current;
    const controller = new AbortController();
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;
    let mounted = true;

    const scheduleReconnect = () => {
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(2, attempt),
        RECONNECT_MAX_MS,
      );
      attempt++;
      console.log(`${EVENT_STREAM_TAG} disconnected, reconnecting in ${delay}ms`);
      reconnectTimer = setTimeout(connect, delay);
    };

    async function connect() {
      try {
        const response = await fetch(EVENTS_URL, { signal: controller.signal });

        if (!response.ok || !response.body) {
          if (!mounted) return;
          setEventStreamConnected(false);
          scheduleReconnect();
          return;
        }

        if (!mounted) return;
        setEventStreamConnected(true);
        console.log(`${EVENT_STREAM_TAG} connected`);
        attempt = 0;

        const connectedAt = Date.now();

        for await (const line of readSSEStream(response.body)) {
          if (!mounted) break;

          const entry = processSSELine(line);
          if (entry) {
            appendTraceEntry(entry);
            if (entry.severity === 'error') {
              setIsStreaming(false);
            }
            if (entry.severity === 'success') {
              setIsStreaming(false);
            }
          }
        }

        const elapsed = Date.now() - connectedAt;
        if (elapsed < MIN_CONNECTED_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_CONNECTED_MS - elapsed));
        }
      } catch (err) {
        if (isAbortError(err)) return;
        if (!mounted) return;
      }

      if (!mounted) return;
      setEventStreamConnected(false);
      setIsStreaming(false);
      scheduleReconnect();
    }

    connect();

    return () => {
      mounted = false;
      controller.abort();
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      setEventStreamConnected(false);
    };
  }, []);
}
