import { DomainError } from '../types';
import type { GraphTopology, SyncResponse, GraphNode, GraphEdge } from '../types';

/**
 * Typed domain error for all gateway communication failures.
 */
export class GatewayError extends DomainError {
  public readonly name = 'GatewayError';

  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const BASE_URL =
  typeof window !== 'undefined'
    ? '/api/gateway'
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/gateway');

/**
 * Sends the given policy content to the rule sync endpoint.
 */
export async function syncRules(
  content: string,
  correlationId: string,
): Promise<SyncResponse> {
  try {
    const response = await fetch(`${BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify({ rules: content }),
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (_) {
        errorText = response.statusText || 'Unknown error';
      }
      throw new GatewayError(response.status, errorText);
    }

    return (await response.json()) as SyncResponse;
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[gateway] error', { status: 0, message, correlationId });
    throw new GatewayError(0, 'Network unreachable');
  }
}

function isGraphNode(node: unknown): node is GraphNode {
  return (
    node !== null &&
    typeof node === 'object' &&
    'id' in node &&
    'label' in node &&
    'type' in node
  );
}

function isGraphEdge(edge: unknown): edge is GraphEdge {
  return (
    edge !== null &&
    typeof edge === 'object' &&
    'source' in edge &&
    'target' in edge &&
    'label' in edge
  );
}

/**
 * Fetches the current knowledge graph topology from the backend.
 */
export async function fetchGraph(): Promise<GraphTopology> {
  try {
    const response = await fetch(`${BASE_URL}/graph`, {
      method: 'GET',
    });

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (_) {
        errorText = response.statusText || 'Unknown error';
      }
      throw new GatewayError(response.status, errorText);
    }

    const data = await response.json();
    const nodes = (Array.isArray(data.nodes) ? data.nodes : []).filter(isGraphNode);
    const edges = (Array.isArray(data.edges) ? data.edges : []).filter(isGraphEdge);

    return { nodes, edges };
  } catch (err) {
    if (err instanceof GatewayError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[gateway] error', { status: 0, message });
    throw new GatewayError(0, 'Network unreachable');
  }
}
