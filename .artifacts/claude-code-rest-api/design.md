# Claude Code REST API - Architecture Design

## Chosen Approach
**Pragmatic Architecture** (3-Layer Structure)

## Rationale
This approach balances simplicity with maintainability:
- Clear separation of concerns without over-engineering
- TypeScript provides type safety for CLI argument mapping
- Services are testable without complex DI setup
- Natural evolution path to Clean Architecture if needed later
- Can be built in 2-3 days while remaining maintainable

## Approaches Considered

### Approach A: Minimal Architecture
- **Summary**: 6 files, ~800 lines, single routes.js with all endpoints
- **Pros**: Fast to build (1-2 days), easy to understand, low cognitive load
- **Cons**: Code duplication, hard to unit test, tight coupling, won't scale well
- **Verdict**: Too simple for this project's scope and future needs

### Approach B: Clean Architecture
- **Summary**: Full layered architecture (Domain → Application → Infrastructure → Presentation)
- **Pros**: Highly testable, extremely maintainable, SOLID principles, professional patterns
- **Cons**: Lots of boilerplate (40+ files), steeper learning curve, longer development time
- **Verdict**: Over-engineered for MVP, but good target for future evolution

### Approach C: Pragmatic Architecture ✓ Selected
- **Summary**: 3-layer architecture (Routes → Services → Infrastructure), TypeScript, balanced
- **Pros**: Clear structure, testable services, TypeScript safety, good DX, easy to extend
- **Cons**: More files than minimal (15-20), requires TypeScript knowledge
- **Verdict**: Best balance for MVP with clear evolution path to Approach B

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Express Server                              │
│                     (CORS, Validation, Logging)                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Sessions   │ │    Query     │ │   Health     │
        │   Routes     │ │   Routes     │ │   Routes     │
        └──────┬───────┘ └──────┬───────┘ └──────────────┘
               │                │
               ▼                ▼
        ┌─────────────────────────────────────────────┐
        │           Service Layer                      │
        │  ┌────────────────┐  ┌────────────────┐     │
        │  │SessionService  │  │ QueryService   │     │
        │  │- CRUD ops      │  │ - Execute CLI  │     │
        │  │- Queue mgmt    │  │ - Parse output │     │
        │  └────────┬───────┘  └────────┬───────┘     │
        └───────────┼───────────────────┼─────────────┘
                    │                   │
                    ▼                   ▼
        ┌─────────────────────────────────────────────┐
        │        Infrastructure Layer                  │
        │  ┌────────────────┐  ┌────────────────┐     │
        │  │ SessionStore   │  │  CLIExecutor   │     │
        │  │  (SQLite)      │  │(child_process) │     │
        │  └────────────────┘  └────────┬───────┘     │
        │                               │              │
        │  ┌────────────────┐           │              │
        │  │ RequestQueue   │           │              │
        │  │  (p-queue)     │           │              │
        │  └────────────────┘           │              │
        └───────────────────────────────┼──────────────┘
                                        │
                                        ▼
                            ┌────────────────────┐
                            │   Claude CLI       │
                            │   (subprocess)     │
                            └────────────────────┘
```

## Directory Structure

```
/home/n78573/workspace/personal/claude-code-api/
├── package.json
├── tsconfig.json
├── config.yaml                    # Default configuration
├── .env.example                   # Environment variable template
├── data/                          # Runtime data (gitignored)
│   └── sessions.db                # SQLite database
│
├── src/
│   ├── index.ts                   # Entry point - starts server
│   ├── app.ts                     # Express app configuration
│   │
│   ├── config/
│   │   └── index.ts               # Configuration loading (YAML + env)
│   │
│   ├── routes/
│   │   ├── index.ts               # Route aggregator
│   │   ├── sessions.ts            # Session CRUD + message routes
│   │   ├── query.ts               # Stateless query routes
│   │   └── health.ts              # Health and info routes
│   │
│   ├── services/
│   │   ├── SessionService.ts      # Session business logic + queue
│   │   └── QueryService.ts        # CLI execution orchestration
│   │
│   ├── infrastructure/
│   │   ├── SessionStore.ts        # SQLite data access
│   │   ├── CLIExecutor.ts         # Process spawning + streaming
│   │   └── RequestQueue.ts        # Per-session request queue
│   │
│   ├── middleware/
│   │   ├── validation.ts          # Request validation middleware
│   │   ├── errorHandler.ts        # Global error handler
│   │   └── requestLogger.ts       # Request logging
│   │
│   ├── types/
│   │   ├── index.ts               # Shared types
│   │   ├── api.ts                 # Request/response types
│   │   ├── cli.ts                 # CLI output types
│   │   └── errors.ts              # Error types and codes
│   │
│   └── utils/
│       ├── cliArgs.ts             # Build CLI arguments from request
│       ├── streamParser.ts        # Parse stream-json output
│       └── logger.ts              # Winston logger setup
│
└── tests/
    ├── integration/
    │   ├── sessions.test.ts
    │   └── query.test.ts
    └── unit/
        ├── CLIExecutor.test.ts
        └── cliArgs.test.ts
