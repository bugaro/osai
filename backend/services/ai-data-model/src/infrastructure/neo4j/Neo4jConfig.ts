import { InvalidOperationError } from '../../domain/errors/InvalidOperationError.js';
import { DEFAULT_NEO4J_POOL_SIZE, ENV_NEO4J_URI, ENV_NEO4J_USER, ENV_NEO4J_PASSWORD, ENV_NEO4J_MAX_POOL_SIZE } from '../../constants.js';

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  maxConnectionPoolSize: number;
}

export function loadNeo4jConfig(): Neo4jConfig {
  const uri = process.env[ENV_NEO4J_URI];
  if (!uri) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_NEO4J_URI}`);
  }
  const username = process.env[ENV_NEO4J_USER];
  if (!username) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_NEO4J_USER}`);
  }
  const password = process.env[ENV_NEO4J_PASSWORD];
  if (!password) {
    throw new InvalidOperationError(`Missing required environment variable: ${ENV_NEO4J_PASSWORD}`);
  }
  return {
    uri,
    username,
    password,
    maxConnectionPoolSize: parseInt(process.env[ENV_NEO4J_MAX_POOL_SIZE] || String(DEFAULT_NEO4J_POOL_SIZE), 10),
  };
}
