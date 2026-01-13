# Claude Code REST API - Progress

## Status
Phase: Phase 2 - Infrastructure Layer (Complete) → Phase 3 - Service Layer (Next)
Started: 2026-01-13
Last Updated: 2026-01-13
Current Session: Resumed and completed infrastructure layer

## Checklist
- [x] Discovery
- [x] Codebase Exploration
- [x] Requirements
- [x] Architecture Design
- [ ] Implementation (TDD Mode)
- [ ] Code Review
- [ ] Testing
- [ ] Summary

## Session Log
### 2026-01-13
- Started feature development
- Initial request: Build REST API wrapper for Claude Code CLI to enable web-based UI and eventual Electron desktop app
- Explored claude CLI flags and features
- Confirmed core functionality: models, streaming, sessions, tools, output formats
- Completed codebase exploration (greenfield project)
- Documented Claude CLI capabilities, architectural patterns, and technology considerations
- Completed requirements gathering through 9 clarifying questions
- Finalized scope: REST API only, SQLite storage, SSE streaming, all CLI flags, no auth, structured errors
- Completed architecture design using 3 specialized architect agents
- Selected Pragmatic Architecture (3-layer) for MVP with evolution path to Clean Architecture
- User insight: Approach C is a natural stepping stone to Approach B
- Switched to TDD mode for implementation
- Created comprehensive test plan with 100+ test cases ordered from simple to complex
- Created TDD progress tracker for red-green-refactor cycles
- Fixed Node.js compatibility issue - installed nvm and Node 20 LTS
- Completed Phase 1: Foundation utilities (40 tests passing)
  - Config loading (3 tests)
  - CLI args builder (24 tests)
  - Stream parser (9 tests)
  - Logger (4 tests)
- Started Phase 2: Infrastructure layer
  - Wrote SessionStore implementation (178 lines)
  - Wrote 18 tests for SessionStore
  - Blocked on Node 20 setup for better-sqlite3 compilation
- **Session Paused**: Need to reinstall dependencies with Node 20

### Resumption (2026-01-13 continued)
- Resumed session successfully
- Setup Node 20 environment using use-node20.sh script
- Clean installed dependencies with better-sqlite3 compilation successful
- Verified all 58 tests passing
- Completed Phase 2: Infrastructure layer (TDD red-green cycles)
  - Phase 2.2: CLIExecutor (12 tests, 248 lines)
    - RED: Wrote 11 failing tests for blocking/streaming execution and health checks
    - GREEN: Implemented CLIExecutor with execute(), executeStream(), checkHealth()
  - Phase 2.3: RequestQueue (12 tests, 58 lines)
    - RED: Wrote 12 failing tests for queueing, concurrency, error handling
    - GREEN: Implemented RequestQueue using p-queue library
- **Current status**: 82 tests passing, Infrastructure layer complete

## Codebase Exploration

### Project Status
**Greenfield project** - Starting from scratch, no existing code

### Key Patterns Identified
1. **Session-Aware Architecture**: Use `--session-id` for conversational continuity
2. **Streaming via SSE**: Perfect match for `--output-format=stream-json`
3. **Direct Process Spawning**: Simple approach to start, optimize later
4. **Local Authentication**: Piggyback on existing Claude CLI auth

### Technology Stack Recommendation
- **Backend**: Node.js + Express (best for Electron integration)
- **Streaming**: Server-Sent Events (SSE) initially, WebSocket later
- **Session Storage**: Redis or SQLite
- **Desktop**: Electron wrapper

### Relevant Files
| Component | Purpose | Technology |
|-----------|---------|------------|
| REST API Server | Handle HTTP requests, spawn claude processes | Express.js |
| Session Manager | Track session IDs, manage state | Redis/SQLite |
| Streaming Handler | Convert stream-json to SSE | EventSource |
| Electron Main | Desktop wrapper, IPC bridge | Electron |
| Web UI | Chat interface, editor, file tree | React + Monaco |

### Integration Points
- `/api/sessions` - Session CRUD operations
- `/api/query` - Send prompts (blocking)
- `/api/query/stream` - Send prompts (streaming)
- WebSocket for bidirectional streaming
- IPC for Electron integration

## Requirements

### Scope Decisions
1. **MVP**: REST API only (no UI yet)
2. **Session Storage**: SQLite database
3. **Streaming**: Both blocking and SSE streaming
4. **CLI Flags**: All flags supported for full parity
5. **Authentication**: None (localhost only, rely on CLI auth)
6. **Error Handling**: Structured responses with HTTP status codes
7. **Concurrency**: Queue requests per session
8. **Configuration**: YAML file + env var overrides
9. **API Versioning**: `/api/v1/` prefix

### Key Features
- Full session management (create, list, get, delete, resume, fork)
- Message operations (blocking and streaming modes)
- All Claude models supported
- Complete tool control (allow/disallow, patterns, permissions)
- Advanced features (custom prompts, agents, MCP, plugins, budgets)
- Structured error responses
- Configuration via file and environment

### API Endpoints
```
POST   /api/v1/sessions
GET    /api/v1/sessions
GET    /api/v1/sessions/:id
DELETE /api/v1/sessions/:id
POST   /api/v1/sessions/:id/messages
POST   /api/v1/sessions/:id/messages/stream
POST   /api/v1/query
POST   /api/v1/query/stream
GET    /api/v1/health
GET    /api/v1/info
```

### Out of Scope (Future)
- Web UI
- Electron app
- Multi-user auth
- Cloud deployment features
- WebSocket (use SSE for now)

## Architecture Design

### Chosen Approach
**Pragmatic Architecture** - 3-layer structure (Routes → Services → Infrastructure)

### Rationale
- Balances simplicity with maintainability
- TypeScript provides type safety for CLI argument mapping
- Clear evolution path to Clean Architecture if needed
- Can be built in 2-3 days while remaining testable and extensible

### Approaches Evaluated
1. **Minimal** (6 files, ~800 lines) - Too simple, hard to test
2. **Clean** (40+ files, full DI) - Over-engineered for MVP
3. **Pragmatic** (15-20 files, 3 layers) - ✓ Selected

### Architecture Layers
```
Routes (sessions.ts, query.ts, health.ts)
   ↓
Services (SessionService, QueryService)
   ↓
Infrastructure (SessionStore, CLIExecutor, RequestQueue)
```

### Key Components
- **SessionService**: Session CRUD + message operations with queueing
- **QueryService**: Stateless query execution
- **SessionStore**: SQLite operations (better-sqlite3)
- **CLIExecutor**: Spawn claude process, parse output
- **RequestQueue**: Per-session FIFO queue (p-queue)

### Technology Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **Framework**: Express 4.x
- **Database**: SQLite (better-sqlite3)
- **Validation**: Zod
- **Queue**: p-queue
- **Config**: js-yaml + dotenv
- **Logging**: Winston

### Directory Structure
```
src/
├── index.ts, app.ts
├── config/
├── routes/ (sessions, query, health)
├── services/ (SessionService, QueryService)
├── infrastructure/ (SessionStore, CLIExecutor, RequestQueue)
├── middleware/ (validation, errorHandler, requestLogger)
├── types/ (api, cli, errors)
└── utils/ (cliArgs, streamParser, logger)
```
