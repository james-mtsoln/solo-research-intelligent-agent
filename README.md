# Research Intelligence Dashboard (RID)

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white" alt="Python 3.10+" />
  <img src="https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Tailwind-v3-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v3" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" />
</p>

<p align="center">
  <strong>AI-Powered Research Intelligence for Teams</strong><br/>
  Persistent topic monitoring, weekly business planning, multi-source news aggregation,<br/>
  and LLM-driven strategic analysis — all in one ultra-dark, mobile-first dashboard.
</p>

<p align="center">
  <a href="https://www.mtsoln.com/rid"><b>Live Demo</b></a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#api-overview">API</a>
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Development](#development)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The **Research Intelligence Dashboard (RID)** is a standalone, full-stack AI research assistant designed for analysts, strategists, and teams who need to monitor ongoing topics, plan business cycles, and synthesize intelligence from multiple sources — all within a single, privacy-respecting platform.

Unlike ephemeral chat-based AI tools, RID is built around **persistence**: research "Topics" continuously gather news and analysis over time, while "Weekly Plans" drive structured business planning cycles across 52-week timelines. Every insight is stored, searchable, and actionable. The ultra-dark UI — inspired by the refined aesthetics of mtsoln.com — puts content front and center with near-black surfaces, subtle borders, and carefully chosen accent colors that reduce eye strain during long research sessions.

RID runs entirely on your own infrastructure. With support for **Ollama (local LLMs)**, your data never leaves your machine. For teams that need cloud-scale models, RID also integrates with OpenAI, Anthropic, Moonshot (Kimi), and Google Gemini — switch providers on a per-request basis or set a global default.

---

## Features

### Research Management

| Feature | Description |
|---------|-------------|
| **Topics** | Create persistent research areas (e.g., "AI in Healthcare", "Crypto Regulation") that continuously collect news, analysis, and insights over time |
| **Weekly Plans** | Time-bound business planning cycles mapped to Week 1–52 with news feeds, AI-generated analysis, and strategic timeline tracking |
| **Plan Detail View** | Deep-dive into any weekly plan with aggregated news, AI intelligence reports, and Gantt-style timeline visualization |
| **Bookmarking** | Save key articles and insights across topics and plans for quick reference |

### AI-Powered Intelligence

| Feature | Description |
|---------|-------------|
| **Trend Analyzer** | Identifies emerging patterns and directional shifts across your news corpus |
| **Competitor Analyzer** | Maps competitive landscape changes, new entrants, and strategic moves |
| **Risk Analyzer** | Surfaces regulatory, market, and operational risks with severity scoring |
| **Summary Generator** | Produces concise executive briefings from large volumes of collected articles |
| **Business Planning** | AI-generated 6–12 month strategic plans with milestones, resource allocation, and Gantt-style timelines |
| **5 AI Providers** | Ollama (local), OpenAI, Anthropic, Moonshot (Kimi), Google Gemini — configurable per-request |

### Multi-Language Support (i18n)

RID's interface is fully localized via `react-i18next`:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Complete |
| Simplified Chinese | `zh-CN` | Complete |
| Traditional Chinese | `zh-TW` | Complete |
| Japanese | `ja` | Complete |
| Korean | `ko` | Complete |
| Thai | `th` | Complete |

### Team Collaboration

| Feature | Description |
|---------|-------------|
| **Role-Based Access Control** | Three roles — Admin, Editor, Viewer — with granular permissions |
| **Email Invitations** | Invite team members via email with role assignment |
| **User Management** | Admins can add, remove, and reassign roles from the Team page |
| **Audit Trail** | Track who created topics, plans, and analyses |

### Local-First Architecture

| Feature | Description |
|---------|-------------|
| **Ollama Integration** | Run LLMs entirely locally — zero data egress, full privacy |
| **Self-Hosted** | Deploy on your own Mac or Linux server; no vendor lock-in |
| **Plugin System** | Extensible OSS add-on architecture for custom analyzers, data sources, and exporters |
| **Async Everything** | All I/O (RSS, NewsAPI, web scraping, LLM calls) is fully asynchronous |
| **SQLite Default** | Lightweight `aiosqlite` backend with optional PostgreSQL upgrade path |

---

## Screenshots

RID's interface is organized around eight primary views:

### Dashboard
The central command center displaying active topics, current weekly plan status, recent news highlights, and quick-access AI analysis cards. Dark-themed with cyan accent metrics and subtle card-based layout.

### Topics
A browsable grid of all persistent research topics. Each topic card shows news volume, last update time, and active analyzer status. Create, edit, archive, or delete topics. Filter by category, language, or recency.

### Weekly Plans
A calendar-aligned list of all 52 weekly planning cycles. Each row shows the week number, plan title, completion status, and a preview of associated news count. Navigate forward and backward through the year.

### Plan Detail
The richest view in RID. Split-pane layout: left sidebar shows the news feed (RSS + NewsAPI + scraped articles); right panel shows AI-generated analysis tabs (Trend, Competitor, Risk, Summary) and an interactive Gantt-style timeline for the strategic plan.

### Agents
Configure and manage AI analyzer agents. Set default LLM provider, model parameters (temperature, max tokens), and toggle individual analyzers on/off. View agent execution logs and token usage statistics.

### Settings
Personal preferences: theme (dark-only), language selector, notification preferences, API key management for cloud LLM providers, and default plan templates.

### Login
Clean, centered authentication form with email/password entry. Supports persistent sessions via JWT refresh tokens. "Remember me" option for 30-day sessions.

### Team Management
Admin-only page displaying all team members with their roles, invitation status, and last active time. Send new invitations, revoke access, and reassign roles inline.

---

## Architecture

```
+-----------------------------------------------------------+
|                    React 19 Frontend                       |
|  +------------------+  +------------------+               |
|  |  Vite (Build)    |  |  TypeScript      |               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  |  Tailwind CSS v3 |  |  shadcn/ui       |               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  |  Framer Motion   |  |  Recharts        |               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  |  react-i18next   |  |  Zustand Store   |               |
|  +------------------+  +------------------+               |
+-----------------------------------------------------------+
                          | HTTPS / REST
                          v
+-----------------------------------------------------------+
|                 Python 3.10+ Backend                       |
|  +------------------+  +------------------+               |
|  |  FastAPI (async) |  |  SQLAlchemy 2.0  |               |
|  |  Uvicorn (ASGI)  |  |  aiosqlite       |               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  |  httpx (async)   |  |  passlib + bcrypt|               |
|  +------------------+  +------------------+               |
|  +------------------+  +------------------+               |
|  |  python-jose     |  |  APScheduler     |               |
|  |  (JWT)           |  |  (cron jobs)     |               |
|  +------------------+  +------------------+               |
+-----------------------------------------------------------+
                          | Async I/O
              +-----------+-----------+-----------+
              v           v           v           v
+---------+  +---------+  +---------+  +---------+
| Ollama  |  | OpenAI  |  |Anthropic|  | Gemini  |
| (local) |  | (cloud) |  | (cloud) |  | (cloud) |
+---------+  +---------+  +---------+  +---------+
                                              +
+---------+  +---------+  +---------+         |
| RSS     |  | NewsAPI |  | Web     |         |
| Feeds   |  | (cloud) |  | Scraping|         |
+---------+  +---------+  +---------+         |
                                              v
                                        +---------+
                                        | Moonshot|
                                        | (Kimi)  |
                                        +---------+
```

### Data Flow

```
User creates Topic/Plan
       |
       v
Backend schedules background jobs (APScheduler)
       |
       +---> RSS Feeds ---> Parsed Articles ---> SQLite DB
       +---> NewsAPI -----> Fetched Articles ---> SQLite DB
       +---> Web Scraping -> Extracted Content -> SQLite DB
       |
       v
AI Analyzer Pipeline (async, per-provider)
       |
       +---> Trend Analyzer -----> Analysis Records
       +---> Competitor Analyzer -> Analysis Records
       +---> Risk Analyzer -------> Analysis Records
       +---> Summary Generator ---> Analysis Records
       |
       v
Frontend polls / WebSocket updates Dashboard
```

---

## Quick Start

Get RID running locally in under 5 minutes:

### Prerequisites

- **macOS** 12+ or **Linux** (Ubuntu 22.04+ recommended)
- **Node.js** 20+ and **npm** 10+
- **Python** 3.10+ and **pip**
- **Git**

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/your-org/research-intelligence-dashboard.git
cd research-intelligence-dashboard

# Setup backend
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# Setup frontend
cd frontend
npm install
cd ..
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your settings (see Configuration section)
cd ..
```

### 3. Initialize Database

```bash
cd backend
source venv/bin/activate
python -c "from app.database import init_db; import asyncio; asyncio.run(init_db())"
cd ..
```

### 4. Start Both Services

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

### 5. Open in Browser

Navigate to `http://localhost:5173` — the RID dashboard will load and prompt you to create an admin account on first visit.

---

## Installation

### macOS (12 Monterey or later)

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install python@3.11 node@20 git

# Clone and setup
git clone https://github.com/your-org/research-intelligence-dashboard.git
cd research-intelligence-dashboard

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Return to project root
cd ..
```

### Linux (Ubuntu 22.04/24.04)

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y python3.11 python3.11-venv python3-pip nodejs npm git

# Clone and setup
git clone https://github.com/your-org/research-intelligence-dashboard.git
cd research-intelligence-dashboard

# Backend setup
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Return to project root
cd ..
```

### Optional: Local LLM with Ollama

```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Pull a recommended model
ollama pull llama3.2
ollama pull mistral

# Start Ollama (runs on localhost:11434)
ollama serve
```

### Optional: NewsAPI Key

Sign up for a free API key at [newsapi.org](https://newsapi.org) and add it to your `.env` file for enhanced news coverage.

---

## Configuration

All configuration is managed via environment variables in `backend/.env`:

### Core Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_NAME` | No | `Research Intelligence Dashboard` | Application display name |
| `DEBUG` | No | `false` | Enable FastAPI debug mode |
| `SECRET_KEY` | **Yes** | — | JWT signing secret (generate: `openssl rand -hex 32`) |
| `DATABASE_URL` | No | `sqlite+aiosqlite:///./rid.db` | Async SQLite database path |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS-allowed frontend origin |

### AI Provider API Keys (at least one recommended)

| Variable | Required | Description |
|----------|----------|-------------|
| `OLLAMA_BASE_URL` | No | Ollama endpoint (default: `http://localhost:11434`) |
| `OPENAI_API_KEY` | No | OpenAI API key for GPT-4o / GPT-4o-mini |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for Claude 3.5 Sonnet |
| `MOONSHOT_API_KEY` | No | Moonshot (Kimi) API key |
| `GEMINI_API_KEY` | No | Google Gemini API key |
| `DEFAULT_AI_PROVIDER` | No | Default provider: `ollama`, `openai`, `anthropic`, `moonshot`, `gemini` |

### News & Data Sources

| Variable | Required | Description |
|----------|----------|-------------|
| `NEWSAPI_KEY` | No | NewsAPI.org API key for news aggregation |
| `RSS_FEEDS` | No | Comma-separated list of default RSS feed URLs |
| `SCRAPE_INTERVAL_MINUTES` | No | Web scraping frequency (default: `60`) |

### Email (for team invitations)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | No | SMTP server hostname |
| `SMTP_PORT` | No | SMTP server port (default: `587`) |
| `SMTP_USER` | No | SMTP authentication username |
| `SMTP_PASSWORD` | No | SMTP authentication password |
| `SMTP_FROM` | No | Sender email address for invitations |

### Security

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | JWT refresh token lifetime |
| `MAX_LOGIN_ATTEMPTS` | No | `5` | Failed login attempts before lockout |
| `INVITE_TOKEN_EXPIRE_HOURS` | No | `48` | Email invitation link expiration |

### Example `.env` file

```bash
# Core
APP_NAME=Research Intelligence Dashboard
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
DEBUG=false
DATABASE_URL=sqlite+aiosqlite:///./rid.db
FRONTEND_URL=http://localhost:5173

# AI Providers
OLLAMA_BASE_URL=http://localhost:11434
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
DEFAULT_AI_PROVIDER=ollama

# News
NEWSAPI_KEY=your-newsapi-key
SCRAPE_INTERVAL_MINUTES=60

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Security
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

---

## Project Structure

```
research-intelligence-dashboard/
├── backend/                          # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Environment configuration
│   │   ├── database.py               # SQLAlchemy async engine & session
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py               # User, Role, Invitation models
│   │   │   ├── topic.py              # Topic, TopicNews models
│   │   │   ├── plan.py               # WeeklyPlan, PlanItem models
│   │   │   ├── analysis.py           # AnalysisResult, AnalyzerRun models
│   │   │   └── plugin.py             # Plugin registry models
│   │   ├── routers/                  # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Login, register, token refresh
│   │   │   ├── users.py              # User CRUD, team management
│   │   │   ├── topics.py             # Topic CRUD, news association
│   │   │   ├── plans.py              # Weekly plan CRUD, timeline
│   │   │   ├── analysis.py           # AI analysis triggers & results
│   │   │   ├── agents.py             # AI agent configuration
│   │   │   ├── news.py               # News feed, search, bookmarks
│   │   │   ├── plugins.py            # Plugin management
│   │   │   └── system.py             # Health, settings, i18n
│   │   ├── services/                 # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── ai/                   # AI provider integrations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py           # Abstract AI provider interface
│   │   │   │   ├── ollama.py         # Ollama local LLM client
│   │   │   │   ├── openai_client.py  # OpenAI API client
│   │   │   │   ├── anthropic.py      # Anthropic Claude client
│   │   │   │   ├── moonshot.py       # Moonshot (Kimi) client
│   │   │   │   └── gemini.py         # Google Gemini client
│   │   │   ├── analyzers/            # AI analyzer implementations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── trend.py          # Trend analysis engine
│   │   │   │   ├── competitor.py     # Competitor analysis engine
│   │   │   │   ├── risk.py           # Risk analysis engine
│   │   │   │   └── summary.py        # Summary generation engine
│   │   │   ├── news/                 # News aggregation services
│   │   │   │   ├── __init__.py
│   │   │   │   ├── rss.py            # RSS feed parser (async)
│   │   │   │   ├── newsapi.py        # NewsAPI client
│   │   │   │   └── scraper.py        # Web scraping engine
│   │   │   ├── planning.py           # Business planning generator
│   │   │   ├── invitation.py         # Email invitation service
│   │   │   └── plugin_loader.py      # Plugin discovery & loading
│   │   ├── core/                     # Core utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py           # Password hashing, JWT encode/decode
│   │   │   ├── permissions.py        # RBAC permission checks
│   │   │   ├── exceptions.py         # Custom exception classes
│   │   │   └── middleware.py         # CORS, logging, rate limiting
│   │   ├── plugins/                  # Built-in & third-party plugins
│   │   │   └── __init__.py
│   │   └── locales/                  # Backend i18n strings
│   │       ├── en.json
│   │       ├── zh-CN.json
│   │       ├── zh-TW.json
│   │       ├── ja.json
│   │       ├── ko.json
│   │       └── th.json
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variable template
│   └── Dockerfile                    # Backend container image
│
├── frontend/                         # React 19 frontend
│   ├── src/
│   │   ├── main.tsx                  # App entry point
│   │   ├── App.tsx                   # Root router & providers
│   │   ├── index.css                 # Tailwind directives + global styles
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ui/                   # shadcn/ui primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/               # Layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── TopBar.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   └── PageContainer.tsx
│   │   │   ├── charts/               # Recharts visualizations
│   │   │   │   ├── TimelineGantt.tsx
│   │   │   │   ├── NewsVolumeChart.tsx
│   │   │   │   └── SentimentTrend.tsx
│   │   │   └── shared/               # Shared components
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── LanguageSelector.tsx
│   │   │       └── ThemeToggle.tsx
│   │   ├── pages/                    # Route-level page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Topics.tsx
│   │   │   ├── TopicDetail.tsx
│   │   │   ├── WeeklyPlans.tsx
│   │   │   ├── PlanDetail.tsx
│   │   │   ├── Agents.tsx
│   │   │   ├── Settings.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── TeamManagement.tsx
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useTopics.ts
│   │   │   ├── usePlans.ts
│   │   │   ├── useAnalysis.ts
│   │   │   ├── useNews.ts
│   │   │   └── useLocale.ts
│   │   ├── stores/                   # Zustand state stores
│   │   │   ├── authStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── themeStore.ts
│   │   ├── services/                 # API client layer
│   │   │   ├── api.ts                # Axios instance with interceptors
│   │   │   ├── auth.service.ts
│   │   │   ├── topic.service.ts
│   │   │   ├── plan.service.ts
│   │   │   ├── analysis.service.ts
│   │   │   └── news.service.ts
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── auth.ts
│   │   │   ├── topic.ts
│   │   │   ├── plan.ts
│   │   │   ├── analysis.ts
│   │   │   └── news.ts
│   │   ├── i18n/                     # Internationalization
│   │   │   ├── index.ts              # i18n initialization
│   │   │   ├── en.json               # English translations
│   │   │   ├── zh-CN.json            # Simplified Chinese
│   │   │   ├── zh-TW.json            # Traditional Chinese
│   │   │   ├── ja.json               # Japanese
│   │   │   ├── ko.json               # Korean
│   │   │   └── th.json               # Thai
│   │   └── lib/                      # Utility functions
│   │       ├── utils.ts              # General utilities
│   │       ├── constants.ts          # App constants
│   │       └── formatters.ts         # Date, number formatters
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── components.json               # shadcn/ui configuration
│   ├── package.json
│   └── Dockerfile                    # Frontend container image
│
├── docker-compose.yml               # Full-stack Docker deployment
├── Dockerfile                       # Combined build (optional)
├── nginx.conf                       # Nginx reverse proxy config
├── README.md                        # This file
└── LICENSE                          # MIT License
```

---

## API Overview

All API endpoints are prefixed with `/api/v1/` and return JSON. Authentication is via Bearer JWT token in the `Authorization` header.

### Endpoint Groups

| Group | Base Path | Description |
|-------|-----------|-------------|
| **Authentication** | `/api/v1/auth` | Login, register, token refresh, password reset |
| **Users** | `/api/v1/users` | User CRUD, profile, team management |
| **Topics** | `/api/v1/topics` | Create, list, update, delete research topics |
| **Weekly Plans** | `/api/v1/plans` | Plan CRUD, week navigation, timeline data |
| **Analysis** | `/api/v1/analysis` | Trigger AI analysis, retrieve results |
| **Agents** | `/api/v1/agents` | AI agent configuration, provider settings |
| **News** | `/api/v1/news` | News feed, search, bookmarks, sources |
| **Plugins** | `/api/v1/plugins` | Plugin discovery, install, enable/disable |
| **System** | `/api/v1/system` | Health check, settings, i18n resources |

### Example Requests

```bash
# Login (returns access + refresh tokens)
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "securepassword"}'

# List topics (authenticated)
curl http://localhost:8000/api/v1/topics \
  -H "Authorization: Bearer <access_token>"

# Trigger AI analysis on a topic
curl -X POST http://localhost:8000/api/v1/analysis/topic/1/analyze \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"analyzer": "trend", "provider": "ollama"}'

# Create a weekly plan
curl -X POST http://localhost:8000/api/v1/plans \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q1 Market Entry Strategy",
    "week_number": 5,
    "description": "Analyze APAC market conditions"
  }'

