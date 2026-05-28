# AGENTS.md — Research Intelligence Dashboard (RID)

> This file is written for AI coding agents. It describes the actual project structure, conventions, and commands as they exist in the repository. Do not rely on the root `README.md` for accurate project structure — it describes an aspirational layout that does not match the codebase.

---

## Project Overview

**Research Intelligence Dashboard (RID)** is a full-stack AI-powered research intelligence platform. It provides persistent topic monitoring, weekly business planning, multi-source news aggregation, and LLM-driven strategic analysis — wrapped in an ultra-dark, mobile-first dashboard.

The project is organised into two main parts:

- **`app/`** — React 19 + TypeScript frontend (Vite, Tailwind CSS v3, shadcn/ui)
- **`backend/`** — FastAPI Python backend (async SQLAlchemy, aiosqlite, httpx)

The frontend and backend are separate sub-projects with their own dependency management and build processes. There is no monorepo tooling linking them.

---

## Technology Stack

### Frontend (`app/`)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2.0 |
| Build Tool | Vite | 7.2.4 |
| Language | TypeScript | ~5.9.3 |
| Styling | Tailwind CSS | 3.4.19 |
| UI Components | shadcn/ui + Radix UI | 40+ primitives |
| Animation | Framer Motion | 12.40.0 |
| Charts | Recharts | 2.15.4 |
| Icons | Lucide React | 0.562.0 |
| Forms | React Hook Form + Zod | 7.70.0 / 4.3.5 |
| i18n | react-i18next + i18next | 17.0.8 / 26.3.0 |
| Routing | react-router-dom | 7.15.1 |
| Fonts | Inter Variable + JetBrains Mono | 5.2.8 |

### Backend (`backend/`)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | FastAPI | >=0.110.0 |
| ASGI Server | Uvicorn | >=0.27.0 |
| ORM | SQLAlchemy (async) | >=2.0.0 |
| Database | SQLite via aiosqlite | >=0.19.0 |
| Validation | Pydantic + Pydantic Settings | >=2.0.0 |
| HTTP Client | httpx (async) | >=0.26.0 |
| Auth | python-jose (JWT) + passlib (bcrypt) | >=3.3.0 / >=1.7.4 |
| News Parsing | feedparser + BeautifulSoup4 | >=6.0.0 / >=4.12.0 |
| Python | 3.11+ required |

### Supported LLM Providers

1. **Ollama** (local, default) — `llama3.2` @ `localhost:11434`
2. **OpenAI** (cloud) — GPT-4o / GPT-4o-mini
3. **Moonshot Kimi** (cloud) — `kimi-k1`
4. **Google Gemini** (cloud) — `gemini-1.5-pro`

---

## Directory Structure

