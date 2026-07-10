# Service Discovery — OSAI

## Service Endpoints (Local Development)

| Service              | URL                             | Port  | Container Name       |
|----------------------|---------------------------------|-------|----------------------|
| Admin UI             | http://localhost:3000            | 3000  | `osai-admin-ui`      |
| MS AI-Data-Model     | http://localhost:3002            | 3002  | `osai-ai-data-model` |
| MS AI-Agents         | http://localhost:3001            | 3001  | `osai-ai-agents`     |
| Neo4j Browser        | http://localhost:7474            | 7474  | `osai-neo4j`         |
| Neo4j Bolt           | bolt://localhost:7687            | 7687  | `osai-neo4j`         |
| Ollama API           | http://localhost:11434           | 11434 | `osai-ollama`        |
| Grafana              | http://localhost:3333            | 3333  | `osai-grafana`       |
| Prometheus           | http://localhost:9090            | 9090  | `osai-prometheus`    |
| Loki                 | http://localhost:3100            | 3100  | `osai-loki`          |
| Alloy UI             | http://localhost:12345           | 12345 | `osai-alloy`         |

## Health Endpoints

| Service          | Health Check URL            |
|------------------|-----------------------------|
| MS AI-Data-Model | `GET /health` on port 3002  |
| MS AI-Agents     | `GET /health` on port 3001  |
| Admin UI         | `GET /` on port 3000        |

## Metrics Endpoints

| Service          | Metrics URL                  |
|------------------|------------------------------|
| MS AI-Data-Model | `GET /metrics` on port 3002  |
| MS AI-Agents     | `GET /metrics` on port 3001  |

## Network

All services run on the `osai_default` Docker network when started via `docker-compose.orchestration.yml`.
