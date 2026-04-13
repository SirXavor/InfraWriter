from fastapi import FastAPI
from app.api.hosts import router as hosts_router

app = FastAPI(title="InfraWriter", version="0.1.0")
app.include_router(hosts_router)