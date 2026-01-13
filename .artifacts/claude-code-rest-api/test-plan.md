# Claude Code REST API - TDD Test Plan

## TDD Approach

Following **red-green-refactor** cycle:
1. **RED**: Write failing test, verify it fails
2. **GREEN**: Write minimum code to pass test
3. **REFACTOR**: Clean up code if needed

Each cycle gets its own commit:
- `test(claude-code-rest-api): add failing test for {behavior}`
- `feat(claude-code-rest-api): implement {behavior}`
- `refactor(claude-code-rest-api): {description}` (if needed)

## Test Order (Simplest → Complex)

Tests are ordered from simple pure functions to complex integration tests.

---

## Phase 1: Foundation & Utilities (No Dependencies)

### Test 1.1: Configuration Loading
**File**: `tests/unit/config.test.ts`

**Test Cases**:
- [ ] Loads default configuration from config.yaml
- [ ] Overrides config with environment variables
- [ ] Returns typed configuration object
- [ ] Throws error if config.yaml is malformed
- [ ] Uses default values when config.yaml is missing

**Expected Implementation**: `src/config/index.ts`

---

### Test 1.2: CLI Arguments Builder
**File**: `tests/unit/cliArgs.test.ts`

**Test Cases**:
- [ ] Builds basic args: `['-p', 'prompt text']`
- [ ] Adds model flag: `['--model', 'opus']`
- [ ] Adds session-id flag: `['--session-id', 'uuid']`
- [ ] Adds output-format flag: `['--output-format', 'json']`
- [ ] Adds multiple tools: `['--tools', 'Read', 'Grep']`
- [ ] Adds allowedTools: `['--allowedTools', 'Bash']`
- [ ] Adds disallowedTools: `['--disallowedTools', 'Write']`
- [ ] Adds system-prompt: `['--system-prompt', 'You are...']`
- [ ] Adds json-schema: `['--json-schema', '{...}']`
- [ ] Adds max-budget-usd: `['--max-budget-usd', '1.00']`
- [ ] Adds all 20+ CLI flags correctly
- [ ] Escapes special characters in prompt
- [ ] Handles undefined/null options gracefully

**Expected Implementation**: `src/utils/cliArgs.ts`

---

### Test 1.3: Stream Parser
**File**: `tests/unit/streamParser.test.ts`

**Test Cases**:
- [ ] Parses init event: `{"type":"system","subtype":"init",...}`
- [ ] Parses assistant event: `{"type":"assistant","message":{...}}`
- [ ] Parses result event: `{"type":"result",...}`
- [ ] Parses error event: `{"type":"error",...}`
- [ ] Returns null for invalid JSON
- [ ] Returns null for empty lines
- [ ] Handles malformed JSON gracefully

**Expected Implementation**: `src/utils/streamParser.ts`

---

### Test 1.4: Logger
**File**: `tests/unit/logger.test.ts`

**Test Cases**:
- [ ] Creates Winston logger with correct transports
- [ ] Logs at correct levels (info, warn, error, debug)
- [ ] Respects log level from config
- [ ] Formats log messages correctly

**Expected Implementation**: `src/utils/logger.ts`

---

## Phase 2: Infrastructure Layer (External Dependencies)

### Test 2.1: SessionStore - Database Operations
**File**: `tests/unit/SessionStore.test.ts`

**Test Cases**:
- [ ] `initialize()` creates sessions table
- [ ] `initialize()` creates indexes
- [ ] `create()` inserts new session
- [ ] `create()` generates UUID if not provided
- [ ] `findById()` returns session by ID
- [ ] `findById()` returns null for non-existent ID
- [ ] `findAll()` returns all sessions ordered by updated_at DESC
- [ ] `findAll()` returns empty array when no sessions
- [ ] `update()` updates session metadata
- [ ] `update()` updates message_count
- [ ] `update()` updates total_cost_usd
- [ ] `update()` updates updated_at timestamp
- [ ] `delete()` removes session by ID
- [ ] `delete()` is idempotent (no error if already deleted)

**Expected Implementation**: `src/infrastructure/SessionStore.ts`

**Setup**: Use in-memory SQLite (`:memory:`) for tests

---

### Test 2.2: CLIExecutor - Process Spawning (Mocked)
**File**: `tests/unit/CLIExecutor.test.ts`

**Test Cases**:
- [ ] `execute()` spawns claude process with correct args
- [ ] `execute()` parses JSON output correctly
- [ ] `execute()` returns CLIResult with result, usage, cost
- [ ] `execute()` throws error on non-zero exit code
- [ ] `execute()` throws error on timeout
- [ ] `execute()` captures stderr on failure
- [ ] `executeStream()` yields parsed events from stdout
- [ ] `executeStream()` handles process errors
- [ ] `checkHealth()` returns available=true if CLI exists
- [ ] `checkHealth()` returns available=false if CLI missing
- [ ] `checkHealth()` returns version string

