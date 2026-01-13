import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import type { Session, CreateSessionData } from '../types/session.js';

/**
 * SessionStore manages session persistence using SQLite
 */
export class SessionStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    // Create sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        total_cost_usd REAL DEFAULT 0,
        last_model TEXT,
        metadata TEXT
      )
    `);

    // Create indexes for common queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at
      ON sessions(created_at)
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_updated_at
      ON sessions(updated_at DESC)
    `);
  }

  /**
   * Create a new session
   */
  async create(session: Session): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, created_at, updated_at, message_count,
        total_cost_usd, last_model, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.createdAt,
      session.updatedAt,
      session.messageCount,
      session.totalCostUsd,
      session.lastModel ?? null,
      session.metadata ? JSON.stringify(session.metadata) : null
    );
  }

  /**
   * Create a session with default values
   */
  async createWithDefaults(data: CreateSessionData): Promise<Session> {
    const now = new Date().toISOString();
    const session: Session = {
      id: data.id ?? randomUUID(),
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      totalCostUsd: 0,
      metadata: data.metadata,
    };

    await this.create(session);
    return session;
  }

  /**
   * Find session by ID
   */
  async findById(id: string): Promise<Session | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `);

    const row = stmt.get(id) as any;

    if (!row) {
      return null;
    }

    return this.rowToSession(row);
  }

  /**
   * Find all sessions ordered by updated_at DESC
   */
  async findAll(): Promise<Session[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions ORDER BY updated_at DESC
    `);

    const rows = stmt.all() as any[];

    return rows.map(row => this.rowToSession(row));
  }

  /**
   * Update session
   */
  async update(
    id: string,
    updates: Partial<Pick<Session, 'messageCount' | 'totalCostUsd' | 'lastModel' | 'metadata'>>
  ): Promise<void> {
    const now = new Date().toISOString();

    const fields: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (updates.messageCount !== undefined) {
      fields.push('message_count = ?');
      values.push(updates.messageCount);
    }

    if (updates.totalCostUsd !== undefined) {
      fields.push('total_cost_usd = ?');
      values.push(updates.totalCostUsd);
    }

    if (updates.lastModel !== undefined) {
      fields.push('last_model = ?');
      values.push(updates.lastModel);
    }

    if (updates.metadata !== undefined) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE sessions SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
  }

  /**
   * Delete session by ID
   */
  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM sessions WHERE id = ?
    `);

    stmt.run(id);
  }

  /**
   * Check if session exists
   */
  async exists(id: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT 1 FROM sessions WHERE id = ? LIMIT 1
    `);

    const row = stmt.get(id);

    return row !== undefined;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    this.db.close();
  }

  /**
   * Convert database row to Session object
   */
  private rowToSession(row: any): Session {
    return {
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: row.message_count,
      totalCostUsd: row.total_cost_usd,
      lastModel: row.last_model ?? undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
