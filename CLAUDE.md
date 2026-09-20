# CampusOne Admin — Project Context for Claude Code

## What this is

The admin console for **CampusOne**, a multi-tenant SaaS college management platform. Any college signs up as a tenant; features are enabled per tenant like installable modules.

**Two separate repos, not a monorepo:** this repo is the frontend. The API lives in a sibling repo, `campusone-api`. They're paired over HTTP/CORS with no shared package; types are duplicated by hand on each side. See `campusone-api/CLAUDE.md` for backend architecture (multi-tenancy/RLS, RBAC's actual permission model, the module-entitlement system) — this file only covers frontend-specific decisions.

**No mock layer.** Early V1 scope (auth, dashboard, departments, students) was originally built against a mock service layer to unblock frontend work before the API existed. That's gone — `src/services/mock/` was deleted once every module had a real endpoint, and all ~38 feature modules below talk to `campusone-api` directly. There's nothing left to "swap a fetch implementation into."

## Tech stack (decided)

- **Framework:** React 19 + TypeScript + Vite
- **UI library:** Ant Design (antd) 6 — see "Design system" below for how it's themed
- **Data fetching:** TanStack Query (react-query) — every list/detail page is a `useQuery`, every mutation a `useMutation` with `queryClient.invalidateQueries` on success
- **Forms:** React Hook Form + Zod (`@hookform/resolvers/zod`) for state/validation, antd's `Form`/`Form.Item` for layout only — see "Form convention" below, this pairing has a real gotcha
- **Routing:** React Router v7, plain `BrowserRouter` (not the data router) — see "Scroll restoration" below for why that matters
- **Charts:** Recharts (dashboard trend/distribution charts)
- **Dates:** dayjs

## Frontend structure

```
src/
├── app/
│   ├── layouts/AdminLayout.tsx      # header + (currently hidden) sidebar + content shell
│   ├── providers/AppProviders.tsx   # ConfigProvider(theme) > QueryClientProvider > BrowserRouter > ScrollManager > AuthProvider
│   ├── router/navConfig.tsx         # NAV_ITEMS (module list) + role-group constants + NAV_GROUPS
│   ├── router/breadcrumbs.ts        # path → breadcrumb title lookup
│   ├── router/ScrollManager.tsx     # custom back/forward scroll restoration
│   └── theme.ts                     # the whole visual identity — one file, see "Design system"
├── components/common/               # ErrorBoundary, FullPageSpinner, NotFoundPage
├── features/<module>/               # one folder per module — *Page.tsx (list), *FormDrawer.tsx or *FormPage.tsx (create/edit), *DetailsPage.tsx, hooks.ts, *Schema.ts, plus *.test.tsx next to each
├── services/api/<module>Api.ts      # thin typed wrappers over httpClient.ts (get/post/put/delete), one per backend module
├── services/api/httpClient.ts       # fetch wrapper: bearer token, 401-refresh-and-retry, error → ApiError
├── test/mockFetch.ts                # fake `fetch` router for tests — register routes, no real network
├── test/setup.ts                    # jsdom polyfills (matchMedia, ResizeObserver) — see gotchas below
├── types/                           # shared types not owned by one feature (common.ts's PaginatedResponse/ApiError, user.ts, etc.)
└── utils/                           # errorMessage.ts, formatDate.ts/formatDateTime.ts, relativeTime.ts — shared, reuse before writing a local version
```

Every feature module follows the same shape: a service file in `services/api/`, a `hooks.ts` wrapping it in react-query, a list page, and create/edit via either a side `Drawer` (most modules) or a full `*FormPage.tsx` (Students, Faculty — forms with enough fields that a drawer felt cramped). Match whichever sibling module is closest before inventing a new pattern.

## RBAC — mirror the backend's tiers, never invent new ones

`campusone-api` has 10 roles and per-route permission keys; this frontend doesn't re-implement that — `useAuth()`'s `hasRole(...roles)` and `hasModule(moduleId)` gate what renders, and the backend still enforces the real permission check independently (a hidden button is UX, not security). `src/app/router/navConfig.tsx` defines the role-group constants every page's gating reuses:

