# Claude Code REST API

REST API wrapper for the Claude Code CLI, providing HTTP endpoints for all CLI functionality.

## Prerequisites

- **Node.js 20 LTS** (required for better-sqlite3 compatibility)
- **Claude Code CLI** installed and authenticated
- **npm** or **yarn**

## Quick Start

### 1. Install Node 20 (if needed)

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `config.yaml` or set environment variables as needed.

### 4. Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run test:coverage

# Watch mode for TDD
npm run test:watch
```

### 5. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### Sessions

- `POST /api/v1/sessions` - Create new session
- `GET /api/v1/sessions` - List all sessions
- `GET /api/v1/sessions/:id` - Get session details
- `DELETE /api/v1/sessions/:id` - Delete session
- `POST /api/v1/sessions/:id/messages` - Send message (blocking)
- `POST /api/v1/sessions/:id/messages/stream` - Send message (streaming)

### Queries

- `POST /api/v1/query` - Execute query (blocking)
- `POST /api/v1/query/stream` - Execute query (streaming)

### Health

- `GET /api/v1/health` - Health check
- `GET /api/v1/info` - System information

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_PATH` - Database file path (default: ./data/sessions.db)
- `CLI_TIMEOUT` - CLI execution timeout in ms (default: 120000)
- `DEFAULT_MODEL` - Default Claude model (default: sonnet)
- `LOG_LEVEL` - Logging level (default: info)
- `LOG_FILE` - Log file path (default: ./logs/api.log)

### config.yaml

See `config.yaml` for full configuration options.

## Development

### Test-Driven Development

This project uses TDD with red-green-refactor cycles:

```bash
# Watch tests while developing
npm run test:watch
```

### Architecture

3-layer architecture:
- **Routes** - HTTP endpoints
- **Services** - Business logic
- **Infrastructure** - Database, CLI executor, queue

See `.artifacts/claude-code-rest-api/design.md` for full architecture details.

## Project Structure

```
src/
├── config/          # Configuration loading
├── routes/          # HTTP routes
├── services/        # Business logic
├── infrastructure/  # External integrations
├── middleware/      # Express middleware
├── types/           # TypeScript type definitions
└── utils/           # Utility functions

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── e2e/             # End-to-end tests
```

## License

MIT