```

## Component Design

### Layer 1: Routes (HTTP Interface)

#### `/src/routes/sessions.ts`
Endpoints:
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/:id` - Get session details
- `DELETE /api/v1/sessions/:id` - Delete session
- `POST /api/v1/sessions/:id/messages` - Send message (blocking)
- `POST /api/v1/sessions/:id/messages/stream` - Send message (SSE)

Responsibilities:
- Request validation via Zod schemas
- SSE header setup for streaming endpoints
- Delegate business logic to SessionService
- Transform service results to API responses

#### `/src/routes/query.ts`
Endpoints:
- `POST /api/v1/query` - Execute query (blocking)
- `POST /api/v1/query/stream` - Execute query (SSE)

Responsibilities:
- Stateless query execution
- No session persistence

#### `/src/routes/health.ts`
Endpoints:
- `GET /api/v1/health` - Health check
- `GET /api/v1/info` - System info

### Layer 2: Services (Business Logic)

#### `/src/services/SessionService.ts`
```typescript
class SessionService {
  constructor(
    private store: SessionStore,
    private executor: CLIExecutor,
    private queue: RequestQueue
  ) {}

  // Session lifecycle
  async createSession(options?: SessionOptions): Promise<Session>
  async getSession(id: string): Promise<Session | null>
  async listSessions(filter?: ListFilter): Promise<Session[]>
  async deleteSession(id: string): Promise<void>
  async forkSession(sourceId: string): Promise<Session>

  // Message operations (queue-aware)
  async sendMessage(sessionId: string, request: MessageRequest): Promise<CLIResult>
  async *streamMessage(sessionId: string, request: MessageRequest): AsyncIterable<CLIEvent>
}
```

Key responsibilities:
- Orchestrate session CRUD operations
- Manage per-session request queues
- Track session metadata (message count, cost, last activity)
- Coordinate between SessionStore and CLIExecutor

#### `/src/services/QueryService.ts`
```typescript
class QueryService {
  constructor(private executor: CLIExecutor) {}

  async execute(request: QueryRequest): Promise<CLIResult>
  async *executeStream(request: QueryRequest): AsyncIterable<CLIEvent>
}
```

Key responsibilities:
- Handle stateless queries (no session tracking)
- Build CLI arguments from request
- Delegate to CLIExecutor

### Layer 3: Infrastructure (External Integrations)

#### `/src/infrastructure/SessionStore.ts`
```typescript
class SessionStore {
  async initialize(): Promise<void>
  async create(session: Session): Promise<void>
  async findById(id: string): Promise<Session | null>
  async findAll(filter?: ListFilter): Promise<Session[]>
  async update(id: string, updates: Partial<Session>): Promise<void>
  async delete(id: string): Promise<void>
}
```

Database schema:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  last_model TEXT,
  metadata TEXT  -- JSON blob
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at);
```

#### `/src/infrastructure/CLIExecutor.ts`
```typescript
class CLIExecutor {
  async execute(args: string[], options: ExecOptions): Promise<CLIResult>
  async *executeStream(args: string[], options: ExecOptions): AsyncIterable<CLIEvent>
  async checkHealth(): Promise<HealthStatus>
}
```

Key responsibilities:
- Spawn `claude` process with child_process.spawn
- Parse JSON output from `--output-format=json`
- Parse NDJSON from `--output-format=stream-json`
- Handle process lifecycle (timeout, cleanup)

#### `/src/infrastructure/RequestQueue.ts`
```typescript
class RequestQueue {
  async enqueue<T>(sessionId: string, task: () => Promise<T>): Promise<T>
  getQueueLength(sessionId: string): number
  clear(sessionId: string): void
}
```

Implementation using `p-queue`:
- Per-session FIFO queue
- Ensures sequential processing per session
- Allows concurrent processing across sessions

### Cross-Cutting: Utilities

#### `/src/utils/cliArgs.ts`
```typescript
function buildCLIArgs(
  request: QueryRequest | MessageRequest,
  sessionId?: string
): string[]
```

Maps all API request options to CLI flags:
- `model` → `--model`
- `systemPrompt` → `--system-prompt`
- `tools` → `--tools`
- `jsonSchema` → `--json-schema`
- All 20+ CLI flags supported

#### `/src/utils/streamParser.ts`
```typescript
function parseStreamLine(line: string): CLIEvent | null
```

Parses NDJSON lines from `stream-json`:
- `{"type":"system","subtype":"init",...}`
- `{"type":"assistant","message":{...}}`
- `{"type":"result",...}`

## Data Flow Examples

### Send Message (Blocking)
```
POST /sessions/:id/messages
  ↓ validation.ts
  ↓ sessions.ts route
  ↓ SessionService.sendMessage()
  ↓ RequestQueue.enqueue(sessionId, task)
  ↓ SessionStore.findById(sessionId)
  ↓ CLIExecutor.execute(args)
  ↓ spawn('claude', ['-p', '--session-id=X', ...])
  ↓ Parse JSON result
  ↓ SessionStore.update(sessionId, metadata)
  ↓ Return CLIResult
  ↓ 200 JSON response
