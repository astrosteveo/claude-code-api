# Claude Code REST API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

No authentication required. The API relies on the Claude Code CLI's existing authentication.

## Content Type

All requests with a body must use `Content-Type: application/json`.

---

## Health Endpoints

### GET /health

Simple health check endpoint.

**Response**

```json
{
  "status": "ok",
  "timestamp": "2026-01-13T22:06:53.878Z"
}
```

### GET /info

Detailed system information including CLI availability.

**Response**

```json
{
  "version": "1.0.0",
  "cli": {
    "available": true,
    "version": "2.1.6 (Claude Code)"
  },
  "config": {
    "dbPath": "./data/sessions.db",
    "port": 3000,
    "logLevel": "info"
  }
}
```

**Response (CLI unavailable)**

```json
{
  "version": "1.0.0",
  "cli": {
    "available": false,
    "error": "CLI not found or not authenticated"
  },
  "config": {
    "dbPath": "./data/sessions.db",
    "port": 3000,
    "logLevel": "info"
  }
}
```

---

## Session Endpoints

### POST /sessions

Create a new session.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | No | Custom session ID (auto-generated UUID if not provided) |
| metadata | object | No | Arbitrary metadata to attach to the session |

**Example Request**

```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-session",
    "metadata": {
      "purpose": "code review",
      "project": "my-app"
    }
  }'
```

**Response (201 Created)**

```json
{
  "id": "my-session",
  "createdAt": "2026-01-13T22:07:19.404Z",
  "updatedAt": "2026-01-13T22:07:19.404Z",
  "messageCount": 0,
  "totalCostUsd": 0,
  "metadata": {
    "purpose": "code review",
    "project": "my-app"
  }
}
```

---

### GET /sessions

List all sessions.

**Example Request**

```bash
curl http://localhost:3000/api/v1/sessions
```

**Response (200 OK)**

```json
[
  {
    "id": "my-session",
    "createdAt": "2026-01-13T22:07:19.404Z",
    "updatedAt": "2026-01-13T22:07:19.404Z",
    "messageCount": 5,
    "totalCostUsd": 0.0234,
    "metadata": {
      "purpose": "code review"
    }
  },
  {
    "id": "another-session",
    "createdAt": "2026-01-13T20:00:00.000Z",
    "updatedAt": "2026-01-13T21:30:00.000Z",
    "messageCount": 12,
    "totalCostUsd": 0.0567
  }
]
```

---

### GET /sessions/:id

Get a specific session by ID.

**Example Request**

```bash
curl http://localhost:3000/api/v1/sessions/my-session
```

**Response (200 OK)**

```json
{
  "id": "my-session",
  "createdAt": "2026-01-13T22:07:19.404Z",
  "updatedAt": "2026-01-13T22:07:19.404Z",
  "messageCount": 5,
  "totalCostUsd": 0.0234,
  "metadata": {
    "purpose": "code review"
  }
}
```

**Response (404 Not Found)**

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found: my-session"
  }
}
```

---

### DELETE /sessions/:id

Delete a session.

**Example Request**

```bash
curl -X DELETE http://localhost:3000/api/v1/sessions/my-session
```

**Response (204 No Content)**

No response body.

**Response (404 Not Found)**

```json
{
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found: my-session"
  }
}
```

---

## Message Endpoints

### POST /sessions/:id/messages

Send a message to a session (blocking). Waits for the complete response.

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | **Yes** | The message to send to Claude |
| model | string | No | Model to use (e.g., "sonnet", "opus", "haiku") |
| systemPrompt | string | No | Custom system prompt |
| appendSystemPrompt | string | No | Append to default system prompt |
| allowedTools | string[] | No | Tools to allow (e.g., ["Read", "Write"]) |
| disallowedTools | string[] | No | Tools to disallow |
| maxBudgetUsd | number | No | Maximum cost budget in USD |
| permissionMode | string | No | Permission mode for tool use |

**Example Request**

```bash
curl -X POST http://localhost:3000/api/v1/sessions/my-session/messages \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What files are in the current directory?",
    "allowedTools": ["Read", "Glob"],
    "maxBudgetUsd": 0.10
  }'
```

**Response (200 OK)**

```json
{
  "output": "I found the following files in the current directory:\n\n- package.json\n- tsconfig.json\n- src/\n- tests/\n...",
  "totalCostUsd": 0.0023,
  "inputTokens": 150,
  "outputTokens": 200
}
```

**Response (400 Bad Request)**

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Validation failed: prompt: Required",
    "details": {
      "errors": [
        {
          "code": "invalid_type",
          "expected": "string",
          "received": "undefined",
          "path": ["prompt"],
          "message": "Required"
        }
      ]
    }
  }
}
```

---

### POST /sessions/:id/messages/stream

Send a message to a session with Server-Sent Events (SSE) streaming.

**Request Body**

Same as `/sessions/:id/messages`.

**Example Request**

```bash
curl -X POST http://localhost:3000/api/v1/sessions/my-session/messages/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a hello world function"}' \
  --no-buffer
```

