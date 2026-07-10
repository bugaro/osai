import { ClientTier } from '../enums/ClientTier.js';

export interface InvariantContext {
  zone: string;
  tier: ClientTier;
  amount: number;
}
