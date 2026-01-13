# TDD Progress Tracker

## Current Cycle

**Phase**: Not started
**Test**: N/A
**Status**: Waiting to begin

---

## Completed Cycles

### Legend
- 🔴 RED - Test written and failing
- 🟢 GREEN - Test passing with minimal code
- 🔵 REFACTOR - Code cleaned up (optional)

---

## Phase 1: Foundation & Utilities

### 1.1: Configuration Loading
- [ ] 🔴 Load default config
- [ ] 🟢 Load default config
- [ ] 🔵 Refactor (if needed)
- [ ] 🔴 Override with env vars
- [ ] 🟢 Override with env vars
- [ ] 🔴 Return typed config
- [ ] 🟢 Return typed config
- [ ] 🔴 Handle malformed YAML
- [ ] 🟢 Handle malformed YAML
- [ ] 🔴 Use defaults when missing
- [ ] 🟢 Use defaults when missing

### 1.2: CLI Arguments Builder
- [ ] 🔴 Build basic args
- [ ] 🟢 Build basic args
- [ ] 🔴 Add model flag
- [ ] 🟢 Add model flag
- [ ] 🔴 Add session-id flag
- [ ] 🟢 Add session-id flag
- [ ] 🔴 Add output-format flag
- [ ] 🟢 Add output-format flag
- [ ] 🔴 Add tools
- [ ] 🟢 Add tools
- [ ] 🔴 Add allowedTools
- [ ] 🟢 Add allowedTools
- [ ] 🔴 Add disallowedTools
- [ ] 🟢 Add disallowedTools
- [ ] 🔴 Add system-prompt
- [ ] 🟢 Add system-prompt
- [ ] 🔴 Add json-schema
- [ ] 🟢 Add json-schema
- [ ] 🔴 Add max-budget-usd
- [ ] 🟢 Add max-budget-usd
- [ ] 🔴 Add all remaining flags
- [ ] 🟢 Add all remaining flags
- [ ] 🔴 Escape special chars
- [ ] 🟢 Escape special chars
- [ ] 🔴 Handle undefined/null
- [ ] 🟢 Handle undefined/null
- [ ] 🔵 Refactor (if needed)

### 1.3: Stream Parser
- [ ] 🔴 Parse init event
- [ ] 🟢 Parse init event
- [ ] 🔴 Parse assistant event
- [ ] 🟢 Parse assistant event
- [ ] 🔴 Parse result event
- [ ] 🟢 Parse result event
- [ ] 🔴 Parse error event
- [ ] 🟢 Parse error event
- [ ] 🔴 Return null for invalid JSON
- [ ] 🟢 Return null for invalid JSON
- [ ] 🔴 Return null for empty lines
- [ ] 🟢 Return null for empty lines
- [ ] 🔴 Handle malformed JSON
- [ ] 🟢 Handle malformed JSON
- [ ] 🔵 Refactor (if needed)

### 1.4: Logger
- [ ] 🔴 Create Winston logger
- [ ] 🟢 Create Winston logger
- [ ] 🔴 Log at correct levels
- [ ] 🟢 Log at correct levels
- [ ] 🔴 Respect log level from config
- [ ] 🟢 Respect log level from config
- [ ] 🔴 Format messages
- [ ] 🟢 Format messages
- [ ] 🔵 Refactor (if needed)

---

## Phase 2: Infrastructure Layer

