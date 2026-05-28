# Research Intelligence Dashboard (RID) — API Reference

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:8000`  
> **Authentication:** Bearer Token (JWT)  
> **Content-Type:** `application/json`

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Auth Endpoints](#3-auth-endpoints)
4. [Invitations](#4-invitations)
5. [Users](#5-users)
6. [Weekly Plans](#6-weekly-plans)
7. [News](#7-news)
8. [Analysis](#8-analysis)
9. [Business Plans](#9-business-plans)
10. [Agents & Plugins](#10-agents--plugins)
11. [Pipeline](#11-pipeline)
12. [Settings](#12-settings)
13. [Health](#13-health)

---

## 1. Conventions

### Authentication Header

All protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_access_token>
```

Obtain a token via `POST /api/auth/login` or `POST /api/auth/register`.

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (not used) |
| `400` | Bad Request — invalid parameters |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — resource does not exist |
| `409` | Conflict — resource already exists |
| `422` | Validation Error — invalid request body |
| `500` | Internal Server Error |

### Response Format

Successful responses return the requested data directly. Error responses follow this structure:

```json
{
  "detail": "Error description message"
}
```

### Authentication Requirements Legend

| Badge | Meaning |
|-------|---------|
| **Public** | No authentication required |
| **Authenticated** | Any valid user (viewer, editor, or admin) |
| **Editor** | Requires `editor` or `admin` role |
| **Admin** | Requires `admin` role only |

### Data Types

| Type | Format | Example |
|------|--------|---------|
| `string` | UTF-8 text | `"Hello World"` |
| `integer` | 64-bit signed | `42` |
| `float` | IEEE 754 double | `0.85` |
| `boolean` | `true` / `false` | `true` |
| `datetime` | ISO 8601 string | `"2024-01-15T10:30:00+00:00"` |
| `date` | ISO 8601 date string | `"2024-01-15"` |
| `JSON string` | Serialized JSON array | `"[\"item1\", \"item2\"]"` |

---

## 2. Authentication

The API uses JWT (JSON Web Token) authentication. Tokens are valid for 7 days.

### Getting a Token

**Via Registration:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe", "password": "secure123"}'
```

**Via Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00+00:00",
    "last_login": null
  }
}
```

### Using the Token

Include the token in all subsequent requests:

```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 3. Auth Endpoints

Base path: `/api/auth`

---

### 3.1 Register

**Public** | Create a new user account.

```
POST /api/auth/register
```

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `name` | string | Yes | 1-255 characters |
| `password` | string | Yes | Minimum 6 characters |

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure123"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00+00:00",
    "last_login": null
  }
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `409` | `Email already registered` |
| `422` | Validation error (invalid email, short password, etc.) |

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "secure123"
  }'
```

---

### 3.2 Login

**Public** | Authenticate and receive a JWT token.

