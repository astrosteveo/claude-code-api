import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionStore } from '../../src/infrastructure/SessionStore.js';
import type { Session } from '../../src/types/session.js';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(async () => {
    // Use in-memory database for tests
    store = new SessionStore(':memory:');
    await store.initialize();
  });

  afterEach(async () => {
    if (store) {
      await store.close();
    }
  });

  describe('initialize', () => {
    it('should create sessions table', async () => {
      // Table should exist after initialization
      // Try to insert a session to verify table exists
      const session: Session = {
        id: 'test-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        totalCostUsd: 0,
      };

      await store.create(session);
      const found = await store.findById('test-1');
      expect(found).toBeDefined();
    });
  });

  describe('create', () => {
    it('should insert a new session', async () => {
      const session: Session = {
        id: 'test-session-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messageCount: 0,
        totalCostUsd: 0,
      };

      await store.create(session);

      const found = await store.findById('test-session-1');
      expect(found).toBeDefined();
      expect(found?.id).toBe('test-session-1');
      expect(found?.messageCount).toBe(0);
      expect(found?.totalCostUsd).toBe(0);
    });

    it('should generate UUID if not provided', async () => {
      const session = await store.createWithDefaults({});

      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(session.messageCount).toBe(0);
      expect(session.totalCostUsd).toBe(0);
    });

    it('should use provided custom ID', async () => {
      const session = await store.createWithDefaults({ id: 'custom-id-123' });

      expect(session.id).toBe('custom-id-123');
    });

    it('should store metadata as JSON', async () => {
      const metadata = { name: 'Test Session', tags: ['test', 'demo'] };
      const session = await store.createWithDefaults({ metadata });

      const found = await store.findById(session.id);
      expect(found?.metadata).toEqual(metadata);
    });
  });

  describe('findById', () => {
    it('should return session by ID', async () => {
      const session = await store.createWithDefaults({ id: 'find-test-1' });

      const found = await store.findById('find-test-1');

      expect(found).toBeDefined();
      expect(found?.id).toBe('find-test-1');
    });

    it('should return null for non-existent ID', async () => {
      const found = await store.findById('does-not-exist');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all sessions ordered by updated_at DESC', async () => {
      // Create sessions with different timestamps
      const session1 = await store.createWithDefaults({ id: 'session-1' });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const session2 = await store.createWithDefaults({ id: 'session-2' });

      await new Promise(resolve => setTimeout(resolve, 10));

      const session3 = await store.createWithDefaults({ id: 'session-3' });

      const all = await store.findAll();

      expect(all).toHaveLength(3);
      // Most recently updated should be first
      expect(all[0].id).toBe('session-3');
      expect(all[1].id).toBe('session-2');
      expect(all[2].id).toBe('session-1');
    });

    it('should return empty array when no sessions exist', async () => {
      const all = await store.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update session metadata', async () => {
      const session = await store.createWithDefaults({ id: 'update-test-1' });

      await store.update('update-test-1', {
        messageCount: 5,
        totalCostUsd: 0.05,
        lastModel: 'opus',
      });

      const found = await store.findById('update-test-1');
      expect(found?.messageCount).toBe(5);
      expect(found?.totalCostUsd).toBe(0.05);
      expect(found?.lastModel).toBe('opus');
    });

    it('should update message_count', async () => {
      const session = await store.createWithDefaults({ id: 'update-test-2' });

      await store.update('update-test-2', { messageCount: 10 });

      const found = await store.findById('update-test-2');
      expect(found?.messageCount).toBe(10);
    });

    it('should update total_cost_usd', async () => {
      const session = await store.createWithDefaults({ id: 'update-test-3' });

      await store.update('update-test-3', { totalCostUsd: 1.25 });

      const found = await store.findById('update-test-3');
      expect(found?.totalCostUsd).toBe(1.25);
    });

    it('should update updated_at timestamp', async () => {
      const session = await store.createWithDefaults({ id: 'update-test-4' });
      const originalUpdatedAt = session.updatedAt;

      // Wait to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await store.update('update-test-4', { messageCount: 1 });

      const found = await store.findById('update-test-4');
      expect(found?.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('delete', () => {
    it('should remove session by ID', async () => {
      const session = await store.createWithDefaults({ id: 'delete-test-1' });

      await store.delete('delete-test-1');

      const found = await store.findById('delete-test-1');
      expect(found).toBeNull();
    });

    it('should be idempotent - no error if already deleted', async () => {
      const session = await store.createWithDefaults({ id: 'delete-test-2' });

      await store.delete('delete-test-2');

      // Deleting again should not throw
      await expect(store.delete('delete-test-2')).resolves.not.toThrow();
    });

    it('should not throw error for non-existent ID', async () => {
      await expect(store.delete('never-existed')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true for existing session', async () => {
      const session = await store.createWithDefaults({ id: 'exists-test-1' });

      const exists = await store.exists('exists-test-1');

      expect(exists).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const exists = await store.exists('does-not-exist');

      expect(exists).toBe(false);
    });
  });
});
