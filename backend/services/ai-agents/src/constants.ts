export const SERVICE_NAME = 'ms-ai-agents';

export const HEADER_CORRELATION_ID = 'x-correlation-id';
export const HEADER_CONTENT_TYPE = 'Content-Type';
export const MEDIA_TYPE_JSON = 'application/json';

export const ROUTE_HEALTH = '/health';
export const ROUTE_METRICS = '/metrics';
export const ROUTE_RESOLVE = '/api/agents/resolve';

export const API_POLICY = '/api/policy';
export const API_TRANSACTION = '/api/transaction';
export const API_EVENTS = '/api/events';

export const AGENT_ID = 'deliveryAgent';
export const AGENT_NAME = 'Delivery Agent';
export const AGENT_MODEL = 'ollama/qwen2.5:3b';

export const OLLAMA_GATEWAY_ID = 'ollama';
export const OLLAMA_GATEWAY_NAME = 'Ollama';
export const OLLAMA_DEFAULT_MODEL = 'qwen2.5:3b';
export const OLLAMA_DEFAULT_API_KEY = 'ollama';
export const OLLAMA_API_KEY_ENV_VAR = 'OLLAMA_API_KEY';

export const STORAGE_ID = 'mastra-storage';
export const STORAGE_MEMORY_URL = ':memory:';

export const MEMORY_LAST_MESSAGES = 5;

export const ERROR_TYPE_VALIDATION = 'ValidationError';
export const ERROR_TYPE_INTERNAL = 'InternalError';

export const RESULT_SUCCESS = 'success';
export const RESULT_ERROR = 'error';
export const RESULT_VALIDATION_ERROR = 'validation_error';

export const METRIC_HTTP_REQUESTS_TOTAL = 'http_requests_total';
export const METRIC_HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds';
export const METRIC_AGENT_RESOLUTION_TOTAL = 'agent_resolution_total';
export const METRIC_AGENT_RESOLUTION_DURATION_SECONDS = 'agent_resolution_duration_seconds';
export const METRIC_AGENT_INPUT_TOKENS = 'agent_input_tokens_total';
export const METRIC_AGENT_OUTPUT_TOKENS = 'agent_output_tokens_total';
export const METRIC_GEN_AI_CLIENT_TOKEN_USAGE = 'gen_ai_client_token_usage';
export const METRIC_GEN_AI_INVOKE_AGENT_DURATION = 'gen_ai_invoke_agent_duration';

export const STATUS_ACCEPTED = 'accepted';
export const STATUS_OK = 'ok';

export const ENV_AI_DATA_MODEL_URL = 'AI_DATA_MODEL_URL';
export const ENV_AI_AGENTS_PORT = 'AI_AGENTS_PORT';
export const ENV_OTEL_SERVICE_NAME = 'OTEL_SERVICE_NAME';
export const ENV_OTEL_EXPORTER_OTLP_ENDPOINT = 'OTEL_EXPORTER_OTLP_ENDPOINT';
export const ENV_OLLAMA_BASE_URL = 'OLLAMA_BASE_URL';
export const ENV_OLLAMA_MODELS = 'OLLAMA_MODELS';
export const ENV_LOG_LEVEL = 'LOG_LEVEL';

export const DEFAULT_OLLAMA_BASE_URL = 'http://ollama:11434/v1';
export const DEFAULT_OTEL_ENDPOINT = 'http://alloy:4317';
export const DEFAULT_LOG_LEVEL = 'info';