```
solo-research-intelligent-agent/
├── app/                          # React frontend
│   ├── src/
│   │   ├── main.tsx              # Entry point — renders App
│   │   ├── App.tsx               # HashRouter, AuthProvider, lazy routes
│   │   ├── pages/                # Route-level page components (lazy-loaded)
│   │   │   ├── Home.tsx
│   │   │   ├── WeeklyPlans.tsx
│   │   │   ├── Topics.tsx
│   │   │   ├── PlanDetail.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── AcceptInvite.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── components/
│   │   │   ├── ui/               # 50+ shadcn/ui primitive components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx        # Sidebar + top nav + page transitions
│   │   │   ├── RouteGuard.tsx    # Auth/role-based route protection
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # React context for auth state (JWT in localStorage)
│   │   ├── hooks/
│   │   │   └── use-mobile.ts
│   │   ├── lib/
│   │   │   ├── api.ts            # fetch wrapper with auth headers + 401 handling
│   │   │   └── utils.ts          # General utilities (cn helper)
│   │   └── i18n/                 # 6-language i18n config + translation JSONs
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── eslint.config.js
│   ├── components.json           # shadcn/ui configuration
│   └── index.html
│
├── backend/                      # FastAPI backend
│   ├── rid/
│   │   ├── main.py               # FastAPI app factory, CORS, router registration
│   │   ├── config.py             # Pydantic Settings (RID_* env vars)
│   │   ├── database.py           # Async SQLAlchemy engine, session, init_db
│   │   ├── models.py             # All SQLAlchemy ORM models (single file)
│   │   ├── auth.py               # Password hashing, JWT tokens, RBAC deps
│   │   ├── routers/              # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── invitations.py
│   │   │   ├── users.py
│   │   │   ├── weekly_plans.py
│   │   │   ├── news.py
│   │   │   ├── analysis.py
│   │   │   ├── plans.py
│   │   │   ├── agents.py
│   │   │   ├── pipeline.py
│   │   │   └── settings.py
│   │   ├── agents/               # Core AI engine modules
│   │   │   ├── base.py           # Abstract interfaces (LLMProvider, etc.)
│   │   │   ├── llm.py            # Ollama, OpenAI, Kimi, Gemini providers
│   │   │   ├── news_engine.py    # RSS, NewsAPI, WebScraper sources
│   │   │   ├── analysis_engine.py # 4 AI analysers
│   │   │   ├── plan_generator.py # Business plan generation
│   │   │   └── orchestrator.py   # ResearchPipeline (fetch→analyse→plan)
│   │   └── plugins/              # Plugin system
│   │       ├── __init__.py       # PluginLoader (auto-discovery)
│   │       ├── rss_advanced.py
│   │       └── sentiment_plugin.py
│   ├── requirements.txt
│   └── run.py                    # Entry point — runs uvicorn with settings
│
├── design-v2/
│   └── design.md                 # Global design system v2 (colors, typography, components)
├── API_REFERENCE.md              # Full API reference (~2,500 lines)
├── BACKEND.md                    # Backend developer guide (~1,500 lines)
├── USER_MANUAL.md                # End-user manual (~1,000 lines)
├── README.md                     # Project overview (aspirational structure, not exact)
└── AGENTS.md                     # This file
```

---

## Build and Run Commands

### Frontend (`app/`)

```bash
cd app
npm install
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build → dist/
npm run lint       # ESLint
npm run preview    # Preview production build
```

**Important:** The Vite dev server runs on port **3000** (configured in `vite.config.ts`). The root `README.md` incorrectly mentions port 5173 and a `frontend/` directory — neither exists.

### Backend (`backend/`)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py      # Runs on http://localhost:8000
```

Or directly with uvicorn:

```bash
uvicorn rid.main:app --reload --port 8000
```

The backend auto-creates the SQLite database (`rid.db`) and seeds a default admin user on first startup.

---

## Environment Configuration

Backend configuration is loaded from environment variables prefixed with `RID_`. Create a `backend/.env` file:

```bash
# Database
RID_DB_PATH=./rid.db

# Ollama (local LLM)
RID_OLLAMA_URL=http://localhost:11434
RID_OLLAMA_MODEL=llama3.2

# Optional external LLM providers
RID_OPENAI_KEY=sk-...
RID_OPENAI_URL=https://api.openai.com/v1

RID_KIMI_KEY=...
RID_KIMI_URL=https://api.moonshot.cn/v1
RID_KIMI_MODEL=kimi-k1

RID_GEMINI_KEY=...
RID_GEMINI_URL=https://generativelanguage.googleapis.com/v1beta/openai
RID_GEMINI_MODEL=gemini-1.5-pro

# News
RID_NEWSAPI_KEY=your_key_here
RID_FETCH_LIMIT=50

# Server
RID_PORT=8000
RID_HOST=0.0.0.0
RID_LOG_LEVEL=INFO

