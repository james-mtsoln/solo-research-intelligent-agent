# Plan v3: i18n + RBAC

## Stage 1: i18n Infrastructure (Frontend)
- Install react-i18next, i18next, i18next-browser-languagedetector
- Create i18n config + 6 translation files (en, zh-CN, zh-TW, ja, ko, th)
- Create LanguageSwitcher component
- Wrap all page strings with t() translation keys

## Stage 2: RBAC Backend (Python FastAPI)
- Add User model (id, email, name, role, password_hash, is_active)
- Add Invitation model (id, email, role, token, expires_at, created_by, used_at)
- Add auth: register, login, JWT tokens, logout
- Add invitation: create invite, accept invite, resend
- Add middleware: require_auth, require_role
- Add user management endpoints (admin)

## Stage 3: RBAC Frontend (React)
- Add Login/Register pages
- Add route guards (redirect to login if not authenticated)
- Role-based navigation hiding
- Add User Management page (admin only)
- Add Invitation page (admin only)
- Integrate auth context with API calls

## Stage 4: Build & Deploy
- Wire all routes
- Build
- Deploy
