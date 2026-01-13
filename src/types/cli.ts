/**
 * CLI stream event types from --output-format=stream-json
 */

export interface CLIInitEvent {
  type: 'system';
  subtype: 'init';
  cwd: string;
  session_id: string;
  tools: string[];
  mcp_servers: Array<{ name: string; status: string }>;
  model: string;
  permissionMode: string;
  slash_commands: string[];
  apiKeySource: string;
  claude_code_version: string;
  output_style: string;
  agents: string[];
  skills: string[];
  plugins: Array<{ name: string; path: string }>;
  uuid: string;
}

export interface CLIAssistantEvent {
  type: 'assistant';
  message: {
    model: string;
    id: string;
    type: string;
    role: string;
    content: Array<{ type: string; text?: string; [key: string]: unknown }>;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      output_tokens: number;
      service_tier?: string;
    };
    context_management: unknown | null;
  };
  parent_tool_use_id: string | null;
  session_id: string;
  uuid: string;
}

export interface CLIResultEvent {
  type: 'result';
  subtype: 'success' | 'error';
  is_error: boolean;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
  result: string;
  session_id: string;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens: number;
    server_tool_use?: {
      web_search_requests: number;
      web_fetch_requests: number;
    };
    service_tier?: string;
  };
  modelUsage?: Record<string, unknown>;
  permission_denials?: unknown[];
  structured_output?: Record<string, unknown>;
  uuid: string;
}

export interface CLIErrorEvent {
  type: 'error';
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type CLIStreamEvent =
  | CLIInitEvent
  | CLIAssistantEvent
  | CLIResultEvent
  | CLIErrorEvent;

/**
 * Parsed CLI result from blocking execution
 */
export interface CLIResult {
  type: 'result';
  subtype: 'success' | 'error';
  result: string;
  sessionId: string;
  totalCostUsd: number;
  durationMs: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
  };
  structuredOutput?: Record<string, unknown>;
}
