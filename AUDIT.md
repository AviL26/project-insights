# ECOncrete Project Insights — Codebase Audit

**Date:** 2026-03-18
**Auditor:** Claude (automated)
**Branch:** `claude/determined-wu`
**Commit baseline:** `8634e23` ("getting to MVP")

---

## 1. INVENTORY

### Root
| File | Purpose | Status |
|------|---------|--------|
| `docker-compose.yml` | **Not valid YAML.** Concatenated design doc containing docker-compose, Dockerfiles, nginx.conf, test files, deploy scripts, and user docs all in one file. References PostgreSQL/Redis while the app uses SQLite. | Unusable |
| `.gitignore` | Standard Node gitignore. Lists `*.db`/`*.sqlite` but both DB files are already tracked. | Complete |

### Backend (21 source files)
| File | Purpose | Status |
|------|---------|--------|
| `server.js` | Express entry point. Mounts routes, helmet, CORS, compression, rate limiting, health check, graceful shutdown. | **Complete** |
| `package.json` | Deps & scripts. | Has 6 unused deps, 3 missing deps, 4 scripts pointing to nonexistent files |
| `.env` | Environment config. | **SECURITY:** Real JWT_SECRET and SESSION_SECRET committed to repo |
| **DB Layer (7 files — 5 are redundant)** | | |
| `db/database-service.js` | Primary DB wrapper over connection-pool.js. Used by server.js and most routes. | **Active** |
| `db/connection-pool.js` | SQLite pool targeting `econcretedb.sqlite`. | **Active** (via database-service) |
| `db/enhanced-connection.js` | Separate pool targeting `projects.db`. | **Active** (auth.js only) |
| `db/connection.js` | Another connection module targeting `projects.db`. | **Orphaned** |
| `db/pool.js` | Yet another pool targeting `econcretedb.sqlite`. | **Orphaned** |
| `db/database.js` | Table creation for `econcretedb.sqlite`. | **Orphaned** |
| `db/init.js` | Incompatible schema for `projects.db`. | **Orphaned** |
| `db/seedData.js` | Skeleton seed data. | Half-finished (insert logic is a comment placeholder) |
| **Routes (9 files — 2 orphaned)** | | |
| `routes/projects.js` | Full CRUD with pagination, archive/restore, bulk ops. | **Active** |
| `routes/materials.js` | CRUD with pagination and filtering. | **Active** |
| `routes/compliance.js` | CRUD, dashboard summary, demo/enhanced endpoints. | **Active** |
| `routes/wizard.js` | Wizard bootstrap, cities, project creation with recommendations. Redis+in-memory cache. | **Active** |
| `routes/auth.js` | Register, login, profile CRUD, admin endpoints. JWT auth. | **Active** (but uses wrong DB) |
| `routes/lookups.js` | Queries lookup tables from econcretedb.sqlite. | **Active** |
| `routes/geographic-lookups.js` | REST Countries API, Nominatim, static lookups. | **Active** |
| `routes/ecological.js` | Full CRUD for ecological data. | **Orphaned** (never mounted) |
| `routes/waterQuality.js` | EPA Water Quality Portal integration. | **Orphaned** (never mounted) |
| **Middleware (4 files)** | | |
| `middleware/auth.js` | JWT generation/verification, bcrypt, role-based auth, rate limiters. | **Active** |
| `middleware/error-handler.js` | Custom error classes, async handler, global error handler. | **Active** |
| `middleware/security.js` | CORS options, rate limiter, security headers. | **Active** |
| `middleware/validation.js` | Express-validator rules, custom sanitization. | **Active** |
| **Services (3 files — all orphaned)** | | |
| `services/GeographicService.js` | Mega-file: geographic service + Joi validation + complete Express app. Uses uninstalled deps (node-fetch, Joi). | **Orphaned** |
| `services/RecommendationEngine.js` | Mega-file: recommendation engine + validation + route definitions. References undefined variables. | **Orphaned** |
| `services/backup-service.js` | Cron-scheduled backups, monitoring. Requires uninstalled `node-cron`. | **Orphaned** |
| **Utils** | | |
| `utils/pagination.js` | Pagination helper, CacheService, PerformanceMonitor. | **Active** |
| `scripts/test-optimizations.js` | Test script. Imports nonexistent `../db/optimize-indexes`. | **Broken** |