**Response Headers**

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Response Body (SSE events)**

```
data: {"type":"text","text":"Here"}

data: {"type":"text","text":"'s a"}

data: {"type":"text","text":" hello"}

data: {"type":"text","text":" world"}

data: {"type":"text","text":" function:"}

data: {"type":"text","text":"\n\n```python"}

data: {"type":"result","output":"Here's a hello world function:\n\n```python\ndef hello():\n    print(\"Hello, World!\")\n```","total_cost_usd":0.0015,"input_tokens":50,"output_tokens":30}
```

**Error During Streaming**

If an error occurs after streaming has started:

```
data: {"type":"error","error":"Connection timeout"}
```

---

## Query Endpoints

Stateless queries that don't maintain conversation context.

### POST /query

Execute a one-off query (blocking).

**Request Body**

Same fields as `/sessions/:id/messages`.

**Example Request**

```bash
curl -X POST http://localhost:3000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is 2 + 2?",
    "model": "haiku"
  }'
```

**Response (200 OK)**

```json
{
  "output": "2 + 2 = 4",
  "totalCostUsd": 0.0001,
  "inputTokens": 10,
  "outputTokens": 8
}
```

---

### POST /query/stream

Execute a one-off query with SSE streaming.

**Request Body**

Same fields as `/sessions/:id/messages`.

**Example Request**

```bash
curl -X POST http://localhost:3000/api/v1/query/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Count to 5"}' \
  --no-buffer
```

**Response**

Same SSE format as `/sessions/:id/messages/stream`.

---

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // Optional additional details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `SESSION_NOT_FOUND` | 404 | Session with given ID does not exist |
| `INVALID_REQUEST` | 400 | Request validation failed |
| `CLI_ERROR` | 500 | Error executing Claude CLI |
| `CLI_TIMEOUT` | 504 | CLI execution timed out |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Request Body Schema

### QueryRequest / SendMessageRequest

```typescript
{
  // Required
  prompt: string;              // The message/query to send

  // Model selection
  model?: string;              // "sonnet" | "opus" | "haiku" | full model name
  fallbackModel?: string;      // Fallback if primary model unavailable

  // System prompts
  systemPrompt?: string;       // Replace default system prompt
  appendSystemPrompt?: string; // Append to default system prompt

  // Tool control
  tools?: string[];            // Specific tools to use
  allowedTools?: string[];     // Whitelist of allowed tools
  disallowedTools?: string[];  // Blacklist of disallowed tools
  permissionMode?: string;     // Tool permission mode

  // Cost control
  maxBudgetUsd?: number;       // Maximum cost in USD

  // Advanced options
  agent?: string;              // Agent to use
  agents?: object;             // Agent configuration
  jsonSchema?: object;         // JSON schema for structured output
  addDirs?: string[];          // Additional directories to include
  mcpConfig?: object[];        // MCP server configuration
  pluginDirs?: string[];       // Plugin directories
  betas?: string[];            // Beta features to enable
  verbose?: boolean;           // Enable verbose output
  settingSources?: string[];   // Settings sources
  settings?: string | object;  // Settings override
  strictMcpConfig?: boolean;   // Strict MCP configuration
  disableSlashCommands?: boolean; // Disable slash commands
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_PATH` | ./data/sessions.db | SQLite database path |
| `CLI_TIMEOUT` | 120000 | CLI timeout (ms) |
| `DEFAULT_MODEL` | sonnet | Default Claude model |
| `LOG_LEVEL` | info | Log level (error/warn/info/debug) |
| `LOG_FILE` | ./logs/api.log | Log file path |
| `ALLOWED_ORIGINS` | localhost:3000,localhost:5173 | CORS allowed origins (comma-separated) |

---

## Examples

### JavaScript/TypeScript

```typescript
// Blocking query
const response = await fetch('http://localhost:3000/api/v1/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Hello, Claude!' })
});
const result = await response.json();
console.log(result.output);

// Streaming query
const response = await fetch('http://localhost:3000/api/v1/query/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Write a poem' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'text') {
        process.stdout.write(event.text);
      }
    }
  }
}
```

### Python

```python
import requests

# Blocking query
response = requests.post(
    'http://localhost:3000/api/v1/query',
    json={'prompt': 'Hello, Claude!'}
)
print(response.json()['output'])

# Streaming query
response = requests.post(
    'http://localhost:3000/api/v1/query/stream',
    json={'prompt': 'Write a poem'},
    stream=True
)

for line in response.iter_lines():
    if line.startswith(b'data: '):
        import json
        event = json.loads(line[6:])
        if event.get('type') == 'text':
            print(event['text'], end='', flush=True)
```

### curl

```bash
# Create session
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"id": "my-chat"}'

# Send message
curl -X POST http://localhost:3000/api/v1/sessions/my-chat/messages \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What can you help me with?"}'

# Stream response
curl -X POST http://localhost:3000/api/v1/sessions/my-chat/messages/stream \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Tell me a story"}' \
  --no-buffer

# Delete session
curl -X DELETE http://localhost:3000/api/v1/sessions/my-chat
```
