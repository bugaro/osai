import { PolicyFrame } from '../../domain/PolicyFrame.js';

export interface PolicyProvider {
  getPolicyFrame(location: string, tier: string): Promise<PolicyFrame>;
}
