# RID Code QA Report

**Date:** 2026-05-28  
**Scope:** Full-stack review of `app/` (React frontend) and `backend/rid/` (FastAPI backend)  
**Method:** Manual code review + automated static analysis

---

## Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Security | 4 | 2 | 6 | 3 | 15 |
| Bugs & Logic | 3 | 4 | 8 | 12 | 27 |
| Code Quality | 0 | 0 | 5 | 14 | 19 |
| API Consistency | 1 | 0 | 3 | 6 | 10 |
| Performance | 0 | 0 | 2 | 3 | 5 |
| **Total** | **8** | **6** | **24** | **38** | **76** |

---

## 🔴 Critical Issues (Fix Immediately)

### 1. [BACKEND] `PipelineStatus` Attribute Error — Runtime Crash
- **File:** `backend/rid/agents/orchestrator.py` (lines 168, 210, 239)
- **Issue:** `PipelineStatus` is defined with `weekly_plan_id`, but `_step_fetch`, `_step_analyse`, and `_step_plan` all reference `status.topic_id`. This raises `AttributeError` at runtime.
- **Fix:** Change all `status.topic_id` → `status.weekly_plan_id`.

### 2. [BACKEND] Raw SQL in `_step_fetch` with Wrong Attribute
- **File:** `backend/rid/agents/orchestrator.py` (lines 184–187)
- **Issue:** Uses raw string SQL: `session.execute("SELECT url FROM news_articles WHERE weekly_plan_id = :wid", ...)`. Mixes raw SQL with ORM. Also references `status.topic_id` (wrong attribute).
- **Fix:** Use SQLAlchemy expression API: `select(NewsArticle.url).where(NewsArticle.weekly_plan_id == status.weekly_plan_id)`.

### 3. [BACKEND] `accept_invitation` Inherits Admin Dependency
- **File:** `backend/rid/routers/invitations.py` (line 191)
- **Issue:** The router is created with `dependencies=[require_admin]`, so `accept_invitation` inherits it. But the docstring says it's public. Non-admin users cannot accept invitations.
- **Fix:** Move `accept_invitation` to a separate public router (e.g., `auth` router) or override with `dependencies=[]`.

### 4. [BACKEND] Hardcoded Default Admin Password
- **File:** `backend/rid/config.py` (line 61)
- **Issue:** `admin_password: str = "admin"` is the factory default. If deployed without changing `RID_ADMIN_PASSWORD`, the admin account is trivially guessable.
- **Fix:** Generate a random password on first startup and log it, or require explicit configuration before the app starts.

### 5. [BACKEND] Per-Process JWT Secret
- **File:** `backend/rid/config.py` (lines 72–87)
- **Issue:** If `secret_key` is empty, a random key is generated per process. All existing tokens become invalid on restart. In multi-worker setups, workers reject each other's tokens.
- **Fix:** Persist the generated secret to the database or a file, or fail startup if `RID_SECRET_KEY` is not set.

### 6. [FRONTEND] API Keys Stored in localStorage Plain Text
- **File:** `app/src/pages/Settings.tsx`
- **Issue:** LLM API keys (OpenAI, Kimi, Gemini) are stored in `localStorage` as plaintext. Any XSS vulnerability or malicious browser extension can exfiltrate them.
- **Fix:** Store API keys server-side in the `settings` table, or use `httpOnly` cookies. Never store secrets in `localStorage`.

### 7. [FRONTEND] `ConfigPanel` Conditional Hooks Violation
- **File:** `app/src/pages/Agents.tsx` (lines 251–542)
- **Issue:** `ConfigPanel` has multiple `if (agentId === '...')` blocks, each defining `useState` hooks. React requires hooks to be called in the same order on every render. If `agentId` changes, React throws "Rendered fewer hooks than expected."
- **Fix:** Extract each agent config panel into separate components, or call all hooks unconditionally at the top.

