# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paint Together is a real-time collaborative drawing application built with Node.js, Express, and Socket.io. Users can create or join password-protected rooms and draw together in real-time with synchronized canvas state across all connected clients.

The project also includes a Python-based AI documentation automation system that runs via GitHub Actions to automatically update README.md and CHANGELOG.md on every push.

## Architecture

### Real-time Communication Flow

The application uses Socket.io for bidirectional real-time communication:

1. **Client connects** → Server assigns socket ID
2. **User joins room** → Server validates password, adds user to room Map, sends current drawing state
3. **User draws** → Client emits draw event → Server broadcasts to all other users in room → All clients render the line
4. **User clears canvas** → Server clears room's drawingData array → Broadcasts clear event to all clients
5. **User disconnects** → Server removes user from room, deletes room if empty

### Server State Management

- **rooms Map**: `roomName → { password, users: Map(socketId → username), drawingData: [] }`
- **Drawing data**: Array of line segments `{ x0, y0, x1, y1, color, size }`
- **Room lifecycle**: Created on first join, deleted when last user leaves
- **Socket properties**: Each socket gets `socket.roomName` and `socket.username` attached on join

### Client Architecture

- **Canvas rendering**: HTML5 Canvas with 2D context, lines drawn with `lineCap: 'round'` and `lineJoin: 'round'`
- **Drawing state**: Tracks `isDrawing`, `currentColor`, `currentSize`, `isEraser`
- **Event handling**: Supports both mouse and touch events for mobile compatibility
- **State sync**: On room join, replays entire `drawingData` array to reconstruct canvas

## Development Commands

### Running the Application

```bash
# Start server (production)
npm start

# Start with auto-reload (development)
npm run dev

# Custom port
PORT=8080 npm start
```

The server runs on `http://localhost:3000` by default.

### Python Documentation System

The AI documentation automation requires Python 3.10+:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Manual documentation generation
python src/main.py --commit HEAD
python src/main.py --commit <commit-hash>
python src/main.py --range HEAD~5..HEAD
python src/main.py --only-readme
python src/main.py --only-changelog
```

## Key Implementation Details

### Room Password System

Rooms are password-protected but passwords are stored in plain text in memory (not persisted). When a user tries to join an existing room, the server compares the provided password with `room.password`. This is intentionally simple for a demo app.

### Drawing Synchronization

Each draw event contains a line segment (start point, end point, color, size). The server:
1. Appends to `room.drawingData` for state persistence
2. Broadcasts to other clients via `socket.to(roomName).emit('draw', data)`

New users receive the entire `drawingData` array on join to reconstruct the canvas.

### Canvas Clearing

When a user clears the canvas:
1. Server sets `room.drawingData = []`
2. Server broadcasts to ALL clients in room (including sender) via `io.to(roomName).emit('clear-canvas')`
3. All clients execute `ctx.clearRect(0, 0, canvas.width, canvas.height)`

### Eraser Implementation

The eraser is implemented by drawing white lines (`#FFFFFF`). This means:
- Eraser only works on white backgrounds
- Erasing doesn't actually remove data, it adds white lines to `drawingData`
- If background color changes, old "erased" areas will show white lines

## File Structure

```
server.js              # Socket.io server, room management, event handlers
public/
  index.html          # Two-screen UI: login and canvas
  app.js              # Client-side Socket.io, canvas drawing, event handling
  style.css           # Responsive styles
src/                  # Python documentation automation
  main.py             # Entry point for doc generation
  mcp_client.py       # MCP server client
  ai_analyzer.py      # Claude API integration
  doc_generator.py    # Documentation generator
  git_utils.py        # Git utilities
config/
  prompts.json        # AI prompts for documentation
  mcp_config.json     # MCP server configuration
```

## Common Modifications

### Adding New Drawing Tools

1. Add UI control in `public/index.html`
2. Add state variable in `public/app.js` (e.g., `let currentTool = 'brush'`)
3. Modify draw event emission to include tool type
4. Update `drawLine()` function or add new rendering function
5. Update server to broadcast new data structure

### Changing Canvas Behavior

Canvas is dynamically sized in `resizeCanvas()` with max dimensions 1200x700. Resizing clears the canvas, so the function resets `ctx.lineCap` and `ctx.lineJoin` but doesn't redraw content.

### Adding Room Features

Room data structure is in `server.js` line 14. To add features like room settings or permissions, extend the room object created at line 33-37.

## Testing Considerations

- **Multi-user testing**: Open multiple browser windows/tabs to test real-time sync
- **Mobile testing**: Use touch events on actual mobile devices, not just browser dev tools
- **Network latency**: Drawing events are not throttled, so high-frequency events on slow networks may cause lag
- **Room cleanup**: Verify rooms are deleted when empty by checking server logs

## AI Documentation System

The GitHub Action (`.github/workflows/auto-docs.yml`) triggers on push to main/develop. It:
1. Fetches git diff via MCP GitHub server
2. Sends diff to Omniroute API (Claude via OpenAI-compatible endpoint) for analysis
3. Generates updated README.md and CHANGELOG.md
4. Commits changes back to the repository

Requires GitHub Secrets:
- `OMNIROUTE_API_KEY` - your Omniroute API key
- `OMNIROUTE_BASE_URL` - Omniroute endpoint (e.g., `https://api.omniroute.ai/v1`)
- `GITHUB_TOKEN` - automatically provided by GitHub Actions

### Setting up GitHub Secrets

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add `OMNIROUTE_API_KEY` with your API key
5. Add `OMNIROUTE_BASE_URL` with the endpoint URL
