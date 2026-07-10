'use client';

import { useDashboardStore, MAX_TRACE_ENTRIES } from '@/shared/store/dashboardStore';
import type { TraceEntry } from '@/shared/types';

export function TraceTerminal() {
  const traceLog = useDashboardStore((s) => s.traceLog);
  const isStreaming = useDashboardStore((s) => s.isStreaming);
  const isEventStreamConnected = useDashboardStore((s) => s.isEventStreamConnected);
  const clearTrace = useDashboardStore((s) => s.clearTrace);

  const getSeverityColor = (severity: TraceEntry['severity']) => {
    switch (severity) {
      case 'error':   return 'text-red-400 font-bold';
      case 'warn':    return 'text-amber-400';
      case 'info':    return 'text-blue-400';
      case 'log':     return 'text-slate-400';
      case 'success': return 'text-emerald-400 font-semibold';
    }
  };

  return (
    <div className="bg-[#0E1424] border border-slate-800 rounded-xl p-5 h-[300px] lg:h-[600px] flex flex-col gap-4">
      {/* CardHeader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${(isStreaming || isEventStreamConnected) ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <h3 className="font-semibold text-sm text-white">
            Agent Execution Trace
          </h3>
        </div>
        <button
          onClick={clearTrace}
          className="font-mono text-[10px] uppercase text-slate-400 hover:text-white transition-colors bg-slate-900 px-2.5 py-1 rounded border border-slate-700"
        >
          Clear Log
        </button>
      </div>

      {/* Log Screen */}
      <div
        className="flex-1 border rounded-lg p-4 font-mono text-xs overflow-y-auto leading-relaxed text-emerald-400 flex flex-col gap-1 transition-all bg-black/50 border-slate-900"
      >
        {traceLog.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            {isStreaming || isEventStreamConnected ? 'Stream initiating...' : 'Awaiting execution trace...'}
          </div>
        ) : (
          traceLog.map((entry) => (
            <div key={entry.id} className="flex gap-2 items-start">
              <span className="text-[10px] text-slate-600 select-none pt-0.5 font-mono">
                [{entry.timestamp}]
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  {entry.title}
                </span>
                <span className={`${getSeverityColor(entry.severity)} break-words whitespace-pre-wrap`}>
                  {entry.message}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase border-t border-slate-800/60 pt-2">
        <span>LOGS: {traceLog.length} / {MAX_TRACE_ENTRIES}</span>
        <span>STATUS: {(isStreaming || isEventStreamConnected) ? 'STREAMING' : 'IDLE'}</span>
      </div>
    </div>
  );
}