```
POST /api/auth/login
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email address |
| `password` | string | Yes | Account password |

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secure123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "viewer",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00+00:00",
    "last_login": "2024-01-15T14:30:00+00:00"
  }
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `401` | `Invalid email or password` |
| `403` | `Account is deactivated` |

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

---

### 3.3 Logout

**Authenticated** | Log out the current user.

```
POST /api/auth/logout
```

**Note:** This is a no-op on the server side. Clients should delete the stored token.

**Response (200 OK):**
```json
{
  "detail": "Logged out successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

---

### 3.4 Get Current User

**Authenticated** | Get the current authenticated user's profile.

```
GET /api/auth/me
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "viewer",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00+00:00",
  "last_login": "2024-01-15T14:30:00+00:00"
}
```

**Example:**
```bash
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

### 3.5 Update Current User

**Authenticated** | Update the current user's profile (name only).

```
PUT /api/auth/me
```

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-255 characters |

**Request:**
```json
{
  "name": "Jane Doe"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "viewer",
  "is_active": true,
  "created_at": "2024-01-15T10:00:00+00:00",
  "last_login": "2024-01-15T14:30:00+00:00"
}
```

**Example:**
```bash
curl -X PUT http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'
```

---

## 4. Invitations

Base path: `/api/invitations`

**Note:** All endpoints except `POST /{token}/accept` require Admin role.

---

### 4.1 Create Invitation

**Admin** | Create a new invitation for a user to join.

```
POST /api/invitations
```

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email format |
| `role` | string | No | `admin`, `editor`, or `viewer` (default: `viewer`) |

**Request:**
```json
{
  "email": "newuser@example.com",
  "role": "editor"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "newuser@example.com",
  "role": "editor",
  "token": "aBcD1234xYz...",
  "expires_at": "2024-01-22T10:00:00+00:00",
  "created_at": "2024-01-15T10:00:00+00:00",
  "accept_url": "/invite/aBcD1234xYz..."
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `409` | `User with this email already exists` |
| `409` | `A pending invitation already exists for this email` |

**Example:**
```bash
curl -X POST http://localhost:8000/api/invitations \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "role": "editor"
  }'
```

---

### 4.2 List Invitations

**Admin** | List all invitations (pending, used, and expired).

```
GET /api/invitations
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "newuser@example.com",
    "role": "editor",
    "status": "pending",
    "created_at": "2024-01-15T10:00:00+00:00",
    "expires_at": "2024-01-22T10:00:00+00:00",
    "used_at": null
  },
  {
    "id": 2,
    "email": "olduser@example.com",
    "role": "viewer",
    "status": "used",
    "created_at": "2024-01-10T10:00:00+00:00",
    "expires_at": "2024-01-17T10:00:00+00:00",
    "used_at": "2024-01-12T14:00:00+00:00"
  }
]
```

**Status values:** `pending`, `used`, `expired`

**Example:**
```bash
curl http://localhost:8000/api/invitations \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.3 Delete Invitation

**Admin** | Cancel and delete an invitation.

```
DELETE /api/invitations/{invitation_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `invitation_id` | integer | Invitation ID |

**Response (200 OK):**
```json
{
  "success": true,
  "detail": "Invitation deleted"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Invitation not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/invitations/1 \
  -H "Authorization: Bearer <admin_token>"
```

---

### 4.4 Accept Invitation

**Public** | Accept an invitation and create a user account.

```
POST /api/invitations/{token}/accept
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Invitation token from the invite URL |

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | Yes | 1-255 characters |
| `password` | string | Yes | Minimum 6 characters |

**Request:**
```json
{
  "name": "New User",
  "password": "secure123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 3,
    "email": "newuser@example.com",
    "name": "New User",
    "role": "editor",
    "is_active": true,
    "created_at": "2024-01-15T11:00:00+00:00",
    "last_login": null
  }
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Invitation not found` |
| `400` | `Invitation has already been used` |
| `400` | `Invitation has expired` |
| `409` | `User with this email already exists` |

**Example:**
```bash
curl -X POST http://localhost:8000/api/invitations/aBcD1234xYz/accept \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "password": "secure123"
  }'
```

---

### 4.5 Resend Invitation

**Admin** | Resend an invitation by generating a new token.

```
POST /api/invitations/{token}/resend
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Current invitation token |

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "newuser@example.com",
  "token": "newTokenXYZ789...",
  "expires_at": "2024-01-22T11:00:00+00:00",
  "accept_url": "/invite/newTokenXYZ789..."
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Invitation not found` |
| `400` | `Invitation has already been used` |

**Example:**
```bash
curl -X POST http://localhost:8000/api/invitations/aBcD1234xYz/resend \
  -H "Authorization: Bearer <admin_token>"
```

---

## 5. Users

Base path: `/api/users`

**Note:** All endpoints require Admin role.

---

### 5.1 List Users

**Admin** | List all registered users.

```
GET /api/users
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "email": "admin@local",
    "name": "Administrator",
    "role": "admin",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00+00:00",
    "last_login": "2024-01-15T14:00:00+00:00"
  },
  {
    "id": 2,
    "email": "editor@example.com",
    "name": "Editor User",
    "role": "editor",
    "is_active": true,
    "created_at": "2024-01-15T11:00:00+00:00",
    "last_login": null
  }
]
```

**Example:**
```bash
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer <admin_token>"
```

---

### 5.2 Update User Role

**Admin** | Change a user's role.

```
PUT /api/users/{user_id}/role
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | integer | User ID |

**Request Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `role` | string | Yes | `admin`, `editor`, or `viewer` |

**Request:**
```json
{
  "role": "editor"
}
```

**Response (200 OK):**
```json
{
  "id": 2,
  "email": "editor@example.com",
  "name": "Editor User",
  "role": "editor",
  "is_active": true,
  "created_at": "2024-01-15T11:00:00+00:00",
  "last_login": null
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `User not found` |
| `400` | `Cannot change your own role` |

**Example:**
```bash
curl -X PUT http://localhost:8000/api/users/2/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "editor"}'
```

---

### 5.3 Deactivate User

**Admin** | Soft-delete (deactivate) a user account.

```
DELETE /api/users/{user_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | integer | User ID |

**Response (200 OK):**
```json
{
  "success": true,
  "detail": "User deactivated",
  "id": 2
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `User not found` |
| `400` | `Cannot deactivate your own account` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/users/2 \
  -H "Authorization: Bearer <admin_token>"
```

---

## 6. Weekly Plans

Base path: `/api/weekly-plans`

---

### 6.1 List Weekly Plans

**Authenticated** | List all weekly plans with pagination.

```
GET /api/weekly-plans
```

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `skip` | integer | `0` | >= 0 | Number of records to skip |
| `limit` | integer | `100` | 1-500 | Maximum records to return |
| `active_only` | boolean | `true` | — | Filter to active plans only |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Artificial Intelligence",
    "description": "AI market research and trends",
    "keywords": "machine learning, neural networks, LLM",
    "user_id": null,
    "created_at": "2024-01-15T10:00:00+00:00",
    "updated_at": "2024-01-15T10:00:00+00:00",
    "is_active": true
  },
  {
    "id": 2,
    "name": "Quantum Computing",
    "description": "Quantum computing developments",
    "keywords": "qubits, quantum supremacy, IBM",
    "user_id": null,
    "created_at": "2024-01-14T09:00:00+00:00",
    "updated_at": "2024-01-14T09:00:00+00:00",
    "is_active": true
  }
]
```

**Example:**
```bash
# List first 10 active plans
curl "http://localhost:8000/api/weekly-plans?skip=0&limit=10&active_only=true" \
  -H "Authorization: Bearer <token>"

# Include deactivated plans
curl "http://localhost:8000/api/weekly-plans?active_only=false" \
  -H "Authorization: Bearer <token>"
