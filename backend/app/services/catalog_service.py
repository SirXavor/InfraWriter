# app/services/catalog_service.py

from pathlib import Path
from collections import defaultdict
import yaml
from config import settings
from app.services.git_service import GitService

class CatalogService:
    def __init__(self):
        self.repo_path = Path(settings.git_repo_path)
        self.provisioning_path = self.repo_path / "configs" / "provisioning"
        self.roles_path = self.repo_path / "roles"
        self.git = GitService(
            repo_path=settings.git_repo_path,
            branch=settings.git_branch,
        )

    def _sync(self):
        self.git.clone_if_needed(settings.git_repo_url)
        self.git.sync()

    def _load_provisioning_docs(self) -> list[dict]:
        """
        Carga todos los YAML de configs/provisioning/ recursivamente.
        Cada fichero puede tener múltiples documentos separados por ---.
        """
        docs = []
        for path in sorted(self.provisioning_path.rglob("*.yaml")):
            try:
                content = path.read_text(encoding="utf-8")
                for doc in yaml.safe_load_all(content):
                    if isinstance(doc, dict) and doc:
                        doc["_source_file"] = str(path.relative_to(self.repo_path))
                        docs.append(doc)
            except Exception:
                continue
        return docs

    def list_distros(self) -> list[str]:
        self._sync()
        distros = set()
        for doc in self._load_provisioning_docs():
            if doc.get("kind") != "base":
                continue
            match = doc.get("match", {})
            if not isinstance(match, dict):
                continue
            distro = match.get("distro")
            if isinstance(distro, str) and distro.strip():
                distros.add(distro.strip().lower())
            elif isinstance(distro, list):
                distros.update(d.strip().lower() for d in distro if d.strip())
        return sorted(distros)

    def list_profiles(self, distro: str | None = None) -> list[dict]:
        self._sync()
        # Agrupa por nombre de perfil, acumula distros compatibles
        profiles: dict[str, set] = defaultdict(set)
        for doc in self._load_provisioning_docs():
            if doc.get("kind") != "profile":
                continue
            name = doc.get("name", "").strip()
            if not name:
                continue
            match = doc.get("match", {})
            if not isinstance(match, dict):
                # Sin match.distro = compatible con todo
                profiles[name].add("*")
                continue
            d = match.get("distro")
            if d is None:
                profiles[name].add("*")
            elif isinstance(d, str):
                profiles[name].add(d.strip().lower())
            elif isinstance(d, list):
                profiles[name].update(x.strip().lower() for x in d if x.strip())

        result = []
        for name, compatible in sorted(profiles.items()):
            if distro and distro not in compatible and "*" not in compatible:
                continue
            result.append({
                "name": name,
                "compatible_distros": sorted(compatible),
            })
        return result

    def list_roles(self) -> list[dict]:
        self._sync()
        if not self.roles_path.exists():
            return []
        result = []
        for role_dir in sorted(self.roles_path.iterdir()):
            if not role_dir.is_dir():
                continue
            role_name = role_dir.name
            meta = {}
            # Nuestro fichero de metadatos, no el meta/main.yml de Ansible
            meta_file = role_dir / "infrawriter.yaml"
            if meta_file.exists():
                meta = yaml.safe_load(meta_file.read_text()) or {}
            defaults = {}
            defaults_file = role_dir / "defaults" / "main.yaml"
            if defaults_file.exists():
                defaults = yaml.safe_load(defaults_file.read_text()) or {}
            result.append({
                "name": role_name,
                "display_name": meta.get("display_name", role_name),
                "description": meta.get("description", ""),
                "compatible_distros": meta.get("compatible_distros", []),
                "requires_roles": meta.get("requires_roles", []),
                "vars_schema": meta.get("vars_schema", []),
                "defaults": defaults,
            })
        return result

    def get_role(self, role_name: str) -> dict | None:
        return next((r for r in self.list_roles() if r["name"] == role_name), None)