- `STAFF_ROLES` — SUPER_ADMIN, COLLEGE_ADMIN, DEPARTMENT_ADMIN, HOD, FACULTY, STAFF (broad "logged-in staff" access)
- `ADMIN_ROLES` — SUPER_ADMIN, COLLEGE_ADMIN, DEPARTMENT_ADMIN, HOD (create/edit/delete on most modules)
- `EXAM_ROLES` — `STAFF_ROLES` + EXAM_ADMIN
- `PLATFORM_ADMIN_ROLES` — SUPER_ADMIN, COLLEGE_ADMIN only (Billing, Developer settings/API keys/Webhooks/Integrations, Roles & Permissions, Audit Log — matches `campusone-api/CLAUDE.md`'s note that these grants deliberately aren't extended to DEPARTMENT_ADMIN/HOD/STAFF)

Route-level gating uses `<RequireRole roles={...}>` (`src/features/auth/RouteGuards.tsx`); page-level conditional actions (an "Edit"/"Delete" button only an admin sees) call `hasRole(...ADMIN_ROLES)` directly, same constant, so the two can't drift apart.

## Navigation — the dashboard card grid, not a sidebar

The persistent left `Sider`/mobile nav `Drawer` are **hidden**, not deleted — `AdminLayout.tsx`'s `SHOW_LEFT_NAV = false` flag. Primary navigation is a role-filtered, colour-coded card grid on the dashboard (`NavCardGrid.tsx`), grouped via each `NavItem`'s `group` field in `navConfig.tsx`: People, Academic Structure, Academics, Campus Operations, Administration (`NAV_GROUPS`, display order). A "CampusOne" text link in the header (`AdminLayout.tsx`) is the one persistent way back to that grid from any page, since the sidebar no longer serves that role. Flip `SHOW_LEFT_NAV` back to `true` to restore the old sidebar — the Sider/Drawer/hamburger implementation is untouched underneath the flag.

## Design system — one theme file, not per-page styling

`src/app/theme.ts` is the antd `ConfigProvider` theme (`token`/`components`) — colours, border radius, and font family cascade from here to every antd component across all ~38 modules automatically. Change the look of the whole app by editing this one file, not by hunting down inline styles.

- **Palette:** indigo/violet primary (`#4F46E5`), a violet-tinted off-white ground (`#F6F5FC`) rather than flat grey, semantic success/warning/error tuned to sit next to the primary.
- **Type:** Lexend for headings (loaded in `index.html`, applied globally in `index.css` to `h1`–`h5` and `.ant-typography` heading variants — antd's `Typography.Title` renders native heading tags, so this needs no per-component antd token), Inter for body/UI/data. Both are Google Fonts — `index.html`'s CSP explicitly allow-lists `fonts.googleapis.com`/`fonts.gstatic.com` for this; don't add another font host without updating it.
- **Per-group accent colour:** the dashboard's `NavCardGrid` and its stat cards use a small `GROUP_ACCENT`/icon-tint pattern (colour + a `color-mix(in srgb, <color> N%, white)` tint background) rather than one uniform icon colour — reuse that pattern (see `NavCardGrid.tsx`, `StatCard.tsx`, `TimetableGrid.tsx`'s per-subject colour hash) before inventing a new one for a new card-like UI.

## Form convention — always a real `<Form>`, never a bare `<form>`

Every form wraps its fields in antd's actual `<Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()} noValidate>` component — react-hook-form still owns state/validation via `Controller`, antd's `Form` is purely for layout context. **This isn't optional styling** — a bare `<form>` with `Form.Item` inside it and no `Form` ancestor falls back to antd's default `layout="horizontal"`, and each `Form.Item` sizes its own label column independently based on that field's own label text length, so sibling fields with different label lengths (e.g. "Email" vs "Password") visually misalign with different input widths. This bit the whole app once — every form was retrofitted in one pass. `onFinish` (not `onSubmit`) is required too: antd's `Form` intercepts and silently discards a plain `onSubmit` prop internally.

## Mobile responsiveness