### 8. [FRONTEND] `handleExportData` May Leak Sensitive Data
- **File:** `app/src/pages/Settings.tsx` (lines 396–410)
- **Issue:** The export function serializes the full state object. While current `apiKeys` only stores masks, the export object structure could inadvertently include sensitive fields in future changes.
- **Fix:** Explicitly build the export object with an allowlist of safe fields. Redact anything sensitive.

---

## 🟠 High Severity Issues

### 9. [BACKEND] `run_full` Missing WeeklyPlan Validation
- **File:** `backend/rid/agents/orchestrator.py` (lines 75–113)
- **Issue:** Does not check if `WeeklyPlan` exists or is active before running. Fails later with a less clear error.
- **Fix:** Add upfront validation and raise `ValueError` if missing/inactive.

### 10. [BACKEND] `AnalysisRunner.run_all` Swallows Exceptions
- **File:** `backend/rid/agents/analysis_engine.py` (lines 175–188)
- **Issue:** `asyncio.gather(..., return_exceptions=True)` collects exceptions but only logs them. The caller has no way of knowing some analyses failed.
- **Fix:** Return a result object with both successes and errors, or raise if any fail.

### 11. [BACKEND] Plugin `module_path` No Validation
- **File:** `backend/rid/routers/agents.py` (lines 23–28, 69–86)
- **Issue:** `module_path` is an arbitrary string with no validation. If the plugin loader dynamically imports modules, this is an arbitrary code execution vector.
- **Fix:** Add regex validator (`^[a-zA-Z0-9_.]+$`). Ensure the plugin loader only imports from `rid/plugins/`.

### 12. [FRONTEND] Side Effects During Render
- **File:** `app/src/components/RouteGuard.tsx` (lines 32, 38, 44), `app/src/pages/Login.tsx` (lines 14–17)
- **Issue:** Mutates `window.location.hash` during the render phase. In React concurrent mode, renders can be interrupted and replayed, causing redirects to fire multiple times.
- **Fix:** Wrap redirect logic in `useEffect`. Use `useNavigate` from `react-router-dom`.

### 13. [FRONTEND] `localStorage` Not Cleared on Reset/Clear
- **File:** `app/src/pages/Settings.tsx` (lines 310–338, 412–417)
- **Issue:** `handleReset` and `handleClearData` reset state variables but do NOT remove items from `localStorage`. Old data restores on next page load.
- **Fix:** Call `localStorage.removeItem()` for each `STORAGE_KEYS` entry, or use `localStorage.clear()`.

### 14. [FRONTEND] No Network Error Handling in API Layer
- **File:** `app/src/lib/api.ts` (lines 21–37)
- **Issue:** If `fetch` throws (offline, DNS failure, CORS), the error propagates uncaught. Callers show generic messages without distinguishing network from API errors.
- **Fix:** Wrap `fetch` in try/catch, throw a custom `NetworkError`, and handle it in callers.

---

## 🟡 Medium Severity Issues

### Backend — Medium

