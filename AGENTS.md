# AGENTS.md

Backend-only REST API for a healthcare/appointment platform (Express 5 + TypeScript + Prisma 7 + PostgreSQL). ESM (`"type": "module"`), run through `tsx` — no bundler.

The root `README.md` is **stale**: it describes an auth-only starter. Auth, doctor onboarding/approval, appointments, payments (bKash), cron, Cloudinary uploads, Redis OTPs, and Google login all exist now. Trust `src/` and `prisma/schema/` over the README.

## Commands

```bash
npm run dev            # tsx watch src/server.ts — the normal dev loop
npm run lint:check     # biome lint ./src
npm run lint:fix       # biome lint --write ./src
npm run format:fix     # biome format --write ./src
npm run build          # tsc typecheck only — output is NOT runnable (see below)
npm start              # node dist/src/server.js — broken, don't use
```

- There is **no test suite**. `npm test` exits 1; don't treat it as a signal.
- Prisma has no npm wrappers — call the CLI directly: `npx prisma generate`, `npx prisma migrate dev`, `npx prisma studio`.
- `npm run build` catches type errors but emits extensionless relative imports that Node's ESM loader rejects (`ERR_UNSUPPORTED_DIR_IMPORT`). `npm start` as written will fail; use `npm run dev`. `tsx` is what actually runs the TS source.
- Formatting: Biome, **tabs**, double quotes. `src/generated` and `src/app/templates` are excluded from lint/format.

## Setup that is easy to get wrong

- `src/generated/prisma` is **git-ignored**. A fresh clone has no Prisma client and *nothing compiles* until you run `npx prisma generate`. Re-run after editing anything under `prisma/schema/`.
- Prisma schema is split across `prisma/schema/*.prisma` (user, patient, doctor, appointment, payment, enums; `schema.prisma` holds only generator + datasource), wired via `prisma.config.ts` at the root. `prisma.config.ts` loads `.env` itself.
- The client is registered with the **Postgres driver adapter** (`@prisma/adapter-pg`); the datasource block has no `url`. Always import the shared instance from `src/app/lib/prisma.ts` — never construct your own.
- Server startup (`src/server.ts`) **requires live Postgres, Redis, and a working SMTP account** before it listens: it connects Prisma, connects Redis, `transporter.verify()`, seeds super-admin/tester-admin/tester-doctor, registers the doctor-cleanup cron, then listens. If Redis or SMTP creds are missing, boot fails — this is expected, not a code bug.
- Environment is read **only** in `src/app/config/index.ts` (via `dotenv`). Import `config` there; never touch `process.env` elsewhere. No startup validation — missing vars are `undefined` and fail later at runtime.

## Architecture

- **Entrypoints:** `src/server.ts` (boot + seed + cron) → `src/app.ts` (Express app: cors, json, cookie-parser, route mounting, error handler, notFound).
- **Feature modules:** `src/app/module/<name>/` with `*.route.ts` / `*.controller.ts` / `*.service.ts` / `*.interface.ts` (+ `*.validation.ts`). New modules are mounted in `src/app.ts` under `/api/v1/<name>`.
- **Boundaries:** controllers never call Prisma; services never touch `req`/`res`. Services receive the small `RequestUser` shape (`{ userId, email, name, role }`), not the request. Never spread `req.body` into a Prisma `create`/`update` — destructure exact fields.
- **Shared libs:** `src/app/lib/` — `prisma`, `redis`, `cloudinary`, `nodeMailer`, `bkash` (token caching in Redis), `multer` (memory storage), `cron`, `googleAuth`.
- **Utils:** `sendResponse` (the `{ success, statusCode, message, data, meta }` envelope), `catchAsync` (wraps async handlers so throws reach the error handler), `AppError` (carries a status code), `jwt`.
- **Auth guard:** `auth(...roles)` in `src/app/middleware/checkAuth.ts`. Reads token from the `accessToken` cookie, else `Authorization` header (`Bearer <t>` or raw). Verifies JWT, then looks the user up by **id + email + name + role together** — any change to those four invalidates existing tokens, so re-login after a role change.
- **Validation:** `validateRequest(zodSchema)` parses `req.body` with a Zod object, throws the first issue message, and replaces `req.body` with parsed data.

## Domain flows worth knowing

- **Patient registration is two-step:** `POST /api/v1/auth/register` stores hashed password + data in Redis and emails an OTP (5 min TTL); the user row is only created on `POST /api/v1/auth/verify-email`. Same pattern for doctor applications (`/api/v1/doctor/apply-as-doctor` → `/apply-as-doctor/verify-email`, OTP TTL 1 hour).
- **Doctor apply** accepts multipart `resume` (1) + `additionalFiles` (up to 10) via multer memory storage, uploaded to Cloudinary; password is randomly generated and `needPasswordChange` is set.
- **Admin approval** (`/api/v1/doctor/approve-doctor`, ADMIN/SUPER_ADMIN) requires email verified and status PENDING; rejection requires a reason; sends an approved/rejected email.
- **Payments use bKash** (`src/app/lib/bkash.ts` + `appointment.service.ts`): token cached in Redis, callback is `GET /api/v1/appointment/book-appointment/payment/callback`.
- **Cron** (`deleteUnverifiedDoctors`, every 10 min) hard-deletes `DOCTOR` users with unverified email + PENDING status older than 1 hour.
- **Role enum** is `SUPER_ADMIN | ADMIN | DOCTOR | PATIENT`. Test admins/doctors are seeded at boot from `*_ADMIN_*` / `*_DOCTOR_*` env vars.
- **Tokens** are returned in the JSON body *and* set as cookies with `sameSite: "none", secure: false` — that combo is spec-invalid, so browsers drop the cookie. Prefer the body's `accessToken` when testing.

## Gotchas

- `seedTesterDoctor` (in `src/app/utils/seed.ts`) hashes `config.tester_admin_password`, not `tester_doctor_password` — likely a bug. Don't "fix" it silently; confirm with the user first.
- Error handling: `globalErrorHandler` maps Prisma errors (P2002/P2003/P2025, P1000/P1001) and `AppError` to real status codes and only leaks details/stack when `NODE_ENV=development`. Errors thrown as plain `Error` still surface their message in dev.
- `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` must be set or `jsonwebtoken` throws on the first login/register.
- EJS email templates live in `src/app/templates/` and are loaded by absolute path from `process.cwd()` — the server must run with the repo root as cwd.
