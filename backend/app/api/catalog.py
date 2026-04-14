from fastapi import APIRouter, HTTPException
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/api/catalog", tags=["catalog"])
service = CatalogService()


@router.get("/distros")
def list_distros():
    return service.list_distros()


@router.get("/profiles")
def list_profiles(distro: str | None = None):
    return service.list_profiles(distro=distro)


@router.get("/roles")
def list_roles():
    return service.list_roles()


@router.get("/roles/{role_name}")
def get_role(role_name: str):
    role = service.get_role(role_name)
    if not role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return role