# Invite team member
curl -X POST http://localhost:8000/api/v1/users/invite \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "colleague@example.com", "role": "editor"}'
```

### Interactive API Docs

When running the backend, auto-generated documentation is available at:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Development

### Running the Backend (Development)

```bash
cd backend
source venv/bin/activate

# With auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run database migrations (if applicable)
alembic upgrade head
```

The backend will be available at `http://localhost:8000` with hot-reload enabled.

### Running the Frontend (Development)

```bash
cd frontend

# Start Vite dev server
npm run dev

# Or with explicit host binding
npm run dev -- --host 0.0.0.0
```

The frontend will be available at `http://localhost:5173` with HMR (Hot Module Replacement).

### Running Tests

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest -v --cov=app tests/

# Frontend tests
cd frontend
npm run test

# E2E tests (Playwright)
npx playwright test
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check app/
ruff format app/
mypy app/

# Frontend linting
cd frontend
npm run lint
npm run format
```

---

## Deployment

### Docker (Recommended)

A complete `docker-compose.yml` is provided for production deployment:

```bash
# Build and start all services
docker compose up -d --build

# Services:
# - rid-frontend   : nginx serving React build (port 80)
# - rid-backend    : FastAPI + Uvicorn (port 8000)
# - rid-db         : SQLite volume mount (persistent)
# - rid-scheduler  : Background job runner
```

### Manual Production Deployment

#### Backend

```bash
cd backend
source venv/bin/activate

# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn + Uvicorn workers
gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

#### Frontend

```bash
cd frontend

# Build for production
npm run build

# Serve with nginx
# Copy dist/ contents to /var/www/rid/
# Use provided nginx.conf as a template
```

#### Nginx Configuration

Use the provided `nginx.conf` as a starting point:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /var/www/rid;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Deployed Instance

A live demo is running at: **https://www.mtsoln.com/rid**

---

## Security

### Authentication Model

RID uses a dual-token JWT authentication system:

```
+--------+                                    +--------+
| Client | --(email/password)---------------> | Server |
+--------+                                    +--------+
                                                 |
                                                 v
+--------+ <--(access_token + refresh_token)-- +--------+
| Client |                                    | Server |
+--------+                                    +--------+
   |                                               |
   |--(access_token in Authorization header)-----> |
   |                                               |
   |<----------------(protected resource)--------- |
   |                                               |
   |--(refresh_token)----------------------------> |
   |                                               |
   |<----------(new access_token)----------------- |
```

### Password Security

- **Hashing**: All passwords are hashed using `passlib` with `bcrypt` algorithm (12 rounds)
- **Storage**: Only password hashes are stored; plaintext passwords are never persisted
- **Validation**: Minimum 8 characters, requiring mixed case, numbers, and symbols

