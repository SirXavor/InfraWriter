from pathlib import Path
import yaml
from app.models.host import HostManifestModel


class YamlService:
    @staticmethod
    def save_host(path: Path, host: HostManifestModel) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("w", encoding="utf-8") as f:
            yaml.safe_dump(
                host.model_dump(exclude_none=True),
                f,
                allow_unicode=True,
                sort_keys=False,
            )

    @staticmethod
    def load_host(path: Path) -> dict:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f)