# 🎨 Paint Together

Real-time collaborative drawing application with layers, advanced brush tools, and AI-powered automatic documentation.

## Project Description

Paint Together is a web-based collaborative drawing application that allows multiple users to draw together in real-time. Users can create or join password-protected rooms and see each other's drawings instantly synchronized across all connected clients. The application features a professional layer system, multiple brush types, live cursor tracking, and undo/redo functionality.

The project also demonstrates a practical implementation of AI-powered documentation automation using Claude API (via Omniroute), MCP servers, and GitHub Actions.

## Features

### Core Drawing Features
- **Real-time collaboration**: Draw with multiple users simultaneously
- **Live cursor tracking**: See other users' cursors in real-time with their names and current tool
- **Room-based system**: Create or join rooms with name and password protection
- **Layer system**:
  - Multiple independent drawing layers
  - Layer visibility toggle
  - Per-layer opacity control (0-100%)
  - Drag-and-drop layer reordering
  - Layer renaming (double-click layer name)
  - Add/delete layers (minimum 1 layer required)
- **Advanced brush tools**:
  - Normal brush - standard round brush
  - Calligraphy brush - pressure-sensitive angled strokes
  - Marker brush - semi-transparent wide strokes
  - Adjustable brush size (1-200px)
  - Opacity control (10-100%)
  - Smoothing control (0-10) for stabilized strokes
- **Drawing tools**:
  - Color picker
  - Eyedropper tool - pick colors from canvas
  - Eraser tool with visual indicator
  - Custom brush cursor showing size and mode
  - Clear canvas (synchronized for all users)
- **Undo/Redo**:
  - Up to 50 undo steps per layer
  - Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)
  - Synchronized across all users
- **User management**: See who's online in your room
- **Responsive design**: Works on desktop and mobile devices with proper canvas scaling
- **Touch support**: Draw with touch on mobile devices
- **High-resolution canvas**: Fixed 1600x900 internal resolution with responsive display scaling
- **Drawing persistence**: Canvas content is preserved during window resize
- **Performance optimization**: Draw batching reduces network traffic

### AI Documentation System
This project includes an automated documentation system that:
- Automatically updates README.md when code changes
- Generates CHANGELOG.md with semantic versioning
- Analyzes git diffs and creates human-readable documentation
- Runs via GitHub Actions on every push to main/develop branches
- Uses Omniroute API (OpenAI-compatible endpoint) for Claude access

## Tech Stack

### Application
- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Real-time communication**: WebSocket (Socket.io)

### Documentation System
- **Python 3.10+** - documentation automation scripts
- **GitHub Actions** - CI/CD for auto-documentation
- **Omniroute API** - Claude API access via OpenAI-compatible endpoint
- **MCP Servers** - GitHub and filesystem integration
- **GitPython** - Git operations in Python

## Installation

