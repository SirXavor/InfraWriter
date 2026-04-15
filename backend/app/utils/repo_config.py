from pathlib import Path
from typing import Any
import yaml

def normalize_mac(value: str) -> str:
    return str(value).strip().lower().replace(":", "-")

def load_yaml_documents(root_path: Path) -> list[dict[str, Any]]:
    docs: list[dict[str, Any]] = []

    if not root_path.exists():
        return docs

    for path in sorted(root_path.rglob("*.yaml")):
        try:
            with path.open("r", encoding="utf-8") as file_obj:
                for doc in yaml.safe_load_all(file_obj):
                    if isinstance(doc, dict) and doc:
                        doc["_source_file"] = str(path.relative_to(root_path))
                        docs.append(doc)
        except Exception:
            continue

    return docs


def classify_documents(docs: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    classified: dict[str, list[dict[str, Any]]] = {
        "base": [],
        "profile": [],
        "host": [],
    }

    for doc in docs:
        kind = doc.get("kind")
        if kind in classified:
            classified[kind].append(doc)

    return classified


def extract_host_macs(doc: dict[str, Any]) -> list[str]:
    identity = doc.get("identity", {})
    if not isinstance(identity, dict):
        return []

    macs = identity.get("mac", [])
    if isinstance(macs, str):
        macs = [macs]

    if not isinstance(macs, list):
        return []

    result: list[str] = []
    for value in macs:
        normalized = normalize_mac(str(value))
        if normalized:
            result.append(normalized)

    return result


def doc_matches_distro(doc: dict[str, Any], distro: str) -> bool:
    match_cfg = doc.get("match", {})
    if not isinstance(match_cfg, dict):
        return True

    wanted = match_cfg.get("distro")
    if wanted is None:
        return True

    normalized = str(distro).strip().lower()

    if isinstance(wanted, str):
        return wanted.strip().lower() == normalized

    if isinstance(wanted, list):
        accepted = [str(x).strip().lower() for x in wanted if str(x).strip()]
        return normalized in accepted

    return False


def filter_docs_for_distro(docs: list[dict[str, Any]], distro: str) -> list[dict[str, Any]]:
    return [doc for doc in docs if doc_matches_distro(doc, distro)]


def list_host_files(hosts_dir: Path) -> list[Path]:
    if not hosts_dir.exists():
        return []
    return sorted(hosts_dir.glob("80-host-*.yaml"))