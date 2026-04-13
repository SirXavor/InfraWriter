import os
import subprocess
from pathlib import Path


class GitService:
    def __init__(self, repo_path: str = "/data/repo", branch: str = "main"):
        self.repo_path = Path(repo_path)
        self.branch = branch

    def run(self, *args: str) -> str:
        result = subprocess.run(
            args,
            cwd=self.repo_path,
            text=True,
            capture_output=True,
            check=True,
        )
        return result.stdout.strip()

    def clone_if_needed(self, repo_url: str) -> None:
        if (self.repo_path / ".git").exists():
            return

        self.repo_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "clone", "-b", self.branch, repo_url, str(self.repo_path)],
            text=True,
            check=True,
        )

    def sync(self) -> None:
        self.run("git", "fetch", "--all", "--prune")
        self.run("git", "checkout", self.branch)
        self.run("git", "pull", "--ff-only", "origin", self.branch)

    def commit_and_push(self, message: str) -> None:
        self.run("git", "add", ".")
        try:
            self.run("git", "commit", "-m", message)
        except subprocess.CalledProcessError as e:
            if "nothing to commit" in (e.stderr or "").lower():
                return
            raise
        self.run("git", "push", "origin", self.branch)