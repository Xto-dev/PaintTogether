import json
import os
from typing import Dict, Any
from openai import OpenAI

class AIAnalyzer:
    def __init__(self, api_key: str, base_url: str = None):
        # Omniroute uses OpenAI-compatible API
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url or os.getenv('OMNIROUTE_BASE_URL', 'https://api.omniroute.ai/v1')
        )
        self.prompts = self._load_prompts()

    def _load_prompts(self) -> Dict[str, Any]:
        """Load prompts from config file."""
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'prompts.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def analyze_for_readme(self, diff: str, current_readme: str) -> str:
        """Analyze code changes and generate README updates."""
        prompt_config = self.prompts['readme']

        user_prompt = prompt_config['user_template'].format(
            diff=diff,
            current_readme=current_readme
        )

        response = self.client.chat.completions.create(
            model="kr/claude-sonnet-4.5",
            max_tokens=4096,
            messages=[
                {"role": "system", "content": prompt_config['system']},
                {"role": "user", "content": user_prompt}
            ]
        )

        return response.choices[0].message.content

    def analyze_for_changelog(self, diff: str, commit_info: Dict[str, str]) -> str:
        """Analyze code changes and generate CHANGELOG entry."""
        prompt_config = self.prompts['changelog']

        user_prompt = prompt_config['user_template'].format(
            commit_message=commit_info.get('subject', ''),
            commit_hash=commit_info.get('hash', '')[:7],
            author=commit_info.get('author', ''),
            date=commit_info.get('date', ''),
            diff=diff
        )

        response = self.client.chat.completions.create(
            model="kr/claude-sonnet-4.5",
            max_tokens=2048,
            messages=[
                {"role": "system", "content": prompt_config['system']},
                {"role": "user", "content": user_prompt}
            ]
        )

        return response.choices[0].message.content

    def generate_inline_comments(self, code: str) -> str:
        """Generate JSDoc comments for code."""
        prompt_config = self.prompts['inline_comments']

        user_prompt = prompt_config['user_template'].format(code=code)

        response = self.client.chat.completions.create(
            model="kr/claude-sonnet-4.5",
            max_tokens=2048,
            messages=[
                {"role": "system", "content": prompt_config['system']},
                {"role": "user", "content": user_prompt}
            ]
        )

        return response.choices[0].message.content
