import subprocess
from typing import Dict, Optional

def get_commit_diff(commit_hash: str = 'HEAD') -> str:
    """Get the diff for a specific commit."""
    try:
        result = subprocess.run(
            ['git', 'show', commit_hash, '--format=', '--unified=3'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to get commit diff: {e.stderr}")

def get_commit_info(commit_hash: str = 'HEAD') -> Dict[str, str]:
    """Get commit metadata (message, author, date, hash)."""
    try:
        format_str = '%H%n%an%n%ae%n%ad%n%s%n%b'
        result = subprocess.run(
            ['git', 'show', '-s', f'--format={format_str}', commit_hash],
            capture_output=True,
            text=True,
            check=True
        )

        lines = result.stdout.strip().split('\n')

        return {
            'hash': lines[0] if len(lines) > 0 else '',
            'author': lines[1] if len(lines) > 1 else '',
            'email': lines[2] if len(lines) > 2 else '',
            'date': lines[3] if len(lines) > 3 else '',
            'subject': lines[4] if len(lines) > 4 else '',
            'body': '\n'.join(lines[5:]) if len(lines) > 5 else ''
        }
    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to get commit info: {e.stderr}")

def get_current_branch() -> str:
    """Get the current git branch name."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to get current branch: {e.stderr}")

def get_repo_root() -> str:
    """Get the root directory of the git repository."""
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to get repo root: {e.stderr}")
