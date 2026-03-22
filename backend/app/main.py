from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from app.config import settings
from app.routers import workflows, cases, executions

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Occlusion HyperSOC API",
    description="AI-driven Security Operations Center hyperautomation platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(workflows.router, prefix=settings.API_PREFIX)
app.include_router(cases.router, prefix=settings.API_PREFIX)
app.include_router(executions.router, prefix=settings.API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "occlusion-api"}


# ── Socket.IO (real-time activity feed) ──────────────────────────────────────
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=["http://localhost:5173", "http://localhost:3000"],
)
sio_app = socketio.ASGIApp(sio, other_asgi_app=app)


@sio.event
async def connect(sid, environ, auth):
    await sio.emit("connected", {"sid": sid}, to=sid)


@sio.event
async def disconnect(sid):
    pass


# Mount Socket.IO app as the root ASGI app
# Run with: uvicorn app.main:sio_app --reload --port 8000
