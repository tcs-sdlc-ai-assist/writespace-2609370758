# Codebase Architectural Report

> **Auto-generated** by graphify knowledge graph analysis  
> **Purpose**: Dependency map, connection analysis, subsystem breakdown, and quality hotspots.

---

## 1. Executive Summary

- **Total Components**: `85`
- **Total Connections**: `128`
- **Subsystem Modules**: `1`
- **Dependency Types**: `5`

**Key Architectural Hubs:**

| # | Component | File | Type | Connections |
|---|-----------|------|------|-------------|
| 1 | `App.jsx` | `frontend/src/App.jsx` | class | 17 |
| 2 | `identity.test.jsx` | `frontend/src/__tests__/identity.test.jsx` | function | 14 |
| 3 | `auth.js` | `frontend/src/utils/auth.js` | file | 12 |
| 4 | `storage.js` | `frontend/src/utils/storage.js` | file | 12 |
| 5 | `devDependencies` | `frontend/package.json` | function | 11 |
| 6 | `getSession()` | `frontend/src/utils/auth.js` | method | 11 |
| 7 | `LoginPage.jsx` | `frontend/src/pages/LoginPage.jsx` | class | 9 |
| 8 | `RegisterPage.jsx` | `frontend/src/pages/RegisterPage.jsx` | class | 9 |

---

## 2. Dependency & Connection Analysis

### Relationship Types

| Relationship | Count | Share |
|-------------|-------|-------|
| `contains` | 50 | 39% |
| `imports` | 43 | 34% |
| `imports_from` | 21 | 16% |
| `calls` | 12 | 9% |
| `references` | 2 | 2% |

### Hub Dependency Diagram

```mermaid
flowchart TD
    frontend_src_app["App.jsx"]
    frontend_src_tests_identity_test["identity.test.jsx"]
    frontend_src_utils_auth["auth.js"]
    frontend_src_utils_storage["storage.js"]
    frontend_package_devdependencies["devDependencies"]
    frontend_src_utils_auth_getsession["getSession()"]
    frontend_src_pages_loginpage["LoginPage.jsx"]
    frontend_src_pages_registerpage["RegisterPage.jsx"]
    frontend_src_app <--> frontend_src_pages_loginpage
    frontend_src_app <--> frontend_src_pages_registerpage
    frontend_src_app <--> frontend_src_utils_auth
    frontend_src_app <--> frontend_src_utils_auth_getsession
    frontend_src_app <--> frontend_src_utils_storage
    frontend_src_tests_identity_test <--> frontend_src_pages_loginpage
    frontend_src_tests_identity_test <--> frontend_src_pages_registerpage
    frontend_src_tests_identity_test <--> frontend_src_utils_auth
    frontend_src_tests_identity_test <--> frontend_src_utils_auth_getsession
    frontend_src_tests_identity_test <--> frontend_src_utils_storage
    frontend_src_pages_loginpage <--> frontend_src_utils_auth
    frontend_src_pages_loginpage <--> frontend_src_utils_auth_getsession
    frontend_src_pages_loginpage <--> frontend_src_utils_storage
    frontend_src_pages_registerpage <--> frontend_src_utils_auth
    frontend_src_pages_registerpage <--> frontend_src_utils_auth_getsession
    frontend_src_pages_registerpage <--> frontend_src_utils_storage
    frontend_src_utils_auth <--> frontend_src_utils_auth_getsession
```

### Most Connected Pairs

| Component A | Component B | Shared Connections |
|-------------|-------------|-------------------|
| `captureBrowserErrors()` | `identity.spec.js` | 1 |
| `dependencies` | `package.json` | 1 |
| `devDependencies` | `package.json` | 1 |
| `name` | `package.json` | 1 |
| `package.json` | `private` | 1 |
| `package.json` | `scripts` | 1 |
| `package.json` | `type` | 1 |
| `package.json` | `version` | 1 |
| `build` | `scripts` | 1 |
| `dev` | `scripts` | 1 |

---

## 3. Subsystem & Module Breakdown

### 3.1 frontend/package.json
**Nodes**: `85`  
**Files**: `.engine/memory/progress_summary.md`, `.engine/workers/4a6d35d5d3ae/scratch/findings.md`, `frontend/e2e/identity.spec.js`, `frontend/index.html`, `frontend/package.json`, `frontend/postcss.config.js` +14 more

