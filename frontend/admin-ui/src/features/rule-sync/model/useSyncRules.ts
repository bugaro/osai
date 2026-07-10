'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { syncRules, GatewayError } from '@/shared/api/gatewayClient';
import { generateCorrelationId } from '@/shared/lib/correlationId';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import type { SyncResponse } from '@/shared/types';

export function useSyncRules() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setRulesStatus = useDashboardStore((s) => s.setRulesStatus);
  const setGatewayStatus = useDashboardStore((s) => s.setGatewayStatus);
  const incrementGraphRefetchToken = useDashboardStore((s) => s.incrementGraphRefetchToken);

  const sync = async (content: string) => {
    setIsSyncing(true);
    setError(null);
    const correlationId = generateCorrelationId();
    console.log('[sync:start] correlationId=', correlationId);

    try {
      const result = await syncRules(content, correlationId);
      setLastResult(result);
      setRulesStatus('SYNCED');
      setGatewayStatus('ACTIVE');
      incrementGraphRefetchToken();
    } catch (err) {
      const msg = err instanceof GatewayError
        ? `Sync failed: ${err.message || err.status}`
        : 'Gateway unreachable. Check service status.';
      setError(msg);
      setGatewayStatus('OFFLINE');
      toast.error(msg);
      console.error('[sync:error]', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return { isSyncing, lastResult, error, sync };
}
