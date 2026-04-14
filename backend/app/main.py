from fastapi import FastAPI
from app.api.hosts import router as hosts_router
from app.api.catalog import router as catalog_router

app = FastAPI(title="InfraWriter", version="0.1.0")

app.include_router(hosts_router)
app.include_router(catalog_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}