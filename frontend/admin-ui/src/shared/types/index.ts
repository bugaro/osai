/**
 * Shared domain types for the OSAI Admin UI.
 * These are pure TypeScript interfaces — no framework dependency.
 */

// ---------------------------------------------------------------------------
// TraceEntry — represents one notification line in the SSE execution stream
// The backend AI-Data-Model transforms raw TraceEvents into this format
// before publishing to the SSE stream.
// ---------------------------------------------------------------------------
export type TraceEntrySeverity = 'info' | 'warn' | 'error' | 'log' | 'success';

export interface TraceEntry {
  /** Unique identifier for this log entry */
  id: string;
  /** HH:MM:SS timestamp */
  timestamp: string;
  /** Severity controls UI color */
  severity: TraceEntrySeverity;
  /** Short title describing the event type */
  title: string;
  /** Human-readable log message */
  message: string;
}

// ---------------------------------------------------------------------------
// GraphTopology — shape of GET /api/graph response
// ---------------------------------------------------------------------------
export type GraphNodeType = 'zone' | 'tier' | 'limit' | 'voucher';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
}

export interface GraphTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// IncidentPayload — Input DTO for POST /api/resolve
// ---------------------------------------------------------------------------
export type ClientTier = 'Standard' | 'Prime' | 'Enterprise';

export interface IncidentPayload {
  userId: string;
  tier: ClientTier;
  location: string;
  delayMinutes: number;
}

// ---------------------------------------------------------------------------
// SyncResponse — POST /api/sync
// ---------------------------------------------------------------------------
export interface SyncResponse {
  rulesCount: number;
}

// ---------------------------------------------------------------------------
// Validation result helper
// ---------------------------------------------------------------------------
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Domain Errors
// ---------------------------------------------------------------------------
export abstract class DomainError extends Error {
  public abstract readonly name: string;
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly name = 'ValidationError';
}

export class NotFoundError extends DomainError {
  public readonly name = 'NotFoundError';
}

export class ConflictError extends DomainError {
  public readonly name = 'ConflictError';
}

export class AuthorizationError extends DomainError {
  public readonly name = 'AuthorizationError';
}

export class InvalidOperationError extends DomainError {
  public readonly name = 'InvalidOperationError';
}

