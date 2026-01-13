# Claude Code REST API - Codebase Exploration

## Project Status
**Greenfield project** - No existing codebase. Starting from scratch.

## Claude CLI Capabilities (From Prior Exploration)

### Core Features
- **Interactive mode** (default) vs **print mode** (`-p/--print`)
- **Output formats**: `text`, `json`, `stream-json`
- **Models**: `sonnet`, `opus`, `haiku` (or full model names like `claude-sonnet-4-5-20250929`)
- **Structured output**: JSON schema validation via `--json-schema`

### Session Management
- `--session-id <uuid>` - Use specific session ID
- `--continue` - Continue most recent conversation
- `--resume [value]` - Resume by session ID or search
- `--fork-session` - Create new session ID when resuming
- `--no-session-persistence` - Disable session saving

### Tool Control
- `--tools <tools...>` - Specify available tools (Bash, Edit, Read, Write, etc.)
- `--allowedTools <tools...>` - Whitelist specific tools
- `--disallowedTools <tools...>` - Blacklist specific tools
- `--dangerously-skip-permissions` - Bypass permission checks

### Advanced Features
- `--agent <agent>` - Select agent for session
- `--agents <json>` - Define custom agents
- `--system-prompt <prompt>` - Custom system prompt
- `--append-system-prompt <prompt>` - Append to default prompt
- `--max-budget-usd <amount>` - Cost limits (print mode only)
- `--mcp-config <configs...>` - MCP server configuration
- `--plugin-dir <paths...>` - Load plugins
- `--permission-mode <mode>` - Set permission handling

### Streaming Support
- `--output-format=stream-json` - Real-time streaming output
- `--verbose` - Required with stream-json in print mode
- `--include-partial-messages` - Include message chunks as they arrive
- `--input-format=stream-json` - Real-time streaming input
- `--replay-user-messages` - Echo user messages back (for bidirectional streaming)

### Output Formats

#### JSON Output Structure
```json
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 1777,
  "duration_api_ms": 1733,
  "num_turns": 1,
  "result": "The actual response text",
  "session_id": "dacf933b-c94c-4416-839d-cd49f8d86894",
  "total_cost_usd": 0.0024192,
  "usage": {
    "input_tokens": 1,
    "cache_creation_input_tokens": 328,
    "cache_read_input_tokens": 19432,
    "output_tokens": 13
  },
  "structured_output": {
    // Only present when --json-schema used
  }
}
```

#### Stream JSON Format
```json
{"type":"system","subtype":"init","session_id":"...","tools":[...],"model":"..."}
{"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}
{"type":"result","subtype":"success","result":"...","total_cost_usd":0.002}
```

## Architectural Patterns for CLI-Wrapping APIs

### Pattern 1: Direct Process Spawning
**Approach**: Spawn `claude` process for each API request
- ✅ Simple implementation
- ✅ Isolated processes
- ❌ Startup overhead per request
- ❌ No connection pooling

### Pattern 2: Long-Running Process Pool
**Approach**: Maintain pool of claude processes
- ✅ Lower latency
- ✅ Better resource utilization
- ❌ Complex state management
- ❌ Process lifecycle management

### Pattern 3: Stateless Request/Response (Print Mode)
**Approach**: Use `claude -p` for stateless queries
- ✅ Perfect for simple queries
- ✅ No session management needed
- ❌ No conversational context
- ❌ Can't continue conversations

### Pattern 4: Session-Aware Architecture
**Approach**: Track session IDs, use `--session-id` flag
- ✅ Full conversational capability
- ✅ Matches Claude Code's native behavior
- ❌ Requires session storage
- ❌ More complex state management

## Technology Stack Considerations

### Backend Framework Options
1. **Node.js + Express**
   - ✅ Native child_process spawning
   - ✅ Excellent streaming support
   - ✅ Large ecosystem
   - Best for: Electron integration (same runtime)

