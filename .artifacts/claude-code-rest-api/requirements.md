# Claude Code REST API - Requirements

## Overview
A REST API wrapper for the Claude Code CLI that exposes all CLI functionality via HTTP endpoints, enabling programmatic access and future web-based UI development.

## Problem Statement
The Claude Code CLI is powerful but limited to terminal usage. This API enables:
- Language-agnostic access to Claude Code features
- Foundation for web-based UI and Electron desktop app
- Programmatic integration into other tools and workflows
- Better session management and streaming capabilities

## User Stories
- As a developer, I want to send prompts to Claude via HTTP so that I can integrate it into my application
- As a user, I want streaming responses so that I can see output in real-time
- As a developer, I want to manage multiple sessions so that I can maintain separate conversations
- As a user, I want full access to all CLI flags so that I have feature parity with the terminal experience
- As a developer, I want structured error responses so that I can handle failures gracefully

## Functional Requirements

### 1. Session Management
- Create new sessions with unique session IDs
- List all sessions with metadata (creation date, message count, last activity)
- Get details about a specific session
- Resume existing sessions by ID
- Delete/end sessions
- Persist sessions to SQLite database
- Support session forking (create new session from existing one)

### 2. Message Operations
- Send messages to sessions (blocking mode)
- Send messages to sessions (streaming mode via SSE)
- Support for session-less queries (one-off requests)
- Queue concurrent requests to the same session (process sequentially)
- Allow concurrent requests to different sessions

### 3. Model Selection
- Support all Claude models: `sonnet`, `opus`, `haiku`
- Support specific model versions (e.g., `claude-sonnet-4-5-20250929`)
- Fallback model support for overload scenarios

### 4. Output Formats
- Text output (default)
- JSON output (single result)
- Stream JSON output (real-time via SSE)
- Structured output with JSON schema validation

### 5. Tool Control
- Specify available tools from built-in set
- Allow/disallow specific tools
- Support tool patterns (e.g., `Bash(git:*)`)
- Control permission modes (acceptEdits, bypassPermissions, plan, etc.)

### 6. Advanced Features
- Custom system prompts
- Append to system prompt
- Custom agent definitions
- MCP server configuration
- Plugin directory loading
- Budget limits (max cost in USD)
- Additional directory access control
- Beta feature flags

### 7. CLI Flag Support (Complete Parity)
All CLI flags must be supported:
- `--model` - Model selection
- `--agent` - Agent selection
- `--agents` - Custom agent definitions (JSON)
- `--system-prompt` - Custom system prompt
- `--append-system-prompt` - Append to system prompt
- `--tools` - Specify available tools
- `--allowedTools` - Whitelist tools
- `--disallowedTools` - Blacklist tools
- `--permission-mode` - Permission handling mode
- `--session-id` - Use specific session ID
- `--fork-session` - Fork from existing session
- `--json-schema` - Structured output schema
- `--max-budget-usd` - Cost limit
- `--add-dir` - Additional directories for tool access
- `--mcp-config` - MCP server configs
- `--plugin-dir` - Plugin directories
- `--betas` - Beta feature headers
- `--fallback-model` - Fallback for overloads
- `--verbose` - Verbose output
- `--setting-sources` - Setting sources to load
- `--settings` - Additional settings file/JSON
- `--strict-mcp-config` - Only use specified MCP servers
- `--disable-slash-commands` - Disable skills

### 8. Error Handling
- Structured error responses with consistent format
- Proper HTTP status codes:
  - `200` - Success
  - `400` - Bad request (invalid parameters)
  - `404` - Session not found
  - `409` - Conflict (e.g., session already exists)
  - `429` - Rate limit exceeded / budget exceeded
  - `500` - Internal server error
  - `503` - CLI unavailable or not authenticated
- Error response format:
  ```json
  {
    "error": true,
    "code": "SESSION_NOT_FOUND",
    "message": "Human-readable error message",
    "details": {
      "sessionId": "...",
      "additionalContext": "..."
    }
  }
  ```