### JWT Token Lifecycle

| Token Type | Lifespan | Storage | Usage |
|------------|----------|---------|-------|
| Access Token | 30 minutes | HTTP-only cookie + memory | API authentication |
| Refresh Token | 7 days | HTTP-only secure cookie | Token renewal |

### Role-Based Access Control (RBAC)

| Role | Topics | Plans | Analysis | Agents | Settings | Team |
|------|--------|-------|----------|--------|----------|------|
| **Admin** | Full CRUD | Full CRUD | Run & View | Configure | All | Full |
| **Editor** | CRUD | CRUD | Run & View | View | Personal | None |
| **Viewer** | View only | View only | View only | None | Personal | None |

### Invitation Flow

```
Admin creates invitation
       |
       v
+---------------+     +---------------+     +---------------+
|  Generate     | --> |  Send email   | --> |  User clicks  |
|  signed token |     |  with link    |     |  invite link  |
+---------------+     +---------------+     +---------------+
                                                   |
                                                   v
+---------------+     +---------------+     +---------------+
|  User can now | <-- |  Token        | <-- |  Register/    |
|  access RID   |     |  validated    |     |  Login        |
+---------------+     +---------------+     +---------------+
```

- Invitation tokens expire after **48 hours**
- Each invitation is single-use and bound to the invited email
- Expired invitations can be resent by admins

