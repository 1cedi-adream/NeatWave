# Laundry Management Frontend

React, TypeScript, Vite, and Tailwind CSS frontend for the laundry management system. The app uses local sample data while the backend is unavailable. Orders and edits stay in browser memory and reset on refresh.

## Run locally

```sh
npm install
npm run dev
```

## Source map

- `src/app/` — router, shared application layout, and providers.
- `src/components/` — shared navigation and UI components.
- `src/features/` — feature-owned pages, components, types, and order logic.
- `src/features/*/pages/` — individual Overview, Orders, Customers, Services, Staff, Notifications, and Settings screens.
- `src/hooks/` — application-wide hooks.
- `src/lib/` — shared formatting and utility functions.
- `src/services/` — API client configuration for the future backend.
- `src/store/` — global session state.
- `src/types/` and `src/constants/` — shared application types and constants.
- `src/styles/` — global styles.

`frontend/.env` enables mock-data mode and sets the future API base URL. The app does not call that API while mock mode is enabled.
