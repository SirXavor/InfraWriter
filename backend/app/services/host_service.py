from pathlib import Path
from typing import Optional

from app.models.host import HostManifestModel
from app.services.git_service import GitService
from app.services.lock_service import RepoLock
from app.services.yaml_service import YamlService
from app.utils.repo_config import extract_host_macs, list_host_files, normalize_mac
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

    def _ensure_repo(self) -> None:
        self.git.clone_if_needed(settings.git_repo_url)
        self.git.sync()

    def _get_host_file(self, primary_mac: str) -> Path:
        normalized = normalize_mac(primary_mac)
        return self.hosts_dir / f"80-host-{normalized}.yaml"

    def _extract_primary_mac(self, host: HostManifestModel) -> str:
        if not host.identity or not host.identity.mac:
            raise ValueError("El host debe tener al menos una MAC")
        return normalize_mac(host.identity.mac[0])

    def _extract_all_macs(self, host: HostManifestModel) -> list[str]:
        if not host.identity or not host.identity.mac:
            return []
        return [normalize_mac(mac) for mac in host.identity.mac]

    def _find_host_file_by_any_mac(self, host_id: str) -> Optional[Path]:
        wanted = normalize_mac(host_id)

        direct_file = self._get_host_file(wanted)
        if direct_file.exists():
            return direct_file

        for file_path in list_host_files(self.hosts_dir):
            doc = YamlService.load_host(file_path)
            if wanted in extract_host_macs(doc):
                return file_path

        return None

    def _validate_unique_macs(
        self,
        candidate_host: HostManifestModel,
        current_file_to_ignore: Optional[Path] = None,
    ) -> None:
        candidate_macs = set(self._extract_all_macs(candidate_host))
        if not candidate_macs:
            raise ValueError("El host debe tener al menos una MAC")

        for file_path in list_host_files(self.hosts_dir):
            if current_file_to_ignore and file_path == current_file_to_ignore:
                continue

            existing_doc = YamlService.load_host(file_path)
            existing_name = str(existing_doc.get("name", file_path.name))
            existing_macs = set(extract_host_macs(existing_doc))

            overlap = candidate_macs & existing_macs
            if overlap:
                repeated = ", ".join(sorted(overlap))
                raise ValueError(
                    f"Hay MACs duplicadas con el host '{existing_name}': {repeated}"
                )

    def _add_id(self, host: dict) -> dict:
        """
        Añade el campo 'id' al payload de salida usando la MAC principal.
        No modifica el YAML en disco; solo la respuesta de la API.
        """
        identity = host.get("identity", {})

        if isinstance(identity, dict):
            macs = identity.get("mac", [])
            if isinstance(macs, list) and macs:
                host["id"] = normalize_mac(macs[0])

        return host

    def list_hosts(self) -> list[dict]:
        with RepoLock():
            self._ensure_repo()
            result: list[dict] = []

            for file_path in list_host_files(self.hosts_dir):
                host = YamlService.load_host(file_path)
                result.append(self._add_id(host))

            return result

    def get_host(self, host_id: str) -> Optional[dict]:
        with RepoLock():
            self._ensure_repo()
            file_path = self._find_host_file_by_any_mac(host_id)
            if not file_path:
                return None

            host = YamlService.load_host(file_path)
            return self._add_id(host)

    def create_host(self, host: HostManifestModel) -> dict:
        with RepoLock():
            self._ensure_repo()

            primary_mac = self._extract_primary_mac(host)
            file_path = self._get_host_file(primary_mac)

            if file_path.exists():
                raise ValueError(f"Ya existe un host con MAC principal {primary_mac}")

            self._validate_unique_macs(host)
            YamlService.save_host(file_path, host)
            self.git.commit_and_push(f"feat(hosts): add {host.name}")

            return {
                "status": "created",
                "host_id": primary_mac,
            }

    def update_host(self, host_id: str, host: HostManifestModel) -> dict:
        with RepoLock():
            self._ensure_repo()

            current_file = self._find_host_file_by_any_mac(host_id)
            if not current_file:
                raise ValueError("Host no encontrado")

            new_primary_mac = self._extract_primary_mac(host)
            new_file = self._get_host_file(new_primary_mac)

            if new_file != current_file and new_file.exists():
                raise ValueError("La nueva MAC principal ya existe")

            self._validate_unique_macs(host, current_file_to_ignore=current_file)

            if current_file.exists() and current_file != new_file:
                current_file.unlink()

            YamlService.save_host(new_file, host)
            self.git.commit_and_push(f"feat(hosts): update {host.name}")

            return {
                "status": "updated",
                "host_id": new_primary_mac,
            }

    def delete_host(self, host_id: str) -> dict:
        with RepoLock():
            self._ensure_repo()

            file_path = self._find_host_file_by_any_mac(host_id)
            if not file_path:
                raise ValueError("Host no encontrado")

            existing = YamlService.load_host(file_path)
            host_name = str(existing.get("name", host_id))

            file_path.unlink()
            self.git.commit_and_push(f"feat(hosts): remove {host_name}")

            return {
                "status": "deleted",
                "host_id": normalize_mac(host_id),
            }