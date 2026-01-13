import PQueue from 'p-queue';

/**
 * RequestQueue manages per-session request queues to ensure sequential processing
 * within a session while allowing concurrent processing across sessions
 */
export class RequestQueue {
  private queues: Map<string, PQueue>;

  constructor() {
    this.queues = new Map();
  }

  /**
   * Enqueue a task for a specific session
   * Tasks for the same session execute sequentially
   * Tasks for different sessions can execute concurrently
   */
  async enqueue<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    // Get or create queue for this session
    let queue = this.queues.get(sessionId);

    if (!queue) {
      // Create new queue with concurrency 1 (sequential)
      queue = new PQueue({ concurrency: 1 });
      this.queues.set(sessionId, queue);
    }

    // Add task to queue and return its promise
    return queue.add(task);
  }

  /**
   * Get the number of pending tasks for a session
   */
  getQueueLength(sessionId: string): number {
    const queue = this.queues.get(sessionId);

    if (!queue) {
      return 0;
    }

    // Return pending + running tasks
    return queue.size + queue.pending;
  }

  /**
   * Clear all pending tasks for a session and remove the queue
   * Note: Currently running task will complete
   */
  clear(sessionId: string): void {
    const queue = this.queues.get(sessionId);

    if (queue) {
      queue.clear();
      this.queues.delete(sessionId); // Prevent memory leak
    }
  }

  /**
   * Get the number of active queues (for monitoring/debugging)
   */
  getActiveQueueCount(): number {
    return this.queues.size;
  }
}
