export const SERVICE_NAME = 'ms-ai-data-model';

export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_CONTENT_TYPE = 'Content-Type';
export const MEDIA_TYPE_JSON = 'application/json';

export const ROUTE_HEALTH = '/health';
export const ROUTE_METRICS = '/metrics';
export const ROUTE_SYNC = '/api/sync';
export const ROUTE_POLICY = '/api/policy';
export const ROUTE_TRANSACTION = '/api/transaction';
export const ROUTE_GRAPH = '/api/graph';
export const ROUTE_RESOLVE = '/api/resolve';
export const ROUTE_EVENTS = '/api/events';

export const REQUEST_TIMEOUT_MS = 180_000;
export const KEEPALIVE_TIMEOUT_MS = 10_000;

export const MAX_RETRIES = 2;
export const BACKOFF_BASE_MS = 100;
export const BACKOFF_FACTOR = 2;
export const BACKOFF_JITTER = 0.5;
export const TEMPERATURE = 0.0;

export const HEARTBEAT_INTERVAL_MS = 30000;
export const SHUTDOWN_DELAY_MS = 5000;
export const DEFAULT_MAX_CLIENTS = 50;

export const SYSTEM_CORRELATION_ID = 'system';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b';
export const DEFAULT_OLLAMA_TIMEOUT_MS = 30000;

export const DEFAULT_NEO4J_URI = 'bolt://localhost:7687';
export const DEFAULT_NEO4J_USER = 'neo4j';
export const DEFAULT_NEO4J_PASSWORD = 'osai_password';
export const DEFAULT_NEO4J_POOL_SIZE = 10;

export const DEFAULT_PORT = 3002;
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_OTLP_ENDPOINT = 'http://alloy:4317';

export const ENV_PORT = 'PORT';
export const ENV_LOG_LEVEL = 'LOG_LEVEL';
export const ENV_NEO4J_URI = 'NEO4J_URI';
export const ENV_NEO4J_USER = 'NEO4J_USER';
export const ENV_NEO4J_PASSWORD = 'NEO4J_PASSWORD';
export const ENV_NEO4J_MAX_POOL_SIZE = 'NEO4J_MAX_POOL_SIZE';
export const ENV_OLLAMA_URL = 'OLLAMA_URL';
export const ENV_OLLAMA_MODEL = 'OLLAMA_MODEL';
export const ENV_OLLAMA_TIMEOUT = 'OLLAMA_TIMEOUT';
export const ENV_AI_AGENTS_URL = 'AI_AGENTS_URL';
export const ENV_SSE_MAX_CLIENTS = 'SSE_MAX_CLIENTS';
export const ENV_OTEL_SERVICE_NAME = 'OTEL_SERVICE_NAME';
export const ENV_OTEL_EXPORTER_OTLP_ENDPOINT = 'OTEL_EXPORTER_OTLP_ENDPOINT';

export const METRIC_HTTP_REQUESTS_TOTAL = 'http_requests_total';
export const METRIC_HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds';
export const METRIC_SSE_EVENTS_PROCESSED_TOTAL = 'sse_events_processed_total';
export const METRIC_SSE_CONNECTIONS_ACTIVE = 'sse_connections_active';
export const METRIC_OLLAMA_INFERENCE_DURATION_SECONDS = 'ollama_inference_duration_seconds';

export const ERROR_TYPE_VALIDATION = 'ValidationError';
export const ERROR_TYPE_INTERNAL = 'InternalError';

export const RESULT_SUCCESS = 'success';
export const RESULT_ERROR = 'error';
export const RESULT_VALIDATION_ERROR = 'validation_error';

export const STATUS_ACCEPTED = 'accepted';
export const STATUS_OK = 'ok';
