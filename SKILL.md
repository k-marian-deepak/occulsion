---
name: occlusion-hypersoc
description: >
  Build, extend, and maintain Occlusion — a HyperSOC security automation platform
  (React + TypeScript + React Flow frontend, FastAPI + Celery + PostgreSQL backend,
  Ollama/CrewAI AI agents, Keycloak SSO). Use this skill whenever the user asks to:
  build or modify any part of the Occlusion platform (UI components, workflow canvas,
  case management, settings pages, API endpoints, database schema, AI agents, auth,
  Docker/infra config); fix light/dark theme contrast or color token issues; extend
  the integration library; add version-control features to workflows; implement shift
  handover; scaffold new FastAPI routers or Celery tasks; or connect Occlusion to
  MediSense AI shared infrastructure. Also trigger for any question about the full
  stack, tech choices, or architecture of this project.
---

# Occlusion HyperSOC — Skill

Occlusion is an AI-driven Security Operations Center (SOC) hyperautomation platform.
It is a custom build inspired by Torq HyperSOC with three unique differentiators:

1. **Git-like version control for workflows/pipelines** — branch, diff, PR, rollback
2. **Shift handover as a first-class feature** — structured, real-time, auditable
3. **Post-incident learning loop** — analyst decisions feed back into future triage

Read `occlusion-stack.md` for the full architecture, stack rationale, folder structure,
environment setup, and database schema. That file is the single source of truth.

---

## Quick orientation

```
occlusion/
├── frontend/          React 18 + TypeScript + Vite + Tailwind CSS v4 + React Flow
├── backend/           FastAPI + Celery + SQLAlchemy (async) + Pydantic v2
├── infra/             Docker Compose + Nginx + K8s manifests
└── occlusion-stack.md Full project documentation (START HERE)
```

---

## Core design decisions to always respect

### 1. Color tokens — never hardcode hex in components

All colors go through CSS variables. Light/dark mode is handled at the `:root` /
`[data-theme="light"]` level in `src/styles/tokens.css`. Components use `var(--green)`,
`var(--red)`, `var(--amber)` — never raw hex.

| Semantic meaning | Dark token value | Light token value |
|---|---|---|
| Approval / pass / connected / published | `#00FBB0` | `#047857` |
| Rejection / fail / critical / expired | `#BE3455` | `#9B1239` |
| In-progress / wait / testing / warning | `#E9A841` | `#92400E` |
| Page background | `#121212` | `#F9FAFB` |
| Primary text | `#F8FAFC` | `#111827` |
| Borders / info text (explanatory lines) | `#1E293B` | `#E5E7EB` |

**Light mode contrast rule:** The neon semantic colors (`#00FBB0`, `#BE3455`, `#E9A841`)
are fine on dark backgrounds but wash out on white. In light mode, always use darker
variants of the same hue that pass WCAG AA (≥4.5:1 contrast on `#F9FAFB`).

### 2. Sidebar structure — must match Torq's exact layout

The sidebar is collapsible-section based (NOT flat nav groups):

```
[Logo: Occlusion]           [🌙 theme toggle]
[Workspace avatar + name + chevron]
──────────────────────────
▾ Build
    Workflows
    Integrations
    Workspace Variables
    Templates
▾ Monitor
    Activity Log
    Insights
    Dashboards
▾ Investigate
    Cases
    Canvas
──────────────────────────
[Evaluation bar — 449 days left]
──────────────────────────
⚙  Settings
✦  What's new
?  Help Center
──────────────────────────
[Avatar] Deepak Singh  [···]
```

Active item: left accent bar in `#00FBB0` (dark) or `#047857` (light).

### 3. Workflow canvas — React Flow, not vanilla JS

The prototype was built in vanilla JS with manual SVG. The production build uses
**React Flow (`@xyflow/react`)**. Node types: `trigger`, `step`, `operator`, `ai`.
Snap to 16px grid. Minimap shows node colors by type.

### 4. Workflow version control — the core differentiator

Every workflow publish creates a `workflow_versions` row with:
- `branch` (main / dev/feature-name)
- `parent_id` (enables branching tree)
- `definition` JSONB (full step graph)
- `tag` (optional release tag)
- `commit_msg`

When diffing two versions, compare `definition` JSONB step-by-step and highlight
added/removed/modified steps. This is Occlusion's primary differentiator over Torq.

### 5. AI agents — Ollama local inference, CrewAI orchestration

Never hard-depend on OpenAI API. Default LLM is Ollama (local). BYOS (bring your
own subscription) is an opt-in. The `ai_service.py` wraps both paths behind the same
`run_case_investigation(case_id, mode)` interface.

### 6. Auth — Keycloak, not custom JWT

Do not implement a custom auth server. Keycloak handles SSO (SAML/OIDC), RBAC roles,
MFA, and session management. FastAPI validates tokens via JWKS endpoint. Frontend uses
`keycloak-js` or `react-keycloak-web` adapter.

