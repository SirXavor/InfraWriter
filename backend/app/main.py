from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.api.hosts import router as hosts_router
from app.api.catalog import router as catalog_router

app = FastAPI(title="InfraWriter", version="0.1.0", root_path="/api")

app.include_router(hosts_router, prefix="/hosts")
app.include_router(catalog_router, prefix="/catalog")

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, detail=str(exc))

@app.get("/health")
def health():
    return {"status": "ok"}