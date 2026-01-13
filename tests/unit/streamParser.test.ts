import { describe, it, expect } from 'vitest';
import { parseStreamLine } from '../../src/utils/streamParser.js';

describe('Stream Parser', () => {
  it('should parse init event', () => {
    const line = JSON.stringify({
      type: 'system',
      subtype: 'init',
      cwd: '/home/user/project',
      session_id: 'test-session',
      tools: ['Read', 'Write'],
      mcp_servers: [],
      model: 'claude-sonnet-4-5',
      permissionMode: 'default',
      slash_commands: [],
      apiKeySource: 'none',
      claude_code_version: '2.1.6',
      output_style: 'default',
      agents: [],
      skills: [],
      plugins: [],
      uuid: 'test-uuid',
    });

    const event = parseStreamLine(line);

    expect(event).toBeDefined();
    expect(event?.type).toBe('system');
    expect((event as any).subtype).toBe('init');
    expect((event as any).session_id).toBe('test-session');
    expect((event as any).model).toBe('claude-sonnet-4-5');
  });

  it('should parse assistant event', () => {
    const line = JSON.stringify({
      type: 'assistant',
      message: {
        model: 'claude-sonnet-4-5',
        id: 'msg_123',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello!' }],
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
        },
        context_management: null,
      },
      parent_tool_use_id: null,
      session_id: 'test-session',
      uuid: 'test-uuid',
    });

    const event = parseStreamLine(line);

    expect(event).toBeDefined();
    expect(event?.type).toBe('assistant');
    expect((event as any).message.content[0].text).toBe('Hello!');
  });

  it('should parse result event', () => {
    const line = JSON.stringify({
      type: 'result',
      subtype: 'success',
      is_error: false,
      duration_ms: 1500,
      duration_api_ms: 1400,
      num_turns: 1,
      result: 'The answer is 42',
      session_id: 'test-session',
      total_cost_usd: 0.0024,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
      uuid: 'test-uuid',
    });

    const event = parseStreamLine(line);

    expect(event).toBeDefined();
    expect(event?.type).toBe('result');
    expect((event as any).subtype).toBe('success');
    expect((event as any).result).toBe('The answer is 42');
    expect((event as any).total_cost_usd).toBe(0.0024);
  });

  it('should parse error event', () => {
    const line = JSON.stringify({
      type: 'error',
      error: 'Something went wrong',
      code: 'CLI_ERROR',
    });

    const event = parseStreamLine(line);

    expect(event).toBeDefined();
    expect(event?.type).toBe('error');
    expect((event as any).error).toBe('Something went wrong');
    expect((event as any).code).toBe('CLI_ERROR');
  });

  it('should return null for invalid JSON', () => {
    const line = 'not valid json {';

    const event = parseStreamLine(line);

    expect(event).toBeNull();
  });

  it('should return null for empty lines', () => {
    const event1 = parseStreamLine('');
    const event2 = parseStreamLine('   ');
    const event3 = parseStreamLine('\n');

    expect(event1).toBeNull();
    expect(event2).toBeNull();
    expect(event3).toBeNull();
  });

  it('should handle malformed JSON gracefully', () => {
    const lines = [
      '{"type":"assistant"',  // Missing closing brace
      '{"incomplete":',        // Incomplete object
      'random text',           // Not JSON at all
    ];

    for (const line of lines) {
      const event = parseStreamLine(line);
      expect(event).toBeNull();
    }
  });

  it('should parse JSON with extra whitespace', () => {
    const line = '  {"type":"result","subtype":"success","result":"test"}  \n';

    const event = parseStreamLine(line);

    expect(event).toBeDefined();
    expect(event?.type).toBe('result');
  });

  it('should preserve all fields from the event', () => {
    const originalEvent = {
      type: 'result',
      subtype: 'success',
      is_error: false,
      duration_ms: 1500,
      duration_api_ms: 1400,
      num_turns: 1,
      result: 'Test result',
      session_id: 'session-123',
      total_cost_usd: 0.005,
      usage: {
        input_tokens: 200,
        output_tokens: 100,
        cache_read_input_tokens: 1000,
      },
      modelUsage: { 'claude-sonnet-4-5': { inputTokens: 200 } },
      permission_denials: [],
      structured_output: { name: 'test' },
      uuid: 'uuid-123',
    };

    const line = JSON.stringify(originalEvent);
    const event = parseStreamLine(line);

    expect(event).toEqual(originalEvent);
  });
});
