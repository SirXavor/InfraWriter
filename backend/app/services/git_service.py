import subprocess
from pathlib import Path

class GitService:
    def __init__(self, repo_path: str, branch: str = "main",
                 user_name: str = "InfraWriter", user_email: str = "infrawriter@local"):
        self.repo_path = Path(repo_path)
        self.branch = branch
        self.user_name = user_name
        self.user_email = user_email

    def run(self, *args: str) -> str:
        result = subprocess.run(
            list(args),          # <- fix: list(args) no args como primer elemento
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
            text=True, check=True,
        )
        # Configurar identidad justo después del clone
        self.run("git", "config", "user.name", self.user_name)
        self.run("git", "config", "user.email", self.user_email)

    def sync(self) -> None:
        self.run("git", "fetch", "--all", "--prune")
        self.run("git", "checkout", self.branch)
        self.run("git", "pull", "--ff-only", "origin", self.branch)

    def commit_and_push(self, message: str) -> None:
        self.run("git", "add", "-A")   # <- -A trackea también los deletes
        try:
            self.run("git", "commit", "-m", message)
        except subprocess.CalledProcessError as e:
            if "nothing to commit" in (e.stdout + (e.stderr or "")).lower():
                return
            raise
        self.run("git", "push", "origin", self.branch)