```

---

### 6.2 Create Weekly Plan

**Editor** | Create a new weekly research plan.

```
POST /api/weekly-plans
```

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | Yes | 1-255 characters | Plan name |
| `description` | string | No | Free text | Plan description |
| `keywords` | string | No | Comma-separated | Search keywords |

**Request:**
```json
{
  "name": "Blockchain Technology",
  "description": "Blockchain and cryptocurrency market analysis",
  "keywords": "bitcoin, ethereum, DeFi, smart contracts"
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "Blockchain Technology",
  "description": "Blockchain and cryptocurrency market analysis",
  "keywords": "bitcoin, ethereum, DeFi, smart contracts",
  "user_id": null,
  "created_at": "2024-01-15T12:00:00+00:00",
  "updated_at": "2024-01-15T12:00:00+00:00",
  "is_active": true
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/weekly-plans \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Blockchain Technology",
    "description": "Blockchain and cryptocurrency market analysis",
    "keywords": "bitcoin, ethereum, DeFi, smart contracts"
  }'
```

---

### 6.3 Get Weekly Plan

**Authenticated** | Get a single weekly plan by ID.

```
GET /api/weekly-plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Weekly plan ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Artificial Intelligence",
  "description": "AI market research and trends",
  "keywords": "machine learning, neural networks, LLM",
  "user_id": null,
  "created_at": "2024-01-15T10:00:00+00:00",
  "updated_at": "2024-01-15T10:00:00+00:00",
  "is_active": true
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Weekly plan not found` |

**Example:**
```bash
curl http://localhost:8000/api/weekly-plans/1 \
  -H "Authorization: Bearer <token>"
```

---

### 6.4 Update Weekly Plan

**Editor** | Update a weekly plan (partial update).

```
PUT /api/weekly-plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Weekly plan ID |

**Request Body:** (all fields optional)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Plan name |
| `description` | string | Plan description |
| `keywords` | string | Comma-separated keywords |
| `is_active` | boolean | Activation status |

**Request:**
```json
{
  "name": "AI and Machine Learning",
  "keywords": "machine learning, neural networks, LLM, generative AI"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "AI and Machine Learning",
  "description": "AI market research and trends",
  "keywords": "machine learning, neural networks, LLM, generative AI",
  "user_id": null,
  "created_at": "2024-01-15T10:00:00+00:00",
  "updated_at": "2024-01-15T12:30:00+00:00",
  "is_active": true
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Weekly plan not found` |

**Example:**
```bash
curl -X PUT http://localhost:8000/api/weekly-plans/1 \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI and Machine Learning",
    "keywords": "machine learning, neural networks, LLM, generative AI"
  }'
```

---

### 6.5 Delete Weekly Plan

**Editor** | Soft-delete a weekly plan (sets `is_active=False`).