### 2.1: SessionStore
- [ ] 🔴 Initialize creates table
- [ ] 🟢 Initialize creates table
- [ ] 🔴 Initialize creates indexes
- [ ] 🟢 Initialize creates indexes
- [ ] 🔴 Create inserts session
- [ ] 🟢 Create inserts session
- [ ] 🔴 Create generates UUID
- [ ] 🟢 Create generates UUID
- [ ] 🔴 FindById returns session
- [ ] 🟢 FindById returns session
- [ ] 🔴 FindById returns null
- [ ] 🟢 FindById returns null
- [ ] 🔴 FindAll returns all
- [ ] 🟢 FindAll returns all
- [ ] 🔴 FindAll returns empty array
- [ ] 🟢 FindAll returns empty array
- [ ] 🔴 Update updates metadata
- [ ] 🟢 Update updates metadata
- [ ] 🔴 Update updates message_count
- [ ] 🟢 Update updates message_count
- [ ] 🔴 Update updates cost
- [ ] 🟢 Update updates cost
- [ ] 🔴 Update updates timestamp
- [ ] 🟢 Update updates timestamp
- [ ] 🔴 Delete removes session
- [ ] 🟢 Delete removes session
- [ ] 🔴 Delete is idempotent
- [ ] 🟢 Delete is idempotent
- [ ] 🔵 Refactor (if needed)

### 2.2: CLIExecutor
- [ ] 🔴 Execute spawns process
- [ ] 🟢 Execute spawns process
- [ ] 🔴 Execute parses JSON
- [ ] 🟢 Execute parses JSON
- [ ] 🔴 Execute returns CLIResult
- [ ] 🟢 Execute returns CLIResult
- [ ] 🔴 Execute throws on non-zero exit
- [ ] 🟢 Execute throws on non-zero exit
- [ ] 🔴 Execute throws on timeout
- [ ] 🟢 Execute throws on timeout
- [ ] 🔴 Execute captures stderr
- [ ] 🟢 Execute captures stderr
- [ ] 🔴 ExecuteStream yields events
- [ ] 🟢 ExecuteStream yields events
- [ ] 🔴 ExecuteStream handles errors
- [ ] 🟢 ExecuteStream handles errors
- [ ] 🔴 CheckHealth returns available
- [ ] 🟢 CheckHealth returns available
- [ ] 🔴 CheckHealth returns unavailable
- [ ] 🟢 CheckHealth returns unavailable
- [ ] 🔴 CheckHealth returns version
- [ ] 🟢 CheckHealth returns version
- [ ] 🔵 Refactor (if needed)

### 2.3: RequestQueue
- [ ] 🔴 Enqueue executes immediately
- [ ] 🟢 Enqueue executes immediately
- [ ] 🔴 Enqueue queues second task
- [ ] 🟢 Enqueue queues second task
- [ ] 🔴 Processes sequentially per session
- [ ] 🟢 Processes sequentially per session
- [ ] 🔴 Allows concurrent across sessions
- [ ] 🟢 Allows concurrent across sessions
- [ ] 🔴 Returns task result
- [ ] 🟢 Returns task result
- [ ] 🔴 Propagates errors
- [ ] 🟢 Propagates errors
- [ ] 🔴 GetQueueLength correct
- [ ] 🟢 GetQueueLength correct
- [ ] 🔴 Clear removes tasks
- [ ] 🟢 Clear removes tasks
- [ ] 🔵 Refactor (if needed)

---

## Phase 3: Service Layer

### 3.1: QueryService
- [ ] 🔴 Execute builds CLI args
- [ ] 🟢 Execute builds CLI args
- [ ] 🔴 Execute calls CLIExecutor
- [ ] 🟢 Execute calls CLIExecutor
- [ ] 🔴 Execute returns result
- [ ] 🟢 Execute returns result
- [ ] 🔴 Execute throws on CLI error
- [ ] 🟢 Execute throws on CLI error
- [ ] 🔴 ExecuteStream yields events
- [ ] 🟢 ExecuteStream yields events
- [ ] 🔴 ExecuteStream handles errors
- [ ] 🟢 ExecuteStream handles errors
- [ ] 🔵 Refactor (if needed)

