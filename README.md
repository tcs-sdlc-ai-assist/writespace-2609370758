# WriteSpace

WriteSpace is a static, browser-local writing demo built with React and Vite. It has no backend: accounts, sessions, and plain-text posts are stored only in the current browser's localStorage.

## Important limitations

This is a local-only demo, not a secure publishing system. Demo credentials and locally stored data are plain text and are not appropriate for sensitive data, personal secrets, or production authentication.

The built-in demonstration administrator account is `admin` / `admin`.

## Installation

```text
cd frontend
npm install
```

## Run locally

```text
cd frontend
node node_modules/vite/bin/vite.js
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Build

```text
cd frontend
node node_modules/vite/bin/vite.js build
```

The deployable static files are written to `frontend/dist`.

## Test

Run all Vitest unit/component suites:

```text
cd frontend
node node_modules/vitest/vitest.mjs run
```

Run the release preflight E2E suite after installing the Playwright browser:

```text
cd frontend
node node_modules/@playwright/test/cli.js install chromium
node node_modules/@playwright/test/cli.js test --config playwright.config.js e2e/preflight.spec.js
```

## Routes

- `/` — public landing page with the latest local post previews.
- `/login` and `/register` — browser-local sign-in and registration.
- `/blogs` — authenticated post list.
- `/blog/:id` — authenticated post reader.
- `/write` and `/edit/:id` — authenticated plain-text post editor.
- `/admin` and `/users` — administrator-only local dashboard and user management.

## Local data

All data remains in the browser profile that created it:

- `writespace_session` — current local session object.
- `writespace_posts` — plain-text posts.
- `writespace_users` — locally registered accounts, including plain-text demo passwords.

Clearing site data or using another browser/profile removes access to this data; there is no synchronization or recovery service.

## Static deployment

Vercel is configured from the repository root using `vercel.json`, which builds `frontend` and serves `frontend/dist` with an SPA rewrite for direct routes.

For a containerized static server, build from the frontend directory:

```text
cd frontend
docker build -t writespace .
docker run --rm -p 8080:80 writespace
```

The nginx container serves only static files on port 80, provides SPA fallback for client routes, and exposes `/healthz`.

## License

Private and proprietary. All rights reserved.