### Frontend (49 source files)
| File | Purpose | Status |
|------|---------|--------|
| `App.js` | Main shell. State-based routing (no react-router). Sidebar, header, wizard modal. | **Active** — 8+ debug console.logs |
| **Wizard** | | |
| `components/ProjectSetup/ProjectSetupWizard.js` | Multi-step wizard (details, location, structure, goals, review). | **Active, functional** |
| **Landing Page** | | |
| `components/ProjectsLandingPage.js` | Project grid with search, filter, sort, bulk ops. | **Active** — progress bars use `Math.random()` |
| `components/ProjectCard.js` | Memoized project card with wizard data integration. | **Active** |
| **Compliance Dashboard (5 files)** | | |
| `components/ComplianceDashboard/ComplianceDashboard.js` | Full compliance analysis with project/manual modes. | **Active** |
| `components/ComplianceDashboard/ComplianceChecklist.js` | Expandable checklist with status filtering. | **Active** |
| `components/ComplianceDashboard/ComplianceMap.js` | "Coming Soon" placeholder (Leaflet installed but unused here). | **Placeholder** |
| `components/ComplianceDashboard/ProjectSelector.js` | Project dropdown selector. | **Active** |
| `components/ComplianceDashboard/RiskSummaryCards.js` | Risk metric cards. | **Active** — dynamic Tailwind classes broken |
| **Ecological Dashboard** | | |
| `components/Ecological/EcologicalDashboard.js` | Ocean conditions display. Uses Open-Meteo API. | **Active** — environmental metrics hardcoded |
| **Materials Dashboard** | | |
| `components/Materials/MaterialsDashboard.js` | BOM dashboard with filtering. | **Active** — mostly hardcoded mock data |
| **Dashboard (orphaned set — 4 files)** | | |
| `components/Dashboard/Dashboard.js` | Alternative dashboard. **Crashes** — broken import path. | **Orphaned** |
| `components/Dashboard/DashboardNavigation.js` | Tab navigation with mock status indicators. | **Orphaned** |
| `components/Dashboard/IntegratedDashboard.js` | Alternative dashboard with collapsible sidebar. All mock data. | **Orphaned** |
| `components/Dashboard/ProjectSummaryPanel.js` | Project summary sidebar. All metrics hardcoded. | **Orphaned** |
| **Shared Components (5 files — all orphaned)** | | |
| `components/shared/CreateProjectModal.js` | Simple project modal. Client-side only, no API call. | **Orphaned** |
| `components/shared/Header.js` | Header wrapper. | **Orphaned** (App.js uses inline SimpleHeader) |
| `components/shared/Navigation.js` | Sidebar. Missing compliance nav item. | **Orphaned** |
| `components/shared/Sidebar.js` | Sidebar with project info. | **Orphaned** (App.js uses inline SimpleSidebar) |
| `components/shared/SimpleMap.js` | Leaflet map via CDN. | **Orphaned** |
| **Panels (4 files — all orphaned)** | | |
| `components/panels/ClimateProjectionsPanel.js` | **Empty file.** | Placeholder |
| `components/panels/OceanConditionsPanel.js` | Rich interactive ocean panel with charts and export. | **Orphaned** (EcologicalDashboard builds its own inline) |
| `components/panels/WaterQualityPanel.js` | **Empty file.** | Placeholder |
| `components/panels/WaterQualityPanel.jsx` | **Empty file.** | Placeholder |
| **Common Components** | | |
| `components/common/DashboardErrorDisplay.js` | Error/loading display system. | **Active** — bug: reads `loading` instead of `isLoading` |
| `components/common/ErrorAlert.js` | Error toast, global error container. | **Active** |
| `components/common/ValidatedInput.js` | Validated input with numeric/coordinate variants. | **Active but underused** — wizard doesn't use it |
| `components/ErrorBoundary.js` | Class-based error boundary. | **Active** |
| `components/Toast.js` | Toast component + useToast hook. | **Active** — conflicts with hooks/useToast.js |
| **Context (3 files)** | | |
| `context/ProjectContext.js` | Core project CRUD, bulk ops, optimistic updates. | **Active** |
| `context/ComplianceContext.js` | Compliance state management, smart API selection. | **Active** |
| `context/BaseContext.js` | Context factory function. Has broken example code. | **Orphaned** |
| **Hooks (5 files)** | | |
| `hooks/useOceanData.js` | Fetches ocean data with caching, dedup, abort. | **Active** |
| `hooks/useAlertSystem.js` | Environmental alert thresholds, browser notifications. | **Active** |
| `hooks/useDebounce.js` | Debounce hook. | **Active** |
| `hooks/useToast.js` | Toast hook (different API than Toast.js's useToast). | **Active** — naming conflict |
| `hooks/useLookupData.js` | Fetches lookup data. | **Likely orphaned** (wizard uses /wizard/bootstrap instead) |
| **Services (4 files)** | | |
| `services/api.js` | Central axios instance + API functions. | **Active** |
| `services/oceanDataService.js` | Open-Meteo API integration. | **Active** |
| `services/calculation-engine.js` | Scientific calculation models (carbon, biodiversity, risk). | **Orphaned** |
| `services/wizardapiservice.js` | Wizard API service with cache + retry. | **Orphaned** (wizard doesn't import it) |
| **Systems** | | |
| `systems/ErrorRecoverySystem.js` | Centralized error recovery with auto-retry. | **Orphaned** — would crash (destructures wrong method names from useToast) |
| **Utils** | | |
| `utils/projectUtils.js` | Project data utilities. | **Active** |
| `utils/styles.js` | Pre-defined Tailwind class mappings (fixes JIT issue). | **Orphaned** — nothing imports it despite being the fix for known bugs |

### Orphan Summary
- **Backend:** 7 orphaned files (3 DB modules, 2 routes, 3 services, 1 script)
- **Frontend:** 17+ orphaned files (4 Dashboard, 5 shared, 4 panels, 2 services, 1 system, 1 context, 1 hook)
- **~40% of the codebase is unused.**

---

## 2. RUNNABILITY

### Backend
- **`npm install`**: Succeeds with audit warnings.
- **`npm run dev`**: Starts successfully on port 3001. Health check at `/health` responds.
- **Issues at startup:**
  - Redis connection attempt logs warnings (no Redis in dev — falls back to in-memory).
  - `GET /` returns 404 (expected — API routes are under `/api/*`).

### Frontend
- **`npm install`**: Succeeds.
- **`npm start`**: Compiles and serves on port 3000. No build errors.
- **UI renders:** Landing page shows 2 projects from SQLite database. Wizard opens. Dashboards load.
- **Deprecation warnings:** `onAfterSetupMiddleware`/`onBeforeSetupMiddleware` (CRA webpack-dev-server).
- **Runtime warnings:** Stale browserslist data.

### Verdict: Both servers start and the app is usable. Core flows work (project list, wizard, dashboards).

---

## 3. DATABASE

### Two Databases (Split-Brain Problem)

**`econcretedb.sqlite`** (primary — used by all routes except auth):
| Table | Rows | Purpose |
|-------|------|---------|
| projects | 2 | Core projects |
| materials | 0 | Project materials |
| ecological_data | 0 | Ecological measurements |
| compliance_data | 0 | Compliance records |
| environmental_monitoring | 0 | Monitoring data |
| reports | 0 | Generated reports |
| user_sessions | 0 | Sessions (FK to nonexistent users table) |
| audit_log | 0 | Audit trail |
| materials_catalog | 4 | Lookup: material types |
| structure_types | 4 | Lookup: structure types |
| jurisdictions | 5 | Lookup: jurisdictions |
| species_database | 4 | Lookup: species |
| regulatory_requirements | 0 | Lookup: regulations |
| environmental_factors | 0 | Lookup: environmental factors |
| project_materials | 0 | Junction table |

**`projects.db`** (auth only):
| Table | Rows | Purpose |
|-------|------|---------|
| users | 0 | User accounts |

### Critical Issues
1. **Split-brain:** Auth creates users in `projects.db`, but `user_sessions` in `econcretedb.sqlite` has a FK to `users(id)` that references nothing.
2. **No migration runner:** 5 SQL migration files exist but there's no way to run them (scripts in package.json point to nonexistent files).
3. **Invalid SQLite syntax** in migrations: `ALTER TABLE ADD COLUMN IF NOT EXISTS` is not supported by SQLite.
4. **Schema mismatches:** Routes query columns that don't exist in the actual tables (compliance.js queries `priority`, `cost`, `regulatory_body`; materials.js queries `material_type`, `specification`; projects.js queries `species_database.project_id` which doesn't exist).
5. **Seed data is a stub:** `seedData.js` has placeholder comments instead of actual inserts.
6. **5 competing DB connection modules:** Only 2 are actively used.

### Schema Quality
The schema in `econcretedb.sqlite` is reasonable for an MVP. The lookup tables (`materials_catalog`, `structure_types`, `jurisdictions`, `species_database`) are well-structured with sample data. However, the schema does not match what the routes expect, and the split across two databases is a fundamental problem.

---

## 4. API ROUTES

### Mounted Routes (server.js)
| Method | Path | Handler | Frontend Connected? |
|--------|------|---------|-------------------|
| POST | `/api/auth/register` | auth.js | No (no auth UI) |
| POST | `/api/auth/login` | auth.js | No |
| GET | `/api/auth/profile` | auth.js | No |
| GET | `/api/projects` | projects.js | Yes (ProjectContext) |
| GET | `/api/projects/by-status/:status` | projects.js | Yes |
| GET | `/api/projects/:id` | projects.js | Yes |
| POST | `/api/projects` | projects.js | Yes |
| PUT | `/api/projects/:id` | projects.js | Yes |
| PUT | `/api/projects/:id/archive` | projects.js | Yes |
| PUT | `/api/projects/:id/restore` | projects.js | Yes |
| DELETE | `/api/projects/:id/permanent` | projects.js | Yes |
| PUT | `/api/projects/bulk-archive` | projects.js | Yes |
| DELETE | `/api/projects/bulk-permanent` | projects.js | Yes |
| GET | `/api/materials` | materials.js | Partial (context exists but dashboard uses mock data) |
| POST | `/api/materials` | materials.js | No |
| GET | `/api/compliance/demo` | compliance.js | Yes (ComplianceContext) |
| POST | `/api/compliance-enhanced/check` | compliance.js | Yes |
| GET | `/api/compliance-enhanced/rules` | compliance.js | Yes |
| GET | `/api/lookups/*` | lookups.js | No (useLookupData is likely orphaned) |
| GET | `/api/lookup/all` | geographic-lookups.js | Via wizard bootstrap |
| GET | `/api/lookup/countries` | geographic-lookups.js | Via wizard |
| GET | `/api/lookup/structure-types` | geographic-lookups.js | Via wizard |
| GET | `/api/wizard/bootstrap` | wizard.js | Yes (ProjectSetupWizard) |
| POST | `/api/wizard/validate-step` | wizard.js | Yes |
| POST | `/api/wizard/complete` | wizard.js | Yes |
| GET | `/health` | server.js | Yes (ComplianceContext health check) |

### Unmounted Routes (exist as files but never loaded)
| File | Endpoints | Notes |
|------|-----------|-------|
| `routes/ecological.js` | CRUD for ecological_data | Never mounted in server.js |
| `routes/waterQuality.js` | EPA Water Quality Portal proxy | Never mounted in server.js |

---

## 5. FRONTEND

### Pages & Navigation
Navigation is **state-based** (`useState('landing')` in App.js) — react-router-dom is installed but unused.

| View | Component | Functional? |
|------|-----------|-------------|
| Landing | `ProjectsLandingPage` | **Yes** — lists projects, search, filter, sort, bulk ops all work |
| Wizard | `ProjectSetupWizard` (modal) | **Yes** — 5-step wizard creates projects via API |
| Materials | `MaterialsDashboard` | **Partial** — UI renders but data is 90% hardcoded mock |
| Ecological | `EcologicalDashboard` | **Partial** — ocean data from Open-Meteo works; environmental metrics hardcoded |
| Compliance | `ComplianceDashboard` | **Yes** — connects to API, analysis works, checklist renders |

### UI Flow
1. User lands on Project Dashboard (landing page)
2. Can click "+ New Project" to open wizard modal
3. Wizard walks through 5 steps: Details → Location → Structure → Goals → Review
4. After creation, project appears in the grid
5. Sidebar navigation switches between Materials, Ecological, Compliance views
6. Compliance dashboard can analyze projects or manual coordinates

### Key Frontend Bugs
1. **Dynamic Tailwind classes broken:** `bg-${color}-200` in RiskSummaryCards.js and MaterialsDashboard.js won't render with JIT compilation. `styles.js` exists as the fix but is never imported.
2. **Two competing toast systems:** `Toast.js` exports `useToast` with `{success, error, warning, info}` API; `hooks/useToast.js` exports `useToast` with `{showSuccess, showError, showWarning, showInfo}` API. Different components use different ones.
3. **`selectedProject` not passed** to MaterialsDashboard or ComplianceDashboard from App.js (only EcologicalDashboard receives it).
4. **Progress bars are random:** `ProjectsLandingPage` calculates progress with `Math.random()`, changing on every render.
5. **ComplianceMap** is a "Coming Soon" placeholder despite Leaflet being fully installed.

---

## 6. TECH DEBT

### Security (Critical)
| Issue | Location |
|-------|----------|
| `.env` with real secrets committed to repo | `backend/.env` |
| `JWT_SECRET` exported as a module property | `backend/middleware/auth.js` |
| SQLite databases committed to git (despite .gitignore listing them) | `backend/db/*.sqlite`, `backend/db/*.db` |
| No HTTPS enforcement | `backend/server.js` |
| No input sanitization on some wizard endpoints | `backend/routes/wizard.js` |

### Architecture (High)
| Issue | Impact |
|-------|--------|
| Split-brain database (auth in `projects.db`, everything else in `econcretedb.sqlite`) | Users created via auth are invisible to all other services |
| 5 competing DB connection modules | Confusion, maintenance burden |
| ~40% orphaned code | 24+ files that are never imported or used |
| No migration runner | Schema changes require manual SQL execution |
| docker-compose.yml is a design document, not executable config | No containerized deployment path |
| react-router-dom installed but unused (state-based routing) | No URL-based navigation, no deep linking, no browser back |

### Code Quality (Medium)
| Issue | Location |
|-------|----------|
| 8+ debug `console.log` statements | `frontend/src/App.js` |
| Route handlers query nonexistent columns | `compliance.js`, `materials.js`, `projects.js`, `ecological.js` |
| Redis attempted at module load (logs warnings in dev) | `backend/routes/wizard.js` |
| 3 empty placeholder files | `ClimateProjectionsPanel.js`, `WaterQualityPanel.js/.jsx` |
| Inline component definitions inside App function | `App.js` (SimpleSidebar, SimpleHeader, WizardModal) |
| `ErrorRecoverySystem.js` destructures wrong method names | Would crash if actually used |
| `BaseContext.js` has broken example code at bottom | Would cause import errors |

### Dependencies
| Issue | Details |
|-------|---------|
| 6 unused installed deps | `redis`, `connect-sqlite3`, `express-session`, `cookie-parser`, `zod`, `express-slow-down` |
| 3 required but uninstalled deps | `node-cron`, `node-fetch`, `Joi` (only in orphaned files) |
| `react-router-dom` installed, never used | Frontend |
| `@tailwindcss/postcss` v4 vs `tailwindcss` v3 | Potential conflict in frontend |
| Multiple conflicting `process.exit()` signal handlers | `server.js`, `connection-pool.js`, `pool.js` |

---

## 7. VERDICT

### Should you build on this codebase or start fresh?

**Start fresh.** Here's why:

**What works (worth preserving as reference):**
- The project wizard flow (5 steps) is well-designed and functional
- ProjectContext with optimistic updates and rollback is solid
- ComplianceContext with smart API selection is good
- The geographic-lookups route (REST Countries + Nominatim) is well-implemented
- Ocean data integration via Open-Meteo works
- The lookup table schema design is reasonable

**What's fundamentally broken:**
1. **Split-brain database** is an architectural flaw that touches every layer. Auth, sessions, and business data are in different databases with broken foreign keys. Fixing this requires rewriting the entire DB layer.
2. **~40% dead code** means you'd spend more time auditing what to keep vs. delete than writing fresh code. 5 DB modules, 3 orphaned services, 17+ orphaned frontend components.
3. **Schema-route mismatches** mean most CRUD endpoints beyond projects will error. The routes were written against a different schema than what exists.
4. **No migration system** means the schema has been manually patched with invalid SQLite syntax. There's no reliable way to evolve the database.
5. **State-based routing** with no react-router means no URLs, no deep linking, no browser back button. Retrofitting this into the current architecture is a significant rewrite.

**The core issue:** This codebase has accumulated multiple iterations of design (evident from the orphaned services, competing DB modules, and duplicate components) without pruning. The working parts are good reference material, but the foundation (database, routing, module structure) needs to be rebuilt.

---

## 8. RECOMMENDED FRESH ARCHITECTURE

### Tech Stack
| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 19 + React Router 7 + Tailwind 4 | Already familiar; add proper routing |
| Backend | Express 5 + better-sqlite3 | Sync SQLite for dev; Express is already known |
| Database (dev) | SQLite via better-sqlite3 | Simpler, faster than sqlite3 package |
| Database (prod) | PostgreSQL via pg | Drop-in swap via a db adapter layer |
| Migrations | Custom runner or `umzug` | Versioned, reversible schema changes |
| Validation | Zod (shared frontend/backend) | Already a dependency; type-safe |
| Auth | JWT + bcrypt (same as current) | Keep what works |

### Project Structure
```
econcrete/
├── packages/
│   └── shared/              # Shared Zod schemas, types, constants
│       ├── schemas/
│       │   ├── project.js
│       │   ├── material.js
│       │   ├── compliance.js
│       │   └── ecological.js
│       └── constants/
│           ├── structure-types.js
│           ├── jurisdictions.js
│           └── species.js
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db/
│   │   │   ├── adapter.js       # DB adapter interface (SQLite/PostgreSQL)
│   │   │   ├── sqlite.js
│   │   │   ├── postgres.js
│   │   │   └── migrations/
│   │   │       ├── runner.js
│   │   │       ├── 001_initial_schema.sql
│   │   │       ├── 002_lookup_data.sql
│   │   │       └── 003_seed_data.sql
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── materials.js
│   │   │   ├── compliance.js
│   │   │   ├── ecological.js
│   │   │   └── wizard.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validate.js
│   │   │   └── error-handler.js
│   │   └── services/
│   │       ├── geographic.js
│   │       ├── ocean-data.js
│   │       └── recommendations.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── router.jsx           # React Router config
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ProjectWizard.jsx
│   │   │   ├── Materials.jsx
│   │   │   ├── Compliance.jsx
│   │   │   └── Ecological.jsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── PageShell.jsx
│   │   │   ├── wizard/
│   │   │   │   ├── WizardShell.jsx
│   │   │   │   ├── StepLocation.jsx
│   │   │   │   ├── StepStructure.jsx
│   │   │   │   ├── StepGoals.jsx
│   │   │   │   └── StepReview.jsx
│   │   │   └── shared/
│   │   │       ├── Map.jsx
│   │   │       ├── Toast.jsx
│   │   │       └── ErrorBoundary.jsx
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   │   └── api.js
│   │   └── utils/
│   └── package.json
├── docker-compose.yml
├── Dockerfile
└── package.json                 # Workspace root (npm workspaces)
```

### Data Model (Single Database)
```sql
-- Core
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin','user','viewer')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','completed','archived')),
  -- Location
  country TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  -- Structure
  structure_type_id INTEGER REFERENCES structure_types(id),
  wave_exposure TEXT,
  seabed_type TEXT,
  depth_range TEXT,
  -- Goals
  primary_goal TEXT,
  ecological_goals TEXT, -- JSON array
  target_species TEXT,   -- JSON array
  -- Regulatory
  jurisdiction_id INTEGER REFERENCES jurisdictions(id),
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Materials
CREATE TABLE project_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES materials_catalog(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance
CREATE TABLE compliance_checks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rule_code TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','compliant','non_compliant','waived')),
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
  notes TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ecological Monitoring
CREATE TABLE ecological_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL, -- 'water_quality', 'species_observation', 'habitat_assessment'
  data TEXT NOT NULL,        -- JSON payload
  recorded_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lookups (same as current, they're well-designed)
CREATE TABLE materials_catalog ( ... );
CREATE TABLE structure_types ( ... );
CREATE TABLE jurisdictions ( ... );
CREATE TABLE species_database ( ... );
```

### Key Architecture Decisions
1. **Single database** — no more split-brain. Users, sessions, projects, and all domain data in one DB.
2. **DB adapter pattern** — `adapter.js` exports `query(sql, params)` and `transaction(fn)`. Swap SQLite for PostgreSQL by changing one import.
3. **Migration runner** — numbered SQL files, a `migrations` table tracking what's been applied, up/down support.
4. **React Router** — URL-based navigation from day one. Each feature is a route (`/projects`, `/projects/:id/materials`, `/projects/:id/compliance`, etc.).
5. **Shared schemas** — Zod schemas in `packages/shared/` used by both frontend validation and backend middleware. Single source of truth.
6. **No orphans** — every file is imported or it doesn't exist.
7. **Feature-first wizard** — the wizard is the first thing to build since it drives project creation, which everything else depends on.

### Implementation Order
1. **Scaffold** — monorepo with npm workspaces, backend hello-world, frontend hello-world, DB with migrations
2. **Auth** — users table, register/login, JWT middleware
3. **Project Wizard** — the core flow, ported from current working wizard
4. **Project Dashboard** — list, search, filter, archive (port from current)
5. **Materials Calculator** — real data, not mock
6. **Compliance Checklist Generator** — port and fix current implementation
7. **Ecological Scoring Dashboard** — integrate Open-Meteo + calculation engine
8. **Polish** — maps, charts, export, responsive design
