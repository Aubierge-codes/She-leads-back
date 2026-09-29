# Eco Girls Collective: Backend API

NestJS 11 + Prisma 7 + PostgreSQL. Serves the public website's data and the staff dashboard, with login (JWT), roles (ADMIN / MANAGER) and soft deletes.

The frontend lives in a separate repository (`She-leads-front`).

## Quick start

```bash
cp .env.example .env         # set DATABASE_URL, JWT_SECRET, ...
npm install
npx prisma migrate deploy    # create tables
npm run seed                 # create the first admin
npm run start:dev            # http://localhost:4000  (API docs: /api)
```

## Everything else

**See [`docs/OPERATIONS_GUIDE.md`](docs/OPERATIONS_GUIDE.md)** (also available as a PDF next to it): go-live checklist, environment variables, deployment, security model, staff guide, API reference, database and backups, troubleshooting, and known limitations.

Also see [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) for what each folder contains.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run start:dev` | Run with auto-reload |
| `npm run build` | Generate the database client and compile to `dist/` |
| `npm run start:prod` | Run the compiled build |
| `npm run seed` | Create the first admin / reset its password (see the guide) |
| `npx prisma migrate deploy` | Apply database migrations (production-safe) |
| `node scripts/smoke-test.mjs` | 64-check security and behaviour test of a running API |
