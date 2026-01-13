import { CLIExecutor } from '../infrastructure/CLIExecutor.js';
import { buildCLIArgs } from '../utils/cliArgs.js';
import type { QueryRequest } from '../types/api.js';
import type { CLIResult, CLIStreamEvent } from '../types/cli.js';

/**
 * QueryService handles stateless query execution
 */
export class QueryService {
  private executor: CLIExecutor;

  constructor(cliPath: string = 'claude') {
    this.executor = new CLIExecutor(cliPath);
  }

  /**
   * Execute a blocking query and return result
   */
  async execute(request: QueryRequest): Promise<CLIResult> {
    // Build CLI arguments
    const args = buildCLIArgs(request, undefined, false);

    // Execute CLI and return result
    return this.executor.execute(args);
  }

  /**
   * Execute a streaming query and yield events
   */
  async *executeStream(request: QueryRequest): AsyncGenerator<CLIStreamEvent> {
    // Build CLI arguments for streaming
    const args = buildCLIArgs(request, undefined, true);

    // Execute CLI stream and yield events
    yield* this.executor.executeStream(args);
  }
}
