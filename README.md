# 🎨 Paint Together

Real-time collaborative drawing application with AI-powered automatic documentation.

## Project Description

Paint Together is a web-based collaborative drawing application that allows multiple users to draw together in real-time. Users can create or join password-protected rooms and see each other's drawings instantly synchronized across all connected clients.

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
- **Responsive design**: Works on desktop and mobile devices
- **Touch support**: Draw with touch on mobile devices

### AI Documentation System
This project includes an automated documentation system that:
- Automatically updates README.md when code changes
- Generates CHANGELOG.md with semantic versioning
- Analyzes git diffs and creates human-readable documentation
- Runs via GitHub Actions on every push

## Tech Stack

### Application
- **Backend**: Node.js, Express, Socket.io
- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Real-time communication**: WebSocket (Socket.io)

### Documentation System
- **Python 3.10+** - documentation automation scripts
- **GitHub Actions** - CI/CD for auto-documentation
- **Claude API** - AI-powered code analysis
- **MCP Servers** - GitHub and filesystem integration

## Installation

### Prerequisites
- Node.js 14+
- npm or yarn
- Git

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/paint-together.git
cd paint-together
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. Open your browser:
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

## Drawing Controls

- **Draw**: Click and drag on the canvas (or touch on mobile)
- **Change color**: Use the color picker
- **Adjust brush size**: Use the size slider
- **Erase**: Click "Eraser" button to toggle eraser mode
- **Clear canvas**: Click "Clear Canvas" to remove all drawings (affects all users)

## Configuration

Default port is 3000. Change it via environment variable:

```bash
PORT=8080 npm start
```

## AI Documentation Setup

To enable automatic documentation:

1. Set up GitHub Secrets:
   - `CLAUDE_API_KEY` - your Claude API key
   - `GITHUB_TOKEN` - automatically available in Actions

2. The GitHub Action will run on every push to main/develop

3. Documentation will be automatically updated and committed back

See `AI-Documentation-Bot-Project.md` for detailed documentation system architecture.

## Project Structure

```
paint-together/
├── .github/
│   └── workflows/
│       └── auto-docs.yml          # GitHub Action for auto-documentation
├── public/
│   ├── index.html                 # Main HTML file
│   ├── style.css                  # Styles
│   └── app.js                     # Client-side JavaScript
├── src/
│   ├── main.py                    # Documentation automation script
│   ├── mcp_client.py              # MCP server client
│   ├── ai_analyzer.py             # Claude API integration
│   └── doc_generator.py           # Documentation generator
├── config/
│   ├── mcp_config.json            # MCP server configuration
│   └── prompts.json               # AI prompts
├── server.js                      # Node.js server
├── package.json                   # Node dependencies
├── requirements.txt               # Python dependencies
├── README.md                      # This file (auto-updated)
└── CHANGELOG.md                   # Auto-generated changelog
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Last updated**: 2026-05-24
