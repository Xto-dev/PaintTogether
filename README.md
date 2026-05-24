# 🎨 Paint Together

Real-time collaborative drawing application with AI-powered automatic documentation.

## Project Description

Paint Together is a web-based collaborative drawing application that allows multiple users to draw together in real-time. Users can create or join password-protected rooms and see each other's drawings instantly synchronized across all connected clients.

The project also demonstrates a practical implementation of AI-powered documentation automation using Claude API (via Omniroute), MCP servers, and GitHub Actions.

## Features

### Core Drawing Features
- **Real-time collaboration**: Draw with multiple users simultaneously
- **Room-based system**: Create or join rooms with name and password protection
- **Drawing tools**:
  - Color picker
  - Adjustable brush size (1-50px)
  - Eraser tool
  - Clear canvas (synchronized for all users)
- **User management**: See who's online in your room
- **Responsive design**: Works on desktop and mobile devices with proper canvas scaling
- **Touch support**: Draw with touch on mobile devices
- **High-DPI support**: Improved rendering quality on retina and high-resolution displays

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

1. Enter your name
2. Enter a room name (create new or join existing)
3. Enter a room password
4. Click "Join Room"
5. Start drawing!

## Room System

- **Creating a room**: Enter a new room name and set a password
- **Joining a room**: Enter an existing room name with the correct password
- **Room persistence**: Rooms exist as long as at least one user is connected
- **Auto-cleanup**: Empty rooms are automatically deleted
- **Password protection**: Rooms are password-protected (stored in memory, not persisted)

## Drawing Controls

- **Draw**: Click and drag on the canvas (or touch on mobile)
- **Change color**: Use the color picker
- **Adjust brush size**: Use the size slider (1-50px)
- **Erase**: Click "Eraser" button to toggle eraser mode
- **Clear canvas**: Click "Clear Canvas" to remove all drawings (affects all users)

## Technical Details

### Canvas Rendering

The application uses an improved canvas rendering system that provides:

- **Coordinate scaling**: Mouse and touch coordinates are properly scaled to match the canvas's internal resolution, ensuring accurate drawing regardless of display size
- **Responsive sizing**: Canvas automatically adjusts to window size while maintaining aspect ratio (max 1200x700)
- **CSS sizing**: Explicit CSS dimensions prevent browser scaling artifacts
- **Drawing preservation**: Canvas content is maintained during window resize events

This ensures consistent drawing quality across different screen sizes and pixel densities.

## Configuration

### Server Configuration

Default port is 3000. Change it via environment variable:

```bash
PORT=8080 npm start
```

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
│   ├── index.html                 # Main HTML file
│   ├── style.css                  # Styles
│   └── app.js                     # Client-side JavaScript
├── src/                           # Python documentation automation
│   ├── main.py                    # Entry point for doc generation
│   ├── mcp_client.py              # MCP server client
│   ├── ai_analyzer.py             # Omniroute/Claude API integration
│   ├── doc_generator.py           # Documentation generator
│   └── git_utils.py               # Git utilities
├── config/
│   ├── mcp_config.json            # MCP server configuration
│   └── prompts.json               # AI prompts for documentation
├── server.js                      # Node.js server
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
4. Resize the browser window to verify drawing accuracy is maintained

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

## Contact

For questions or issues, please create an issue in the repository.

---

**Last updated**: 2026-05-24  
*This README is automatically updated by AI on every commit.*