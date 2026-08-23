# API Contract (Canonical Backend)

This document defines the auth API contract for the canonical FastAPI server (`backend/server.py`).

> **Migration note**: this contract describes the currently-active FastAPI backend. The Sovereign OS migration's target architecture (see `docs/ARCHITECTURE.md`) removes FastAPI entirely; this document stays authoritative for these endpoints until that migration actually replaces them.

## Base URL

- Local backend base: `http://localhost:8000`
- API prefix: `/api`
- Auth endpoints therefore live under: `/api/auth/*`

---

## Auth Endpoints

### 1) Register

- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Request body**:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strong-password"
}
```

- **Success response**: `200 OK`
- **Response body (UserResponse)**:

```json
{
  "user_id": "user_a1b2c3d4e5f6",
  "email": "jane@example.com",
  "name": "Jane Doe",
  "picture": null,
  "level": 0,
  "current_act": 1,
  "completed_acts": [],
  "act3_unlocked": false,
  "is_admin": false,
  "tier": "free",
  "spins_earned": 0,
  "spins_used": 0,
  "owns_all_albums": false,
  "created_at": "2026-05-20T00:00:00+00:00"
}
```

- **Side effect**: sets `session_token` cookie.

---

### 2) Login

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request body**:

```json
{
  "email": "jane@example.com",
  "password": "strong-password"
}
```

- **Success response**: `200 OK`
- **Response body**: same `UserResponse` shape as register.
- **Error response**: `401` with `{"detail": "Invalid credentials"}`.
- **Side effect**: sets `session_token` cookie.

---

### 3) Current session

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: `session_token` cookie (or bearer token fallback supported by backend internals).
- **Success response**: `200 OK`
- **Response body**: same `UserResponse` shape.
- **Error response**: `401` with `{"detail": "Not authenticated"}`.

---

### 4) Logout

- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Success response**: `200 OK`
- **Response body**:

```json
{
  "message": "Logged out successfully"
}
```

- **Side effect**: clears `session_token` cookie.

---

## Response Model: `UserResponse`

All successful auth user responses (`register`, `login`, `me`, `social`) follow this shape:

```ts
{
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  level: number;
  current_act: number;
  completed_acts: number[];
  act3_unlocked: boolean;
  is_admin: boolean;
  tier: string;
  spins_earned: number;
  spins_used: number;
  owns_all_albums: boolean;
  created_at?: string | null;
}
```

---

## Source of Truth

- Runtime backend app: `backend/server.py`
- Legacy `backend/app/main.py` now re-exports canonical `server.app`.
