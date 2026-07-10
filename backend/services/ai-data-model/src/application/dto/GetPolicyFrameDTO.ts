export interface GetPolicyFrameInput {
  location: string;
  tier: string;
}

export interface GetPolicyFrameOutput {
  baseRefund: number;
  primeBonus: number;
  ceiling: number;
}
