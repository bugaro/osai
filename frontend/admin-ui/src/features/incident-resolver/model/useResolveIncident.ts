'use client';

import { GatewayError } from '@/shared/api/gatewayClient';
import { generateCorrelationId } from '@/shared/lib/correlationId';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import type { IncidentPayload } from '@/shared/types';
import { useRef } from 'react';
import { toast } from 'sonner';

export function useResolveIncident() {
  const abortRef = useRef<AbortController | null>(null);
  const clearTrace = useDashboardStore((s) => s.clearTrace);
  const setIsStreaming = useDashboardStore((s) => s.setIsStreaming);
  const setGatewayStatus = useDashboardStore((s) => s.setGatewayStatus);

  const resolve = async (payload: IncidentPayload) => {
    abortRef.current?.abort();
    clearTrace();
    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const correlationId = generateCorrelationId();

    try {
      const response = await fetch('/api/gateway/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const body = await response.text().catch(() => 'Unknown error');
        throw new GatewayError(response.status, body);
      }

      setGatewayStatus('ACTIVE');

    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      const isClientError = err instanceof GatewayError && err.status >= 400 && err.status < 500;
      if (!isClientError) {
        setGatewayStatus('OFFLINE');
      }

      const errorMessage = err instanceof GatewayError
        ? `Resolve failed: ${err.message || err.status}`
        : 'Gateway unreachable. Check service status.';
      toast.error(errorMessage);

      console.error('[resolve:error]', err);
    }
  };

  return { resolve, abort: () => abortRef.current?.abort() };
}
