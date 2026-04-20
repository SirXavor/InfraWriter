import logging
from pathlib import Path

from git import Repo
from git.exc import GitCommandError

logger = logging.getLogger(__name__)


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

    def _authenticated_url(self, url: str, token: str) -> str:
        """Embed token into HTTPS URL without persisting it to disk."""
        if not token:
            return url
        if "://" in url:
            scheme, rest = url.split("://", 1)
            # strip any existing credentials
            if "@" in rest:
                rest = rest.split("@", 1)[1]
            return f"{scheme}://x-token:{token}@{rest}"
        return url

    def clone_if_needed(self, repo_url: str, token: str = "") -> None:
        if not (self.repo_path / ".git").exists():
            self.repo_path.parent.mkdir(parents=True, exist_ok=True)
            auth_url = self._authenticated_url(repo_url, token)
            Repo.clone_from(auth_url, self.repo_path, branch=self.branch)
            # replace remote URL with unauthenticated version to avoid token on disk
            repo = self._get_repo()
            repo.remotes.origin.set_url(repo_url)

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
        try:
            origin.fetch(prune=True)
            repo.git.pull("--ff-only", "origin", self.branch)
        except GitCommandError as e:
            logger.warning("git sync failed (network issue?), using cached repo: %s", e)

    def commit_and_push(self, message: str, token: str = "") -> None:
        repo = self._get_repo()
        origin = repo.remote(name="origin")

        repo.git.add(A=True)

        if not repo.is_dirty(untracked_files=True):
            return

        repo.index.commit(message)
        try:
            if token:
                push_url = self._authenticated_url(origin.url, token)
                repo.git.push(push_url, self.branch)
            else:
                origin.push(self.branch)
        except GitCommandError as e:
            logger.warning("git push failed (network issue?), commit kept locally: %s", e)