# Auth / RBAC
RID_SECRET_KEY=your-jwt-secret-change-in-production
RID_ADMIN_EMAIL=admin@local
RID_ADMIN_PASSWORD=admin
```

If `RID_SECRET_KEY` is empty, a random key is generated per process (not persisted across restarts).

---

## Code Style Guidelines

### Python (Backend)

- **Python 3.11+** with `from __future__ import annotations` at the top of every file.
- Use **type hints** everywhere.
- Use **Google-style docstrings** with double backticks for inline code (`` `code` ``).
- Imports are grouped: stdlib → third-party → local (`rid.*`).
- No formatter or linter is configured in the repo. If you add one, match the existing style.
- All database operations are **async** via `AsyncSession`.
- All HTTP I/O uses `httpx.AsyncClient`.

### TypeScript / React (Frontend)

- **TypeScript** with strict-ish settings (see `tsconfig.app.json`).
- **Functional components** with hooks. No class components.
- Use the `@/` path alias for imports from `src/`.
- Tailwind CSS classes are composed with the `cn()` utility from `@/lib/utils`.
- shadcn/ui components live in `src/components/ui/` and follow the shadcn conventions.
- ESLint is configured with `@eslint/js`, `typescript-eslint`, `react-hooks`, and `react-refresh`.

### Design System

The project uses an ultra-dark theme inspired by mtsoln.com. Key tokens (defined in `tailwind.config.js`):

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0A0A0F` | Page background |
| `bg-surface` | `#13131A` | Cards, panels |
| `bg-elevated` | `#1A1A24` | Hover states, modals |
| `border-subtle` | `#1E1E2A` | Default borders |
| `accent-cyan` | `#38BDF8` | Active/focus states |
| `accent-blue` | `#5B5CFF` | Primary CTA buttons |
| `text-primary` | `#F0F0F5` | Headlines |
| `text-secondary` | `#8A8B9E` | Body text |

- **No light mode** — dark-only.
- **Mobile-first responsive** — breakpoints at 640px and 1024px.
- **Flat design** — no shadows, borders define hierarchy.
- **Font**: Inter Variable for UI, JetBrains Mono for data/labels.

---

## Testing

**There are currently no tests in the repository.** Neither frontend nor backend has test frameworks configured.

If you add tests:

- **Backend**: `pytest` + `pytest-asyncio` would be the natural choice.
- **Frontend**: `vitest` would integrate well with the Vite setup.

---

## API Conventions

All API endpoints are prefixed with `/api/` (not `/api/v1/` as the README claims).

| Group | Base Path | Tags |
|-------|-----------|------|
| Auth | `/api/auth` | Auth |
| Invitations | `/api/invitations` | Invitations |
| Users | `/api/users` | Users |
| Weekly Plans | `/api/weekly-plans` | Weekly Plans |
| News | `/api/news` | News |
| Analysis | `/api/analysis` | Analysis |
| Business Plans | `/api/plans` | Business Plans |
| Agents | `/api/agents` | Agents & Plugins |
| Pipeline | `/api/pipeline` | Pipeline |
| Settings | `/api/settings` | Settings |
| Health | `/api/health` | Health |

Authentication is via **Bearer JWT token** in the `Authorization` header. The token is stored in `localStorage` as `rid_token` on the frontend.

Interactive API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Authentication & RBAC

### Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access — all CRUD, user management, invitations |
| `editor` | Can create/edit topics, plans, run analysis |
| `viewer` | Read-only access to topics, plans, analysis |

### JWT Token