| Component | Type | File | Connections |
|-----------|------|------|-------------|
| `App.jsx` | class | `frontend/src/App.jsx` | 17 |
| `identity.test.jsx` | function | `frontend/src/__tests__/identity.test.jsx` | 14 |
| `auth.js` | file | `frontend/src/utils/auth.js` | 12 |
| `storage.js` | file | `frontend/src/utils/storage.js` | 12 |
| `devDependencies` | function | `frontend/package.json` | 11 |
| `getSession()` | method | `frontend/src/utils/auth.js` | 11 |
| `LoginPage.jsx` | class | `frontend/src/pages/LoginPage.jsx` | 9 |
| `RegisterPage.jsx` | class | `frontend/src/pages/RegisterPage.jsx` | 9 |
| `package.json` | function | `frontend/package.json` | 7 |
| `dependencies` | function | `frontend/package.json` | 6 |


---

## 4. API Reference

Public classes and functions by subsystem.

### frontend/package.json

| Name | Type | File | Connections |
|------|------|------|-------------|
| `App.jsx` | class | `frontend/src/App.jsx` | 17 |
| `identity.test.jsx` | function | `frontend/src/__tests__/identity.test.jsx` | 14 |
| `devDependencies` | function | `frontend/package.json` | 11 |
| `LoginPage.jsx` | class | `frontend/src/pages/LoginPage.jsx` | 9 |
| `RegisterPage.jsx` | class | `frontend/src/pages/RegisterPage.jsx` | 9 |
| `package.json` | function | `frontend/package.json` | 7 |
| `dependencies` | function | `frontend/package.json` | 6 |
| `Navbar.jsx` | class | `frontend/src/components/Navbar.jsx` | 6 |

---

## 5. Code Quality & Architectural Risk Hotspots

### Component Type Distribution

| Type | Count | Share |
|------|-------|-------|
| function | 45 | 53% |
| class | 21 | 25% |
| method | 13 | 15% |
| file | 6 | 7% |

### High-Connectivity Hotspots

**1** component(s) with >15 connections:

| Component | File | Connections |
|-----------|------|-------------|
| `App.jsx` | `frontend/src/App.jsx` | 17 |

### Dependency Cycles

**51** circular dependency loop(s) detected:

| # | Cycle Path |
|---|-----------|
| 1 | `frontend_src_utils_storage → frontend_src_utils_storage_writearray → frontend_src_utils_storage_saveusers` |
| 2 | `frontend_src_utils_storage → frontend_src_utils_storage_saveposts → frontend_src_utils_storage_writearray` |
| 3 | `frontend_src_pages_registerpage → frontend_src_utils_storage → frontend_src_utils_storage_saveusers` |
| 4 | `frontend_src_tests_identity_test → frontend_src_utils_storage → frontend_src_utils_storage_saveusers` |
| 5 | `frontend_src_utils_storage_getposts → frontend_src_utils_storage_readarray → frontend_src_utils_storage` |
| 6 | `frontend_src_utils_storage_getusers → frontend_src_utils_storage_readarray → frontend_src_utils_storage` |
| 7 | `frontend_src_pages_loginpage → frontend_src_utils_storage_getusers → frontend_src_utils_storage` |
| 8 | `frontend_src_pages_registerpage → frontend_src_utils_storage_getusers → frontend_src_utils_storage` |
| 9 | `frontend_src_tests_identity_test → frontend_src_utils_storage_getusers → frontend_src_utils_storage` |
| 10 | `frontend_src_app → frontend_src_utils_storage_getposts → frontend_src_utils_storage` |

### Orphaned Components

**4** isolated node(s) with no connections:

| Component | File |
|-----------|------|
| `postcss.config.js` | `frontend/postcss.config.js` |
| `tailwind.config.js` | `frontend/tailwind.config.js` |
| `vite.config.js` | `frontend/vite.config.js` |
| `WriteSpace Browser Entry Document` | `frontend/index.html` |

---

## 6. How to Navigate

1. **Interactive D3 Map** — open `graph.html` to explore node connections visually.
2. **Knowledge Graph Queries** — use MCP tools (`graph_query`, `graph_explain_node`, `graph_impact_radius`).
