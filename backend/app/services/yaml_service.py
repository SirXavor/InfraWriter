from pathlib import Path
import yaml

from app.models.host import HostManifestModel


class YamlService:
    @staticmethod
    def save_host(path: Path, host: HostManifestModel) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)

        with path.open("w", encoding="utf-8") as file_obj:
            yaml.safe_dump(
                host.model_dump(exclude_none=True),
                file_obj,
                allow_unicode=True,
                sort_keys=False,
            )

    @staticmethod
    def load_yaml(path: Path):
        with path.open("r", encoding="utf-8") as file_obj:
            return yaml.safe_load(file_obj)

    @staticmethod
    def load_host(path: Path) -> dict:
        data = YamlService.load_yaml(path)
        if not isinstance(data, dict):
            return {}
        return data