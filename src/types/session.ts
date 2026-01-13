/**
 * Session entity representing a conversation with Claude
 */
export interface Session {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  messageCount: number;
  totalCostUsd: number;
  lastModel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Data transfer object for creating a session
 */
export interface CreateSessionData {
  id?: string; // Optional custom ID
  metadata?: Record<string, unknown>;
}
