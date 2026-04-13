from fastapi import APIRouter, HTTPException
from app.models.host import HostManifestModel
from app.services.host_service import HostService

router = APIRouter(prefix="/api/hosts", tags=["hosts"])
service = HostService()


@router.get("")
def list_hosts():
    return service.list_hosts()


@router.get("/{host_id}")
def get_host(host_id: str):
    host = service.get_host(host_id)
    if not host:
        raise HTTPException(status_code=404, detail="Host no encontrado")
    return host


@router.post("")
def create_host(host: HostManifestModel):
    return service.create_host(host)


@router.put("/{host_id}")
def update_host(host_id: str, host: HostManifestModel):
    return service.update_host(host_id, host)


@router.delete("/{host_id}")
def delete_host(host_id: str):
    return service.delete_host(host_id)