### Additional Security Measures

- **CORS**: Strictly configured to allow only the configured `FRONTEND_URL`
- **Rate Limiting**: Login endpoint is rate-limited to 5 attempts per IP per minute
- **Input Validation**: All inputs validated via Pydantic schemas
- **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries throughout
- **XSS Protection**: Frontend sanitizes all rendered content

---

## Contributing

We welcome contributions from the community! Here's how to get involved:

### Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. Create a **feature branch**: `git checkout -b feature/your-feature-name`
4. Make your changes with clear, descriptive commits
5. **Push** to your fork: `git push origin feature/your-feature-name`
6. Open a **Pull Request** with a detailed description

### Contribution Guidelines

- Follow the existing code style (Ruff for Python, Prettier for TypeScript)
- Add tests for new features
- Update documentation for any changed behavior
- Ensure all tests pass before submitting
- Keep pull requests focused on a single change
- Reference issues in your PR description when applicable

### Reporting Issues

Please use GitHub Issues to report bugs or request features. Include:

- Clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Your environment (OS, Python version, Node version)
- Screenshots if applicable

### Code of Conduct

This project follows a standard code of conduct: be respectful, constructive, and inclusive in all interactions.

---

## License

```
MIT License

Copyright (c) 2025 Research Intelligence Dashboard Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  Built with care for researchers, strategists, and teams worldwide.
  <br/>
  <a href="https://www.mtsoln.com/rid">Try the Live Demo</a> •
  <a href="https://github.com/james-mtsoln/solo-research-intelligent-agent">Star on GitHub</a>
</p>
