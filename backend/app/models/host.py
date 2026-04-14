from typing import Any, Dict, List, Literal, Optional
import re

from pydantic import BaseModel, Field, field_validator


MAC_RE = re.compile(r"^[0-9a-f]{2}(-[0-9a-f]{2}){5}$")


def normalize_mac(value: str) -> str:
    return str(value).strip().lower().replace(":", "-")


class GitRepoConfig(BaseModel):
    url: str
    local_path: str = "/opt/InfraServer"
    branch: str = "main"


class ApplyConfig(BaseModel):
    playbook: str = "playbooks/bootstrap.yaml"
    interval: str = "1h"


class UserModel(BaseModel):
    name: str
    password: Optional[str] = None
    groups: List[str] = Field(default_factory=list)
    shell: str = "/bin/bash"
    ssh_keys: List[str] = Field(default_factory=list)


class IdentityModel(BaseModel):
    mac: List[str] = Field(min_length=1)

    @field_validator("mac")
    @classmethod
    def validate_mac_list(cls, value: List[str]) -> List[str]:
        normalized: List[str] = []

        for mac in value:
            mac_norm = normalize_mac(mac)
            if not MAC_RE.match(mac_norm):
                raise ValueError(f"MAC inválida: {mac}")
            normalized.append(mac_norm)

        if len(set(normalized)) != len(normalized):
            raise ValueError("Hay MACs duplicadas dentro del mismo host")

        return normalized


class ProvisioningModel(BaseModel):
    distro: Literal["ubuntu", "rhel", "rocky", "almalinux", "centos"]
    version: str


class AutomationModel(BaseModel):
    repo: GitRepoConfig
    apply: ApplyConfig
    roles: List[str] = Field(default_factory=list)
    vars: Dict[str, Any] = Field(default_factory=dict)


class HostManifestModel(BaseModel):
    kind: Literal["host"] = "host"
    name: str
    identity: Optional[IdentityModel] = None
    profile: str
    hostname: str
    provisioning: Optional[ProvisioningModel] = None
    automation: AutomationModel