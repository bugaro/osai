import neo4j, { Driver } from 'neo4j-driver';
import { loadNeo4jConfig, type Neo4jConfig } from './Neo4jConfig.js';

let driver: Driver | null = null;
let config: Neo4jConfig;

export function getNeo4jConfig(): Neo4jConfig {
  if (!config) {
    config = loadNeo4jConfig();
  }
  return config;
}

export function getDriver(): Driver {
  if (!driver) {
    const cfg = getNeo4jConfig();
    driver = neo4j.driver(cfg.uri, neo4j.auth.basic(cfg.username, cfg.password), {
      maxConnectionPoolSize: cfg.maxConnectionPoolSize,
    });
  }
  return driver;
}

export async function disconnectDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const d = getDriver();
    const session = d.session();
    await session.run('RETURN 1');
    await session.close();
    return true;
  } catch {
    return false;
  }
}