### 3.2: SessionService
- [ ] 🔴 CreateSession generates UUID
- [ ] 🟢 CreateSession generates UUID
- [ ] 🔴 CreateSession saves to store
- [ ] 🟢 CreateSession saves to store
- [ ] 🔴 CreateSession returns Session
- [ ] 🟢 CreateSession returns Session
- [ ] 🔴 CreateSession accepts custom ID
- [ ] 🟢 CreateSession accepts custom ID
- [ ] 🔴 GetSession retrieves
- [ ] 🟢 GetSession retrieves
- [ ] 🔴 GetSession returns null
- [ ] 🟢 GetSession returns null
- [ ] 🔴 ListSessions retrieves all
- [ ] 🟢 ListSessions retrieves all
- [ ] 🔴 DeleteSession removes
- [ ] 🟢 DeleteSession removes
- [ ] 🔴 ForkSession creates new
- [ ] 🟢 ForkSession creates new
- [ ] 🔴 ForkSession throws if missing
- [ ] 🟢 ForkSession throws if missing
- [ ] 🔴 SendMessage enqueues
- [ ] 🟢 SendMessage enqueues
- [ ] 🔴 SendMessage throws if no session
- [ ] 🟢 SendMessage throws if no session
- [ ] 🔴 SendMessage executes CLI
- [ ] 🟢 SendMessage executes CLI
- [ ] 🔴 SendMessage updates metadata
- [ ] 🟢 SendMessage updates metadata
- [ ] 🔴 SendMessage increments count
- [ ] 🟢 SendMessage increments count
- [ ] 🔴 SendMessage accumulates cost
- [ ] 🟢 SendMessage accumulates cost
- [ ] 🔴 StreamMessage enqueues
- [ ] 🟢 StreamMessage enqueues
- [ ] 🔴 StreamMessage yields events
- [ ] 🟢 StreamMessage yields events
- [ ] 🔴 StreamMessage updates after
- [ ] 🟢 StreamMessage updates after
- [ ] 🔵 Refactor (if needed)

---

## Phase 4: Middleware

### 4.1: Error Handler
- [ ] 🔴 Catches errors
- [ ] 🟢 Catches errors
- [ ] 🔴 Maps SESSION_NOT_FOUND to 404
- [ ] 🟢 Maps SESSION_NOT_FOUND to 404
- [ ] 🔴 Maps INVALID_REQUEST to 400
- [ ] 🟢 Maps INVALID_REQUEST to 400
- [ ] 🔴 Maps CLI_ERROR to 500
- [ ] 🟢 Maps CLI_ERROR to 500
- [ ] 🔴 Maps CLI_NOT_FOUND to 503
- [ ] 🟢 Maps CLI_NOT_FOUND to 503
- [ ] 🔴 Maps TIMEOUT to 500
- [ ] 🟢 Maps TIMEOUT to 500
- [ ] 🔴 Includes error code
- [ ] 🟢 Includes error code
- [ ] 🔴 Includes error message
- [ ] 🟢 Includes error message
- [ ] 🔴 Logs errors
- [ ] 🟢 Logs errors
- [ ] 🔵 Refactor (if needed)

### 4.2: Request Validation
- [ ] 🔴 Validates CreateSessionRequest
- [ ] 🟢 Validates CreateSessionRequest
- [ ] 🔴 Validates SendMessageRequest
- [ ] 🟢 Validates SendMessageRequest
- [ ] 🔴 Validates QueryRequest
- [ ] 🟢 Validates QueryRequest
- [ ] 🔴 Returns 400 for missing prompt
- [ ] 🟢 Returns 400 for missing prompt
- [ ] 🔴 Returns 400 for invalid model
- [ ] 🟢 Returns 400 for invalid model
- [ ] 🔴 Returns 400 for invalid tools
- [ ] 🟢 Returns 400 for invalid tools
- [ ] 🔴 Allows optional fields
- [ ] 🟢 Allows optional fields
- [ ] 🔴 Sanitizes prompt
- [ ] 🟢 Sanitizes prompt
- [ ] 🔵 Refactor (if needed)

---

## Phase 5: Routes (Integration)

### 5.1: Health Routes
- [ ] 🔴 GET /health returns 200
- [ ] 🟢 GET /health returns 200
- [ ] 🔴 GET /info returns version
- [ ] 🟢 GET /info returns version
- [ ] 🔴 GET /info returns CLI version
- [ ] 🟢 GET /info returns CLI version
- [ ] 🔴 GET /info returns config
- [ ] 🟢 GET /info returns config
- [ ] 🔵 Refactor (if needed)

