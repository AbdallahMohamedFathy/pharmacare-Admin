# Academic Institutions (Universities / Faculties / Faculty Deans) — Questions Before We Test

> **To:** Backend Team
> **From:** Frontend Team (Admin Dashboard)
> **Date:** 2026-09-12
> **Priority:** Medium — not blocking today, but blocks end-to-end testing of the new screen

---

## What We Built

Based on `FACULTY_DEAN_AND_INTERN_BACKEND_SPEC.md` (Part 8.5), we added a new **"Academic Institutions"** screen to the Admin Dashboard (SuperAdmin-only, same gating as Platform Config / Admin Management). It has 3 tabs and is wired to the exact endpoints your spec defines:

| Tab | Action | Endpoint Called |
|---|---|---|
| Universities | Create | `POST /api/v1/admin/universities` |
| Universities | List | `GET /api/v1/admin/universities` |
| Faculties | Create | `POST /api/v1/admin/faculties` |
| Faculties | List | `GET /api/v1/admin/faculties` |
| Faculty Deans | Provision | `POST /api/v1/admin/deans` |
| Faculty Deans | List | `GET /api/v1/admin/deans` |
| Faculty Deans | Activate/Suspend | `PUT /api/v1/admin/deans/{id}/status` |
| Faculty Deans | Reset Password | `POST /api/v1/admin/deans/{id}/reset-password` |

This is all built and ready — we just can't test it end-to-end yet since these endpoints don't exist on your side yet (or we can't confirm they do). Before you build them, please confirm/clarify the points below — a couple of them affect what we already built.

---

## 1. Endpoint prefix — `/admin/` vs `/super-admin/` (🔴 please confirm first)

Every other SuperAdmin-only feature in this dashboard (Admin Management, Platform Config, System Health, Backups, Integrations) lives under **`/api/v1/super-admin/...`**. Your spec document defines the new University/Faculty/Dean endpoints under **`/api/v1/admin/...`** instead.

We built the frontend calling `/api/v1/admin/universities`, `/api/v1/admin/faculties`, `/api/v1/admin/deans` — exactly as written in the spec. **Please confirm this is intentional** and not a typo in the spec, otherwise every call from this new screen will 404.

## 2. No edit endpoint for Universities or Faculties

The spec only gives us `POST` + `GET` for both:
- If we create a University with a typo in the name, there's no way to fix it.
- `Faculty` has an `isActive` field in the schema, but no endpoint to toggle it after creation.

Is this intentional (create-only for now), or should we expect `PUT /api/v1/admin/universities/{id}` and `PUT /api/v1/admin/faculties/{id}` at some point? We built the screen as create + list only for now, matching what the spec actually provides.

## 3. `GET /api/v1/admin/deans` — please include `facultyId` in the list

Your example response only returns `facultyName` / `universityName` as display strings:

```json
{ "deanId": "...", "name": "...", "email": "...", "facultyName": "كلية الصيدلة", "universityName": "جامعة القاهرة", "isActive": true, "appointmentDate": "2024-09-01" }
```

We need the actual `facultyId` (and ideally `universityId`) in each item — right now, without it, the only way we can check "does this faculty already have an active Dean" before provisioning a new one is by matching the faculty **name as a string**, which is fragile (e.g. breaks if two faculties share a name, or if `facultyName` is sometimes the Arabic name and sometimes the English one).

## 4. What happens when a faculty already has an active Dean?

The spec says `POST /api/v1/admin/deans` "*Ensures that no other active Dean is already assigned to this facultyId (or archives previous appointment)*." Can you clarify which one it actually does:
- (a) silently deactivates/archives the existing Dean and proceeds, or
- (b) rejects the request with an error until we explicitly deactivate the old Dean first?

This changes whether our UI should hard-block submission or just show a warning. We currently just show a soft warning and let the request go through — let us know if that's the wrong behavior once (a)/(b) is confirmed.

## 5. Confirm `deanId` is the `{id}` used in status/reset-password

`GET /api/v1/admin/deans` returns `deanId` as the identifier (not `id`). We're assuming this is the same value that goes into `PUT /admin/deans/{id}/status` and `POST /admin/deans/{id}/reset-password` — please confirm.

---

## Summary of Actions Needed from Backend

| # | Action | Priority |
|---|--------|----------|
| 1 | Confirm `/admin/...` prefix is correct for universities/faculties/deans (not `/super-admin/...`) | 🔴 High |
| 2 | Confirm `GET /admin/deans` will include `facultyId` (and `universityId`) per item | 🟡 Medium |
| 3 | Clarify duplicate-active-Dean behavior on `POST /admin/deans` (archive vs. reject) | 🟡 Medium |
| 4 | Confirm whether edit endpoints for Universities/Faculties are planned | 🟢 Low |
| 5 | Confirm `deanId` is the correct `{id}` for status/reset-password calls | 🟢 Low |

---

*Frontend team — Tamenny Admin Dashboard*
*Date: 2026-09-12*
