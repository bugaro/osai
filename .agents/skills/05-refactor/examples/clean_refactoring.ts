// BEFORE REFACTOR (with code smell, magic values, and duplicate types)
/*
function calculateDiscount(user: { id: string; status: string }, amount: number): number {
  if (user.status === "GOLD") {
    return amount * 0.15; // magic value
  } else if (user.status === "SILVER") {
    return amount * 0.05; // magic value
  }
  return 0;
}
*/

// AFTER REFACTOR (clean code, extracted types and constants)
export enum UserTier {
  Gold = "GOLD",
  Silver = "SILVER",
  Regular = "REGULAR"
}

export interface DiscountableUser {
  id: string;
  status: UserTier;
}

const TIER_DISCOUNTS: Record<UserTier, number> = {
  [UserTier.Gold]: 0.15,
  [UserTier.Silver]: 0.05,
  [UserTier.Regular]: 0.00
};

export function calculateDiscount(user: DiscountableUser, amount: number): number {
  const discountRate = TIER_DISCOUNTS[user.status] ?? 0;
  return amount * discountRate;
}
