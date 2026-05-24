import os
import re
from datetime import datetime
from typing import Dict
from ai_analyzer import AIAnalyzer

class DocumentationGenerator:
    def __init__(self, analyzer: AIAnalyzer):
        self.analyzer = analyzer
        self.repo_root = self._get_repo_root()

    def _get_repo_root(self) -> str:
        """Get repository root directory."""
        current = os.path.dirname(os.path.abspath(__file__))
        while current != os.path.dirname(current):
            if os.path.exists(os.path.join(current, '.git')):
                return current
            current = os.path.dirname(current)
        return os.getcwd()

    def update_readme(self, diff: str, commit_info: Dict[str, str]) -> None:
        """Update README.md based on code changes."""
        readme_path = os.path.join(self.repo_root, 'README.md')

        current_readme = ''
        if os.path.exists(readme_path):
            with open(readme_path, 'r', encoding='utf-8') as f:
                current_readme = f.read()

        updated_readme = self.analyzer.analyze_for_readme(diff, current_readme)

        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write(updated_readme)

    def update_changelog(self, diff: str, commit_info: Dict[str, str]) -> None:
        """Update CHANGELOG.md with new entry."""
        changelog_path = os.path.join(self.repo_root, 'CHANGELOG.md')

        current_changelog = ''
        if os.path.exists(changelog_path):
            with open(changelog_path, 'r', encoding='utf-8') as f:
                current_changelog = f.read()

        new_entry = self.analyzer.analyze_for_changelog(diff, commit_info)

        updated_changelog = self._insert_changelog_entry(current_changelog, new_entry)

        with open(changelog_path, 'w', encoding='utf-8') as f:
            f.write(updated_changelog)

    def _insert_changelog_entry(self, current_changelog: str, new_entry: str) -> str:
        """Insert new changelog entry in the correct position."""
        unreleased_pattern = r'## \[Unreleased\]'

        match = re.search(unreleased_pattern, current_changelog)

        if match:
            insert_pos = match.end()
            next_section = re.search(r'\n## \[', current_changelog[insert_pos:])

            if next_section:
                insert_pos += next_section.start()
            else:
                insert_pos = len(current_changelog)

            updated = (
                current_changelog[:insert_pos] +
                '\n\n' + new_entry.strip() + '\n' +
                current_changelog[insert_pos:]
            )
            return updated
        else:
            return current_changelog + '\n\n' + new_entry
