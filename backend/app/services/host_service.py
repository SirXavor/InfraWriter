from config import settings

class HostService:
    def __init__(self):
        self.repo_path = Path(settings.git_repo_path)
        self.hosts_dir = self.repo_path / "configs" / "provisioning" / "hosts"
        self.git = GitService(
            repo_path=settings.git_repo_path,
            branch=settings.git_branch,
            user_name=settings.git_user_name,
            user_email=settings.git_user_email,
        )

    # El repo_url ya no está hardcodeado, se pasa en cada llamada:
    def _ensure_repo(self):
        self.git.clone_if_needed(settings.git_repo_url)
        self.git.sync()