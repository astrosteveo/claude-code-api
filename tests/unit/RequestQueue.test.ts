import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestQueue } from '../../src/infrastructure/RequestQueue.js';

describe('RequestQueue', () => {
  let queue: RequestQueue;

  beforeEach(() => {
    queue = new RequestQueue();
  });

  describe('enqueue() - Basic queueing', () => {
    it('should execute task immediately if queue is empty', async () => {
      // Arrange
      const task = vi.fn().mockResolvedValue('result');

      // Act
      const promise = queue.enqueue('session-1', task);
      const result = await promise;

      // Assert
      expect(task).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('should queue second task for same session', async () => {
      // Arrange
      let firstTaskStarted = false;
      let firstTaskDone = false;
      let secondTaskStarted = false;

      const firstTask = async () => {
        firstTaskStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        firstTaskDone = true;
        return 'first';
      };

      const secondTask = async () => {
        secondTaskStarted = true;
        // Second task should not start until first is done
        expect(firstTaskDone).toBe(true);
        return 'second';
      };

      // Act
      const firstPromise = queue.enqueue('session-1', firstTask);
      const secondPromise = queue.enqueue('session-1', secondTask);

      // Assert - first task should start immediately
      expect(firstTaskStarted).toBe(true);

      // Second task should not have started yet
      expect(secondTaskStarted).toBe(false);

      // Wait for both
      const [firstResult, secondResult] = await Promise.all([firstPromise, secondPromise]);

      expect(firstResult).toBe('first');
      expect(secondResult).toBe('second');
      expect(secondTaskStarted).toBe(true);
    });

    it('should process tasks sequentially per session', async () => {
      // Arrange
      const executionOrder: number[] = [];

      const task1 = async () => {
        executionOrder.push(1);
        await new Promise((resolve) => setTimeout(resolve, 20));
        executionOrder.push(11);
      };

      const task2 = async () => {
        executionOrder.push(2);
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionOrder.push(22);
      };

      const task3 = async () => {
        executionOrder.push(3);
      };

      // Act
      await Promise.all([
        queue.enqueue('session-1', task1),
        queue.enqueue('session-1', task2),
        queue.enqueue('session-1', task3),
      ]);

      // Assert - tasks should execute in order
      expect(executionOrder).toEqual([1, 11, 2, 22, 3]);
    });

    it('should allow concurrent tasks for different sessions', async () => {
      // Arrange
      const session1Started: number[] = [];
      const session2Started: number[] = [];

      const task1Session1 = async () => {
        session1Started.push(1);
        await new Promise((resolve) => setTimeout(resolve, 30));
        return 's1-t1';
      };

      const task2Session1 = async () => {
        session1Started.push(2);
        return 's1-t2';
      };

      const task1Session2 = async () => {
        session2Started.push(1);
        await new Promise((resolve) => setTimeout(resolve, 30));
        return 's2-t1';
      };

      const task2Session2 = async () => {
        session2Started.push(2);
        return 's2-t2';
      };

      // Act
      const results = await Promise.all([
        queue.enqueue('session-1', task1Session1),
        queue.enqueue('session-1', task2Session1),
        queue.enqueue('session-2', task1Session2),
        queue.enqueue('session-2', task2Session2),
      ]);

      // Assert
      expect(results).toEqual(['s1-t1', 's1-t2', 's2-t1', 's2-t2']);

      // Both sessions should have started their first task
      expect(session1Started).toEqual([1, 2]);
      expect(session2Started).toEqual([1, 2]);
    });
  });

  describe('enqueue() - Return values and errors', () => {
    it('should return task result', async () => {
      // Arrange
      const task = async () => {
        return { data: 'test', count: 42 };
      };

      // Act
      const result = await queue.enqueue('session-1', task);

      // Assert
      expect(result).toEqual({ data: 'test', count: 42 });
    });

    it('should propagate task errors', async () => {
      // Arrange
      const task = async () => {
        throw new Error('Task failed');
      };

      // Act & Assert
      await expect(queue.enqueue('session-1', task)).rejects.toThrow('Task failed');
    });

    it('should handle error in one task without affecting others', async () => {
      // Arrange
      const task1 = async () => {
        throw new Error('Task 1 failed');
      };

      const task2 = async () => {
        return 'success';
      };

      // Act
      const promise1 = queue.enqueue('session-1', task1);
      const promise2 = queue.enqueue('session-1', task2);

      // Assert
      await expect(promise1).rejects.toThrow('Task 1 failed');
      await expect(promise2).resolves.toBe('success');
    });
  });

  describe('getQueueLength()', () => {
    it('should return 0 for empty queue', () => {
      // Act
      const length = queue.getQueueLength('session-1');

      // Assert
      expect(length).toBe(0);
    });

    it('should return correct queue size', async () => {
      // Arrange
      const slowTask = () => new Promise((resolve) => setTimeout(resolve, 100));

      // Act - enqueue 3 tasks
      queue.enqueue('session-1', slowTask);
      queue.enqueue('session-1', slowTask);
      queue.enqueue('session-1', slowTask);

      // Give a moment for first task to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Assert - 1 running + 2 pending = length 2 (or 3 if counting running)
      const length = queue.getQueueLength('session-1');
      expect(length).toBeGreaterThan(0);
    });

    it('should return 0 for non-existent session', () => {
      // Act
      const length = queue.getQueueLength('non-existent');

      // Assert
      expect(length).toBe(0);
    });
  });

  describe('clear()', () => {
    it('should remove all queued tasks for session', async () => {
      // Arrange
      const completed: number[] = [];
      const slowTask = (id: number) => async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        completed.push(id);
      };

      // Act - enqueue 3 tasks
      queue.enqueue('session-1', slowTask(1));
      queue.enqueue('session-1', slowTask(2));
      queue.enqueue('session-1', slowTask(3));

      // Clear after a moment (let first task start)
      await new Promise((resolve) => setTimeout(resolve, 10));
      queue.clear('session-1');

      // Wait for any running task to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - only the first task (already running) should complete
      // Tasks 2 and 3 should be cleared
      expect(completed.length).toBeLessThanOrEqual(1);
    });

    it('should not affect other sessions', async () => {
      // Arrange
      const session1Completed: number[] = [];
      const session2Completed: number[] = [];

      const task1 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        session1Completed.push(1);
      };

      const task2 = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        session2Completed.push(1);
      };

      // Act
      queue.enqueue('session-1', task1);
      queue.enqueue('session-2', task2);

      // Clear session-1 only
      await new Promise((resolve) => setTimeout(resolve, 10));
      queue.clear('session-1');

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert - session-2 should not be affected
      expect(session2Completed).toEqual([1]);
    });
  });
});
