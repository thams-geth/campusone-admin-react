# CampusOne — Project Context for Claude Code

## What this is

A multi-tenant SaaS college management platform ("CampusOne"). Not a single college's admin tool — any college can sign up as a tenant, and features are enabled per tenant like installing integrations (Datadog-style module toggles).

**Two separate repos, not a monorepo:** this repo (`campusone-admin`) is the frontend; the API lives in a sibling repo, `campusone-api`. They're paired over HTTP/CORS with no shared package — types are duplicated by hand on each side for now.

## Tech stack (decided)

- **Frontend:** React + TypeScript + Vite, Ant Design, TanStack Query, React Router, React Hook Form + Zod, Recharts/ECharts
- **Backend:** Express + TypeScript (separate repo: `campusone-api`)
- **ORM/DB:** Prisma + PostgreSQL
- **Payments:** Razorpay or Cashfree (native UPI support — non-negotiable for India)
- **Notifications:** WhatsApp Business API + SMS/email fallback (e.g. Gupshup)
- **Background jobs:** BullMQ/Redis

## Multi-tenancy — the most important architectural decision

- Start **pooled**: one Postgres database, one schema, every table carries a `tenant_id` (or `college_id`) column.
- Enforce tenant isolation with **Postgres Row-Level Security**, not just app-level `WHERE` clauses. RLS is the last line of defense — app code should never be the only thing standing between tenants.
- **Prisma specifics:** middleware (`$use`) is removed in Prisma 7. Use a **Prisma Client Extension** that sets `app.current_tenant` via `SET_CONFIG` at the start of each request, combined with an RLS policy on every table. Carry `tenant_id` through the Express request lifecycle with `AsyncLocalStorage` (set in middleware right after auth, read by the Prisma extension), not as a parameter threaded through every function — that's how it gets forgotten.
- Migration path for large customers later: schema-per-tenant, then dedicated DB per tenant — don't build these now, just don't make pooled-only assumptions that block the upgrade.
- Never let a query reach business logic without a resolved `tenant_id` in context.

## Module system

- Platform core (always on) + installable modules. A `tenant_modules` table maps `tenant_id → module_id → enabled + plan tier`.
- Every API route and every frontend route checks module entitlement before executing/rendering. Frontend modules should be code-split so a tenant without, say, Hostel enabled never downloads that bundle.
- Module list (rough plan-tier grouping):
  - **Core (always on):** tenant onboarding, auth/RBAC, department/class/section/student/staff structure, dashboard
  - **Academics:** attendance, marks/grading, assignments, timetable, LMS basics
  - **Admissions/CRM:** enquiry → application → admission pipeline
  - **Fee/Finance:** fee structure, UPI payments, receipts, concessions
  - **Examination:** scheduling, hall tickets, results, transcripts, CBCS/credit handling
  - **HR/Payroll:** staff profiles, leave, biometric attendance, salary/PF/ESI/TDS
  - **Library, Hostel/Transport**
  - **Placement/Alumni**
  - **Communication:** one engine for SMS/WhatsApp/email/push, used by every other module
  - **Compliance/Reporting (enterprise):** NAAC/NBA/NIRF/AISHE export-ready reports
  - **Inventory/Procurement (enterprise, later phase)**
- Platform admin console (internal, not tenant-facing): tenant list, module enable/disable, plan management, per-tenant usage, impersonate-for-support.

## Roles (scoped per tenant except platform admin)

`PLATFORM_ADMIN` (you, across all tenants) → `SUPER_ADMIN`/`COLLEGE_ADMIN` (one college) → `DEPARTMENT_ADMIN` → `FACULTY`/`STAFF` → `STUDENT` → (future) `PARENT`.

Every permission check is "does user X have role Y inside tenant Z" — never just "does this user have role Y."

## Core data hierarchy

```
College (tenant)
  └── Academic Year
       └── Department
            └── Program
                 └── Batch
                      └── Section
                           ├── Students, Faculty, Subjects, Timetable
                           ├── Attendance, Assignments, Exams, Marks
```

## Frontend structure (already decided, keep this)

```
src/
├── app/ (router, providers, layouts)
├── components/ (common, tables, forms, charts)
├── features/ (one folder per module: students, faculty, departments, academics, attendance, exams, marks, announcements...)
├── services/ (api.ts, auth.ts)
├── types/
└── utils/
```

## Development sequencing

1. Frontend shell with mock data first (layout, routing, dashboard) — don't wire Postgres/Prisma until the UX for core screens has stabilized, to avoid schema churn.
2. Build tenant model + auth/RBAC + module-entitlement system before deep-building any single module.
3. Then: Academics → Fee/Finance (UPI) → Communication engine → Library/Hostel/Transport → HR/Payroll/Examination/Placement-Alumni → Compliance/Reporting → mobile app (same API).

## V1 scope (first milestone — don't build everything at once)

Login → Admin layout (sidebar/header/breadcrumb) → Dashboard → Students (list/add/edit/details) → Departments (list/add/edit).

## Competitive positioning

Existing Indian college ERPs (Fedena, Academia ERP, MasterSoft, Proctur, EduplusCampus) already cover most standard modules. The differentiation is: self-serve module activation (rare in this market), WhatsApp/UPI as first-class rather than bolted-on, and a modern UI/UX — not a longer feature list.
