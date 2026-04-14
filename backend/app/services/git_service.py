from pathlib import Path
from git import Repo, GitCommandError


class GitService:
    def __init__(
        self,
        repo_path: str,
        branch: str = "main",
        user_name: str = "InfraWriter",
        user_email: str = "infrawriter@local",
    ):
        self.repo_path = Path(repo_path)
        self.branch = branch
        self.user_name = user_name
        self.user_email = user_email

    def _get_repo(self) -> Repo:
        return Repo(self.repo_path)

    def clone_if_needed(self, repo_url: str) -> None:
        if not (self.repo_path / ".git").exists():
            self.repo_path.parent.mkdir(parents=True, exist_ok=True)
            Repo.clone_from(repo_url, self.repo_path, branch=self.branch)

        self.configure_identity()

    def configure_identity(self) -> None:
        repo = self._get_repo()
        with repo.config_writer() as config:
            config.set_value("user", "name", self.user_name)
            config.set_value("user", "email", self.user_email)

    def sync(self) -> None:
        repo = self._get_repo()
        origin = repo.remote(name="origin")

        repo.git.checkout(self.branch)
        origin.fetch(prune=True)
        repo.git.pull("--ff-only", "origin", self.branch)

    def commit_and_push(self, message: str) -> None:
        repo = self._get_repo()
        origin = repo.remote(name="origin")

        repo.git.add(A=True)

        if not repo.is_dirty(untracked_files=True):
            return

        repo.index.commit(message)
        origin.push(self.branch)