### 5.2: Session Routes - CRUD
- [ ] 🔴 POST /sessions creates, 201
- [ ] 🟢 POST /sessions creates, 201
- [ ] 🔴 POST /sessions with custom ID
- [ ] 🟢 POST /sessions with custom ID
- [ ] 🔴 GET /sessions returns array
- [ ] 🟢 GET /sessions returns array
- [ ] 🔴 GET /sessions/:id returns session
- [ ] 🟢 GET /sessions/:id returns session
- [ ] 🔴 GET /sessions/:id 404
- [ ] 🟢 GET /sessions/:id 404
- [ ] 🔴 DELETE /sessions/:id 204
- [ ] 🟢 DELETE /sessions/:id 204
- [ ] 🔴 DELETE /sessions/:id 404
- [ ] 🟢 DELETE /sessions/:id 404
- [ ] 🔵 Refactor (if needed)

### 5.3: Session Routes - Messages (Blocking)
- [ ] 🔴 POST /messages sends, 200
- [ ] 🟢 POST /messages sends, 200
- [ ] 🔴 POST /messages 404 if missing
- [ ] 🟢 POST /messages 404 if missing
- [ ] 🔴 POST /messages 400 invalid body
- [ ] 🟢 POST /messages 400 invalid body
- [ ] 🔴 POST /messages queues concurrent
- [ ] 🟢 POST /messages queues concurrent
- [ ] 🔴 POST /messages updates metadata
- [ ] 🟢 POST /messages updates metadata
- [ ] 🔵 Refactor (if needed)

### 5.4: Session Routes - Messages (Streaming)
- [ ] 🔴 POST /messages/stream SSE headers
- [ ] 🟢 POST /messages/stream SSE headers
- [ ] 🔴 POST /messages/stream sends events
- [ ] 🟢 POST /messages/stream sends events
- [ ] 🔴 POST /messages/stream closes
- [ ] 🟢 POST /messages/stream closes
- [ ] 🔴 POST /messages/stream 404
- [ ] 🟢 POST /messages/stream 404
- [ ] 🔵 Refactor (if needed)

### 5.5: Query Routes
- [ ] 🔴 POST /query executes, 200
- [ ] 🟢 POST /query executes, 200
- [ ] 🔴 POST /query 400 missing prompt
- [ ] 🟢 POST /query 400 missing prompt
- [ ] 🔴 POST /query passes options
- [ ] 🟢 POST /query passes options
- [ ] 🔴 POST /query/stream SSE headers
- [ ] 🟢 POST /query/stream SSE headers
- [ ] 🔴 POST /query/stream sends events
- [ ] 🟢 POST /query/stream sends events
- [ ] 🔵 Refactor (if needed)

---

## Phase 6: E2E Tests

### 6.1: E2E - Query
- [ ] 🔴 POST /query real CLI
- [ ] 🟢 POST /query real CLI
- [ ] 🔴 Response includes output
- [ ] 🟢 Response includes output
- [ ] 🔴 Response includes usage/cost
- [ ] 🟢 Response includes usage/cost

### 6.2: E2E - Session Flow
- [ ] 🔴 Create → send → verify
- [ ] 🟢 Create → send → verify
- [ ] 🔴 Multiple messages continuity
- [ ] 🟢 Multiple messages continuity
- [ ] 🔴 Fork session
- [ ] 🟢 Fork session

### 6.3: E2E - Streaming
- [ ] 🔴 Stream query real-time
- [ ] 🟢 Stream query real-time
- [ ] 🔴 Stream message real-time
- [ ] 🟢 Stream message real-time
- [ ] 🔴 Multiple concurrent streams
- [ ] 🟢 Multiple concurrent streams

---

## Summary Statistics

- **Total Test Cases**: 0 completed
- **Red Phase**: 0
- **Green Phase**: 0
- **Refactored**: 0
- **Current Phase**: Not started