```

### Stream Message (SSE)
```
POST /sessions/:id/messages/stream
  ↓ validation.ts
  ↓ sessions.ts route (set SSE headers)
  ↓ SessionService.streamMessage()
  ↓ RequestQueue.enqueue(sessionId, task)
  ↓ CLIExecutor.executeStream(args)
  ↓ spawn('claude', ['-p', '--output-format=stream-json', ...])
  ↓ For each stdout line:
      ↓ parseStreamLine(line)
      ↓ res.write(`data: ${JSON.stringify(event)}\n\n`)
  ↓ SessionStore.update(sessionId, metadata)
  ↓ res.end()
```

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | Node.js | 20+ |
| Language | TypeScript | 5.x |
| Framework | Express | 4.x |
| Database | SQLite (better-sqlite3) | 9.x |
| Validation | Zod | 3.x |
| Queue | p-queue | 8.x |
| Config | js-yaml + dotenv | Latest |
| Logging | Winston | 3.x |
| Testing | Vitest + Supertest | Latest |

## API Endpoints Summary

```
POST   /api/v1/sessions                    # Create session
GET    /api/v1/sessions                    # List sessions
GET    /api/v1/sessions/:id                # Get session
DELETE /api/v1/sessions/:id                # Delete session
POST   /api/v1/sessions/:id/messages       # Send message (blocking)
POST   /api/v1/sessions/:id/messages/stream # Send message (SSE)
POST   /api/v1/query                       # Query (blocking)
POST   /api/v1/query/stream                # Query (SSE)
GET    /api/v1/health                      # Health check
GET    /api/v1/info                        # System info
```

## CLI Flag Mapping

All CLI flags are supported via request body `options` field:

| API Field | CLI Flag | Example |
|-----------|----------|---------|
| `model` | `--model` | `"opus"` |
| `agent` | `--agent` | `"code-review"` |
| `systemPrompt` | `--system-prompt` | `"You are..."` |
| `tools` | `--tools` | `["Read", "Grep"]` |
| `allowedTools` | `--allowedTools` | `["Bash"]` |
| `disallowedTools` | `--disallowedTools` | `["Write"]` |
| `permissionMode` | `--permission-mode` | `"bypassPermissions"` |
| `jsonSchema` | `--json-schema` | `{...}` |
| `maxBudgetUsd` | `--max-budget-usd` | `1.00` |
| `addDirs` | `--add-dir` | `["/path"]` |
| `mcpConfig` | `--mcp-config` | `[{...}]` |
| `pluginDirs` | `--plugin-dir` | `["./plugins"]` |
| `betas` | `--betas` | `["feature1"]` |
| `fallbackModel` | `--fallback-model` | `"haiku"` |
| `verbose` | `--verbose` | `true` |
| ... | ... | ... |

## Error Handling

### Error Response Format
```typescript
interface APIError {
  error: true;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

enum ErrorCode {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  CLI_ERROR = 'CLI_ERROR',
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  CLI_NOT_AUTHENTICATED = 'CLI_NOT_AUTHENTICATED',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
```

### HTTP Status Code Mapping
- `200` - Success
- `201` - Created (new session)
- `400` - Bad request (validation failed)
- `404` - Session not found
- `409` - Conflict (duplicate session ID)
- `429` - Rate limit / budget exceeded
- `500` - Internal server error
- `503` - CLI unavailable / not authenticated

## Configuration

### config.yaml
```yaml
server:
  port: 3000

database:
  path: ./data/sessions.db

cli:
  timeout: 120000  # 2 minutes
  defaultModel: sonnet

queue:
  maxConcurrentPerSession: 1

logging:
  level: info
  file: ./logs/api.log
```

### Environment Variable Overrides
- `PORT` - Server port
- `DB_PATH` - Database file path
- `CLI_TIMEOUT` - CLI execution timeout (ms)
- `DEFAULT_MODEL` - Default Claude model
- `LOG_LEVEL` - Logging level

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| **CLI process hangs** | Implement timeout, force kill after timeout |
| **SQLite lock contention** | Use WAL mode, better-sqlite3 handles this well |
| **Memory leak from queues** | Clear completed tasks, implement queue size limits |
| **CLI not installed** | Health check on startup, return 503 if unavailable |
| **Unbounded cost** | Respect `maxBudgetUsd`, track per-session costs |

## Evolution Path to Clean Architecture

When needed, this design can evolve:

1. **Add interfaces**: Wrap `SessionStore` with `ISessionRepository`
2. **Introduce domain layer**: Create `Session` entity with domain logic
3. **Add DI container**: Use tsyringe for dependency injection
4. **Create value objects**: Extract `SessionId`, `CLIOptions` as immutable objects
5. **Add mappers**: Separate DTOs from entities

The 3-layer structure makes this evolution straightforward without requiring a rewrite.

## Implementation Sequence

1. **Foundation** - Config, logging, error handling
2. **Infrastructure** - SessionStore, CLIExecutor, RequestQueue
3. **Services** - SessionService, QueryService
4. **Routes** - Sessions, query, health endpoints
5. **Streaming** - SSE support in routes and executor
6. **Polish** - Validation, tests, documentation
