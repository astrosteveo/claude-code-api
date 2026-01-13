import type { QueryRequest } from '../types/api.js';

/**
 * Builds CLI arguments array from API request
 * @param request The query request with all options
 * @param sessionId Optional session ID for conversational context
 * @param streaming Whether to use stream-json output format
 * @returns Array of CLI arguments ready for spawn()
 */
export function buildCLIArgs(
  request: QueryRequest,
  sessionId?: string,
  streaming: boolean = false,
  isNewSession: boolean = true
): string[] {
  const args: string[] = [];

  // Always use print mode
  args.push('-p');

  // Output format
  args.push('--output-format', streaming ? 'stream-json' : 'json');

  // Session management
  if (sessionId) {
    if (isNewSession) {
      // First message: create new session with this ID
      args.push('--session-id', sessionId);
    } else {
      // Subsequent messages: resume existing session
      args.push('--resume', sessionId);
    }
  }

  if (request.forkSession) {
    args.push('--fork-session');
  }

  // Model selection
  if (request.model) {
    args.push('--model', request.model);
  }

  if (request.fallbackModel) {
    args.push('--fallback-model', request.fallbackModel);
  }

  // Agent
  if (request.agent) {
    args.push('--agent', request.agent);
  }

  if (request.agents) {
    args.push('--agents', JSON.stringify(request.agents));
  }

  // System prompts
  if (request.systemPrompt) {
    args.push('--system-prompt', request.systemPrompt);
  }

  if (request.appendSystemPrompt) {
    args.push('--append-system-prompt', request.appendSystemPrompt);
  }

  // Tools control
  if (request.tools && request.tools.length > 0) {
    args.push('--tools', ...request.tools);
  }

  if (request.allowedTools && request.allowedTools.length > 0) {
    args.push('--allowedTools', ...request.allowedTools);
  }

  if (request.disallowedTools && request.disallowedTools.length > 0) {
    args.push('--disallowedTools', ...request.disallowedTools);
  }

  if (request.permissionMode) {
    args.push('--permission-mode', request.permissionMode);
  }

  // Structured output
  if (request.jsonSchema) {
    args.push('--json-schema', JSON.stringify(request.jsonSchema));
  }

  // Budget control
  if (request.maxBudgetUsd !== undefined) {
    args.push('--max-budget-usd', request.maxBudgetUsd.toString());
  }

  // Directory access
  if (request.addDirs && request.addDirs.length > 0) {
    for (const dir of request.addDirs) {
      args.push('--add-dir', dir);
    }
  }

  // MCP configuration
  if (request.mcpConfig && request.mcpConfig.length > 0) {
    for (const config of request.mcpConfig) {
      args.push('--mcp-config', JSON.stringify(config));
    }
  }

  if (request.strictMcpConfig) {
    args.push('--strict-mcp-config');
  }

  // Plugin directories
  if (request.pluginDirs && request.pluginDirs.length > 0) {
    for (const dir of request.pluginDirs) {
      args.push('--plugin-dir', dir);
    }
  }

  // Beta features
  if (request.betas && request.betas.length > 0) {
    args.push('--betas', ...request.betas);
  }

  // Settings
  if (request.settings) {
    const settingsValue =
      typeof request.settings === 'string'
        ? request.settings
        : JSON.stringify(request.settings);
    args.push('--settings', settingsValue);
  }

  if (request.settingSources && request.settingSources.length > 0) {
    args.push('--setting-sources', request.settingSources.join(','));
  }

  // Flags
  if (request.verbose) {
    args.push('--verbose');
  }

  if (request.disableSlashCommands) {
    args.push('--disable-slash-commands');
  }

  // Prompt must be last
  args.push(request.prompt);

  return args;
}
