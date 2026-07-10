export interface IncidentPayload {
  userId: string;
  tier: string;
  location: string;
  delayMinutes: number;
}

export interface AgentClient {
  triggerResolution(incident: IncidentPayload): Promise<void>;
}