**Expected Implementation**: `src/infrastructure/CLIExecutor.ts`

**Setup**: Mock `child_process.spawn` to avoid calling real CLI

---

### Test 2.3: RequestQueue - Concurrency Control
**File**: `tests/unit/RequestQueue.test.ts`

**Test Cases**:
- [ ] `enqueue()` executes task immediately if queue empty
- [ ] `enqueue()` queues second task for same session
- [ ] `enqueue()` processes tasks sequentially per session
- [ ] `enqueue()` allows concurrent tasks for different sessions
- [ ] `enqueue()` returns task result
- [ ] `enqueue()` propagates task errors
- [ ] `getQueueLength()` returns correct queue size
- [ ] `clear()` removes all queued tasks for session

**Expected Implementation**: `src/infrastructure/RequestQueue.ts`

---

## Phase 3: Service Layer (Business Logic)

### Test 3.1: QueryService
**File**: `tests/unit/QueryService.test.ts`

**Test Cases**:
- [ ] `execute()` builds CLI args from request
- [ ] `execute()` calls CLIExecutor.execute()
- [ ] `execute()` returns CLIResult
- [ ] `execute()` throws error if CLI fails
- [ ] `executeStream()` yields events from CLIExecutor.executeStream()
- [ ] `executeStream()` handles CLI errors

**Expected Implementation**: `src/services/QueryService.ts`

**Setup**: Mock CLIExecutor

---

### Test 3.2: SessionService
**File**: `tests/unit/SessionService.test.ts`

**Test Cases**:
- [ ] `createSession()` generates UUID
- [ ] `createSession()` saves to SessionStore
- [ ] `createSession()` returns Session object
- [ ] `createSession()` accepts custom session ID
- [ ] `getSession()` retrieves from SessionStore
- [ ] `getSession()` returns null for non-existent session
- [ ] `listSessions()` retrieves all sessions
- [ ] `deleteSession()` removes from SessionStore
- [ ] `forkSession()` creates new session from existing one
- [ ] `forkSession()` throws error if source doesn't exist
- [ ] `sendMessage()` enqueues request for session
- [ ] `sendMessage()` throws error if session doesn't exist
- [ ] `sendMessage()` executes CLI with session-id
- [ ] `sendMessage()` updates session metadata after execution
- [ ] `sendMessage()` increments message_count
- [ ] `sendMessage()` accumulates total_cost_usd
- [ ] `streamMessage()` enqueues streaming request
- [ ] `streamMessage()` yields events from CLI
- [ ] `streamMessage()` updates session after completion

**Expected Implementation**: `src/services/SessionService.ts`

**Setup**: Mock SessionStore, CLIExecutor, RequestQueue

---

## Phase 4: Middleware

### Test 4.1: Error Handler
**File**: `tests/unit/errorHandler.test.ts`

**Test Cases**:
- [ ] Catches errors and returns structured response
- [ ] Maps SESSION_NOT_FOUND to 404
- [ ] Maps INVALID_REQUEST to 400
- [ ] Maps CLI_ERROR to 500
- [ ] Maps CLI_NOT_FOUND to 503
- [ ] Maps TIMEOUT to 500
- [ ] Includes error code in response
- [ ] Includes error message in response
- [ ] Logs errors with logger

**Expected Implementation**: `src/middleware/errorHandler.ts`

---

### Test 4.2: Request Validation
**File**: `tests/unit/validation.test.ts`

**Test Cases**:
- [ ] Validates CreateSessionRequest with Zod
- [ ] Validates SendMessageRequest with Zod
- [ ] Validates QueryRequest with Zod
- [ ] Returns 400 for invalid prompt (missing)
- [ ] Returns 400 for invalid model (wrong type)
- [ ] Returns 400 for invalid tools (wrong type)
- [ ] Allows optional fields to be undefined
- [ ] Sanitizes prompt to prevent injection

**Expected Implementation**: `src/middleware/validation.ts`

---

## Phase 5: Routes (Integration-ish)

### Test 5.1: Health Routes
**File**: `tests/integration/health.test.ts`

**Test Cases**:
- [ ] GET /api/v1/health returns 200 with status
- [ ] GET /api/v1/info returns API version
- [ ] GET /api/v1/info returns CLI version
- [ ] GET /api/v1/info returns configuration

**Expected Implementation**: `src/routes/health.ts`

**Setup**: Start Express app, use supertest

---

### Test 5.2: Session Routes - CRUD
**File**: `tests/integration/sessions.test.ts`

