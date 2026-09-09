# FoodBite Deployment

FoodBite is a Next.js App Router application backed by PostgreSQL and Prisma. A deployment must provide Node.js, the environment variables in `.env.example`, a managed PostgreSQL database, Prisma migration execution, and observability appropriate to the selected platform.

## Worker scheduling

Vercel Cron is intentionally not configured because the target deployment uses Vercel Hobby. The protected worker endpoints remain part of the application:

- `GET|POST /api/internal/reservations/expire` with `Authorization: Bearer <CRON_SECRET>`
- `POST /api/internal/notifications/process` with `x-cron-secret: <CRON_SECRET>`

`.github/workflows/foodbite-workers.yml` invokes both endpoints on an intended five-minute schedule and supports `workflow_dispatch`. GitHub Actions schedules may start late or be temporarily unavailable; the application remains correct because expiration timestamps, notification retry state, transactions, and idempotency are database-authoritative.

## GitHub configuration

Configure these values for each GitHub repository or environment:

| Name | Location | Requirement |
| --- | --- | --- |
| `CRON_SECRET` | GitHub Actions secret | Use exactly the same value as the deployed FoodBite environment. Never print or place it in a URL. |
| `FOODBITE_APP_URL` | GitHub Actions variable | Use the staging deployment URL for staging and the production domain for production. Do not commit the value. |

Keep `CRON_SECRET` configured in the FoodBite/Vercel deployment; removing it would make both workers reject GitHub Actions requests. The workflow discards response bodies, uses bounded HTTP timeouts, fails on any non-2xx response, and serializes overlapping runs with a GitHub Actions concurrency group.

## Deployment sequence

1. Configure the deployment environment, including `CRON_SECRET`, database credentials, `NEXT_PUBLIC_APP_URL`, and provider integrations.
2. Configure the matching GitHub Actions `CRON_SECRET` secret and environment-specific `FOODBITE_APP_URL` variable.
3. Deploy the application and apply reviewed migrations with `pnpm db:migrate:deploy`.
4. Verify `/api/health` and `/api/ready`.
5. Use workflow dispatch against staging to verify both worker contracts, then monitor scheduled runs and application worker logs.
6. Promote the same configuration pattern to production and retain a rollback deployment.

Backups, retention, point-in-time recovery, restore testing, and alert routing remain responsibilities of the managed PostgreSQL and deployment providers. GitHub Actions is a scheduler trigger, not a hard real-time guarantee or a replacement for application idempotency.