2. **Python + FastAPI**
   - ✅ subprocess module
   - ✅ Async/await support
   - ✅ Type safety with Pydantic
   - Best for: Data-heavy workloads

3. **Go + Gin/Fiber**
   - ✅ Excellent performance
   - ✅ Built-in concurrency
   - ✅ Easy process management
   - Best for: High-throughput scenarios

### Streaming Strategy
1. **Server-Sent Events (SSE)**
   - One-way server → client
   - Simple HTTP-based
   - Perfect for `--output-format=stream-json`

2. **WebSockets**
   - Bidirectional communication
   - Better for interactive features
   - Required for `--input-format=stream-json`

3. **HTTP/2 Server Push**
   - Modern alternative to SSE
   - Better multiplexing

## Key Integration Points

### 1. Session Management
```
POST /api/sessions          # Create new session
GET  /api/sessions          # List sessions
GET  /api/sessions/:id      # Get session details
POST /api/sessions/:id/messages  # Send message to session
DELETE /api/sessions/:id    # End session
```

### 2. Streaming Responses
```
POST /api/query             # Simple query (blocking)
POST /api/query/stream      # Streaming query (SSE)
WS   /api/stream            # Bidirectional streaming (WebSocket)
```

### 3. Model Selection
```
POST /api/query
Body: {
  "prompt": "...",
  "model": "sonnet" | "opus" | "haiku",
  "options": {
    "tools": [...],
    "maxBudget": 1.00
  }
}
```

### 4. Tool Control
```
POST /api/query
Body: {
  "prompt": "...",
  "allowedTools": ["Read", "Grep", "Glob"],
  "disallowedTools": ["Bash", "Write"]
}
```

## Security Considerations

### Authentication
- Users must have Claude Code CLI authenticated locally
- API should verify `claude --version` works
- No API key management needed (piggyback on CLI auth)

### Permissions
- Respect file system boundaries
- Use `--add-dir` to limit tool access
- Consider `--permission-mode` for different trust levels

### Process Isolation
- Separate processes per user/session
- Resource limits (CPU, memory, timeout)
- Clean up zombie processes

## Performance Considerations

### Caching
- Session state in Redis/memory
- Response caching for identical queries
- Prompt cache leveraging (Claude API feature)

### Rate Limiting
- Per-user request limits
- Cost tracking via `total_cost_usd`
- Budget enforcement with `--max-budget-usd`

### Concurrency
- Multiple concurrent sessions per user
- Process pool management
- Queue for expensive operations

## Electron Integration Points

### IPC vs REST
**Option A: Electron IPC**
```javascript
// Main process
ipcMain.handle('claude-query', async (event, prompt, options) => {
  return await spawnClaude(prompt, options);
});

// Renderer
const result = await ipcRenderer.invoke('claude-query', 'Hello', {});
```

**Option B: Local REST API**
```javascript
// Main process starts Express on localhost:3000
// Renderer uses fetch('http://localhost:3000/api/query')
```

### File System Access
- Main process has full FS access
- Renderer can request file operations
- Preview diffs before applying edits

### UI Components Needed
1. **Chat Interface** - Send prompts, receive responses
2. **File Explorer** - Browse project files
3. **Code Editor** - Monaco/CodeMirror integration
4. **Diff Viewer** - Preview file changes
5. **Session Browser** - List/resume past conversations
6. **Settings UI** - Model selection, tool permissions

## Similar Projects (Reference)

### GitHub Copilot
- VS Code extension
- Language server protocol
- Real-time completions

### ChatGPT Desktop
- Electron app
- WebSocket for streaming
- Session management

### Docker Desktop
- Wraps Docker CLI
- REST API layer
- Native UI on top

### Postman
- HTTP client
- Collection management
- Workspace sync

## Recommendation

**Start with**:
- Node.js + Express (best for Electron)
- Session-aware architecture
- SSE for streaming
- Simple process spawning (optimize later)

**Then add**:
- WebSocket support
- Session persistence (SQLite/Redis)
- Electron wrapper
- Monaco editor integration
