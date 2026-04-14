from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    git_repo_url: str
    git_branch: str = "main"
    git_repo_path: str = "/data/repo"
    git_user_name: str = "InfraWriter"
    git_user_email: str = "infrawriter@local"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()