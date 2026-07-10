export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30000;
export const MIN_CONNECTED_MS = 150;
export const EVENTS_URL = '/api/gateway/events';

export const GRAPH_CONFIG = {
  HEIGHT: 450,
  DEFAULT_WIDTH: 500,
  LAYER_Y: {
    zone: 0.15,
    tier: 0.42,
    limit: 0.68,
    voucher: 0.90,
  } as const,
  COLORS: {
    DEFAULT_LINE: '#444749',
    PRIME_LINE: '#4edea3',
    ZONE_FILL: '#2d3449',
    ZONE_STROKE: '#8e9193',
    TIER_FILL: '#171f33',
    TIER_STANDARD_STROKE: '#8e9193',
    TIER_PRIME_STROKE: '#4edea3',
    LIMIT_STANDARD_FILL: '#171f33',
    LIMIT_STANDARD_STROKE: '#8e9193',
    LIMIT_PRIME_FILL: 'rgba(78, 222, 163, 0.1)',
    LIMIT_PRIME_STROKE: '#4edea3',
    VOUCHER_FILL: '#131b2e',
    VOUCHER_STROKE: '#4edea3',
    TEXT_FILL: '#dae2fd',
  },
} as const;
