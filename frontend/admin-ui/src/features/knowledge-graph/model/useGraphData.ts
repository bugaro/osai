'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import { fetchGraph } from '@/shared/api/gatewayClient';

export function useGraphData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphRefetchToken = useDashboardStore((s) => s.graphRefetchToken);
  const setGraphData = useDashboardStore((s) => s.setGraphData);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const topology = await fetchGraph();
      setGraphData(topology);
    } catch (err) {
      setError('Failed to load graph topology');
      console.error('[graphData:error]', err);
    } finally {
      setIsLoading(false);
    }
  }, [setGraphData]);

  // Fetch on mount and on every refetch token increment
  useEffect(() => {
    load();
  }, [load, graphRefetchToken]);

  return { isLoading, error, refetch: load };
}
