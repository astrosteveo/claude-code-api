export interface QueryRequest {
  prompt: string;
  model?: string;
  agent?: string;
  agents?: Record<string, unknown>;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  tools?: string[];
  allowedTools?: string[];
  disallowedTools?: string[];
  permissionMode?: string;
  jsonSchema?: Record<string, unknown>;
  maxBudgetUsd?: number;
  addDirs?: string[];
  mcpConfig?: Record<string, unknown>[];
  pluginDirs?: string[];
  betas?: string[];
  fallbackModel?: string;
  verbose?: boolean;
  settingSources?: string[];
  settings?: string | Record<string, unknown>;
  strictMcpConfig?: boolean;
  disableSlashCommands?: boolean;
  forkSession?: boolean;
}
