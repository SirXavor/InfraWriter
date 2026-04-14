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


@router.post("", status_code=201)
def create_host(host: HostManifestModel):
    try:
        return service.create_host(host)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.put("/{host_id}")
def update_host(host_id: str, host: HostManifestModel):
    try:
        return service.update_host(host_id, host)
    except ValueError as exc:
        message = str(exc)
        if "no encontrado" in message.lower():
            raise HTTPException(status_code=404, detail=message) from exc
        raise HTTPException(status_code=409, detail=message) from exc


@router.delete("/{host_id}")
def delete_host(host_id: str):
    try:
        return service.delete_host(host_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc