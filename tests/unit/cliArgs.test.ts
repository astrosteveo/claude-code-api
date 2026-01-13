import { describe, it, expect } from 'vitest';
import { buildCLIArgs } from '../../src/utils/cliArgs.js';
import type { QueryRequest } from '../../src/types/api.js';

describe('CLI Arguments Builder', () => {
  it('should build basic args with just prompt', () => {
    const request: QueryRequest = {
      prompt: 'Hello, Claude!',
    };

    const args = buildCLIArgs(request);

    expect(args).toEqual(['-p', '--output-format', 'json', 'Hello, Claude!']);
  });

  it('should add session-id flag when sessionId is provided', () => {
    const request: QueryRequest = {
      prompt: 'Test',
    };
    const sessionId = 'test-session-123';

    const args = buildCLIArgs(request, sessionId);

    expect(args).toContain('--session-id');
    expect(args).toContain(sessionId);
  });

  it('should add model flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      model: 'opus',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--model');
    expect(args).toContain('opus');
  });

  it('should add agent flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      agent: 'code-review',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--agent');
    expect(args).toContain('code-review');
  });

  it('should add system-prompt flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      systemPrompt: 'You are a helpful assistant',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--system-prompt');
    expect(args).toContain('You are a helpful assistant');
  });

  it('should add append-system-prompt flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      appendSystemPrompt: 'Additional instructions',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--append-system-prompt');
    expect(args).toContain('Additional instructions');
  });

  it('should add tools flag with multiple tools', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      tools: ['Read', 'Grep', 'Glob'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--tools');
    expect(args).toContain('Read');
    expect(args).toContain('Grep');
    expect(args).toContain('Glob');
  });

  it('should add allowedTools flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      allowedTools: ['Bash', 'Edit'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--allowedTools');
    expect(args).toContain('Bash');
    expect(args).toContain('Edit');
  });

  it('should add disallowedTools flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      disallowedTools: ['Write', 'Delete'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--disallowedTools');
    expect(args).toContain('Write');
    expect(args).toContain('Delete');
  });

  it('should add permission-mode flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      permissionMode: 'bypassPermissions',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--permission-mode');
    expect(args).toContain('bypassPermissions');
  });

  it('should add json-schema flag with stringified JSON', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      jsonSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--json-schema');
    const schemaIndex = args.indexOf('--json-schema');
    const schemaValue = args[schemaIndex + 1];
    expect(schemaValue).toBe(JSON.stringify(request.jsonSchema));
  });

  it('should add max-budget-usd flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      maxBudgetUsd: 1.5,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--max-budget-usd');
    expect(args).toContain('1.5');
  });

  it('should add add-dir flags for multiple directories', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      addDirs: ['/path/one', '/path/two'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--add-dir');
    expect(args).toContain('/path/one');
    expect(args).toContain('/path/two');
  });

  it('should add plugin-dir flags', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      pluginDirs: ['./plugins', './custom-plugins'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--plugin-dir');
    expect(args).toContain('./plugins');
    expect(args).toContain('./custom-plugins');
  });

  it('should add betas flag with multiple values', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      betas: ['feature1', 'feature2'],
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--betas');
    expect(args).toContain('feature1');
    expect(args).toContain('feature2');
  });

  it('should add fallback-model flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      fallbackModel: 'haiku',
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--fallback-model');
    expect(args).toContain('haiku');
  });

  it('should add verbose flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      verbose: true,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--verbose');
  });

  it('should not add verbose flag when false', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      verbose: false,
    };

    const args = buildCLIArgs(request);

    expect(args).not.toContain('--verbose');
  });

  it('should add strict-mcp-config flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      strictMcpConfig: true,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--strict-mcp-config');
  });

  it('should add disable-slash-commands flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      disableSlashCommands: true,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--disable-slash-commands');
  });

  it('should add fork-session flag', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      forkSession: true,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('--fork-session');
  });

  it('should handle undefined/null options gracefully', () => {
    const request: QueryRequest = {
      prompt: 'Test',
      model: undefined,
      tools: undefined,
      maxBudgetUsd: undefined,
    };

    const args = buildCLIArgs(request);

    // Should only contain basic args
    expect(args).toEqual(['-p', '--output-format', 'json', 'Test']);
  });

  it('should build complex command with multiple flags', () => {
    const request: QueryRequest = {
      prompt: 'Analyze this code',
      model: 'sonnet',
      tools: ['Read', 'Grep'],
      systemPrompt: 'You are a code reviewer',
      maxBudgetUsd: 2.0,
      verbose: true,
    };

    const args = buildCLIArgs(request);

    expect(args).toContain('-p');
    expect(args).toContain('--output-format');
    expect(args).toContain('json');
    expect(args).toContain('--model');
    expect(args).toContain('sonnet');
    expect(args).toContain('--tools');
    expect(args).toContain('Read');
    expect(args).toContain('Grep');
    expect(args).toContain('--system-prompt');
    expect(args).toContain('You are a code reviewer');
    expect(args).toContain('--max-budget-usd');
    expect(args).toContain('2');
    expect(args).toContain('--verbose');
    expect(args[args.length - 1]).toBe('Analyze this code');
  });

  it('should always put prompt as the last argument', () => {
    const request: QueryRequest = {
      prompt: 'My prompt',
      model: 'opus',
      tools: ['Read'],
      verbose: true,
    };

    const args = buildCLIArgs(request);

    expect(args[args.length - 1]).toBe('My prompt');
  });
});
