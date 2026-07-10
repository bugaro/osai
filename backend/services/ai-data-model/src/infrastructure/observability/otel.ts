import { NodeSDK, resources } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SERVICE_NAME, DEFAULT_OTLP_ENDPOINT, ENV_OTEL_SERVICE_NAME, ENV_OTEL_EXPORTER_OTLP_ENDPOINT } from '../../constants.js';

const traceExporter = new OTLPTraceExporter({
  url: process.env[ENV_OTEL_EXPORTER_OTLP_ENDPOINT] || DEFAULT_OTLP_ENDPOINT,
});

const sdk = new NodeSDK({
  resource: resources.resourceFromAttributes({
    'service.name': process.env[ENV_OTEL_SERVICE_NAME] || SERVICE_NAME,
  }),
  traceExporter,
  instrumentations: [new HttpInstrumentation()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(() => {});
});
