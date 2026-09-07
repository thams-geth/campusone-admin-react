# CampusOne Admin

Admin frontend for **CampusOne**, a multi-tenant SaaS college management platform. Any college can sign up as a tenant; features are enabled per tenant as installable modules.

See [`CLAUDE.md`](./CLAUDE.md) for the full product/architecture context.

## Stack

- React 19 + TypeScript + Vite
- Ant Design (theming in `src/app/theme.ts`)
- TanStack Query for server state
- React Router for routing
- React Hook Form + Zod for forms/validation
- Recharts for charts
- Vitest + React Testing Library for tests

## Current phase

This frontend is being built **with mock data first** against a fake service layer (`src/services/api`), per the project's development sequencing — no backend exists yet. Every mock service function mirrors the shape a real REST call will eventually have (async, paginated, typed envelope), so swapping in real HTTP calls later should only touch `src/services`, not the features that consume them.

## Project structure

```
src/
├── app/          # router, providers, theme, layouts
├── components/   # shared UI: common, tables, forms, charts
├── features/     # one folder per module (auth, students, departments, ...)
├── services/     # api.ts, auth.ts and the mock data layer
├── types/        # shared domain types
├── utils/        # helpers
└── test/         # test setup
```

## Scripts

```bash
npm run dev         # start dev server
npm run build       # typecheck + production build
npm run lint        # eslint
npm run typecheck   # tsc project references, no emit
npm run test        # run tests once
npm run test:watch  # run tests in watch mode
```

## Security notes (mock-data phase)

- Session token is kept in `sessionStorage`, not `localStorage`, to limit exposure if an XSS bug ever slips through — cleared when the tab closes. **Production must replace this with a backend-issued httpOnly, secure, SameSite cookie**; the client should never be the sole holder of a long-lived credential.
- The CSP in `index.html` is a defense-in-depth fallback. In production it must be set as a real `Content-Security-Policy` HTTP response header at the server/CDN (a `<meta>` CSP can't set `frame-ancestors`, and could be stripped by anything able to inject markup).
- Route access is guarded by both authentication and role (RBAC), matching the "role inside tenant" model in `CLAUDE.md` — never just "has this role" globally.
- All forms validate with Zod on the client; **this is a UX convenience, not a security boundary** — the real backend must re-validate everything server-side once it exists.
- Login lockout after repeated failures is implemented client-side for demo UX only — real throttling (per-account and per-IP) must live server-side, since an attacker controls their own client.
- `robots.txt` and a `noindex` meta tag keep the admin console out of search results; it is not a substitute for authentication.
- A top-level `ErrorBoundary` (`src/components/common/ErrorBoundary.tsx`) catches render-time crashes so a bug in one page shows a "something went wrong" screen instead of silently blanking the whole app.
- Routes are code-split with `React.lazy` per CLAUDE.md's module model — a tenant's browser only downloads the JS for pages it visits, not the whole app upfront.
- `npm audit` is clean as of this writing; re-run it before shipping, and again whenever dependencies change.
