from pathlib import Path
from typing import List, Optional
from app.models.host import HostManifestModel
from app.services.git_service import GitService
from app.services.yaml_service import YamlService
from app.services.lock_service import RepoLock
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

    def _ensure_repo(self):
        self.git.clone_if_needed(settings.git_repo_url)
        self.git.sync()

    def _get_host_file(self, host_id: str) -> Path:
        return self.hosts_dir / f"80-host-{host_id}.yaml"

    def _extract_host_id(self, host: HostManifestModel) -> str:
        if not host.identity or not host.identity.mac:
            raise ValueError("El host debe tener al menos una MAC")
        return host.identity.mac[0]

    def list_hosts(self) -> List[dict]:
        self._ensure_repo()
        if not self.hosts_dir.exists():
            return []
        return [
            YamlService.load_host(f)
            for f in sorted(self.hosts_dir.glob("80-host-*.yaml"))
        ]

    def get_host(self, host_id: str) -> Optional[dict]:
        self._ensure_repo()
        file = self._get_host_file(host_id)
        if not file.exists():
            return None
        return YamlService.load_host(file)

    def create_host(self, host: HostManifestModel) -> dict:
        with RepoLock():
            self._ensure_repo()
            host_id = self._extract_host_id(host)
            file = self._get_host_file(host_id)
            if file.exists():
                raise ValueError(f"Ya existe un host con MAC {host_id}")
            YamlService.save_host(file, host)
            self.git.commit_and_push(f"feat(hosts): add {host.name}")
            return {"status": "created", "host_id": host_id}

    def update_host(self, host_id: str, host: HostManifestModel) -> dict:
        with RepoLock():
            self._ensure_repo()
            new_host_id = self._extract_host_id(host)
            old_file = self._get_host_file(host_id)
            new_file = self._get_host_file(new_host_id)
            if not old_file.exists():
                raise ValueError("Host no encontrado")
            if old_file != new_file:
                if new_file.exists():
                    raise ValueError("La nueva MAC principal ya existe")
                old_file.unlink()
            YamlService.save_host(new_file, host)
            self.git.commit_and_push(f"feat(hosts): update {host.name}")
            return {"status": "updated", "host_id": new_host_id}

    def delete_host(self, host_id: str) -> dict:
        with RepoLock():
            self._ensure_repo()
            file = self._get_host_file(host_id)
            if not file.exists():
                raise ValueError("Host no encontrado")
            name = YamlService.load_host(file).get("name", host_id)
            file.unlink()
            self.git.commit_and_push(f"feat(hosts): remove {name}")
            return {"status": "deleted", "host_id": host_id}