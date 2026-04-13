from pathlib import Path
from typing import List, Optional
from app.models.host import HostManifestModel
from app.services.git_service import GitService
from app.services.yaml_service import YamlService
from app.services.lock_service import RepoLock


class HostService:
    def __init__(self):
        self.repo_url = "https://github.com/SirXavor/InfraServer.git"
        self.repo_path = Path("/data/repo")
        self.hosts_dir = self.repo_path / "configs" / "provisioning" / "hosts"
        self.git = GitService(repo_path=str(self.repo_path), branch="main")

    def _get_host_file(self, host_id: str) -> Path:
        return self.hosts_dir / f"80-host-{host_id}.yaml"

    def _extract_host_id(self, host: HostManifestModel) -> str:
        if not host.identity or not host.identity.mac:
            raise ValueError("El host debe tener al menos una MAC")
        return host.identity.mac[0]

    def list_hosts(self) -> List[dict]:
        if not self.repo_path.exists():
            return []

        result = []
        for file in sorted(self.hosts_dir.glob("80-host-*.yaml")):
            result.append(YamlService.load_host(file))
        return result

    def get_host(self, host_id: str) -> Optional[dict]:
        file = self._get_host_file(host_id)
        if not file.exists():
            return None
        return YamlService.load_host(file)

    def create_host(self, host: HostManifestModel) -> dict:
        with RepoLock():
            self.git.clone_if_needed(self.repo_url)
            self.git.sync()

            host_id = self._extract_host_id(host)
            file = self._get_host_file(host_id)

            if file.exists():
                raise ValueError("Ya existe un host con esa MAC principal")

            YamlService.save_host(file, host)
            self.git.commit_and_push(f"Add host {host.name}")
            return {"status": "created", "host_id": host_id}

    def update_host(self, host_id: str, host: HostManifestModel) -> dict:
        with RepoLock():
            self.git.clone_if_needed(self.repo_url)
            self.git.sync()

            new_host_id = self._extract_host_id(host)
            old_file = self._get_host_file(host_id)
            new_file = self._get_host_file(new_host_id)

            if not old_file.exists():
                raise ValueError("Host no encontrado")

            if old_file != new_file and new_file.exists():
                raise ValueError("La nueva MAC principal ya existe")

            if old_file.exists() and old_file != new_file:
                old_file.unlink()

            YamlService.save_host(new_file, host)
            self.git.commit_and_push(f"Update host {host.name}")
            return {"status": "updated", "host_id": new_host_id}

    def delete_host(self, host_id: str) -> dict:
        with RepoLock():
            self.git.clone_if_needed(self.repo_url)
            self.git.sync()

            file = self._get_host_file(host_id)
            if not file.exists():
                raise ValueError("Host no encontrado")

            file.unlink()
            self.git.commit_and_push(f"Delete host {host_id}")
            return {"status": "deleted", "host_id": host_id}