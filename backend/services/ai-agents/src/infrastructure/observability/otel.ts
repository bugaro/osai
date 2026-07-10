import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { SERVICE_NAME, ENV_OTEL_SERVICE_NAME, ENV_OTEL_EXPORTER_OTLP_ENDPOINT, DEFAULT_OTEL_ENDPOINT } from '../../constants.js';

const sdk = new NodeSDK({
  serviceName: process.env[ENV_OTEL_SERVICE_NAME] || SERVICE_NAME,
  traceExporter: new OTLPTraceExporter({
    url: process.env[ENV_OTEL_EXPORTER_OTLP_ENDPOINT] || DEFAULT_OTEL_ENDPOINT,
  }),
  instrumentations: [new HttpInstrumentation()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .catch(() => {});
});
