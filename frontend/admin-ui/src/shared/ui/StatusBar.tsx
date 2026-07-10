'use client';

import { Radar, Database } from 'lucide-react';
import { useDashboardStore } from '@/shared/store/dashboardStore';

/**
 * StatusBar — system health footer.
 *
 * Displays GW (gateway), RULES, and SEC indicators pulled live from
 * the Zustand dashboard store.
 */
export default function StatusBar() {
  const gatewayStatus = useDashboardStore((s) => s.gatewayStatus);
  const rulesStatus = useDashboardStore((s) => s.rulesStatus);

  return (
    <footer className="w-full bg-[#070A12] border-t border-slate-800 px-6 py-3 flex gap-6 text-xs font-mono text-slate-400">
      {/* Gateway indicator */}
      <div className="flex items-center gap-2">
        <Radar
          className={`h-4 w-4 ${gatewayStatus === 'ACTIVE' ? 'text-emerald-400' : 'text-red-500'}`}
        />
        <span>GW: {gatewayStatus}</span>
      </div>

      {/* Rules indicator */}
      <div className="flex items-center gap-2">
        <Database
          className={`h-4 w-4 ${rulesStatus === 'SYNCED' ? 'text-emerald-400' : 'text-amber-500'}`}
        />
        <span>RULES: {rulesStatus}</span>
      </div>
    </footer>
  );
}