| # | Issue | File | Fix |
|---|-------|------|-----|
| 15 | `run_analysis` doesn't close `OllamaProvider` on exception | `analysis.py:121–135` | Use `try/finally` around `llm.close()` |
| 16 | `list_settings` has no auth; sensitive settings readable by anyone | `settings.py:48–59` | Add auth, filter sensitive categories |
| 17 | `PUT /settings/{key}` auto-creates (violates REST) | `settings.py:72–92` | Return 404 if missing; use POST for creation |
| 18 | `create_weekly_plan` doesn't set `user_id` | `weekly_plans.py:73–87` | Set `plan.user_id = current_user.id` |
| 19 | `date_from`/`date_to` not validated as dates | `news.py:49–67` | Use Pydantic `datetime` or validate with `fromisoformat` |
| 20 | `MilestoneUpdate.target_date` accepts any string | `plans.py:42–44, 188–190` | Use Pydantic `date` type |
| 21 | `WebScraperSource` no URL validation | `news_engine.py:200–241` | Validate scheme is `http`/`https` |
| 22 | `NewsAggregator` deduplicates by MD5 unnecessarily | `news_engine.py:271–279` | Use URL string directly in set |
| 23 | `BusinessPlanResult.risks_mitigations` never persisted | `plan_generator.py` | Add `risks_mitigations_json` column to DB model |
| 24 | `PlanGenerator._parse_plan` doesn't validate month range | `plan_generator.py:167–204` | Clamp `month` to `[1, timeframe_months]` |
| 25 | `require_role` doesn't validate role string | `auth.py:162–189` | Validate against known roles at creation |
| 26 | `health_check` may 500 if `ollama.close()` raises | `main.py:125–138` | Wrap `await ollama.close()` in try/except |
| 27 | `pydantic-settings` `.env` path is relative | `config.py:22` | Use absolute path from `__file__` |
| 28 | `NewsAPISource` sends API key as query param | `news_engine.py:132` | Document risk; consider server-side proxy |
| 29 | `ResearchPipeline` stores status in memory only | `orchestrator.py:71–72` | Document limitation; persist to DB for multi-worker |
| 30 | `run_full` creates separate sessions per step | `orchestrator.py:85–113` | Document independent steps; or use single session |

### Frontend — Medium

| # | Issue | File | Fix |
|---|-------|------|-----|
| 31 | `window.open` without `noopener` | `PlanDetail.tsx` | Add `rel="noopener noreferrer"` |
| 32 | Missing React Error Boundary | `App.tsx` | Add `ErrorBoundary` around route tree |
| 33 | `useCountUp` rAF race condition | `Home.tsx` | Cancel previous `requestAnimationFrame` |
| 34 | `visibleCount` not reset on filter change | `PlanDetail.tsx:659–676` | Add `useEffect` to reset on filter change |
| 35 | `DesktopSidebar` active state out of sync | `Layout.tsx:45–65` | Add `hashchange` listener |
| 36 | `Layout.tsx` reads `window.location.hash` in render | `Layout.tsx:161–164` | Use `useLocation` from react-router-dom |
| 37 | `handleSave` doesn't handle `localStorage` quota errors | `Settings.tsx:276–308` | Return boolean from `saveItem`; check all saves |
| 38 | `handleTestConnection` is fake mock | `Settings.tsx:264–270` | Make actual fetch to Ollama health endpoint |
| 39 | `handleVerifyKey` is fake mock | `Settings.tsx:272–274` | Implement actual key validation |
| 40 | `handleAddFeed` no URL validation | `Settings.tsx:344–362` | Add `URL` constructor check |
| 41 | `handleInstall` timeout without cleanup | `Agents.tsx:811–817` | Use ref to track and clear timeout on unmount |
| 42 | `UserManagement` custom toast instead of `sonner` | `UserManagement.tsx` | Use `toast.success()` from sonner |
| 43 | `fetchWithAuth` return type is a lie on error | `api.ts:40–60` | Consider discriminated union return type |
| 44 | `AnimatePresence` used incorrectly around `TabsContent` | `PlanDetail.tsx:600–642` | Move `AnimatePresence` outside Tabs |
| 45 | `PlanDetail.tsx` hardcodes plan data | `PlanDetail.tsx:395` | Fetch plan by ID from API using `useParams()` |

---

## 🟢 Low Severity Issues

### Backend — Low