---

## When the user asks to build something new

### Frontend component

1. Check if a shadcn/ui primitive covers it — prefer composition over building from scratch
2. Style with Tailwind utilities + CSS variables only (no inline hex)
3. Put complex state in a Zustand store, not component-local state
4. Use TanStack Query for any server data (not `useEffect + fetch`)
5. If it involves forms: React Hook Form + Zod schema

### Backend endpoint

1. Add router in `app/routers/`
2. Define Pydantic request/response schemas in `app/schemas/`
3. Business logic in `app/services/` (not in the router)
4. Long-running ops → Celery task in `app/workers/`
5. Write migration: `alembic revision --autogenerate -m "description"`

### New integration card

Add to the `DB` array in the frontend `torq-combined.html` (prototype) or the
`FULL_INTS` data in the React app's `src/data/integrations.ts`. Fields:
```ts
{
  n: 'Integration Name',
  cat: 'SIEM' | 'EDR' | 'Identity' | ...,  // one of 16 categories
  fa: 'fa-solid fa-...',   // Font Awesome icon class
  ib: 'rgba(r,g,b,0.1)',   // icon background (10% opacity brand color)
  ic: '#hexcolor',          // icon foreground (brand color)
  t: 'both' | 'trigger' | 'step',
  c: false,                 // connected status
  d: 'Description...',
  auth: ['API Key', 'Base URL'],  // auth fields needed
}
```

---

## Common tasks — quick reference

### Fix a light mode contrast issue
→ The color is probably using a neon dark-mode value on a light background.
  Set the correct darker variant in `[data-theme="light"]` in `tokens.css`.
  Never change the dark-mode value — change only the light-mode override.

### Add a new settings sub-page
→ Add `<div class="s-page" id="sp-newpage">` in the settings HTML.
  Add `.sn-item` to the settings nav pointing to `setSettingsPage('newpage')`.
  Follow the existing pattern (s-card, s-row, s-row-left, s-inp, toggle).

### Add a collapsible sidebar section
→ Copy the `sb-section` pattern. Give it a unique `id="sec-name"` and
  `id="items-name"`. The `toggleSection('name')` function handles collapse.

### Trigger a workflow from the UI
→ `POST /api/v1/executions` with `{ workflow_id, trigger_data }`.
  Subscribe to `WS /ws/activity` to stream live step updates.
  The execution status updates via Redis pub/sub → WebSocket → TanStack Query invalidation.

### Add a workflow version
→ On publish: `POST /api/v1/workflows/{id}/publish` with `{ commit_msg, tag? }`.
  Backend creates a `workflow_versions` row with `version_num = latest + 1`.
  On branch: `POST /api/v1/workflows/{id}/branches` with `{ branch_name, from_version_id }`.

---

## Files to read before major changes

| File | When to read |
|---|---|
| `occlusion-stack.md` | Full architecture, stack decisions, DB schema, env vars |
| `src/styles/tokens.css` | Before touching any color, theme, or spacing |
| `src/stores/workflowStore.ts` | Before touching the canvas |
| `app/routers/workflows.py` | Before adding workflow API endpoints |
| `app/services/ai_service.py` | Before modifying AI agent behaviour |
| `alembic/versions/` (latest) | Before adding DB migrations |
| `docker-compose.yml` | Before adding new services |

---

## Shared infrastructure with MediSense AI

Ollama, PostgreSQL server, Redis, MinIO, and Keycloak are shared between Occlusion
and MediSense AI. Use separate:
- PostgreSQL databases (`occlusion` vs `medisense`)
- Redis key namespaces (`occ:*` vs `med:*`)
- MinIO buckets
- Keycloak realms

Never modify shared infra in a way that breaks MediSense. Test both after infra changes.

---

## Stack summary (one-liner per layer)

```
React 18 + TypeScript    → UI framework (type-safe, component model)
Vite                     → Build tool (fast HMR, native ESM)
Tailwind CSS v4          → Styling (theme tokens, utility-first)
shadcn/ui                → UI primitives (unstyled, composable)
React Flow               → Workflow canvas (drag-drop, node-edge)
Zustand                  → Client state (lightweight, no boilerplate)
TanStack Query v5        → Server state (cache, background refetch)
React Router v6          → SPA routing
FastAPI (Python 3.12)    → REST API + WebSocket
Celery + Redis           → Async workflow execution engine
PostgreSQL 16            → Primary database (cases, workflows, audit)
Redis                    → Broker + pub/sub + cache
MinIO                    → File storage (attachments, exports)
Qdrant                   → Vector DB (case similarity, runbook search)
Ollama + CrewAI          → Local LLM + multi-agent orchestration
Keycloak                 → SSO (SAML/OIDC), RBAC, MFA
Docker Compose → K8s     → Dev → production infrastructure
Nginx                    → Reverse proxy + TLS
Prometheus + Grafana     → Metrics and alerting
```
