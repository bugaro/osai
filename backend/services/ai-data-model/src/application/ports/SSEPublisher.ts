export interface SSEClient {
  id: string;
  send(data: Record<string, unknown>): void;
}

export interface SSEPublisher {
  publish(data: Record<string, unknown>): void;
  connect(client: SSEClient): void;
  disconnect(clientId: string): void;
}