### 9. Configuration
- Config file support (YAML format: `config.yaml`)
- Environment variable overrides
- Configurable settings:
  - Server port (default: 3000)
  - Database path (default: `./data/sessions.db`)
  - Default model (default: `sonnet`)
  - Request timeout (default: 120s)
  - Max concurrent sessions (default: unlimited)
  - Allowed origins for CORS
  - Log level

### 10. API Endpoints (v1)

#### Sessions
```
POST   /api/v1/sessions
GET    /api/v1/sessions
GET    /api/v1/sessions/:id
DELETE /api/v1/sessions/:id
POST   /api/v1/sessions/:id/messages
POST   /api/v1/sessions/:id/messages/stream
```

#### Queries (session-less)
```
POST   /api/v1/query
POST   /api/v1/query/stream
```

#### Health & Info
```
GET    /api/v1/health
GET    /api/v1/info
```

## Non-Functional Requirements

### Performance
- Support streaming responses with minimal latency
- Handle multiple concurrent sessions
- Queue requests per session to prevent race conditions
- Database queries should be optimized (indexed lookups)

### Reliability
- Graceful handling of CLI errors
- Clean process cleanup on server shutdown
- Database transaction safety
- Automatic session cleanup for abandoned sessions (optional)

### Security
- No authentication required (localhost only, relies on CLI auth)
- Input validation for all API parameters
- Prevent command injection in CLI arguments
- Sanitize file paths and directory access

### Maintainability
- Clean separation of concerns (routes, services, DB layer)
- Comprehensive logging
- Clear error messages
- TypeScript for type safety (optional but recommended)

### Compatibility
- Node.js 18+ required
- Works on Linux, macOS, Windows
- Requires Claude Code CLI 2.0+ installed and authenticated

## Clarifications

### Q: What's the MVP scope?
**A**: REST API only. Web UI and Electron wrapper come later.

### Q: How should sessions be persisted?
**A**: SQLite database - no external dependencies, persistent, performant enough for local use.

### Q: Should we support streaming?
**A**: Yes, both blocking and streaming modes for feature parity with CLI.

### Q: Which CLI flags should be supported?
**A**: All flags for complete feature parity.

### Q: Should the API have authentication?
**A**: No. Runs locally, relies on CLI's existing authentication with Anthropic.

### Q: How should errors be handled?
**A**: Structured error responses with proper HTTP status codes and consistent format.

### Q: How to handle concurrent requests to same session?
**A**: Queue them - process one at a time per session to maintain conversational integrity.

### Q: How should the API be configured?
**A**: Config file (YAML) with environment variable overrides.

### Q: Should the API be versioned?
**A**: Yes, use URL versioning with `/v1/` prefix.

## Out of Scope

### For MVP
- Web-based UI (future phase)
- Electron desktop app (future phase)
- Multi-user authentication
- Cloud deployment features
- Rate limiting (beyond budget enforcement)
- User management
- Team collaboration features
- Analytics and usage tracking
- Webhook notifications
- GraphQL API
- gRPC support

### Explicitly Not Included
- Proxy for direct Anthropic API (use Claude CLI's auth)
- Custom model training or fine-tuning
- Multi-tenancy support
- Distributed session management
- High-availability features

## Success Criteria

The API is successful when:
1. All CLI flags can be used via REST endpoints
2. Sessions persist across server restarts
3. Streaming works with real-time updates
4. Multiple concurrent sessions work correctly
5. Errors are handled gracefully with proper status codes
6. Configuration via file and env vars works
7. Can be run with simple `npm start` after `npm install`
8. Claude CLI integration works seamlessly
9. API is documented (OpenAPI/Swagger)
10. Ready to serve as backend for future web UI

## Future Enhancements

After MVP:
- Web-based chat UI (React/Vue)
- Electron desktop application
- WebSocket support for bidirectional streaming
- File explorer integration
- Monaco code editor integration
- Visual diff viewer
- Session search and filtering
- Export conversations
- Plugin marketplace UI
- Settings management UI
- Multi-workspace support
