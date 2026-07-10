import { Hono } from 'hono';
import { z } from 'zod';
import { IncidentPayload } from '../../domain/IncidentPayload.js';
import { ValidationError } from '../../domain/errors/ValidationError.js';
import { NotFoundError } from '../../domain/errors/NotFoundError.js';
import { runWithCorrelationId } from '../../infrastructure/observability/correlation.js';
import { logger } from '../../infrastructure/observability/logger.js';
import { agentResolutionTotal, agentResolutionDurationSeconds, agentInputTokensTotal, agentOutputTokensTotal, genAiClientTokenUsage, genAiInvokeAgentDuration } from '../../infrastructure/observability/metrics.js';
import type { Mastra } from '@mastra/core';
import type { DataModelClient } from '../../infrastructure/clients/DataModelClient.js';
import type { TraceEvent } from '../../domain/TraceEvent.js';
import { TraceEventType } from '../../domain/enums/TraceEventType.js';
import {
  ROUTE_RESOLVE,
  HEADER_CORRELATION_ID,
  ERROR_TYPE_VALIDATION,
  ERROR_TYPE_INTERNAL,
  RESULT_SUCCESS,
  RESULT_ERROR,
  RESULT_VALIDATION_ERROR,
  STATUS_ACCEPTED,
  AGENT_ID,
} from '../../constants.js';

const resolveBodySchema = z.object({
  userId: z.string().min(1),
  tier: z.string().min(1),
  location: z.string().min(1),
  delayMinutes: z.number().nonnegative(),
});

export function createResolveApp(mastra: Mastra, dataModelClient: DataModelClient) {
  const app = new Hono();

  app.post(ROUTE_RESOLVE, async (c) => {
    const correlationId = c.req.header(HEADER_CORRELATION_ID) || crypto.randomUUID();

    return runWithCorrelationId(correlationId, async () => {
      try {
        const body = await c.req.json();
        const parsed = resolveBodySchema.parse(body);

        const payload = IncidentPayload.create(
          parsed.userId,
          parsed.tier,
          parsed.location,
          parsed.delayMinutes,
        );

        logger.info({ msg: 'Resolution started', incident: { userId: payload.userId, tier: payload.tier, location: payload.location, delayMinutes: payload.delayMinutes } });

        const startTime = performance.now();

        resolveIncident(mastra, dataModelClient, payload, correlationId)
          .then((result) => {
            const duration = (performance.now() - startTime) / 1000;
            agentResolutionDurationSeconds.observe(duration);
            genAiInvokeAgentDuration.observe({ gen_ai_agent_name: AGENT_ID, error_type: '' }, duration);
            agentResolutionTotal.inc({ result: result.status });
            const promptTokens = result.usage?.inputTokens ?? Math.round(result.estimatedPromptChars / 4);
            const outputTokens = result.usage?.outputTokens ?? Math.round(result.estimatedOutputChars / 4);
            if (promptTokens > 0) agentInputTokensTotal.inc(promptTokens);
            if (outputTokens > 0) agentOutputTokensTotal.inc(outputTokens);
            if (promptTokens > 0) genAiClientTokenUsage.observe({ gen_ai_token_type: 'input' }, promptTokens);
            if (outputTokens > 0) genAiClientTokenUsage.observe({ gen_ai_token_type: 'output' }, outputTokens);
            logger.info({ msg: 'Resolution completed', result: result.status, duration, promptTokens, outputTokens });
          })
          .catch((error) => {
            const duration = (performance.now() - startTime) / 1000;
            agentResolutionTotal.inc({ result: RESULT_ERROR });
            genAiInvokeAgentDuration.observe({ gen_ai_agent_name: AGENT_ID, error_type: RESULT_ERROR }, duration);
            logger.error({ msg: 'Resolution failed', error: String(error) });
          });

        c.res.headers.set(HEADER_CORRELATION_ID, correlationId);
        return c.json({ status: STATUS_ACCEPTED }, 202);
      } catch (error) {
        if (error instanceof ValidationError || error instanceof z.ZodError) {
          agentResolutionTotal.inc({ result: RESULT_VALIDATION_ERROR });
          c.res.headers.set(HEADER_CORRELATION_ID, correlationId);
          return c.json({ error: ERROR_TYPE_VALIDATION, message: error instanceof ValidationError ? error.message : 'Invalid request body' }, 400);
        }
        agentResolutionTotal.inc({ result: RESULT_ERROR });
        logger.error({ msg: 'Unexpected error in resolve handler', error: String(error) });
        c.res.headers.set(HEADER_CORRELATION_ID, correlationId);
        return c.json({ error: ERROR_TYPE_INTERNAL, message: 'An unexpected error occurred' }, 500);
      }
    });
  });

  return app;
}

function pushTraceEvent(
  dataModelClient: DataModelClient,
  type: TraceEventType,
  payload: Record<string, unknown>,
  correlationId: string,
): void {
  const event: TraceEvent = { type, payload, timestamp: new Date().toISOString(), correlationId };
  dataModelClient.push(event).catch((err) => {
    logger.warn({ msg: 'Failed to push trace event', error: String(err), eventType: type });
  });
}

async function resolveIncident(
  mastra: Mastra,
  dataModelClient: DataModelClient,
  payload: IncidentPayload,
  correlationId: string,
): Promise<{ status: string; usage?: { inputTokens: number; outputTokens: number; totalTokens: number }; estimatedPromptChars: number; estimatedOutputChars: number }> {
  try {
    const agent = mastra.getAgent(AGENT_ID);
    if (!agent) {
      throw new NotFoundError('Delivery agent not found');
    }

    const prompt = `Resolve delivery incident for user ${payload.userId}:
- Tier: ${payload.tier}
- Location: ${payload.location}
- Delay: ${payload.delayMinutes} minutes

Calculate appropriate compensation and issue a delivery voucher.`;

    pushTraceEvent(dataModelClient, TraceEventType.Reasoning, {
      step: 'Analyzing incident',
      thought: `Checking policy for ${payload.location} zone, tier ${payload.tier}`,
    }, correlationId);

    const response = await agent.generate(prompt);

    const finalPayload: Record<string, unknown> = {
      userId: payload.userId,
      tier: payload.tier,
      location: payload.location,
      delayMinutes: payload.delayMinutes,
    };
    if (response?.text) {
      finalPayload.reason = response.text;
    }

    pushTraceEvent(dataModelClient, TraceEventType.FinalAnswer, finalPayload, correlationId);

    const result: {
      status: string;
      usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
      estimatedPromptChars: number;
      estimatedOutputChars: number;
    } = {
      status: RESULT_SUCCESS,
      estimatedPromptChars: prompt.length,
      estimatedOutputChars: response?.text?.length ?? 0,
    };
    if (response?.usage) {
      result.usage = {
        inputTokens: response.usage.inputTokens ?? 0,
        outputTokens: response.usage.outputTokens ?? 0,
        totalTokens: response.usage.totalTokens ?? 0,
      };
    }
    return result;
  } catch (error) {
    pushTraceEvent(dataModelClient, TraceEventType.SecurityViolation, {
      error: String(error),
    }, correlationId);

    throw error;
  }
}