### Prerequisites
- Node.js 14+
- npm or yarn
- Python 3.10+ (for documentation automation)
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/paint-together.git
cd paint-together
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies (for documentation automation):
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your API keys
```

Required environment variables:
- `OMNIROUTE_API_KEY` - Your Omniroute API key
- `OMNIROUTE_BASE_URL` - Omniroute endpoint (default: http://localhost:20128/v1)
- `GITHUB_TOKEN` - GitHub token for MCP server (optional for local use)
- `PORT` - Server port (default: 3000)

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. Open your browser:
```
http://localhost:3000
```

## How to Use

### Getting Started

1. Enter your name
2. Enter a room name (create new or join existing)
3. Enter a room password
4. Click "Join Room"
5. Start drawing!

You'll see other users' cursors moving in real-time, labeled with their names and showing their current tool (brush color or eraser).

### Drawing Controls

- **Draw**: Click and drag on the canvas (or touch on mobile)
- **Change color**: Use the color picker or eyedropper tool
- **Adjust brush size**: Use the size slider (1-200px)
- **Select brush type**: Choose from Normal, Calligraphy, or Marker
- **Adjust opacity**: Use the opacity slider (10-100%)
- **Adjust smoothing**: Use the smoothing slider (0-10) for stroke stabilization
- **Pick color**: Click "Eyedropper" button, then click on canvas to sample color
- **Erase**: Click "Eraser" button to toggle eraser mode
- **Clear canvas**: Click "Clear Canvas" to remove all drawings (affects all users)
- **Undo/Redo**: Use Ctrl+Z to undo, Ctrl+Y or Ctrl+Shift+Z to redo

### Layer Management

The layers panel on the left side provides full layer control:

- **Add layer**: Click "+ Add Layer" button
- **Select layer**: Click on a layer to make it active (blue highlight)
- **Rename layer**: Double-click the layer name, type new name, press Enter
- **Toggle visibility**: Click the eye icon (👁) to show/hide layer
- **Adjust opacity**: Drag the opacity slider for each layer
- **Reorder layers**: Drag and drop layers to change drawing order
- **Delete layer**: Click the × button (requires at least 1 layer)

Layers are drawn from bottom to top, with the topmost layer in the list appearing on top of the canvas.

## Room System

- **Creating a room**: Enter a new room name and set a password
- **Joining a room**: Enter an existing room name with the correct password
- **Room persistence**: Rooms exist as long as at least one user is connected
- **Auto-cleanup**: Empty rooms are automatically deleted
- **Password protection**: Rooms are password-protected (stored in memory, not persisted)
- **State synchronization**: New users receive complete layer data, drawing history, and existing cursor positions

## Technical Details

### Layer System Architecture

The application uses a sophisticated layer rendering system:

- **Independent layer canvases**: Each layer has its own off-screen canvas for efficient rendering
- **Composite rendering**: Layers are composited to the main canvas on each frame
- **Layer properties**: Each layer stores visibility, opacity, name, and drawing data
- **Synchronized state**: Layer operations (add, delete, reorder, update) are broadcast to all users
- **Performance optimization**: Only visible layers are rendered, and compositing is scheduled via requestAnimationFrame

### Advanced Brush System

The brush system provides multiple rendering modes:

- **Normal brush**: Standard round brush with configurable size and opacity
- **Calligraphy brush**: Simulates angled pen strokes with variable width based on stroke direction
- **Marker brush**: Semi-transparent wide strokes with 30% base opacity for layering effects
- **Eraser mode**: Uses destination-out compositing to remove pixels from the current layer
- **Smoothing**: Averages recent cursor positions to stabilize hand-drawn strokes
- **Custom cursor**: Visual feedback shows brush size and mode (normal or eraser)

### Canvas Rendering

The application uses a high-resolution canvas rendering system:

- **Fixed internal resolution**: Canvas uses a fixed 1600x900 pixel resolution for consistent drawing quality
- **Normalized coordinates**: All drawing coordinates are stored as normalized values (0-1 range) for resolution independence
- **Responsive display**: Canvas display size scales responsively while maintaining 16:9 aspect ratio
- **Coordinate scaling**: Mouse and touch coordinates are properly scaled between display size and internal resolution
- **Boundary clamping**: Coordinates are clamped to canvas bounds to prevent drawing outside the canvas
- **Drawing preservation**: Canvas content is automatically redrawn when window is resized
- **Smooth rendering**: Uses round line caps and joins for smooth brush strokes

### Real-time Cursor Tracking

The cursor tracking system provides live collaboration feedback:

- **Position updates**: Cursor positions are broadcast to all room members on mouse/touch movement
- **Visual indicators**: Each user's cursor shows their name, current color, and tool state
- **Eraser visualization**: Eraser cursors display a distinct icon instead of a color dot
- **Smooth transitions**: CSS transitions provide smooth cursor movement
- **Automatic cleanup**: Cursors are removed when users disconnect
- **State synchronization**: New users receive existing cursor positions on room join

### Performance Optimizations

- **Draw batching**: Drawing operations are batched and sent every 16ms (60fps) to reduce network traffic
- **Scheduled compositing**: Layer compositing uses requestAnimationFrame to avoid redundant renders
- **Off-screen rendering**: Each layer renders to its own canvas, avoiding full redraws
- **Coordinate normalization**: Normalized coordinates reduce data size in network messages

### Undo/Redo System

- **Per-layer history**: Each layer maintains its own undo/redo stack
- **State snapshots**: Complete drawing data is saved on stroke completion
- **Stack limits**: Maximum 50 undo steps to prevent memory issues
- **Synchronized operations**: Undo/redo actions are broadcast to all users
- **Keyboard shortcuts**: Standard Ctrl+Z (undo) and Ctrl+Y/Ctrl+Shift+Z (redo)

### Socket.io Events

**Client → Server:**
- `join-room`: Join or create a room with username, room name, and password
- `draw`: Send single drawing operation (deprecated, use draw-batch)
- `draw-batch`: Send batched drawing operations for performance
- `cursor-move`: Send cursor position and tool state (normalized coordinates)
- `clear-canvas`: Request to clear all layers for all users
- `add-layer`: Request to create a new layer
- `delete-layer`: Request to delete a layer by ID
- `update-layer`: Update layer properties (name, visibility, opacity)
- `reorder-layers`: Update layer order
- `undo`: Broadcast undo operation with updated layer data
- `redo`: Broadcast redo operation with updated layer data

**Server → Client:**
- `room-joined`: Confirmation with room info, user list, layer data, and cursor positions
- `user-joined`: Notification when a user joins the room
- `user-left`: Notification when a user leaves (includes socketId for cursor cleanup)
- `draw`: Broadcast single drawing operation to other users
- `draw-batch`: Broadcast batched drawing operations to other users
- `cursor-move`: Broadcast cursor position and tool state
- `clear-canvas`: Broadcast canvas clear command
- `layer-added`: Broadcast new layer creation
- `layer-deleted`: Broadcast layer deletion
- `layer-updated`: Broadcast layer property changes
- `layers-reordered`: Broadcast layer order changes
- `undo`: Broadcast undo operation
- `redo`: Broadcast redo operation
- `error`: Error messages (wrong password, etc.)

## Configuration

### Server Configuration

Default port is 3000. Change it via environment variable:

```bash
PORT=8080 npm start
```

### Canvas Configuration

Canvas dimensions are defined in `public/app.js`:
- Internal resolution: 1600x900 pixels
- Display size: Responsive, max 1200px width, maintains 16:9 aspect ratio

### Brush Configuration

Brush parameters in `public/app.js`:
- Size range: 1-200 pixels
- Opacity range: 10-100%
- Smoothing range: 0-10 points
- Undo stack limit: 50 steps

### Documentation System Configuration

The documentation system can be configured through:

1. **Prompts** (`config/prompts.json`): Customize AI prompts for README, CHANGELOG, and inline comments
2. **MCP Servers** (`config/mcp_config.json`): Configure MCP server connections
3. **Environment variables** (`.env`): API keys and endpoints

## AI Documentation Setup

### Local Testing

Test documentation generation locally:

```bash
# Analyze the latest commit
python src/main.py --commit HEAD

