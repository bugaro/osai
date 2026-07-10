import { create } from 'zustand';
import type { TraceEntry, GraphTopology } from '../types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface DashboardState {
  /** Execution trace log — capped at MAX_TRACE_ENTRIES (200) entries (FIFO) */
  traceLog: TraceEntry[];
  appendTraceEntry: (entry: TraceEntry) => void;
  clearTrace: () => void;

  /** Gateway connectivity */
  gatewayStatus: 'ACTIVE' | 'OFFLINE';
  setGatewayStatus: (status: 'ACTIVE' | 'OFFLINE') => void;

  /** Rules synchronization state */
  rulesStatus: 'SYNCED' | 'PENDING';
  setRulesStatus: (status: 'SYNCED' | 'PENDING') => void;

  /** Knowledge graph topology from GET /api/graph */
  graphData: GraphTopology | null;
  setGraphData: (data: GraphTopology) => void;

  /** SSE stream active flag */
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  /** Incremented by useSyncRules to signal useGraphData to refetch */
  graphRefetchToken: number;
  incrementGraphRefetchToken: () => void;

  /** Persistent SSE event stream connection health (GET /api/events) */
  isEventStreamConnected: boolean;
  setEventStreamConnected: (v: boolean) => void;
}

/** Maximum number of trace log entries retained in memory */
export const MAX_TRACE_ENTRIES = 200;

// ---------------------------------------------------------------------------
// Dashboard store — Zustand global state for OSAI Admin UI
// ---------------------------------------------------------------------------
export const useDashboardStore = create<DashboardState>()((set) => ({
  traceLog: [],
  appendTraceEntry: (entry: TraceEntry) => {
    set((state) => {
      const next = [...state.traceLog, entry];
      return {
        traceLog: next.length > MAX_TRACE_ENTRIES
          ? next.slice(next.length - MAX_TRACE_ENTRIES)
          : next,
      };
    });
  },
  clearTrace: () => {
    set({ traceLog: [] });
  },

  gatewayStatus: 'ACTIVE',
  setGatewayStatus: (status: 'ACTIVE' | 'OFFLINE') => {
    set({ gatewayStatus: status });
  },

  rulesStatus: 'PENDING',
  setRulesStatus: (status: 'SYNCED' | 'PENDING') => {
    set({ rulesStatus: status });
  },

  graphData: null,
  setGraphData: (data: GraphTopology) => {
    set({ graphData: data });
  },

  isStreaming: false,
  setIsStreaming: (v: boolean) => {
    set({ isStreaming: v });
  },

  graphRefetchToken: 0,
  incrementGraphRefetchToken: () => {
    set((state) => ({ graphRefetchToken: state.graphRefetchToken + 1 }));
  },

  isEventStreamConnected: false,
  setEventStreamConnected: (v: boolean) => {
    set({ isEventStreamConnected: v });
  },
}));

