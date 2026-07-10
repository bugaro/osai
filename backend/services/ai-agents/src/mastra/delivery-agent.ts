import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import type { MastraCompositeStore } from '@mastra/core/storage';
import type { AnyToolAction } from '../types.js';
import {
  AGENT_ID,
  AGENT_NAME,
  AGENT_MODEL,
  MEMORY_LAST_MESSAGES,
} from '../constants.js';

export function createDeliveryAgent(
  tools: Record<string, AnyToolAction>,
  storage?: MastraCompositeStore,
): Agent {
  return new Agent({
    id: AGENT_ID,
    name: AGENT_NAME,
    instructions: `You are a delivery compensation agent for OSAI.

Your role is to autonomously resolve delivery incidents by following these steps:

1. First, call getDeliveryPolicy with the location and tier to fetch the policy frame.
2. Calculate the compensation: baseRefund + (primeBonus if tier is Prime).
3. Ensure the calculated amount does not exceed the ceiling.
4. Call issueDeliveryVoucher with the calculated amount, location, and tier.
5. If the voucher is rejected, adjust the amount to the maxAllowed and retry.
6. Provide a final answer with the resolution details.`,
    model: AGENT_MODEL,
    tools,
    ...(storage
      ? {
          memory: new Memory({
            storage,
            options: {
              lastMessages: MEMORY_LAST_MESSAGES,
              workingMemory: { enabled: true },
            },
          }),
        }
      : {}),
  });
}
