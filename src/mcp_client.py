import json
import subprocess
from typing import Dict, Any, List

class MCPClient:
    """Client for interacting with MCP (Model Context Protocol) servers."""

    def __init__(self, config_path: str = None):
        if config_path is None:
            import os
            config_path = os.path.join(
                os.path.dirname(__file__),
                '..',
                'config',
                'mcp_config.json'
            )

        with open(config_path, 'r') as f:
            self.config = json.load(f)

    def call_github_server(self, method: str, params: Dict[str, Any]) -> Any:
        """Call GitHub MCP server with specified method and parameters."""
        server_config = self.config['servers']['github']

        request = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": method,
            "params": params
        }

        try:
            result = subprocess.run(
                [server_config['command']] + server_config['args'],
                input=json.dumps(request),
                capture_output=True,
                text=True,
                env={**subprocess.os.environ, **server_config.get('env', {})}
            )

            if result.returncode != 0:
                raise Exception(f"MCP server error: {result.stderr}")

            response = json.loads(result.stdout)

            if 'error' in response:
                raise Exception(f"MCP error: {response['error']}")

            return response.get('result')

        except Exception as e:
            raise Exception(f"Failed to call MCP server: {str(e)}")

    def get_file_content(self, path: str) -> str:
        """Get file content from repository."""
        return self.call_github_server('files/read', {'path': path})

    def list_files(self, path: str = '.') -> List[str]:
        """List files in repository."""
        return self.call_github_server('files/list', {'path': path})

    def get_commit_diff(self, commit_hash: str) -> str:
        """Get diff for a specific commit."""
        return self.call_github_server('git/diff', {'commit': commit_hash})
