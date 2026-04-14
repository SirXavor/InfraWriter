from pathlib import Path
import yaml

from app.services.git_service import GitService
from app.services.lock_service import RepoLock
from app.utils.repo_config import (
    classify_documents,
    filter_docs_for_distro,
    load_yaml_documents,
)
from config import settings


class CatalogService:
    def __init__(self):
        self.repo_path = Path(settings.git_repo_path)
        self.provisioning_path = self.repo_path / "configs" / "provisioning"
        self.roles_path = self.repo_path / "roles"
        self.git = GitService(
            repo_path=settings.git_repo_path,
            branch=settings.git_branch,
            user_name=settings.git_user_name,
            user_email=settings.git_user_email,
        )

    def _ensure_repo(self) -> None:
        self.git.clone_if_needed(settings.git_repo_url)
        self.git.sync()

    def _load_classified_docs(self) -> dict[str, list[dict]]:
        docs = load_yaml_documents(self.provisioning_path)
        return classify_documents(docs)

    def list_distros(self) -> list[str]:
        with RepoLock():
            self._ensure_repo()

            classified = self._load_classified_docs()
            distros: set[str] = set()

            for doc in classified["base"]:
                match_cfg = doc.get("match", {})
                if not isinstance(match_cfg, dict):
                    continue

                distro = match_cfg.get("distro")
                if isinstance(distro, str) and distro.strip():
                    distros.add(distro.strip().lower())
                elif isinstance(distro, list):
                    distros.update(
                        str(item).strip().lower()
                        for item in distro
                        if str(item).strip()
                    )

            return sorted(distros)

    def list_profiles(self, distro: str | None = None) -> list[dict]:
        with RepoLock():
            self._ensure_repo()

            classified = self._load_classified_docs()
            profile_docs = classified["profile"]

            if distro:
                profile_docs = filter_docs_for_distro(profile_docs, distro)

            result: list[dict] = []

            for doc in profile_docs:
                name = str(doc.get("name", "")).strip()
                if not name:
                    continue

                match_cfg = doc.get("match", {})
                compatible_distros: list[str] = []

                if isinstance(match_cfg, dict):
                    distro_value = match_cfg.get("distro")
                    if isinstance(distro_value, str) and distro_value.strip():
                        compatible_distros = [distro_value.strip().lower()]
                    elif isinstance(distro_value, list):
                        compatible_distros = sorted(
                            {
                                str(item).strip().lower()
                                for item in distro_value
                                if str(item).strip()
                            }
                        )

                result.append(
                    {
                        "name": name,
                        "compatible_distros": compatible_distros,
                        "source_file": doc.get("_source_file"),
                    }
                )

            result.sort(key=lambda item: item["name"])
            return result

    def list_roles(self) -> list[dict]:
        with RepoLock():
            self._ensure_repo()

            if not self.roles_path.exists():
                return []

            result: list[dict] = []

            for role_dir in sorted(self.roles_path.iterdir()):
                if not role_dir.is_dir():
                    continue

                role_name = role_dir.name
                meta: dict = {}
                defaults: dict = {}

                meta_file = role_dir / "infrawriter.yaml"
                if meta_file.exists():
                    meta = yaml.safe_load(meta_file.read_text(encoding="utf-8")) or {}

                defaults_file = role_dir / "defaults" / "main.yaml"
                if defaults_file.exists():
                    defaults = yaml.safe_load(defaults_file.read_text(encoding="utf-8")) or {}

                result.append(
                    {
                        "name": role_name,
                        "display_name": meta.get("display_name", role_name),
                        "description": meta.get("description", ""),
                        "compatible_distros": meta.get("compatible_distros", []),
                        "requires_roles": meta.get("requires_roles", []),
                        "vars_schema": meta.get("vars_schema", []),
                        "defaults": defaults,
                    }
                )

            return result

    def get_role(self, role_name: str) -> dict | None:
        for role in self.list_roles():
            if role["name"] == role_name:
                return role
        return None