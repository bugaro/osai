import { Mastra } from '@mastra/core';
import { LibSQLStore } from '@mastra/libsql';
import { Observability } from '@mastra/observability';
import { OtelBridge } from '@mastra/otel-bridge';
import { OllamaGateway } from './gateways/ollama.js';
import type { DataModelClient } from '../infrastructure/clients/DataModelClient.js';
import { createMastraTools } from './tools.js';
import { createDeliveryAgent } from './delivery-agent.js';
import { PinoMastraLogger } from '../infrastructure/observability/mastra-logger.js';
import { SERVICE_NAME, STORAGE_ID, STORAGE_MEMORY_URL } from '../constants.js';

export async function createMastraInstance(dataModelClient: DataModelClient): Promise<Mastra> {
  const tools = createMastraTools(dataModelClient);

  const inMemoryStorage = new LibSQLStore({ id: STORAGE_ID, url: STORAGE_MEMORY_URL });
  const deliveryAgent = createDeliveryAgent(tools, inMemoryStorage);
  const pinoLogger = new PinoMastraLogger();

  const mastra = new Mastra({
    agents: {
      deliveryAgent,
    },
    storage: inMemoryStorage,
    gateways: {
      ollama: new OllamaGateway(),
    },
    tools,
    logger: pinoLogger,
    observability: new Observability({
      configs: {
        default: {
          serviceName: SERVICE_NAME,
          bridge: new OtelBridge(),
        },
      },
    }),
  });

  return mastra;
}
