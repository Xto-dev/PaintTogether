import os
import sys
import argparse
from dotenv import load_dotenv
from git_utils import get_commit_diff, get_commit_info
from mcp_client import MCPClient
from ai_analyzer import AIAnalyzer
from doc_generator import DocumentationGenerator

load_dotenv()

def main():
    parser = argparse.ArgumentParser(description='Auto-generate documentation from git commits')
    parser.add_argument('--commit', default='HEAD', help='Commit hash to analyze (default: HEAD)')
    parser.add_argument('--range', help='Commit range to analyze (e.g., HEAD~5..HEAD)')
    parser.add_argument('--only-readme', action='store_true', help='Generate only README')
    parser.add_argument('--only-changelog', action='store_true', help='Generate only CHANGELOG')

    args = parser.parse_args()

    api_key = os.getenv('OMNIROUTE_API_KEY')
    if not api_key:
        print("Error: OMNIROUTE_API_KEY not found in environment variables")
        sys.exit(1)

    try:
        if args.range:
            commit_hash = args.range.split('..')[-1]
        else:
            commit_hash = args.commit

        print(f"Analyzing commit: {commit_hash}")

        diff = get_commit_diff(commit_hash)
        commit_info = get_commit_info(commit_hash)

        if not diff:
            print("No changes detected in commit")
            return

        print("Initializing AI analyzer...")
        analyzer = AIAnalyzer(api_key)

        print("Initializing documentation generator...")
        doc_gen = DocumentationGenerator(analyzer)

        if not args.only_changelog:
            print("Generating README updates...")
            doc_gen.update_readme(diff, commit_info)
            print("✓ README.md updated")

        if not args.only_readme:
            print("Generating CHANGELOG entry...")
            doc_gen.update_changelog(diff, commit_info)
            print("✓ CHANGELOG.md updated")

        print("\n✓ Documentation generation complete!")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