- Algorithm: **HS256**
- Expiration: **7 days** (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`)
- Stored in `localStorage` as `rid_token` (frontend)

### Route Guards (Frontend)

- `RouteGuard` — requires authentication
- `RouteGuard requireEditor` — requires `admin` or `editor`
- `RouteGuard requireAdmin` — requires `admin`

### Backend Dependencies

- `get_current_user` — optional auth (returns `None` if no token)
- `get_current_active_user` — required auth
- `require_role("editor")` / `require_admin` — RBAC enforcement

---

## Database Models

All models are defined in a single file: `backend/rid/models.py`.

| Model | Table | Key Fields |
|-------|-------|------------|
| `User` | `users` | email, name, password_hash, role (`admin`/`editor`/`viewer`), is_active |
| `Invitation` | `invitations` | email, role, token, expires_at, used_at |
| `WeeklyPlan` | `weekly_plans` | name, description, keywords, is_active |
| `NewsArticle` | `news_articles` | weekly_plan_id, title, url, source, sentiment, relevance_score |
| `Analysis` | `analyses` | weekly_plan_id, analysis_type, content, key_insights, trends, risks, opportunities |
| `BusinessPlan` | `business_plans` | weekly_plan_id, title, overview, timeframe_months, milestones_json, strategies_json |
| `Milestone` | `milestones` | plan_id, title, target_date, status, priority |
| `AgentPlugin` | `agent_plugins` | name, module_path, config_schema, is_enabled |
| `Setting` | `settings` | key, value, category |

Note: `Topic` is a backward-compatibility alias for `WeeklyPlan`.

---

## Research Pipeline

The pipeline runs in 3 steps, orchestrated by `ResearchPipeline` in `backend/rid/agents/orchestrator.py`:

1. **Fetch News** — Aggregates from RSS, NewsAPI, and web scraping (`NewsAggregator`)
2. **Run Analysis** — AI-powered trend, competitor, risk, and summary analysis (`AnalysisRunner`)
3. **Generate Plan** — Creates a structured business plan with milestones (`PlanGenerator`)

Run the full pipeline:

```bash
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"topic_id": 1}'
```

Run a single step:

```bash
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"topic_id": 1, "step": "fetch_news"}'
```

---

## Plugin System

Plugins are auto-discovered via `BasePlugin` interface in `backend/rid/plugins/`.

Built-in plugins:
- `rss_advanced.py` — Advanced RSS plugin
- `sentiment_plugin.py` — Enhanced sentiment analysis

Plugins are registered in the `agent_plugins` table and can be enabled/disabled via the API.

---

## Security Considerations

1. **JWT in localStorage** — The frontend stores the JWT token in `localStorage`. This is simple but vulnerable to XSS. Consider `httpOnly` cookies for production hardening.
2. **Default admin password** — The default admin password is `"admin"`. Change `RID_ADMIN_PASSWORD` in production.
3. **CORS** — Backend CORS is hardcoded to `http://localhost:3000` and `http://127.0.0.1:3000`. Update `backend/rid/main.py` for production origins.
4. **No rate limiting** — The backend does not implement rate limiting. Add it for production.
5. **No HTTPS enforcement** — The backend runs HTTP only. Use a reverse proxy (nginx, Caddy) for TLS termination.
6. **SQL injection protection** — All DB access uses SQLAlchemy ORM with parameterized queries.
7. **No test framework** — No automated security or integration tests exist.

---

## Known Gaps & Inconsistencies

- **No Docker files** — The root `README.md` describes Docker deployment, but no `Dockerfile`, `docker-compose.yml`, or `nginx.conf` exists in the repo.
- **No CI/CD** — No GitHub Actions, GitLab CI, or other CI configuration.
- **No test files** — Neither frontend nor backend has tests.
- **No `.env.example`** — The backend README mentions one, but it does not exist.
- **README structure mismatch** — The root `README.md` describes a `frontend/` directory and a `backend/app/` package structure that do not match the actual codebase (`app/` and `backend/rid/` respectively).
- **Port mismatch in README** — README says frontend dev server is on 5173; actual Vite config uses 3000.
- **No `FRONTEND.md`** — Mentioned in `plan-docs.md` but does not exist.
- **No state management library** — Auth uses React Context; the rest appears to use local component state. The README mentions Zustand but it is not used.

---

## Useful References

| File | Content |
|------|---------|
| `backend/SPEC.md` | Backend spec: architecture diagram, all API endpoints, DB schema, env vars |
| `backend/README.md` | Backend quick start and project structure |
| `API_REFERENCE.md` | Complete API reference with request/response examples |
| `BACKEND.md` | Detailed backend developer guide: LLM providers, news aggregation, AI analysis, plugin system |
| `USER_MANUAL.md` | End-user manual: dashboard, topics, plans, AI analysis, settings, troubleshooting |
| `design-v2/design.md` | Design system v2: color palette, typography, spacing, component design, animations |