| # | Issue | File |
|---|-------|------|
| 46 | Inconsistent HTTP status codes (`status.HTTP_404` vs raw `404`) | Multiple routers |
| 47 | `import asyncio` at bottom of `analysis_engine.py` | `analysis_engine.py:200` |
| 48 | `from datetime import date` inside function | `plans.py:189` |
| 49 | `logging` imported inside `init_default_admin` | `database.py:95–96` |
| 50 | `selectinload` imported but not used consistently | `plans.py:15` |
| 51 | `list_plans` doesn't eager-load milestones (N+1) | `plans.py:66–80` |
| 52 | `Topic = WeeklyPlan` alias unused | `models.py:143` |
| 53 | `requirements.txt` pins minimums but no maximums | `requirements.txt` |
| 54 | `requirements.txt` redundant `cryptography` line | `requirements.txt` |
| 55 | `__all__` missing in `rid/agents/__init__.py` | `agents/__init__.py` |
| 56 | `get_llm_provider` missing return type | `agents/__init__.py:11` |
| 57 | `PlanGenerator.generate` has very long prompt string | `plan_generator.py:64–84` |
| 58 | `AnalysisRunner.run_one` linear scan (minor) | `analysis_engine.py:190–196` |
| 59 | `run.py` no error handling for `uvicorn.run` | `run.py:13–20` |
| 60 | `UserResponse` schema inconsistent with other user schemas | `auth.py:49–55` |
| 61 | `InvitationResponse` missing `accept_url` field | `invitations.py:39–47` |
| 62 | `list_invitations` returns `None` for dates | `invitations.py:168–170` |
| 63 | `PlanResponse.milestones` mutable default | `plans.py:56` |
| 64 | `PluginLoader.discover` fails for namespace packages | `plugins/__init__.py:48–53` |
| 65 | `AdvancedRSSSource` doesn't close `httpx.AsyncClient` | `plugins/rss_advanced.py:59–64` |
| 66 | `SentimentPlugin` lexicon hardcoded | `plugins/sentiment_plugin.py:18–32` |
| 67 | `SentimentScorer.score_with_confidence` confusing zero logic | `plugins/sentiment_plugin.py:89–104` |

### Frontend — Low

| # | Issue | File |
|---|-------|------|
| 68 | Duplicate router dependencies (`react-router` + `react-router-dom`) | `package.json` |
| 69 | `jwt-decode` listed but never used | `package.json` |
| 70 | `tailwind.config.js` CJS in ESM project | `tailwind.config.js` |
| 71 | `tsconfig.json` and `tsconfig.app.json` duplicate `paths` | `tsconfig.json`, `tsconfig.app.json` |
| 72 | `verbatimModuleSyntax` enabled but used inconsistently | `tsconfig.app.json` |
| 73 | `noUnusedLocals` and `noUnusedParameters` disabled | `tsconfig.app.json` |
| 74 | Missing `aria-label` on icon-only buttons | Multiple pages |
| 75 | Custom inputs not associated with labels | `WeeklyPlans.tsx`, `Topics.tsx` |
| 76 | Low color contrast (`#5A5B6E` on `#0A0A0F`) | Multiple files |
| 77 | `useTranslation` inside helper functions | `Home.tsx`, `WeeklyPlans.tsx`, etc. |
| 78 | `vite.config.ts` missing `build.sourcemap` | `vite.config.ts` |
| 79 | Massive code duplication of design tokens | All page files |
| 80 | `Topics.tsx` and `WeeklyPlans.tsx` nearly identical | `Topics.tsx`, `WeeklyPlans.tsx` |
| 81 | `PlanDetail.tsx` extremely large (1272 lines) | `PlanDetail.tsx` |
| 82 | `Settings.tsx` extremely large (1556 lines) | `Settings.tsx` |
| 83 | `useIsMobile` reads `window.innerWidth` instead of `mql.matches` | `use-mobile.ts` |
| 84 | `i18n` `escapeValue: false` with no user HTML | `i18n/index.ts` |
| 85 | No centralized state management | Multiple pages |
| 86 | Mock data mixed with real components | Multiple pages |
| 87 | API layer too thin (no interceptors, retry, dedup) | `api.ts` |
| 88 | No runtime API response validation | `api.ts` |
| 89 | `AuthContext` doesn't expose token expiration | `AuthContext.tsx` |
| 90 | `Layout.tsx` renders different DOM trees based on auth | `Layout.tsx` |
| 91 | `framer-motion` `layout` prop on every card | `Agents.tsx` |
| 92 | Inline style objects created on every render | Every page |
| 93 | `AnimatePresence mode="wait"` may cause jank | `PlanDetail.tsx` |
| 94 | `ResponsiveContainer` on every plan card (heavy) | `Home.tsx` |
| 95 | `HashRouter` instead of `BrowserRouter` | `App.tsx` |
| 96 | Unused shadcn/ui components increase bundle size | `components/ui/` |

