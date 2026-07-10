import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { SSEStreamManager } from '../sse/SSEStreamManager.js';
import { ProcessTraceEventUseCase } from '../../application/use-cases/ProcessTraceEventUseCase.js';

export function createEventsRoute(streamManager: SSEStreamManager, processUseCase: ProcessTraceEventUseCase): Hono {
  const route = new Hono();

  route.get('/api/events', (c) => {
    c.header('Content-Type', 'text/event-stream');
    c.header('Cache-Control', 'no-cache');
    c.header('Connection', 'keep-alive');
    return stream(c, async (s) => {
      const client = streamManager.addAdminClient((event) => {
        s.write(`data: ${JSON.stringify(event)}\n\n`);
      });

      c.req.raw.signal.addEventListener('abort', () => {
        streamManager.disconnect(client.id);
      });

      s.onAbort(() => {
        streamManager.disconnect(client.id);
      });

      await new Promise<void>(() => {});
    });
  });

  route.post('/api/events', async (c) => {
    try {
      const body = await c.req.json();
      await processUseCase.execute(body);
      return c.json({ status: 'ok' });
    } catch {
      return c.json({ error: 'ValidationError', message: 'Invalid request body' }, 400);
    }
  });

  return route;
}