**Test Cases**:
- [ ] POST /api/v1/sessions creates session, returns 201
- [ ] POST /api/v1/sessions with custom ID uses that ID
- [ ] GET /api/v1/sessions returns array of sessions
- [ ] GET /api/v1/sessions/:id returns session, 200
- [ ] GET /api/v1/sessions/:id returns 404 for non-existent
- [ ] DELETE /api/v1/sessions/:id deletes session, returns 204
- [ ] DELETE /api/v1/sessions/:id returns 404 for non-existent

**Expected Implementation**: `src/routes/sessions.ts`

---

### Test 5.3: Session Routes - Messages (Blocking)
**File**: `tests/integration/sessions-messages.test.ts`

**Test Cases**:
- [ ] POST /api/v1/sessions/:id/messages sends message, returns 200
- [ ] POST /api/v1/sessions/:id/messages returns 404 if session missing
- [ ] POST /api/v1/sessions/:id/messages returns 400 for invalid body
- [ ] POST /api/v1/sessions/:id/messages queues concurrent requests
- [ ] POST /api/v1/sessions/:id/messages updates session metadata

**Expected Implementation**: `src/routes/sessions.ts`

**Setup**: Mock CLIExecutor to avoid calling real CLI

---

### Test 5.4: Session Routes - Messages (Streaming)
**File**: `tests/integration/sessions-messages-stream.test.ts`

**Test Cases**:
- [ ] POST /api/v1/sessions/:id/messages/stream returns SSE headers
- [ ] POST /api/v1/sessions/:id/messages/stream sends events as SSE
- [ ] POST /api/v1/sessions/:id/messages/stream closes connection on completion
- [ ] POST /api/v1/sessions/:id/messages/stream returns 404 if session missing

**Expected Implementation**: `src/routes/sessions.ts`

---

### Test 5.5: Query Routes
**File**: `tests/integration/query.test.ts`

**Test Cases**:
- [ ] POST /api/v1/query executes query, returns 200
- [ ] POST /api/v1/query returns 400 for missing prompt
- [ ] POST /api/v1/query passes all options to CLI
- [ ] POST /api/v1/query/stream returns SSE headers
- [ ] POST /api/v1/query/stream sends events as SSE

**Expected Implementation**: `src/routes/query.ts`

---

## Phase 6: End-to-End Tests (Real CLI)

### Test 6.1: E2E - Query
**File**: `tests/e2e/query.test.ts`

**Test Cases**:
- [ ] POST /api/v1/query executes real CLI command
- [ ] Response includes actual Claude output
- [ ] Response includes usage and cost information

**Setup**: Requires real Claude CLI installed and authenticated

---

### Test 6.2: E2E - Session Flow
**File**: `tests/e2e/session.test.ts`

**Test Cases**:
- [ ] Create session → send message → verify response
- [ ] Create session → send multiple messages → verify continuity
- [ ] Create session → fork → verify new session has separate history

**Setup**: Requires real Claude CLI installed and authenticated

---

### Test 6.3: E2E - Streaming
**File**: `tests/e2e/streaming.test.ts`

**Test Cases**:
- [ ] Stream query receives events in real-time
- [ ] Stream message to session receives events in real-time
- [ ] Multiple concurrent streams work correctly

**Setup**: Requires real Claude CLI installed and authenticated

---

## Test Coverage Goals

- **Unit tests**: 80%+ coverage for utils, infrastructure, services
- **Integration tests**: All routes covered
- **E2E tests**: Happy paths covered (requires real CLI)

## Test Framework Setup

### Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.2.0",
    "supertest": "^6.3.4",
    "@types/supertest": "^6.0.2",
    "better-sqlite3": "^9.4.0"
  }
}
```

### Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*']
    },
    setupFiles: ['./tests/setup.ts']
  }
});
```

### Test Setup (`tests/setup.ts`)
```typescript
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { SessionStore } from '../src/infrastructure/SessionStore';

// Setup in-memory database for tests
let testDb: SessionStore;

beforeAll(async () => {
  testDb = new SessionStore(':memory:');
  await testDb.initialize();
});

afterAll(async () => {
  // Cleanup
});

beforeEach(async () => {
  // Clear database between tests
});

afterEach(async () => {
  // Additional cleanup
});
```

## Execution Order

Tests should be run in this order during TDD:
1. Phase 1: Foundation (pure functions, no dependencies)
2. Phase 2: Infrastructure (mocked external dependencies)
3. Phase 3: Services (mocked infrastructure)
4. Phase 4: Middleware (isolated)
5. Phase 5: Routes (integration with mocked services)
6. Phase 6: E2E (real CLI, run manually or in CI)

## Commands

```bash
# Run all unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests (requires Claude CLI)
npm run test:e2e

# Run all tests with coverage
npm run test:coverage

# Run specific test file
npm run test -- cliArgs.test.ts

# Watch mode for TDD
npm run test:watch
```

## TDD Progress Tracking

See `tdd-progress.md` for tracking red-green-refactor cycles.