```
DELETE /api/weekly-plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Weekly plan ID |

**Response (200 OK):**
```json
{
  "detail": "Weekly plan deactivated",
  "id": 1
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Weekly plan not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/weekly-plans/1 \
  -H "Authorization: Bearer <editor_token>"
```

---

## 7. News

Base path: `/api/news`

---

### 7.1 List News Articles

**Authenticated** | List news articles with filters.

```
GET /api/news
```

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `weekly_plan_id` | integer | — | Valid plan ID | Filter by weekly plan |
| `source` | string | — | Any | Filter by source (partial match) |
| `sentiment` | string | — | `positive`, `neutral`, `negative` | Filter by sentiment |
| `date_from` | string | — | ISO datetime | Filter: fetched on or after |
| `date_to` | string | — | ISO datetime | Filter: fetched on or before |
| `skip` | integer | `0` | >= 0 | Records to skip |
| `limit` | integer | `50` | 1-200 | Max records to return |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "weekly_plan_id": 1,
    "title": "OpenAI Announces GPT-5 with Breakthrough Capabilities",
    "url": "https://example.com/article/1",
    "source": "rss:news.google.com",
    "summary": "OpenAI has unveiled GPT-5, featuring significant improvements...",
    "content": "Full article content here...",
    "published_at": "2024-01-15T08:00:00+00:00",
    "sentiment": "positive",
    "relevance_score": 0.9,
    "fetched_at": "2024-01-15T10:00:00+00:00"
  },
  {
    "id": 2,
    "weekly_plan_id": 1,
    "title": "EU Proposes New AI Regulation Framework",
    "url": "https://example.com/article/2",
    "source": "newsapi:BBC News",
    "summary": "The European Union has proposed comprehensive regulations...",
    "content": "Full article content here...",
    "published_at": "2024-01-14T14:00:00+00:00",
    "sentiment": "neutral",
    "relevance_score": 0.8,
    "fetched_at": "2024-01-15T10:00:00+00:00"
  }
]
```

**Example:**
```bash
# All articles for plan #1
curl "http://localhost:8000/api/news?weekly_plan_id=1" \
  -H "Authorization: Bearer <token>"

# Positive sentiment articles only
curl "http://localhost:8000/api/news?sentiment=positive&limit=20" \
  -H "Authorization: Bearer <token>"

# From specific date range
curl "http://localhost:8000/api/news?date_from=2024-01-01T00:00:00&date_to=2024-01-31T23:59:59" \
  -H "Authorization: Bearer <token>"
```

---

### 7.2 Get Article

**Authenticated** | Get a single news article.

```
GET /api/news/{article_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `article_id` | integer | Article ID |

**Response (200 OK):** Same structure as list item.

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Article not found` |

**Example:**
```bash
curl http://localhost:8000/api/news/1 \
  -H "Authorization: Bearer <token>"
```

---

### 7.3 Delete Article

**Editor** | Delete a news article permanently.

```
DELETE /api/news/{article_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `article_id` | integer | Article ID |

**Response (200 OK):**
```json
{
  "detail": "Article deleted",
  "id": 1
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Article not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/news/1 \
  -H "Authorization: Bearer <editor_token>"
```

---

### 7.4 News Statistics

**Authenticated** | Return aggregate news statistics.

```
GET /api/news/stats/overview
```

**Response (200 OK):**
```json
{
  "total_articles": 156,
  "by_source": [
    { "source": "rss:news.google.com", "count": 89 },
    { "source": "newsapi:BBC News", "count": 42 },
    { "source": "scraper:duckduckgo", "count": 25 }
  ],
  "by_sentiment": [
    { "sentiment": "positive", "count": 68 },
    { "sentiment": "neutral", "count": 72 },
    { "sentiment": "negative", "count": 16 }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/news/stats/overview \
  -H "Authorization: Bearer <token>"
```

---

## 8. Analysis

Base path: `/api/analysis`

---

### 8.1 List Analyses

**Authenticated** | List AI analyses with optional filters.

```
GET /api/analysis
```

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `weekly_plan_id` | integer | — | Valid plan ID | Filter by weekly plan |
| `analysis_type` | string | — | `summary`, `trend`, `competitor`, `risk` | Filter by type |
| `skip` | integer | `0` | >= 0 | Records to skip |
| `limit` | integer | `50` | 1-200 | Max records to return |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "weekly_plan_id": 1,
    "analysis_type": "summary",
    "content": "The AI industry saw significant developments this week...",
    "key_insights": "[\"Major breakthrough in LLM efficiency\", \"New regulations proposed in EU\"]",
    "trends": "[]",
    "risks": "[]",
    "opportunities": "[]",
    "created_at": "2024-01-15T10:30:00+00:00"
  },
  {
    "id": 2,
    "weekly_plan_id": 1,
    "analysis_type": "trend",
    "content": "The trend toward smaller, more efficient models is accelerating...",
    "key_insights": "[\"Cost reduction of 40% reported\"]",
    "trends": "[\"Edge AI deployment increasing\", \"Open-source model proliferation\"]",
    "risks": "[]",
    "opportunities": "[\"Mobile AI applications\", \"IoT integration\"]",
    "created_at": "2024-01-15T10:35:00+00:00"
  }
]
```

**Example:**
```bash
# All analyses for plan #1
curl "http://localhost:8000/api/analysis?weekly_plan_id=1" \
  -H "Authorization: Bearer <token>"

# Only trend analyses
curl "http://localhost:8000/api/analysis?analysis_type=trend" \
  -H "Authorization: Bearer <token>"
```

---

### 8.2 Get Analysis

**Authenticated** | Get a single analysis.

```
GET /api/analysis/{analysis_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `analysis_id` | integer | Analysis ID |

**Response (200 OK):** Same structure as list item.

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Analysis not found` |

**Example:**
```bash
curl http://localhost:8000/api/analysis/1 \
  -H "Authorization: Bearer <token>"
```

---

### 8.3 Run Analysis

**Editor** | Run AI analysis on-demand for a weekly plan.

```
POST /api/analysis/run
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `weekly_plan_id` | integer | Yes | Weekly plan ID to analyse |
| `analysis_type` | string | No | Specific type (`summary`, `trend`, `competitor`, `risk`). Omit for all. |

**Request:**
```json
{
  "weekly_plan_id": 1,
  "analysis_type": "risk"
}
```

**Response (200 OK):**
```json
{
  "weekly_plan_id": 1,
  "analyses_run": 1,
  "analysis_types": ["risk"]
}
```

**Request (all types):**
```json
{
  "weekly_plan_id": 1
}
```

**Response (200 OK):**
```json
{
  "weekly_plan_id": 1,
  "analyses_run": 4,
  "analysis_types": ["summary", "trend", "competitor", "risk"]
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `400` | `weekly_plan_id is required` |
| `404` | `Weekly plan not found` |
| `400` | `No articles available for analysis` |

**Example:**
```bash
# Run all analyses
curl -X POST http://localhost:8000/api/analysis/run \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan_id": 1}'

# Run only risk analysis
curl -X POST http://localhost:8000/api/analysis/run \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan_id": 1, "analysis_type": "risk"}'
```

---

### 8.4 Delete Analysis

**Editor** | Delete an analysis.

```
DELETE /api/analysis/{analysis_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `analysis_id` | integer | Analysis ID |

**Response (200 OK):**
```json
{
  "detail": "Analysis deleted",
  "id": 1
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Analysis not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/analysis/1 \
  -H "Authorization: Bearer <editor_token>"
```

---

## 9. Business Plans

Base path: `/api/plans`

---

### 9.1 List Business Plans

**Authenticated** | List business plans.

```
GET /api/plans
```

**Query Parameters:**

| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `weekly_plan_id` | integer | — | Valid plan ID | Filter by weekly plan |
| `skip` | integer | `0` | >= 0 | Records to skip |
| `limit` | integer | `50` | 1-200 | Max records to return |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "weekly_plan_id": 1,
    "title": "AI Strategic Business Plan",
    "overview": "A comprehensive 12-month plan for AI market entry...",
    "timeframe_months": 12,
    "milestones_json": "[{\"title\": \"Market Research\", \"month\": 1, ...}]",
    "strategies_json": "[\"Focus on niche verticals\", \"Build partnerships\"]",
    "created_at": "2024-01-15T11:00:00+00:00",
    "milestones": []
  }
]
```

**Example:**
```bash
curl "http://localhost:8000/api/plans?weekly_plan_id=1" \
  -H "Authorization: Bearer <token>"
```

---

### 9.2 Get Business Plan

**Authenticated** | Get a business plan with its milestones.

```
GET /api/plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Business plan ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "weekly_plan_id": 1,
  "title": "AI Strategic Business Plan",
  "overview": "A comprehensive 12-month plan for AI market entry...",
  "timeframe_months": 12,
  "milestones_json": "[{\"title\": \"Market Research\", \"month\": 1, ...}]",
  "strategies_json": "[\"Focus on niche verticals\", \"Build partnerships\"]",
  "created_at": "2024-01-15T11:00:00+00:00",
  "milestones": [
    {
      "id": 1,
      "plan_id": 1,
      "title": "Market Research Complete",
      "description": "Comprehensive competitor and market analysis",
      "target_date": "2024-02-01",
      "status": "pending",
      "priority": "high"
    },
    {
      "id": 2,
      "plan_id": 1,
      "title": "MVP Development",
      "description": "Build minimum viable product",
      "target_date": "2024-04-01",
      "status": "pending",
      "priority": "high"
    }
  ]
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Business plan not found` |

**Example:**
```bash
curl http://localhost:8000/api/plans/1 \
  -H "Authorization: Bearer <token>"
```

---

### 9.3 Create Business Plan

**Editor** | Manually create a business plan.

```
POST /api/plans
```

**Request Body:**

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `weekly_plan_id` | integer | Yes | Valid plan ID | Associated weekly plan |
| `title` | string | Yes | Non-empty | Plan title |
| `overview` | string | No | Free text | Executive summary |
| `timeframe_months` | integer | No | 6-24 | Plan duration (default: 12) |
| `milestones_json` | string | No | JSON array | Serialized milestones |
| `strategies_json` | string | No | JSON array | Serialized strategies |

**Request:**
```json
{
  "weekly_plan_id": 1,
  "title": "AI Market Entry Strategy",
  "overview": "A 12-month plan to enter the AI tools market",
  "timeframe_months": 12,
  "milestones_json": "[{\"title\": \"Launch\", \"month\": 1, \"priority\": \"high\"}]",
  "strategies_json": "[\"Partner with enterprise clients\"]"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "weekly_plan_id": 1,
  "title": "AI Market Entry Strategy",
  "overview": "A 12-month plan to enter the AI tools market",
  "timeframe_months": 12,
  "milestones_json": "[{\"title\": \"Launch\", \"month\": 1, \"priority\": \"high\"}]",
  "strategies_json": "[\"Partner with enterprise clients\"]",
  "created_at": "2024-01-15T12:00:00+00:00",
  "milestones": []
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/plans \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "weekly_plan_id": 1,
    "title": "AI Market Entry Strategy",
    "overview": "A 12-month plan to enter the AI tools market",
    "timeframe_months": 12
  }'
```

---

### 9.4 Update Business Plan

**Editor** | Update a business plan (partial update).

```
PUT /api/plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Business plan ID |

**Request Body:** (all fields optional)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Plan title |
| `overview` | string | Executive summary |
| `timeframe_months` | integer | Plan duration (6-24) |
| `milestones_json` | string | Serialized milestones JSON |
| `strategies_json` | string | Serialized strategies JSON |

**Request:**
```json
{
  "title": "Updated AI Strategy",
  "overview": "Revised market entry approach"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "weekly_plan_id": 1,
  "title": "Updated AI Strategy",
  "overview": "Revised market entry approach",
  "timeframe_months": 12,
  "milestones_json": "...",
  "strategies_json": "...",
  "created_at": "2024-01-15T11:00:00+00:00",
  "milestones": []
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Business plan not found` |

**Example:**
```bash
curl -X PUT http://localhost:8000/api/plans/1 \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated AI Strategy"}'
```

---

### 9.5 Delete Business Plan

**Editor** | Delete a business plan and all its milestones.

```
DELETE /api/plans/{plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Business plan ID |

**Response (200 OK):**
```json
{
  "detail": "Business plan deleted",
  "id": 1
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Business plan not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/plans/1 \
  -H "Authorization: Bearer <editor_token>"
```

---

### 9.6 List Milestones

**Authenticated** | List milestones for a business plan.

```
GET /api/plans/{plan_id}/milestones
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plan_id` | integer | Business plan ID |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "plan_id": 1,
    "title": "Market Research Complete",
    "description": "Comprehensive competitor and market analysis",
    "target_date": "2024-02-01",
    "status": "pending",
    "priority": "high"
  },
  {
    "id": 2,
    "plan_id": 1,
    "title": "MVP Development",
    "description": "Build minimum viable product",
    "target_date": "2024-04-01",
    "status": "in_progress",
    "priority": "high"
  }
]
```

**Example:**
```bash
curl http://localhost:8000/api/plans/1/milestones \
  -H "Authorization: Bearer <token>"
```

---

### 9.7 Update Milestone

**Editor** | Update a milestone's status, priority, or target date.

```
PATCH /api/plans/milestones/{milestone_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `milestone_id` | integer | Milestone ID |

**Request Body:** (all fields optional)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `status` | string | `pending`, `in_progress`, `completed` | Milestone status |
| `priority` | string | `low`, `medium`, `high` | Priority level |
| `target_date` | string | ISO date (`YYYY-MM-DD`) | Target completion date |

**Request:**
```json
{
  "status": "completed",
  "priority": "high"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "plan_id": 1,
  "title": "Market Research Complete",
  "description": "Comprehensive competitor and market analysis",
  "target_date": "2024-02-01",
  "status": "completed",
  "priority": "high"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Milestone not found` |

**Example:**
```bash
curl -X PATCH http://localhost:8000/api/plans/milestones/1 \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "priority": "high"}'
```

---

## 10. Agents & Plugins

Base path: `/api/agents`

---

### 10.1 List Plugins

**Authenticated** | List all registered plugins.

```
GET /api/agents
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled_only` | boolean | `false` | Filter to enabled plugins only |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "rss_advanced",
    "description": "Advanced RSS news source with filtering and categorisation",
    "module_path": "rid.plugins.rss_advanced",
    "config_schema": "{}",
    "is_enabled": false,
    "installed_at": "2024-01-15T10:00:00+00:00"
  },
  {
    "id": 2,
    "name": "sentiment_plugin",
    "description": "Fast lexicon-based sentiment analysis for news articles",
    "module_path": "rid.plugins.sentiment_plugin",
    "config_schema": "{}",
    "is_enabled": false,
    "installed_at": "2024-01-15T10:00:00+00:00"
  }
]
```

**Example:**
```bash
# All plugins
curl http://localhost:8000/api/agents \
  -H "Authorization: Bearer <token>"

# Only enabled plugins
curl "http://localhost:8000/api/agents?enabled_only=true" \
  -H "Authorization: Bearer <token>"
```

---

### 10.2 Create Plugin

**Admin** | Register a new plugin.

```
POST /api/agents
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin name |
| `description` | string | No | Plugin description |
| `module_path` | string | Yes | Python import path |
| `config_schema` | string | No | JSON schema for config (default: `"{}"`) |
| `is_enabled` | boolean | No | Initial enabled state (default: `false`) |

**Request:**
```json
{
  "name": "custom_analyzer",
  "description": "Custom article analysis plugin",
  "module_path": "rid.plugins.custom_analyzer",
  "config_schema": "{\"threshold\": {\"type\": \"number\"}}",
  "is_enabled": false
}
```

**Response (201 Created):**
```json
{
  "id": 3,
  "name": "custom_analyzer",
  "description": "Custom article analysis plugin",
  "module_path": "rid.plugins.custom_analyzer",
  "config_schema": "{\"threshold\": {\"type\": \"number\"}}",
  "is_enabled": false,
  "installed_at": "2024-01-15T12:00:00+00:00"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/api/agents \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_analyzer",
    "description": "Custom article analysis plugin",
    "module_path": "rid.plugins.custom_analyzer",
    "is_enabled": false
  }'
```

---

### 10.3 Get Plugin

**Authenticated** | Get a plugin by ID.

```
GET /api/agents/{plugin_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugin_id` | integer | Plugin ID |

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "rss_advanced",
  "description": "Advanced RSS news source with filtering and categorisation",
  "module_path": "rid.plugins.rss_advanced",
  "config_schema": "{}",
  "is_enabled": false,
  "installed_at": "2024-01-15T10:00:00+00:00"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Plugin not found` |

**Example:**
```bash
curl http://localhost:8000/api/agents/1 \
  -H "Authorization: Bearer <token>"
```

---

### 10.4 Update Plugin

**Admin** | Update a plugin (enable/disable, update config).

```
PATCH /api/agents/{plugin_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugin_id` | integer | Plugin ID |

**Request Body:** (all fields optional)

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Plugin name |
| `description` | string | Plugin description |
| `is_enabled` | boolean | Enable or disable the plugin |
| `config_schema` | string | Updated JSON schema |

**Request:**
```json
{
  "is_enabled": true,
  "description": "Advanced RSS source — now enabled"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "rss_advanced",
  "description": "Advanced RSS source — now enabled",
  "module_path": "rid.plugins.rss_advanced",
  "config_schema": "{}",
  "is_enabled": true,
  "installed_at": "2024-01-15T10:00:00+00:00"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Plugin not found` |

**Example:**
```bash
curl -X PATCH http://localhost:8000/api/agents/1 \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true}'
```

---

### 10.5 Delete Plugin

**Admin** | Unregister a plugin.

```
DELETE /api/agents/{plugin_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plugin_id` | integer | Plugin ID |

**Response (200 OK):**
```json
{
  "detail": "Plugin unregistered",
  "id": 1
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Plugin not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/agents/1 \
  -H "Authorization: Bearer <admin_token>"
```

---

## 11. Pipeline

Base path: `/api/pipeline`

---

### 11.1 Run Pipeline

**Editor** | Run the full pipeline or a specific step for a weekly plan.

```
POST /api/pipeline/run
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `weekly_plan_id` | integer | Yes | Weekly plan ID |
| `step` | string | No | Specific step (`fetch_news`, `run_analysis`, `generate_plan`). Omit for full pipeline. |

**Request (full pipeline):**
```json
{
  "weekly_plan_id": 1
}
```

**Response (200 OK):**
```json
{
  "weekly_plan_id": 1,
  "step": "full",
  "result": {
    "articles_fetched": 42,
    "analyses_run": 4,
    "business_plan_id": 7
  }
}
```

**Request (single step):**
```json
{
  "weekly_plan_id": 1,
  "step": "fetch_news"
}
```

**Response (200 OK):**
```json
{
  "weekly_plan_id": 1,
  "step": "fetch_news",
  "result": {
    "articles_fetched": 42
  }
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `400` | `Invalid step. Valid: ['fetch_news', 'run_analysis', 'generate_plan']` |

**Example:**
```bash
# Run full pipeline
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan_id": 1}'

# Run only news fetch
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Authorization: Bearer <editor_token>" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan_id": 1, "step": "fetch_news"}'
```

---

### 11.2 Get Pipeline Status

**Authenticated** | Get pipeline status for a weekly plan.

```
GET /api/pipeline/status/{weekly_plan_id}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `weekly_plan_id` | integer | Weekly plan ID |

**Response (200 OK) — running:**
```json
{
  "weekly_plan_id": 1,
  "running": true,
  "current_step": "run_analysis",
  "last_run": "2024-01-15T10:30:00+00:00",
  "errors": [],
  "result_summary": {
    "articles_fetched": 42
  }
}
```

**Response (200 OK) — idle:**
```json
{
  "weekly_plan_id": 1,
  "running": false,
  "current_step": null,
  "last_run": null,
  "errors": [],
  "result_summary": {}
}
```

**Example:**
```bash
curl http://localhost:8000/api/pipeline/status/1 \
  -H "Authorization: Bearer <token>"
```

---

### 11.3 List Pipeline Steps

**Authenticated** | List available pipeline steps.

```
GET /api/pipeline/steps
```

**Response (200 OK):**
```json
{
  "steps": [
    {
      "id": "fetch_news",
      "name": "FETCH_NEWS",
      "description": "Fetch latest news articles for the topic"
    },
    {
      "id": "run_analysis",
      "name": "RUN_ANALYSIS",
      "description": "Run AI analysis on fetched articles"
    },
    {
      "id": "generate_plan",
      "name": "GENERATE_PLAN",
      "description": "Generate business plan from analysis results"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8000/api/pipeline/steps \
  -H "Authorization: Bearer <token>"
```

---

## 12. Settings

Base path: `/api/settings`

---

### 12.1 List Settings

**Authenticated** | List all settings, optionally filtered by category.

```
GET /api/settings
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (`llm`, `pipeline`, `news`, `planning`, `general`) |

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "key": "llm_provider",
    "value": "ollama",
    "category": "llm"
  },
  {
    "id": 2,
    "key": "fetch_interval_hours",
    "value": "24",
    "category": "pipeline"
  },
  {
    "id": 3,
    "key": "default_timeframe_months",
    "value": "12",
    "category": "planning"
  }
]
```

**Example:**
```bash
# All settings
curl http://localhost:8000/api/settings \
  -H "Authorization: Bearer <token>"

# Filter by category
curl "http://localhost:8000/api/settings?category=llm" \
  -H "Authorization: Bearer <token>"
```

---

### 12.2 Get Setting

**Authenticated** | Get a specific setting by key.

```
GET /api/settings/{key}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Setting key |

**Response (200 OK):**
```json
{
  "id": 1,
  "key": "llm_provider",
  "value": "ollama",
  "category": "llm"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Setting not found` |

**Example:**
```bash
curl http://localhost:8000/api/settings/llm_provider \
  -H "Authorization: Bearer <token>"
```

---

### 12.3 Update Setting

**Admin** | Update a setting value (auto-creates if not exists).

```
PUT /api/settings/{key}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Setting key |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | string | Yes | New setting value |
| `category` | string | No | Category (default: `general`) |

**Request:**
```json
{
  "value": "openai",
  "category": "llm"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "key": "llm_provider",
  "value": "openai",
  "category": "llm"
}
```

**Example:**
```bash
curl -X PUT http://localhost:8000/api/settings/llm_provider \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"value": "openai", "category": "llm"}'
```

---

### 12.4 Create Setting

**Admin** | Create a new setting.

```
POST /api/settings
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `key` | string | Yes | Unique setting key |
| `value` | string | No | Setting value (default: `""`) |
| `category` | string | No | Category (default: `general`) |

**Request:**
```json
{
  "key": "max_fetch_batch",
  "value": "100",
  "category": "pipeline"
}
```

**Response (201 Created):**
```json
{
  "id": 6,
  "key": "max_fetch_batch",
  "value": "100",
  "category": "pipeline"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `409` | `Setting 'max_fetch_batch' already exists` |

**Example:**
```bash
curl -X POST http://localhost:8000/api/settings \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max_fetch_batch",
    "value": "100",
    "category": "pipeline"
  }'
```

---

### 12.5 Delete Setting

**Admin** | Delete a setting.

```
DELETE /api/settings/{key}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Setting key |

**Response (200 OK):**
```json
{
  "detail": "Setting deleted",
  "key": "max_fetch_batch"
}
```

**Errors:**
| Code | Detail |
|------|--------|
| `404` | `Setting not found` |

**Example:**
```bash
curl -X DELETE http://localhost:8000/api/settings/max_fetch_batch \
  -H "Authorization: Bearer <admin_token>"
```

---

## 13. Health

---

### 13.1 Health Check

**Public** | Check API health and Ollama connectivity.

```
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "ollama": {
    "reachable": true,
    "model": "llama3.2",
    "model_available": true,
    "available_models": ["llama3.2", "mistral"]
  }
}
```

**Ollama unreachable:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "ollama": {
    "reachable": false,
    "error": "Connection refused",
    "model": "llama3.2"
  }
}
```

**Example:**
```bash
curl http://localhost:8000/api/health
```

---

## Appendix: Endpoint Summary

### All Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| **Auth** |
| `POST` | `/api/auth/register` | Public | Register new user |
| `POST` | `/api/auth/login` | Public | Login and get token |
| `POST` | `/api/auth/logout` | Authenticated | Logout current user |
| `GET` | `/api/auth/me` | Authenticated | Get current user |
| `PUT` | `/api/auth/me` | Authenticated | Update current user |
| **Invitations** |
| `POST` | `/api/invitations` | Admin | Create invitation |
| `GET` | `/api/invitations` | Admin | List invitations |
| `DELETE` | `/api/invitations/{id}` | Admin | Delete invitation |
| `POST` | `/api/invitations/{token}/accept` | Public | Accept invitation |
| `POST` | `/api/invitations/{token}/resend` | Admin | Resend invitation |
| **Users** |
| `GET` | `/api/users` | Admin | List all users |
| `PUT` | `/api/users/{id}/role` | Admin | Update user role |
| `DELETE` | `/api/users/{id}` | Admin | Deactivate user |
| **Weekly Plans** |
| `GET` | `/api/weekly-plans` | Authenticated | List plans |
| `POST` | `/api/weekly-plans` | Editor | Create plan |
| `GET` | `/api/weekly-plans/{id}` | Authenticated | Get plan |
| `PUT` | `/api/weekly-plans/{id}` | Editor | Update plan |
| `DELETE` | `/api/weekly-plans/{id}` | Editor | Delete plan |
| **News** |
| `GET` | `/api/news` | Authenticated | List articles |
| `GET` | `/api/news/{id}` | Authenticated | Get article |
| `DELETE` | `/api/news/{id}` | Editor | Delete article |
| `GET` | `/api/news/stats/overview` | Authenticated | News stats |
| **Analysis** |
| `GET` | `/api/analysis` | Authenticated | List analyses |
| `GET` | `/api/analysis/{id}` | Authenticated | Get analysis |
| `POST` | `/api/analysis/run` | Editor | Run analysis |
| `DELETE` | `/api/analysis/{id}` | Editor | Delete analysis |
| **Business Plans** |
| `GET` | `/api/plans` | Authenticated | List plans |
| `GET` | `/api/plans/{id}` | Authenticated | Get plan |
| `POST` | `/api/plans` | Editor | Create plan |
| `PUT` | `/api/plans/{id}` | Editor | Update plan |
| `DELETE` | `/api/plans/{id}` | Editor | Delete plan |
| `GET` | `/api/plans/{id}/milestones` | Authenticated | List milestones |
| `PATCH` | `/api/plans/milestones/{id}` | Editor | Update milestone |
| **Agents & Plugins** |
| `GET` | `/api/agents` | Authenticated | List plugins |
| `POST` | `/api/agents` | Admin | Create plugin |
| `GET` | `/api/agents/{id}` | Authenticated | Get plugin |
| `PATCH` | `/api/agents/{id}` | Admin | Update plugin |
| `DELETE` | `/api/agents/{id}` | Admin | Delete plugin |
| **Pipeline** |
| `POST` | `/api/pipeline/run` | Editor | Run pipeline |
| `GET` | `/api/pipeline/status/{id}` | Authenticated | Pipeline status |
| `GET` | `/api/pipeline/steps` | Authenticated | List steps |
| **Settings** |
| `GET` | `/api/settings` | Authenticated | List settings |
| `GET` | `/api/settings/{key}` | Authenticated | Get setting |
| `PUT` | `/api/settings/{key}` | Admin | Update setting |
| `POST` | `/api/settings` | Admin | Create setting |
| `DELETE` | `/api/settings/{key}` | Admin | Delete setting |
| **Health** |
| `GET` | `/api/health` | Public | Health check |

### Endpoint Count by Router

| Router | Endpoints | Auth Required |
|--------|-----------|---------------|
| Auth | 5 | 2 Public, 3 Authenticated |
| Invitations | 5 | 1 Public, 4 Admin |
| Users | 3 | All Admin |
| Weekly Plans | 5 | 2 Authenticated, 3 Editor |
| News | 4 | 2 Authenticated, 1 Editor, 1 Authenticated |
| Analysis | 4 | 2 Authenticated, 2 Editor |
| Business Plans | 7 | 4 Authenticated, 3 Editor |
| Agents & Plugins | 5 | 2 Authenticated, 3 Admin |
| Pipeline | 3 | 2 Authenticated, 1 Editor |
| Settings | 5 | 2 Authenticated, 3 Admin |
| Health | 1 | Public |
| **Total** | **49** | — |
