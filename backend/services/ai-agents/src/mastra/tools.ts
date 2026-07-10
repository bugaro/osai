import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { PolicyProvider } from '../application/ports/PolicyProvider.js';
import type { TransactionExecutor } from '../application/ports/TransactionExecutor.js';
import type { DataModelClient } from '../infrastructure/clients/DataModelClient.js';
import type { AnyToolAction } from '../types.js';
import { TraceEventType } from '../domain/enums/TraceEventType.js';
import { getCorrelationId } from '../infrastructure/observability/correlation.js';
import { ValidationError } from '../domain/errors/ValidationError.js';

export interface GetDeliveryPolicyInput {
  location: string;
  tier: string;
}

export function createGetDeliveryPolicy(policyProvider: PolicyProvider) {
  return {
    execute: async (input: GetDeliveryPolicyInput): Promise<Record<string, unknown>> => {
      const frame = await policyProvider.getPolicyFrame(input.location, input.tier);
      return {
        baseRefund: frame.baseRefund,
        primeBonus: frame.primeBonus,
        ceiling: frame.ceiling,
      };
    },
  };
}

export interface IssueDeliveryVoucherInput {
  amount: number;
}

export function createIssueDeliveryVoucher(
  transactionExecutor: TransactionExecutor,
  location: string,
  tier: string,
) {
  return {
    execute: async (input: IssueDeliveryVoucherInput): Promise<Record<string, unknown>> => {
      if (typeof input.amount !== 'number' || Number.isNaN(input.amount) || input.amount < 0) {
        throw new ValidationError('amount must be a non-negative number');
      }
      const result = await transactionExecutor.execute(input.amount, location, tier);
      if (result.status === 'executed') {
        return { status: 'success' };
      }
      return {
        status: 'rejected',
        violatedInvariant: result.violatedInvariant,
        attemptedValue: result.attemptedValue,
        maxAllowed: result.maxAllowed,
      };
    },
  };
}

function makeTraceEvent(
  type: TraceEventType,
  payload: Record<string, unknown>,
): { type: TraceEventType; payload: Record<string, unknown>; timestamp: string; correlationId: string } {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    correlationId: getCorrelationId() || 'unknown',
  };
}

export function createMastraTools(dataModelClient: DataModelClient): Record<string, AnyToolAction> {
  const pushEvent = (type: TraceEventType, payload: Record<string, unknown>) => {
    dataModelClient.push(makeTraceEvent(type, payload)).catch(() => {});
  };

  const getDeliveryPolicyTool = createTool({
    id: 'getDeliveryPolicy',
    description: 'Get the delivery policy frame for a given location and client tier',
    inputSchema: z.object({
      location: z.string(),
      tier: z.string(),
    }),
    execute: async ({ location, tier }: { location: string; tier: string }) => {
      pushEvent(TraceEventType.ToolCall, { tool: 'getDeliveryPolicy', args: { location, tier } });
      const appTool = createGetDeliveryPolicy(dataModelClient);
      const result = await appTool.execute({ location, tier });
      pushEvent(TraceEventType.ToolResult, result as Record<string, unknown>);
      return result;
    },
  });

  const issueDeliveryVoucherTool = createTool({
    id: 'issueDeliveryVoucher',
    description: 'Issue a delivery voucher for a given compensation amount',
    inputSchema: z.object({
      amount: z.number().nonnegative(),
      location: z.string(),
      tier: z.string(),
    }),
    execute: async ({ amount, location, tier }: { amount: number; location: string; tier: string }) => {
      pushEvent(TraceEventType.ToolCall, { tool: 'issueDeliveryVoucher', args: { amount, location, tier } });
      const appTool = createIssueDeliveryVoucher(dataModelClient, location, tier);
      const result = await appTool.execute({ amount });
      pushEvent(TraceEventType.ToolResult, result as Record<string, unknown>);
      return result;
    },
  });

  return {
    getDeliveryPolicy: getDeliveryPolicyTool as unknown as AnyToolAction,
    issueDeliveryVoucher: issueDeliveryVoucherTool as unknown as AnyToolAction,
  };
}
