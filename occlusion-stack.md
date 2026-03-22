# Occlusion — HyperSOC Platform
## Complete Project Stack, Architecture & Implementation Guide

> **Project type:** AI-driven Security Operations Center (SOC) hyperautomation platform  
> **Codename:** Occlusion  
> **Inspired by:** Torq HyperSOC  
> **Key differentiator:** Git-like version control for SOC workflows/pipelines + shift-handover as a first-class feature + post-incident learning loop

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [Full Tech Stack](#2-full-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend — React + TypeScript](#4-frontend--react--typescript)
5. [Backend — FastAPI](#5-backend--fastapi)
6. [Database Schema (PostgreSQL)](#6-database-schema-postgresql)
7. [Workflow Execution Engine](#7-workflow-execution-engine)
8. [AI Agent Layer](#8-ai-agent-layer)
9. [Auth — Keycloak + JWT](#9-auth--keycloak--jwt)
10. [Infrastructure & DevOps](#10-infrastructure--devops)
11. [Light/Dark Theme System](#11-lightdark-theme-system)
12. [Color Tokens & Design System](#12-color-tokens--design-system)
13. [Folder Structure](#13-folder-structure)
14. [Environment Variables](#14-environment-variables)
15. [Getting Started](#15-getting-started)
16. [Shared with MediSense AI](#16-shared-with-medisense-ai)

---

## 1. Project Vision

Occlusion solves three problems that Torq and every other SOAR/SIEM tool ignores:

| Gap | Occlusion's Answer |
|---|---|
| Workflow changes are undocumented and irreversible | Git-like branching, diffs, PRs, and tagged releases for every workflow/pipeline |
| Junior SOC analysts don't learn from investigations | Guided triage with embedded reasoning — teaches *why* each step matters |
| Shift handovers are lossy (Slack messages, verbal) | Shift-handover is a first-class feature — structured, diffs what changed, who owns what |

---

## 2. Full Tech Stack

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | **React 18 + TypeScript** | React Flow is React-only; TypeScript is non-negotiable for a SOC tool (type safety on case/workflow objects) |
| Build tool | **Vite** | 10–50× faster than CRA/webpack, native ESM, HMR |
| Styling | **Tailwind CSS v4** | Light/dark mode via `data-theme` trivial; CSS variables map directly to design tokens |
| Components | **shadcn/ui** | Unstyled primitives — you own the CSS, matches the Occlusion design system |
| Canvas | **React Flow** | The standard for node-edge workflow editors; built-in drag-drop, minimap, edge routing, zoom |
| State | **Zustand** | Lightweight, no boilerplate; perfect for workflow canvas state + case panels |
| Data fetching | **TanStack Query v5** | Caching, background refetch, optimistic updates for live case/activity feeds |
| Charts | **Recharts** | Composable, works with Tailwind, no D3 complexity |
| Forms | **React Hook Form + Zod** | Type-safe form validation; used for workflow step config, API key creation |
| Routing | **React Router v6** | SPA routing for workspace/case/workflow URLs |
| Icons | **Font Awesome 6 Pro** (or Lucide React as free alternative) | Already in the prototype |
| Real-time | **Socket.io-client** | Live activity log, running workflow status, shift handover notifications |
| Tests | **Vitest + React Testing Library** | Fast unit/component tests |
| E2E | **Playwright** | Full workflow canvas interaction tests |

### Backend
| Layer | Choice | Why |
|---|---|---|
| API framework | **FastAPI (Python 3.12)** | Async, auto OpenAPI docs, Pydantic validation, already familiar from MediSense |
| Task queue | **Celery + Redis** | Async workflow execution — steps run as background tasks, not blocking requests |
| Message broker | **Redis** | Celery broker + WebSocket pub/sub + response caching |
| Primary DB | **PostgreSQL 16** | Cases, workflows, audit logs, users, version history |
| Search | **Elasticsearch** (or pg_tsvector for start) | Full-text search across cases, workflow steps, audit logs |
| File storage | **MinIO** (S3-compatible) | Case attachments, workflow exports, evidence files |
| Vector DB | **Qdrant** | Semantic search for similar past cases, runbook retrieval |
| AI orchestration | **CrewAI / LangChain** | Multi-agent SOC triage, Socrates-equivalent |
| Local LLM | **Ollama** (Llama 3.1, Mistral, LLaVA) | Local inference — no cloud dependency |
| Auth server | **Keycloak** | SSO (SAML 2.0 + OIDC), RBAC, matches Torq's SSO model |
| Email | **SMTP via python-multipart / Resend API** | Alert notifications, shift handover emails |

### Infrastructure
| Layer | Choice |
|---|---|
| Containerization | Docker + Docker Compose (dev) |
| Orchestration | Kubernetes (prod) |
| Reverse proxy | Nginx |
| TLS | Certbot / Let's Encrypt |
| Monitoring | Prometheus + Grafana |
| Logging | Loki + Grafana (or ELK stack) |
| CI/CD | GitHub Actions |
| Tunneling (dev→mobile) | Tailscale or ngrok (already familiar from MediSense) |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     BROWSER                              │
│  React 18 + TypeScript + Vite                           │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │  React Flow  │ │ Zustand  │ │  TanStack Query      │ │
│  │  (Canvas)    │ │ (State)  │ │  (API + WebSocket)   │ │
│  └──────────────┘ └──────────┘ └──────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼──────────────────────────────────┐
│                   NGINX (Reverse Proxy)                  │
└──────┬────────────────────────┬────────────────────────┘
       │                        │
┌──────▼──────┐          ┌──────▼──────┐
│  FastAPI    │          │  Keycloak   │
│  (REST API) │          │  (Auth/SSO) │
│  + WebSocket│          └─────────────┘
└──────┬──────┘
       │
┌──────▼────────────────────────────────────────────────┐
│                  Service Layer                         │
│  ┌────────────┐ ┌──────────┐ ┌───────────────────────┐│
│  │ Celery     │ │ Redis    │ │ PostgreSQL             ││
│  │ Workers    │ │ (cache + │ │ (cases, workflows,     ││
│  │ (workflow  │ │  pubsub) │ │  users, audit, git-   ││
│  │  execution)│ └──────────┘ │  style version ctrl)  ││
│  └──────┬─────┘              └───────────────────────┘│
│         │          ┌──────────┐ ┌───────┐ ┌─────────┐ │
│         └──────────► Ollama  │ │ MinIO │ │ Qdrant  │ │
│                    │ (LLM)   │ │(files)│ │(vectors)│ │
│                    └──────────┘ └───────┘ └─────────┘ │
└───────────────────────────────────────────────────────┘
```

---

## 4. Frontend — React + TypeScript

### Setup

```bash
npm create vite@latest occlusion-frontend -- --template react-ts
cd occlusion-frontend
npm install

# Core dependencies
npm install react-flow-renderer @xyflow/react  # workflow canvas
npm install zustand                             # state management
npm install @tanstack/react-query               # data fetching
npm install react-router-dom                    # routing
npm install react-hook-form zod @hookform/resolvers  # forms
npm install recharts                            # charts
npm install socket.io-client                    # real-time

# UI
npm install tailwindcss @tailwindcss/vite       # styling
npm install class-variance-authority clsx tailwind-merge  # shadcn helpers
npm install lucide-react                        # icons (free alt to FA)

# shadcn/ui
npx shadcn@latest init
```

### Tailwind config (`tailwind.config.ts`)

```ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens map to CSS vars — one source of truth
        bg: {
          DEFAULT: 'var(--bg)',
          surface: 'var(--bg2)',
          elevated: 'var(--bg3)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border2)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text2)',
          info: 'var(--text3)',  // small explanatory lines
        },
        // Semantic state colors
        success: {
          DEFAULT: 'var(--green)',    // dark: #00FBB0 / light: #047857
          bg: 'var(--gbg)',
        },
        danger: {
          DEFAULT: 'var(--red)',      // dark: #BE3455 / light: #9B1239
          bg: 'var(--rbg)',
        },
        warning: {
          DEFAULT: 'var(--amber)',    // dark: #E9A841 / light: #92400E
          bg: 'var(--abg)',
        },
        accent: 'var(--accent)',
      },
    },
  },
} satisfies Config
```

### CSS Variables (`src/styles/tokens.css`)

```css
/* ── DARK MODE (default) ── */
:root,
[data-theme="dark"] {
  /* Backgrounds */
  --bg:    #121212;
  --bg2:   #1a1a1a;
  --bg3:   #1E293B;
  --bg4:   #253347;
  --bg5:   #2d3d54;

  /* Text */
  --text:  #F8FAFC;
  --text2: #94a3b8;
  --text3: #475569;    /* info/explanatory text */

  /* Borders */
  --border:  rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.11);
  --border3: rgba(248,250,252,0.20);

  /* Accent */
  --accent:  #4f6ef7;
  --accent2: #7b95ff;
  --aglow:   rgba(79,110,247,0.13);

  /* Semantic — high contrast on dark */
  --green:      #00FBB0;
  --gbg:        rgba(0,251,176,0.10);
  --red:        #BE3455;
  --rbg:        rgba(190,52,85,0.12);
  --amber:      #E9A841;
  --abg:        rgba(233,168,65,0.12);
}

/* ── LIGHT MODE ── */
[data-theme="light"] {
  /* Backgrounds */
  --bg:    #F9FAFB;
  --bg2:   #ffffff;
  --bg3:   #E5E7EB;
  --bg4:   #d1d5db;
  --bg5:   #c4c9d4;

  /* Text */
  --text:  #111827;
  --text2: #6b7280;
  --text3: #9ca3af;   /* info/explanatory text */

  /* Borders */
  --border:  rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.12);
  --border3: rgba(0,0,0,0.20);

  /* Accent */
  --accent:  #4f6ef7;
  --accent2: #3b5fe0;
  --aglow:   rgba(79,110,247,0.08);

  /* Semantic — DARKER tones for readability on light backgrounds */
  --green:  #047857;   /* emerald-700 — readable on white */
  --gbg:    #D1FAE5;   /* emerald-100 */
  --red:    #9B1239;   /* rose-800 — readable on white */
  --rbg:    #FCE7F3;   /* rose-100 */
  --amber:  #92400E;   /* amber-800 — readable on white */
  --abg:    #FEF3C7;   /* amber-100 */
}
```

> **Why this fixes the contrast issue:** The semantic meaning (`--green` = approved/pass) is preserved, but the actual hex value changes per theme. Dark mode gets the neon brand colors; light mode gets their dark-tone equivalents which pass WCAG AA contrast on white backgrounds. The Tailwind class `text-success` always reads `var(--green)` — theme-switching is transparent to components.

### React Flow canvas setup (`src/components/canvas/WorkflowCanvas.tsx`)

```tsx
import { ReactFlow, Background, Controls, MiniMap, addEdge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useWorkflowStore } from '@/stores/workflowStore'
import { TriggerNode, StepNode, OperatorNode, AINode } from './nodes'

const nodeTypes = {
  trigger: TriggerNode,
  step: StepNode,
  operator: OperatorNode,
  ai: AINode,
}

export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore()

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      snapToGrid
      snapGrid={[16, 16]}
    >
      <Background variant="dots" gap={22} size={1} color="var(--border)" />
      <Controls />
      <MiniMap
        nodeColor={(n) => n.type === 'trigger' ? 'var(--accent)' : 'var(--bg4)'}
        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}
      />
    </ReactFlow>
  )
}
```

---

## 5. Backend — FastAPI

### Setup

```bash
python3.12 -m venv .venv
source .venv/bin/activate

pip install fastapi uvicorn[standard]
pip install sqlalchemy asyncpg alembic          # DB
pip install redis celery                         # task queue
pip install python-jose[cryptography] passlib    # JWT
pip install boto3                                # MinIO/S3
pip install qdrant-client                        # vector DB
pip install langchain-community ollama           # LLM
pip install websockets python-socketio           # real-time
pip install pydantic-settings                    # config
pip install pytest pytest-asyncio httpx          # testing
```

### Project layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, routers
│   ├── config.py               # Settings (pydantic-settings)
│   ├── database.py             # AsyncSession, Base
│   ├── auth/
│   │   ├── keycloak.py         # Token validation
│   │   └── dependencies.py     # get_current_user
│   ├── routers/
│   │   ├── workflows.py        # CRUD + version history
│   │   ├── cases.py            # Case lifecycle
│   │   ├── integrations.py     # Integration instances
│   │   ├── executions.py       # Trigger + monitor runs
│   │   ├── insights.py         # Metrics + dashboards
│   │   └── users.py            # User management
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── workflow.py
│   │   ├── case.py
│   │   ├── execution.py
│   │   └── user.py
│   ├── schemas/                # Pydantic request/response schemas
│   ├── services/
│   │   ├── workflow_service.py
│   │   ├── case_service.py
│   │   ├── ai_service.py       # Ollama + CrewAI
│   │   └── git_service.py      # Workflow version control
│   └── workers/
│       ├── celery_app.py
│       └── execution_worker.py # Async step execution
├── alembic/                    # DB migrations
├── tests/
├── docker-compose.yml
└── requirements.txt
```

### Key API routes

```
POST   /api/v1/auth/token                     # Login (proxies Keycloak)
GET    /api/v1/workflows                      # List workflows
POST   /api/v1/workflows                      # Create workflow
GET    /api/v1/workflows/{id}/versions        # Git-like version history
POST   /api/v1/workflows/{id}/publish         # Publish (creates version tag)
POST   /api/v1/workflows/{id}/branches        # Create dev branch
POST   /api/v1/workflows/{id}/diff            # Diff two versions (step-by-step)
POST   /api/v1/executions                     # Trigger workflow run
GET    /api/v1/executions/{id}/stream         # SSE stream for live status
GET    /api/v1/cases                          # List cases (with filters)
POST   /api/v1/cases                          # Create case
PATCH  /api/v1/cases/{id}                     # Update case
GET    /api/v1/cases/{id}/timeline            # Full timeline
POST   /api/v1/cases/{id}/assign-socrates     # Hand off to AI agent
GET    /api/v1/insights/metrics               # Dashboard data
WS     /ws/activity                           # Live execution feed
WS     /ws/shift-handover                     # Shift handover real-time
```

---

## 6. Database Schema (PostgreSQL)

```sql
-- Workflows with Git-style version control
CREATE TABLE workflows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  workspace_id UUID NOT NULL,
  state       TEXT CHECK (state IN ('draft','testing','published')),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workflow_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  UUID REFERENCES workflows(id),
  version_num  INTEGER NOT NULL,
  branch       TEXT DEFAULT 'main',  -- 'main', 'dev/fix-phishing', etc.
  definition   JSONB NOT NULL,       -- full step graph as JSON
  commit_msg   TEXT,
  author_id    UUID REFERENCES users(id),
  parent_id    UUID REFERENCES workflow_versions(id),  -- for branching
  tag          TEXT,                 -- 'v1.0', 'post-ransomware-2025-03' etc.
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Cases
CREATE TABLE cases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  severity     TEXT CHECK (severity IN ('critical','high','medium','low')),
  status       TEXT CHECK (status IN ('open','in_progress','resolved','closed')),
  assignee_id  UUID REFERENCES users(id),
  workspace_id UUID NOT NULL,
  sla_deadline TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  resolved_at  TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}'
);

CREATE TABLE case_timeline (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id   UUID REFERENCES cases(id),
  actor_id  UUID REFERENCES users(id),
  event_type TEXT,  -- 'comment','status_change','assignee_change','workflow_run'
  content   JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Workflow executions
CREATE TABLE executions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id   UUID REFERENCES workflows(id),
  version_id    UUID REFERENCES workflow_versions(id),
  triggered_by  TEXT,   -- 'integration', 'schedule', 'on_demand', 'api'
  status        TEXT CHECK (status IN ('pending','running','success','failed','cancelled')),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  step_results  JSONB DEFAULT '[]',
  case_id       UUID REFERENCES cases(id)
);

-- Shift handover (Occlusion-unique feature)
CREATE TABLE shift_handovers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL,
  outgoing_user UUID REFERENCES users(id),
  incoming_user UUID REFERENCES users(id),
  handover_time TIMESTAMPTZ DEFAULT now(),
  open_cases    JSONB,    -- snapshot of open cases at handover time
  decisions     JSONB,    -- key decisions made during the shift
  watch_items   JSONB,    -- things to keep an eye on
  notes         TEXT,
  acknowledged  BOOLEAN DEFAULT false
);
```

---

## 7. Workflow Execution Engine

Celery workers execute workflow steps asynchronously. Each step is a task.

```python
# app/workers/execution_worker.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    'occlusion',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

@celery_app.task(bind=True, max_retries=3)
def execute_step(self, step_id: str, step_config: dict, context: dict):
    """Execute a single workflow step with retry support."""
    try:
        step_type = step_config['type']
        handler = STEP_REGISTRY[step_type]
        result = handler(step_config, context)
        return {'status': 'success', 'output': result}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=30)

@celery_app.task
def run_workflow(execution_id: str, workflow_def: dict, trigger_data: dict):
    """Orchestrate a full workflow execution."""
    context = {'trigger': trigger_data}
    for step in workflow_def['steps']:
        result = execute_step.delay(step['id'], step, context)
        context[step['id']] = result.get()   # $.step_id.output pattern
        publish_step_update(execution_id, step['id'], result)
```

---

## 8. AI Agent Layer

### Socrates-equivalent (case investigation AI)

```python
# app/services/ai_service.py
from crewai import Agent, Task, Crew
from langchain_community.llms import Ollama

llm = Ollama(model="llama3.1", base_url="http://localhost:11434")

triage_agent = Agent(
    role='SOC Triage Analyst',
    goal='Investigate security cases, enrich IOCs, and recommend actions',
    backstory='Expert SOC analyst with deep knowledge of threat intelligence',
    llm=llm,
    tools=[
        virustotal_lookup,
        create_case_comment,
        query_similar_cases,    # Qdrant semantic search
        update_case_severity,
    ],
    verbose=True,
)

def run_case_investigation(case_id: str, mode: str = 'copilot'):
    """
    mode='copilot'  → conversational, returns suggestions
    mode='autopilot' → executes actions autonomously via actionplan
    """
    case = get_case(case_id)
    task = Task(
        description=f"Investigate case: {case.title}\nSeverity: {case.severity}\nTimeline: {case.timeline}",
        agent=triage_agent,
        expected_output="Investigation summary with recommended next actions"
    )
    crew = Crew(agents=[triage_agent], tasks=[task])
    return crew.kickoff()
```

---

## 9. Auth — Keycloak + JWT

```python
# app/auth/keycloak.py
from jose import jwt, JWTError
import httpx

KEYCLOAK_URL = "http://localhost:8080/realms/occlusion"

async def verify_token(token: str) -> dict:
    """Validate JWT from Keycloak."""
    async with httpx.AsyncClient() as client:
        keys = (await client.get(f"{KEYCLOAK_URL}/protocol/openid-connect/certs")).json()
    try:
        payload = jwt.decode(token, keys, algorithms=["RS256"])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# RBAC roles mapped from Keycloak realm roles:
# owner, contributor, creator, operator, viewer
# cases_analyst, cases_contributor, cases_viewer
# organization_manager
```

### SSO providers supported (Keycloak handles all of these):
- Okta SAML 2.0 / OIDC
- Microsoft Entra ID (Azure AD)
- OneLogin SAML / OIDC
- JumpCloud SAML
- Auth0 + Entra
- Generic SAML 2.0 / OIDC

---

## 10. Infrastructure & DevOps

### `docker-compose.yml`

```yaml
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports: ['3000:3000']
    environment:
      - VITE_API_URL=http://localhost:8000

  api:
    build: ./backend
    ports: ['8000:8000']
    environment:
      - DATABASE_URL=postgresql+asyncpg://occ:occ@postgres/occlusion
      - REDIS_URL=redis://redis:6379/0
    depends_on: [postgres, redis, keycloak]

  worker:
    build: ./backend
    command: celery -A app.workers.celery_app worker --loglevel=info
    depends_on: [redis, postgres]

  postgres:
    image: postgres:16-alpine
    volumes: [pg_data:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: occlusion
      POSTGRES_USER: occ
      POSTGRES_PASSWORD: occ

  redis:
    image: redis:7-alpine

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: start-dev
    ports: ['8080:8080']
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin

  minio:
    image: minio/minio
    command: server /data --console-address ':9001'
    ports: ['9000:9000', '9001:9001']
    volumes: [minio_data:/data]

  qdrant:
    image: qdrant/qdrant
    ports: ['6333:6333']
    volumes: [qdrant_data:/qdrant/storage]

  ollama:
    image: ollama/ollama
    ports: ['11434:11434']
    volumes: [ollama_data:/root/.ollama]

volumes:
  pg_data: minio_data: qdrant_data: ollama_data:
```

---

## 11. Light/Dark Theme System

### React theme provider (`src/providers/ThemeProvider.tsx`)

```tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('occlusion-theme') as Theme) ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('occlusion-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
```

---

## 12. Color Tokens & Design System

| Token | Dark | Light | Usage |
|---|---|---|---|
| `--bg` | `#121212` | `#F9FAFB` | Page background |
| `--bg2` | `#1a1a1a` | `#ffffff` | Sidebar, cards |
| `--bg3` | `#1E293B` | `#E5E7EB` | Elevated surfaces, inputs |
| `--text` | `#F8FAFC` | `#111827` | Primary text |
| `--text2` | `#94a3b8` | `#6b7280` | Secondary text |
| `--text3` | `#475569` | `#9ca3af` | Info/explanatory lines |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.08)` | Default borders |
| `--green` | `#00FBB0` | `#047857` | Approval / pass / connected |
| `--gbg` | `rgba(0,251,176,0.10)` | `#D1FAE5` | Green badge background |
| `--red` | `#BE3455` | `#9B1239` | Rejection / fail / critical |
| `--rbg` | `rgba(190,52,85,0.12)` | `#FCE7F3` | Red badge background |
| `--amber` | `#E9A841` | `#92400E` | In-progress / wait / testing |
| `--abg` | `rgba(233,168,65,0.12)` | `#FEF3C7` | Amber badge background |
| `--accent` | `#4f6ef7` | `#4f6ef7` | Primary action / brand |

> **Rule:** Never hardcode hex in components. Always use CSS variables. Light/dark switching is then automatic everywhere.

---

## 13. Folder Structure

```
occlusion/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/          # React Flow nodes, edges, panels
│   │   │   ├── cases/           # Case table, detail, timeline
│   │   │   ├── sidebar/         # Collapsible nav (Build/Monitor/Investigate)
│   │   │   ├── settings/        # API keys, RBAC, org management
│   │   │   ├── insights/        # Charts, metrics
│   │   │   └── ui/              # shadcn/ui primitives
│   │   ├── stores/              # Zustand stores
│   │   │   ├── workflowStore.ts # Canvas nodes/edges state
│   │   │   ├── caseStore.ts
│   │   │   └── authStore.ts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # API client, utils
│   │   ├── providers/           # ThemeProvider, QueryProvider, AuthProvider
│   │   ├── routes/              # React Router page components
│   │   └── styles/
│   │       └── tokens.css       # CSS variable definitions (light + dark)
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/                     # FastAPI + Celery
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── auth/
│   │   ├── routers/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── workers/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── nginx/nginx.conf
│   └── k8s/                     # Kubernetes manifests (prod)
│
├── docs/                        # Architecture docs, API spec
├── .env.example
└── README.md
```

---

## 14. Environment Variables

### `.env.example`

```env
# App
APP_ENV=development
SECRET_KEY=change-me-in-production

# Database
DATABASE_URL=postgresql+asyncpg://occ:occ@localhost:5432/occlusion

# Redis
REDIS_URL=redis://localhost:6379/0

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=occlusion
KEYCLOAK_CLIENT_ID=occlusion-api
KEYCLOAK_CLIENT_SECRET=

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=occlusion-files

# Qdrant
QDRANT_URL=http://localhost:6333

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# Frontend (Vite)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=occlusion
VITE_KEYCLOAK_CLIENT_ID=occlusion-web
```

---

## 15. Getting Started

```bash
# 1. Clone
git clone https://github.com/your-org/occlusion
cd occlusion

# 2. Start infrastructure
docker compose up -d postgres redis keycloak minio qdrant

# 3. Pull Ollama model
docker compose up -d ollama
docker exec -it occlusion-ollama-1 ollama pull llama3.1

# 4. Backend
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 5. Celery worker (new terminal)
celery -A app.workers.celery_app worker --loglevel=info

# 6. Frontend
cd ../frontend
npm install
npm run dev   # → http://localhost:3000

# 7. Keycloak setup
# Open http://localhost:8080
# Create realm: occlusion
# Create client: occlusion-web (public, PKCE)
# Create client: occlusion-api (confidential)
# Create roles: owner, contributor, creator, operator, viewer, cases_analyst
# Create test user + assign role
```

---

## 16. Shared with MediSense AI

These infrastructure components are identical — run them once, serve both products:

| Component | Reuse |
|---|---|
| **FastAPI gateway** | Separate apps, shared patterns (auth, middleware, base schemas) |
| **Ollama** | Same instance, different models per product (`llama3.1` for SOC, `llava` for medical) |
| **CrewAI** | Same orchestration patterns, different agent personas |
| **PostgreSQL** | Separate databases on the same server (`occlusion`, `medisense`) |
| **Redis** | Same instance, different key namespaces (`occ:*`, `med:*`) |
| **MinIO** | Same instance, separate buckets |
| **Keycloak** | Same instance, separate realms (`occlusion`, `medisense`) |
| **Tailscale/ngrok** | Same tunnel infrastructure |

> Both products are the same backend architecture applied to different domains. Build Occlusion first — MediSense gets the same bones.

---

*Generated for Occlusion HyperSOC · Stack decisions current as of 2026 Q1*
