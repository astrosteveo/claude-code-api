import { SessionStore } from '../infrastructure/SessionStore.js';
import { CLIExecutor } from '../infrastructure/CLIExecutor.js';
import { RequestQueue } from '../infrastructure/RequestQueue.js';
import { buildCLIArgs } from '../utils/cliArgs.js';
import type { Session, CreateSessionData } from '../types/session.js';
import type { QueryRequest } from '../types/api.js';
import type { CLIResult, CLIStreamEvent, CLIResultEvent } from '../types/cli.js';

/**
 * SessionService manages conversational sessions with queueing
 */
export class SessionService {
  private store: SessionStore;
  private executor: CLIExecutor;
  private queue: RequestQueue;

  constructor(dbPath: string, cliPath: string = 'claude') {
    this.store = new SessionStore(dbPath);
    this.executor = new CLIExecutor(cliPath);
    this.queue = new RequestQueue();
  }

  /**
   * Initialize the service (creates database tables)
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
  }

  /**
   * Create a new session
   */
  async createSession(data: CreateSessionData = {}): Promise<Session> {
    const session = await this.store.createWithDefaults(data);

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.store.findById(sessionId);
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<Session[]> {
    return this.store.findAll();
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    // Check if session exists
    const exists = await this.store.exists(sessionId);

    if (!exists) {
      throw new Error('Session not found');
    }

    // Clear any pending requests
    this.queue.clear(sessionId);

    // Delete from store
    await this.store.delete(sessionId);
  }

  /**
   * Fork a session (create new session from existing one)
   */
  async forkSession(sourceSessionId: string, newSessionId?: string): Promise<Session> {
    // Get source session
    const sourceSession = await this.store.findById(sourceSessionId);

    if (!sourceSession) {
      throw new Error('Source session not found');
    }

    // Create new session with forked metadata
    const newSession = await this.store.createWithDefaults({
      id: newSessionId,
      metadata: {
        ...sourceSession.metadata,
        forkedFrom: sourceSessionId,
      },
    });

    return newSession;
  }

  /**
   * Send a message to a session (blocking)
   */
  async sendMessage(sessionId: string, request: QueryRequest): Promise<CLIResult> {
    // Get session to check if it exists and get message count
    const session = await this.store.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Enqueue the request to ensure sequential processing
    return this.queue.enqueue(sessionId, async () => {
      // Build CLI args - use isNewSession=true only for first message
      const isNewSession = session.messageCount === 0;
      const args = buildCLIArgs(request, sessionId, false, isNewSession);

      // Execute CLI
      const result = await this.executor.execute(args);

      // Update session metadata
      await this.updateSessionMetadata(sessionId, result);

      return result;
    });
  }

  /**
   * Send a message to a session (streaming)
   */
  async *streamMessage(
    sessionId: string,
    request: QueryRequest
  ): AsyncGenerator<CLIStreamEvent> {
    // Get session to check if it exists and get message count
    const session = await this.store.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Enqueue the streaming request
    const streamGenerator = await this.queue.enqueue(sessionId, async () => {
      // Build CLI args - use isNewSession=true only for first message
      const isNewSession = session.messageCount === 0;
      const args = buildCLIArgs(request, sessionId, true, isNewSession);

      // Execute CLI stream
      return this.executor.executeStream(args);
    });

    // Track result event for metadata update
    let resultEvent: CLIResultEvent | null = null;

    // Yield events from stream
    for await (const event of streamGenerator) {
      // Capture result event
      if (event.type === 'result') {
        resultEvent = event as CLIResultEvent;
      }

      yield event;
    }

    // Update session metadata after stream completes
    if (resultEvent) {
      await this.updateSessionMetadataFromStream(sessionId, resultEvent);
    }
  }

  /**
   * Update session metadata after CLI execution (blocking)
   */
  private async updateSessionMetadata(sessionId: string, result: CLIResult): Promise<void> {
    // Get current session
    const session = await this.store.findById(sessionId);

    if (!session) {
      return;
    }

    // Update metadata
    await this.store.update(sessionId, {
      messageCount: session.messageCount + 1,
      totalCostUsd: Number((session.totalCostUsd + result.totalCostUsd).toFixed(10)),
    });
  }

  /**
   * Update session metadata after CLI streaming (streaming)
   */
  private async updateSessionMetadataFromStream(
    sessionId: string,
    resultEvent: CLIResultEvent
  ): Promise<void> {
    // Get current session
    const session = await this.store.findById(sessionId);

    if (!session) {
      return;
    }

    // Update metadata
    await this.store.update(sessionId, {
      messageCount: session.messageCount + 1,
      totalCostUsd: Number((session.totalCostUsd + resultEvent.total_cost_usd).toFixed(10)),
    });
  }

  /**
   * Close the service (cleanup)
   */
  async close(): Promise<void> {
    await this.store.close();
  }
}
