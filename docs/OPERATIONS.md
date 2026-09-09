# FoodBite Operations

## Runtime configuration

`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`, and `NEXT_PUBLIC_APP_URL` are required in production. Payment credentials are required only when `PAYMENT_PROVIDER` is configured. AI remains optional; `OPENAI_API_KEY` is required only when `OPENAI_AI_ENABLED=true`. `SLOW_REQUEST_MS` controls the documented slow-request threshold and defaults to 1000 ms. All credentials are server-only. `NEXT_PUBLIC_APP_URL` is the only listed application URL intended for browser exposure.

Run `pnpm config:check` in the target environment to validate configuration shape without printing values. Development and test modes allow optional integrations to remain disabled. Production configuration errors are reported by key name only.

## Health and readiness

`GET /api/health` is liveness. It performs no database or provider request and returns `{ "ok": true }` when the application process responds. `GET /api/ready` is readiness. It validates runtime configuration and runs a short `SELECT 1` through the existing Prisma singleton. It returns HTTP 503 with a safe dependency label when configuration or the database is unavailable. AI, email, maps, and payment providers are not readiness dependencies unless a critical transaction explicitly requires them.

Every request receives an `x-request-id` response header. A safe incoming identifier is preserved; otherwise the middleware generates a random identifier. Request identifiers are correlation aids, not authentication tokens.

## Structured logs and privacy

Server diagnostics use `apps/web/lib/logger.ts`. Entries are JSON with timestamp, level, event, environment, component, and event-specific safe fields. The centralized redactor removes values under keys containing password, token, secret, authorization, cookie, API key, pickup code, QR token, signature, credential, prompt, response, address, phone, or email. Raw request bodies, notification bodies, AI prompts and responses, payment signatures, credentials, and pickup secrets are not logged.

The repository does not configure an external error-tracking vendor. The structured logger provides actionable server diagnostics locally and on the deployment platform. A provider such as Sentry may be connected later through an environment-only integration without making startup dependent on it. Hosting-provider log retention and alert routing are deployment responsibilities; logs should be retained only as long as needed for support and incident response under the provider's configured retention policy.

## Workers and cron security

`POST /api/internal/notifications/process` requires the server-only `x-cron-secret` value and processes at most 25 notifications per invocation. Notification records are claimed transactionally, retry at bounded intervals, and stop after three attempts. The response and structured event report processed, sent, and failed counts without returning notification bodies or recipient data.

`GET|POST /api/internal/reservations/expire` requires `Authorization: Bearer <CRON_SECRET>`. Reservation expiration uses an active-state conditional update, returns the number released, and is safe under repeated or concurrent invocation. The GitHub Actions workflow `.github/workflows/foodbite-workers.yml` invokes this endpoint every five minutes using the repository/environment secret `CRON_SECRET`.

`POST /api/internal/notifications/process` is invoked by the same workflow with `x-cron-secret: <CRON_SECRET>`. The two authentication headers intentionally remain different because the worker API contracts predate the scheduler migration.

## GitHub Actions worker scheduler

Vercel Cron is not configured. The GitHub Actions workflow is a trigger only; database timestamps and the existing idempotent worker transitions remain authoritative. The intended schedule is every five minutes, but GitHub Actions may delay scheduled runs. Workflow concurrency uses the `foodbite-workers` group with `cancel-in-progress: false`, so an in-flight run is allowed to finish rather than being cancelled. The worker requests have bounded connect and total timeouts and the workflow fails for any non-2xx response, including authentication, rate-limit, server, or network failures.

Configure the following GitHub repository or environment settings without committing their values:

| Setting | Type | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | Actions secret | Must be the same value configured in the FoodBite/Vercel deployment. It is sent only in the existing worker authentication headers. |
| `FOODBITE_APP_URL` | Actions variable | Base HTTPS URL of the staging or production deployment, without a required trailing slash. |

Use **workflow dispatch** for a manual invocation after verifying that the target URL and secret belong to the intended environment. Do not put secrets in URLs, workflow output, source code, or documentation. The workflow intentionally discards worker response bodies and logs only endpoint paths and HTTP status codes. GitHub Actions scheduling is not hard real-time: a delayed or missed run must be safe because expiration and notification retry decisions remain database-authoritative.

The payment webhook is `POST /api/payments/webhook`. It verifies the HMAC signature before parsing, validates the bounded payload, records a unique provider event, and ignores already processed events. Payment transitions continue to use the existing transactional domain functions. Failures return a safe request identifier and leave the webhook record retryable; secrets, signatures, and raw payloads are never logged.

## AI and analytics observability

The Phase 10 AI provider logs operation name, model, duration, outcome, bounded failure category, and fallback behavior only. AI remains optional and its failure does not affect readiness or marketplace operation. The Phase 11 seller and admin analytics endpoints log scope, bounded range label, duration, authorization outcome, and success/failure category. Analytics remain read-only and no private payload is logged.

## Security and graceful degradation

Middleware applies request correlation and baseline `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and restrictive `Permissions-Policy` headers. No wildcard authenticated CORS policy is configured. Internal endpoints require secret-based authentication. Existing role, permission, ownership, rate-limit, webhook HMAC, and idempotency boundaries remain in force.

AI, email, maps, and analytics are optional dependencies. AI falls back to deterministic behavior, email failures remain bounded and retryable, and analytics failures do not alter commerce. Payment-provider failures are surfaced safely and do not mark payments successful or corrupt inventory. Orders and reservations retain their existing transaction boundaries.

## Deployment and migrations

The production build is deterministic and the CI quality job runs install, Prisma validation and generation, lint, typecheck, tests, and build. Database migrations are forward-only and should be reviewed and applied with `pnpm db:migrate:deploy` during a controlled deployment step. Deployments must not run destructive migrations automatically. The application does not configure database backups from this repository.

Backup retention, point-in-time recovery, restore testing, and recovery credentials depend on the managed PostgreSQL provider selected for deployment and must be enabled and documented by the infrastructure owner. This repository makes no claim that backups are active. Before launch, configure provider-level backups, retention, alert routing, and a tested restore procedure.

## Incident response

| Failure | Detection | Recovery | Manual action |
| --- | --- | --- | --- |
| Database unavailable | `/api/ready` returns 503; application error logs | Restore database connectivity or provider service | Infrastructure owner investigates provider and connections |
| Bad deployment | CI/build failure or elevated 5xx logs | Roll back to last known-good deployment | Deployment owner performs rollback |
| Payment webhook outage | `payment_webhook_failed` or missing processed events | Restore provider endpoint/signature configuration and replay provider events | Payment operator verifies idempotency before replay |
| Notification outage | Worker failures and records at retry limits | Restore email provider configuration; retry eligible records | Support may communicate in-app status |
| AI provider outage | `ai_request` fallback events | Keep AI disabled/fallback; restore provider later | No commerce action required |
| Analytics failure | Analytics endpoint error logs | Continue transactions; investigate query/dependency | Admin may retry later |

Recommended provider-level alerts are readiness failures, sustained 5xx spikes, payment webhook failures, notification records reaching maximum attempts, database unavailability, and AI provider errors only when AI is enabled. These alerts are recommendations, not claims that external alerting is currently active.