# Analyze a specific commit
python src/main.py --commit abc123

# Analyze a range of commits
python src/main.py --range HEAD~5..HEAD

# Generate only README
python src/main.py --only-readme

# Generate only CHANGELOG
python src/main.py --only-changelog
```

### GitHub Actions Setup

To enable automatic documentation on every push:

1. Go to your repository Settings → Secrets and variables → Actions

2. Add the following secrets:
   - `OMNIROUTE_API_KEY` - Your Omniroute API key
   - `OMNIROUTE_BASE_URL` - Omniroute endpoint URL
   - `GITHUB_TOKEN` - Automatically provided by GitHub Actions

3. The workflow (`.github/workflows/auto-docs.yml`) will:
   - Trigger on push to main/develop branches
   - Fetch git diff via MCP GitHub server
   - Send diff to Omniroute API for analysis
   - Generate updated README.md and CHANGELOG.md
   - Commit changes back to the repository

See `AI-Documentation-Bot-Project.md` for detailed documentation system architecture.

## Project Structure

```
paint-together/
├── .github/
│   └── workflows/
│       └── auto-docs.yml          # GitHub Action for auto-documentation
├── .claude/
│   └── settings.local.json        # Claude settings (WebSearch enabled)
├── public/
│   ├── index.html                 # Main HTML with layer panel
│   ├── style.css                  # Styles with layer UI and brush cursor
│   └── app.js                     # Client with layers, brushes, undo/redo
├── src/                           # Python documentation automation
│   ├── main.py                    # Entry point for doc generation
│   ├── mcp_client.py              # MCP server client
│   ├── ai_analyzer.py             # Omniroute/Claude API integration
│   ├── doc_generator.py           # Documentation generator
│   └── git_utils.py               # Git utilities
├── config/
│   ├── mcp_config.json            # MCP server configuration
│   └── prompts.json               # AI prompts for documentation
├── server.js                      # Node.js server with layer management
├── package.json                   # Node dependencies
├── requirements.txt               # Python dependencies
├── .env.example                   # Example environment variables
├── .gitignore                     # Git ignore rules
├── README.md                      # This file (auto-updated)
├── CHANGELOG.md                   # Auto-generated changelog
├── CLAUDE.md                      # Claude Code guidance
├── QUICKSTART.md                  # Quick start guide
└── AI-Documentation-Bot-Project.md # Documentation system architecture
```

## Documentation Files

- **README.md** - Main project documentation (auto-updated)
- **CHANGELOG.md** - Version history (auto-generated)
- **CLAUDE.md** - Guidance for Claude Code when working with this repository
- **QUICKSTART.md** - Quick start guide for developers
- **AI-Documentation-Bot-Project.md** - Detailed documentation system architecture

## Development

### Running Tests

Currently, the project does not include automated tests. Contributions for test coverage are welcome.

### Manual Testing

To test the collaborative drawing:
1. Open multiple browser windows/tabs
2. Join the same room with the same password
3. Draw in one window and verify it appears in others
4. Test layer operations (add, delete, reorder, visibility, opacity)
5. Test different brush types and settings
6. Test undo/redo with Ctrl+Z and Ctrl+Y
7. Test eyedropper tool by picking colors from the canvas
8. Move your cursor and verify it appears in other windows with your name
9. Switch between brush and eraser to verify cursor icon changes
10. Resize the browser window to verify drawing accuracy is maintained

To test documentation generation:
1. Make code changes and commit
2. Run `python src/main.py --commit HEAD`
3. Verify README.md and CHANGELOG.md are updated

## Troubleshooting

### Port Already in Use
```bash
# Change the port
PORT=8080 npm start
```

### Drawing Appears Offset or Inaccurate
The canvas coordinate scaling system should handle this automatically. If issues persist:
- Clear your browser cache
- Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for JavaScript errors

### Layers Not Syncing
- Verify Socket.io connection in browser console
- Check that all users are in the same room
- Ensure layer events are being sent (check Network tab)
- Try refreshing the page to resync with server state

### Cursors Not Appearing
- Verify Socket.io connection in browser console
- Check that multiple users are in the same room
- Ensure cursor-move events are being sent (check Network tab)

### Undo/Redo Not Working
- Verify you have made at least one stroke before attempting undo
- Check that keyboard shortcuts are not being intercepted by browser
- Ensure you are on the correct layer (undo is per-layer)

### Brush Cursor Not Visible
- Move mouse over the canvas area
- Check that canvas is not in eyedropper mode
- Verify CSS is loaded correctly

### Python Script Errors
```bash
# Verify dependencies are installed
pip install -r requirements.txt

# Check environment variables
cat .env
```

### GitHub Action Not Running
- Verify secrets are configured in repository settings
- Check that push is to main or develop branch
- Review logs in Actions tab

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

Areas for contribution:
- Automated tests for drawing and layer operations
- Additional brush types and effects
- Export/import functionality for drawings
- User authentication and persistent rooms
- Mobile UI improvements

## Contact

For questions or issues, please create an issue in the repository.

---

**Last updated**: 2026-05-24  
*This README is automatically updated by AI on every commit.*
```

Updated the README to comprehensively document the new layer system, advanced brush tools, undo/redo functionality, eyedropper tool, and performance optimizations. The structure maintains clarity while adding detailed explanations of the new features and their usage.