'use client';

import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { useSyncRules } from '../model/useSyncRules';

const DEFAULT_RULES = `1. In Poznan, a delivery delay >20m triggers a 5.00 EUR base compensation, increasing to 10.00 EUR for Prime clients, capped at a 15.00 EUR hard ceiling.
2. All automated operations and financial compensation thresholds are locked to the Poznan zone boundary.`;

export function SyncPanel() {
  const [content, setContent] = useState(DEFAULT_RULES);
  const { isSyncing, sync } = useSyncRules();

  const lineCount = Math.max(1, content.split('\n').length);

  const handleSync = () => {
    sync(content);
  };

  return (
    <div className="bg-[#0E1424] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* CardHeader */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <h3 className="font-semibold text-sm text-white">
            Rule Synchronization
          </h3>
        </div>
        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
          LINES: {lineCount}
        </span>
      </div>

      {/* CardContent */}
      <div className="flex flex-col gap-4">
        <textarea
          readOnly
          className="w-full h-32 bg-black/40 border border-slate-700 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-emerald-500 transition-all text-slate-100 resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter operational rules..."
          disabled={isSyncing}
        />

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Operational Rules
        </button>
      </div>
    </div>
  );
}
