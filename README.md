# Occlusion

Occlusion is a full-stack SOC workflow platform with:
- Frontend: React + Vite (`frontend/`)
- Backend API: FastAPI + Socket.IO (`backend/`)
- Worker: Celery (`backend/`)
- Infrastructure: PostgreSQL, Redis, Keycloak, MinIO, Qdrant, Ollama

## Prerequisites

- Python 3.12+
- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Redis 7+

Optional (for full stack integrations):
- Keycloak
- MinIO
- Qdrant
- Ollama

## 1) Backend setup

From project root:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`.

If you have a template file, copy it first:

```bash
cp .env.example .env
```

If `.env.example` is not present in your local clone, create `.env` manually with at least:

```env
APP_ENV=development
SECRET_KEY=change-me
API_PREFIX=/api/v1

DATABASE_URL=postgresql+asyncpg://occ:occ@localhost:5432/occlusion
REDIS_URL=redis://localhost:6379/0

KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=occlusion
KEYCLOAK_CLIENT_ID=occlusion-api
KEYCLOAK_CLIENT_SECRET=

MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=occlusion-files

QDRANT_URL=http://localhost:6333

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

Run database migrations:

```bash
alembic upgrade head
```

Start API:

```bash
uvicorn app.main:sio_app --host 0.0.0.0 --port 8000 --reload
```

Health check: `http://localhost:8000/health`

## 2) Worker setup (new terminal)

```bash
cd backend
source .venv/bin/activate
celery -A app.workers.celery_app worker --loglevel=info -Q celery
```

## 3) Frontend setup

In a separate terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Frontend URL: `http://localhost:5173`

## 4) Default local URLs

- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Keycloak: `http://localhost:8080`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Qdrant: `http://localhost:6333`
- Ollama: `http://localhost:11434`

## Docker Compose (optional)

`docker-compose.yml` is included, but it expects build contexts for `./frontend` and `./backend`.

If Dockerfiles are present in those folders, run:

```bash
docker compose up --build
```

## Quick start (minimum)

If you only want the app UI + API quickly:

1. Start PostgreSQL and Redis
2. Run backend API (`uvicorn ...`)
3. Run frontend (`npm run dev`)
