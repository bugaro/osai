'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useResolveIncident } from '../model/useResolveIncident';
import { useDashboardStore } from '@/shared/store/dashboardStore';
import type { ClientTier } from '@/shared/types';

const FORM_DEFAULTS = {
  USER_ID: 'OSAI-7729-QX',
  TIER: 'Prime' as ClientTier,
  LOCATION: 'Poznan',
  DELAY_MINUTES: 45,
} as const;

const DELIVERY_ZONES = ['Poznan', 'Berlin', 'Warsaw'] as const;
const CLIENT_TIERS: ClientTier[] = ['Standard', 'Prime', 'Enterprise'];

export function IncidentForm() {
  const [userId, setUserId] = useState<string>(FORM_DEFAULTS.USER_ID);
  const [tier, setTier] = useState<ClientTier>(FORM_DEFAULTS.TIER);
  const [location, setLocation] = useState<string>(FORM_DEFAULTS.LOCATION);
  const [delayMinutes, setDelayMinutes] = useState<number>(FORM_DEFAULTS.DELAY_MINUTES);
  const [errors, setErrors] = useState<{ userId?: string; delayMinutes?: string }>({});

  const { resolve } = useResolveIncident();
  const isStreaming = useDashboardStore((s) => s.isStreaming);
  const graphData = useDashboardStore((s) => s.graphData);
  const isGraphEmpty = !graphData || graphData.nodes.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!userId.trim()) {
      newErrors.userId = 'User Identifier is required';
    }
    if (delayMinutes <= 0) {
      newErrors.delayMinutes = 'Must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isGraphEmpty) return;

    setErrors({});
    resolve({
      userId,
      tier,
      location,
      delayMinutes,
    });
  };

  return (
    <div className="bg-[#0E1424] border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
      {/* CardHeader */}
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-emerald-400" />
        <h3 className="font-semibold text-sm text-white">
          Incident Resolution
        </h3>
      </div>

      {/* CardContent */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {/* User ID */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium">
              User Identifier
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-black/20 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              disabled={isStreaming}
            />
            {errors.userId && (
              <span className="text-[10px] text-red-400 font-mono">{errors.userId}</span>
            )}
          </div>

          {/* Client Tier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium">
              Client Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as ClientTier)}
              className="w-full bg-black/20 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-mono"
              disabled={isStreaming}
            >
              {CLIENT_TIERS.map((t) => (
                <option key={t} value={t} className="bg-[#0E1424]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Zone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium">
              Delivery Zone
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-black/20 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer font-mono"
              disabled={isStreaming}
            >
              {DELIVERY_ZONES.map((zone) => (
                <option key={zone} value={zone} className="bg-[#0E1424]">
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Delay Minutes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs font-medium">
              Delay Minutes
            </label>
            <input
              type="number"
              min="1"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-black/20 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              disabled={isStreaming}
            />
            {errors.delayMinutes && (
              <span className="text-[10px] text-red-400 font-mono">{errors.delayMinutes}</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isStreaming || isGraphEmpty}
          title={isGraphEmpty ? 'Sync operational rules first' : ''}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
<Zap className="h-4 w-4" />
          Resolve Incident
        </button>
      </form>
    </div>
  );
}
