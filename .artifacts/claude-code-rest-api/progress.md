# Claude Code REST API - Progress

## Status
Phase: Discovery
Started: 2026-01-13
Last Updated: 2026-01-13

## Checklist
- [x] Discovery
- [x] Codebase Exploration
- [ ] Requirements
- [ ] Architecture Design
- [ ] Implementation
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
