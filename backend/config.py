import os


class Settings:
    git_repo_url = os.getenv("GIT_REPO_URL", "")
    git_branch = os.getenv("GIT_BRANCH", "main")
    git_repo_path = os.getenv("GIT_REPO_PATH", "/data/repo")
    git_user_name = os.getenv("GIT_USERNAME", "main")
    git_user_email = os.getenv("GIT_USER_EMAIL", "main")


settings = Settings()