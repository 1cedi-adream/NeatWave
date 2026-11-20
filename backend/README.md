# NeatWave backend

Multi-tenant laundry operations API built with Express, TypeScript, Drizzle ORM, Neon PostgreSQL, and Zod.

## Local setup

1. Copy `.env.example` to `.env` and fill in the database and authentication secrets.
2. Run `npm install`.
3. Run `npm run db:migrate`.
4. Set the `SUPERADMIN_*` variables and run `npm run seed:superadmin` once.
5. Run `npm run dev` for the API and `npm run dev:worker` for notification delivery.

Realtime updates use the same API process as the REST server. Set
`SOCKET_ALLOWED_ORIGINS` to the comma-separated frontend origins that may open
Socket.IO connections. `GET /health/realtime` reports publisher readiness and
the pending outbox count. Run `npm run db:migrate` after updating the backend;
realtime events are retained for seven days so clients can catch up after a
short disconnection. The first deployment uses a single API instance; configure
a Socket.IO Redis adapter and load-balancer affinity before running multiple API
instances.

All authenticated routes use `Authorization: Bearer <access-token>`. API routes are mounted under `/api/v1`; `GET /health` is public.
The frontend-facing route inventory is documented in `openapi.yaml`.

## Main workflows

- A platform superadmin provisions a laundromat with `POST /api/v1/admin/tenants`.
- The returned development invitation token is accepted at `POST /api/v1/auth/accept-invite`.
- Managers configure settings and services, invite staff, and inspect delivery failures.
- Staff manage customers, orders, payments, refunds, and order statuses.
- Customers receive opaque links served by `GET /api/v1/public/tracking/:token`.
- The worker delivers persisted status messages through mNotify and Nodemailer with retries.

Production responses never return invitation or reset tokens. Invitations are queued for the worker and password resets are delivered through the configured SMTP provider.

## Customer order status notifications

Order status SMS and email are queued only when the status is enabled in the laundry settings, the matching channel is enabled, and the customer has consented and provided a valid contact. The API commits these jobs with the status change; delivery happens asynchronously, so run the API and `npm run dev:worker` as separate processes.

For SMS, set `MNOTIFY_API_KEY` and an approved `MNOTIFY_SENDER_ID` of at most 11 characters. For email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. The worker starts when at least one provider is configured; a failure in one provider is recorded on that job without stopping delivery through the other provider.

### Render deployment

Deploy the API and notification worker as **separate services** from the same repository. The API web service starts with `npm start`. Create a Render **Background Worker** with root directory `backend`, build command `npm ci && npm run build`, and start command `npm run start:worker`. Give the worker the same `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` as the API, plus `MNOTIFY_API_KEY` and `MNOTIFY_SENDER_ID` for SMS. Add the SMTP variables if sending email. Set `NODE_ENV=production`. A web service running `npm start` does not launch the worker.

After deployment, look for `Notification worker started` in the worker service logs. If no SMS job appears in Message Deliveries, check the laundry's SMS setting and the customer's SMS consent and phone number. If a job stays pending, check that the worker is running and shares the API database. If it fails, inspect its attempts and worker logs for the mNotify error. A job marked sent means mNotify accepted it; carrier delivery is separate.

To verify delivery locally:

1. Start the API and notification worker in separate terminals.
2. In the laundry Settings page, enable SMS/email and select the order statuses that should notify customers.
3. Confirm the customer has a phone number, email address, and consent for each channel to be tested.
4. Change the order status and inspect worker logs for queued, provider accepted, retry, or permanent failure events.
5. Managers can inspect `/api/v1/notifications/deliveries/jobs` and `/api/v1/notifications/deliveries/:id/attempts`; failed jobs can be retried through the existing retry endpoint.

Provider acceptance is recorded as sent. This does not confirm final carrier delivery. Never paste provider credentials into logs or support messages.
