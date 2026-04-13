from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator
import re


MAC_RE = re.compile(r"^[0-9a-f]{2}(-[0-9a-f]{2}){5}$")


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
    groups: List[str] = []
    shell: str = "/bin/bash"
    ssh_keys: List[str] = []


class IdentityModel(BaseModel):
    mac: List[str] = Field(min_length=1)

    @field_validator("mac")
    @classmethod
    def validate_mac_list(cls, value: List[str]) -> List[str]:
        normalized = []
        for mac in value:
            mac_norm = mac.lower().replace(":", "-")
            if not MAC_RE.match(mac_norm):
                raise ValueError(f"MAC inválida: {mac}")
            normalized.append(mac_norm)
        return normalized


class ProvisioningModel(BaseModel):
    distro: Literal["ubuntu", "rhel"]
    version: str


class AutomationModel(BaseModel):
    repo: GitRepoConfig
    apply: ApplyConfig
    roles: List[str] = []
    vars: Dict[str, Any] = {}


class HostManifestModel(BaseModel):
    kind: Literal["host"] = "host"
    name: str
    identity: Optional[IdentityModel] = None
    profile: str
    hostname: str
    provisioning: Optional[ProvisioningModel] = None
    automation: AutomationModel