- Global CSS safety nets in `index.css`: `.ant-table-wrapper { overflow-x: auto }` (every list page's `<Table>` scrolls inside its own wrapper instead of widening the page) and `.ant-drawer-content-wrapper { max-width: 100vw }` (no create/edit drawer overflows a phone screen).
- `AdminLayout` switches to a hamburger + `Drawer` below antd's `lg` breakpoint (`Grid.useBreakpoint()`) — currently moot while `SHOW_LEFT_NAV` is false, but keep it working since re-enabling the sidebar shouldn't silently break mobile.
- Detail pages with a fixed `Descriptions bordered column={2}` should use the responsive form `column={{ xs: 1, sm: 1, md: 2 }}` instead — several were fixed this way; match that pattern for new ones.
- **Test gotcha:** `src/test/setup.ts`'s `matchMedia` polyfill evaluates real `min-width` queries against `window.innerWidth` (jsdom defaults to 1024, i.e. "desktop") rather than always returning `false` — a test exercising mobile-only UI must explicitly set `window.innerWidth` via `Object.defineProperty` and dispatch a `resize` event first (see `AdminLayout.test.tsx`).

## Scroll restoration

Plain `BrowserRouter` (not the data router) has no built-in scroll restoration, and the browser's own `history.scrollRestoration` gets defeated anyway: every route's data loads asynchronously (lazy chunks + react-query), so a page is briefly much shorter than its final content on a back/forward navigation, which clamps `scrollY` to 0 before the real content grows back in. `src/app/router/ScrollManager.tsx` (mounted in `AppProviders.tsx`, inside the router) takes manual control instead — remembers each history entry's scroll position, and on `POP` navigation polls via `requestAnimationFrame` until the page is actually tall enough before restoring it.

## Testing conventions

- Vitest + `@testing-library/react` + `userEvent`. `src/test/mockFetch.ts` stubs `global.fetch` — register a route (`mockFetch.get/post/put/delete(path, response)`) per test, `installMockFetch()`/`resetMockFetch()` in `beforeEach`/`afterEach`. No real network in any test.
- A component using `useAuth()`/`useNavigate()` needs `<AuthProvider>` and `<MemoryRouter>` (often `<Routes>` with a stub destination route) wrapped around it, plus `<QueryClientProvider>` for anything using react-query — see any recent `*Page.test.tsx` for the exact wrapper shape.
- `AuthProvider` with no stored token settles to `'unauthenticated'` synchronously, no network call — safe to wrap around a test that doesn't care about auth state.
- A `Tabs` pane containing a `Popconfirm` causes a severe jsdom-only slowdown (not a real bug — confirmed fine in real browsers). Where a page was split into tabs (e.g. `TimetablePage`'s Grid/List views), the tab's content component is exported separately so tests can render it directly without the `Tabs` wrapper — follow that pattern rather than fighting the slowdown.
- An antd `Modal`'s zoom-leave animation doesn't resolve promptly in jsdom — don't `waitFor` a `Modal`'s `dialog` role to disappear after submit; assert the resulting state change instead (a `Drawer`'s close animation is fine to wait on).

## Module list (all built, wired to real endpoints)

Core structure: Departments, Students (+ 360 profile view), Faculty (+ 360 profile view), Academic Years, Programs, Batches, Sections, Subjects, Rooms, Institution settings, Timetable (visual weekly grid + configurable period slots — see `campusone-api/CLAUDE.md`'s Post-Release-4 note for how period slots and entries relate), Audit Log, RBAC (Roles & Permissions).

Academics: Attendance, Leave, Assignments, Examinations, Announcements, Documents, Reports, Import/Export, Class Groups, Notifications, Global Search.

College operations: Admissions, Fees, Hostel, Transport, Library, Certificates, Activities, Placements.

Enterprise/admin: Billing, Developer settings (API Keys, Webhooks, Integrations), Approvals.

Auth: login, change-password, forgot-password/reset-password. `campusone-api` also supports MFA (TOTP), session list/revoke, and login history — none of those three have frontend UI yet; build them the same way as the rest of this list if asked, following `campusone-api/CLAUDE.md`'s TOTP notes.
