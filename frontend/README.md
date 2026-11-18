# NeatWave frontend

React, TypeScript, Vite, Tailwind CSS, and TanStack Query client for NeatWave.

## Local setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Start the backend API and worker.
4. Run `npm run dev`.

Set `VITE_SOCKET_URL` to the Socket.IO server origin (for local development,
`http://localhost:4000`). The REST client continues to use
`VITE_API_BASE_URL`. Realtime updates reconcile TanStack Query caches; REST
remains available when the socket is reconnecting or offline.

The default API prefix is `/api/v1`. Configure `VITE_API_BASE_URL` when the API is hosted on another origin.

## Verification

- `npm run build` — type-check and production build.
- `npm test` — Vitest component and hook tests.
- `npm run test:e2e` — Playwright smoke tests.
- `npm run check` — formatting, tests, and build.

Server state belongs in feature-local TanStack Query hooks. React state is reserved for transient interface state such as filters, forms, tabs, and dialogs.