---

## Security Deep Dive

### Authentication & Authorization
1. **JWT in localStorage** — Vulnerable to XSS. Consider `httpOnly` cookies.
2. **7-day token expiration** — Long window for token abuse if stolen.
3. **No rate limiting** — Auth endpoints vulnerable to brute force.
4. **No password complexity** — `RegisterRequest` only requires min 6 chars.
5. **Admin self-lockout protection** — Good: prevents admins from deactivating themselves.

### Data Protection
1. **API keys in frontend** — Critical. All LLM keys stored in `localStorage`.
2. **Settings readable without auth** — `list_settings` returns all settings including LLM provider config.
3. **News/articles listable without auth** — May be intentional but should be documented.

### Input Validation
1. **Plugin `module_path`** — No validation = potential RCE.
2. **Date strings in news filter** — Passed directly to DB without parsing.
3. **Milestone `target_date`** — `date.fromisoformat()` can raise 500 errors.

---

## Recommended Fix Priority

### Week 1 — Critical
1. Fix `status.topic_id` → `status.weekly_plan_id` (B1)
2. Fix `accept_invitation` auth dependency (A8)
3. Remove API keys from `localStorage` (SEC-frontend)
4. Fix `ConfigPanel` conditional hooks (BUG-008)
5. Fix raw SQL in `_step_fetch` (B2)

### Week 2 — High
6. Generate random admin password or require config (S1)
7. Persist JWT secret or fail on empty (S2)
8. Add `run_full` WeeklyPlan validation (B3)
9. Fix `AnalysisRunner` silent failures (B4)
10. Validate plugin `module_path` (B14/B15)
11. Fix side effects during render (BUG-005, BUG-006)
12. Fix `localStorage` clear on reset (QLT-019, QLT-020)
13. Add network error handling in API layer (QLT-014)

### Week 3 — Medium
14. Add auth to list endpoints (B12, B13)
15. Fix settings PUT auto-create (A10)
16. Fix `run_analysis` resource leak (B21)
17. Fix date validation (B7, B9)
18. Fix `user_id` assignment (B11)
19. Fix export data redaction (BUG-013)
20. Add URL validation for feeds (BUG-018)

### Ongoing — Low
21. Standardize HTTP status codes (Q2)
22. Move imports to top of files (Q3, Q4, Q5)
23. Add type hints to missing functions (Q1)
24. Remove unused dependencies (QLT-011, QLT-016)
25. Extract design tokens (QLT-001)
26. Split large components (QLT-023, QLT-024)
27. Add error boundaries (QLT-005)
28. Add aria-labels (QLT-007)

---

## Files Requiring Immediate Attention

| File | Critical Issues | High Issues |
|------|-----------------|-------------|
| `backend/rid/agents/orchestrator.py` | B1, B2 | B3 |
| `backend/rid/routers/invitations.py` | A8 | — |
| `backend/rid/config.py` | S1, S2 | — |
| `backend/rid/agents/analysis_engine.py` | — | B4 |
| `backend/rid/routers/agents.py` | — | B14, B15 |
| `app/src/pages/Settings.tsx` | SEC-frontend, BUG-013 | BUG-007, QLT-019, QLT-020 |
| `app/src/pages/Agents.tsx` | BUG-008 | — |
| `app/src/components/RouteGuard.tsx` | — | BUG-005 |
| `app/src/pages/Login.tsx` | — | BUG-006 |
| `app/src/lib/api.ts` | — | QLT-014 |
