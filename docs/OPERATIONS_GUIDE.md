# Eco Girls Collective: Operations Guide

How the system fits together, how to put it live, how staff use it, and how to fix it when something breaks.

**Contents**

1. [What this system is](#1-what-this-system-is)
2. [Before you go live: checklist](#2-before-you-go-live-checklist)
3. [Setup and configuration](#3-setup-and-configuration)
4. [Deploying to production](#4-deploying-to-production)
5. [Security model](#5-security-model)
6. [Staff guide: using the dashboard](#6-staff-guide-using-the-dashboard)
7. [The public website](#7-the-public-website)
8. [API reference](#8-api-reference)
9. [Database](#9-database)
10. [Testing and verification](#10-testing-and-verification)
11. [Troubleshooting](#11-troubleshooting)
12. [Known limitations and next steps](#12-known-limitations-and-next-steps)

---

## 1. What this system is

Two applications that work together, each in its own Git repository:

| Part | Folder | Repository | Technology | Default port |
|---|---|---|---|---|
| **Frontend** (public website + staff dashboard) | `frontend/` | `Aubierge-codes/She-leads-front` | Next.js 16, React 19, Tailwind 4 | 3000 |
| **Backend** (API + database access) | `backend/` | `Aubierge-codes/She-leads-back` | NestJS 11, Prisma 7, PostgreSQL | 4000 |

```
  Visitors --> Public website (Next.js) --+
                                           |
                                           +--> API (NestJS) --> PostgreSQL
                                           |
  Staff ----> Login + Dashboard (Next.js) -+

  Staff sign in with email and password. The API returns a login
  token (JWT) which the dashboard sends with every request.
```

**Two audiences, one site:**

* **The public** sees the landing page (`/`) and donation page (`/donate`). They can subscribe to the newsletter, send a partnership inquiry, and pledge a donation. They never log in.
* **Staff** sign in at `/login` and use the dashboard (`/dashboard`) to manage participants, schools, communities, cleanup events, waste records, inventory, clubs, weekly reports, donations, partnership inquiries and newsletter subscribers.

The frontend never talks to the database. Everything goes through the backend API.

---

## 2. Before you go live: checklist

Work through this top to bottom. Items marked **BLOCKER** should not be skipped.

### Security

* [ ] **BLOCKER: Change the admin password.** The first admin account was created with a default password (`ChangeMe123!`) that is visible in the public Git history. Sign in, open **Settings → Change password**.
* [ ] **BLOCKER: Remove the leftover admin `admin@sheleads.org`.** The original version of the seed script created this account; a later rebrand switched to `admin@ecogirlscollective.org` without removing it, so a database that ran both seeds has **two admins, both with the default password**. Sign in as the Eco Girls admin, open **Settings → Team members** and click **Remove** next to `admin@sheleads.org` (unless it genuinely belongs to someone on your team, in which case have them change their password). *This was confirmed on the development database; check your production database the same way.*
* [ ] **BLOCKER: Set a strong `JWT_SECRET`.** The backend refuses to start in production with a missing, placeholder, or short (< 32 character) secret. Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
* [ ] Set `NODE_ENV=production` on the backend. Without it the safety checks are skipped.
* [ ] Set `FRONTEND_URL` to the real public website address so only that site can call the API from a browser.
* [ ] Serve both apps over **HTTPS** (most hosts do this automatically). Login tokens travel in request headers and must not be sent over plain HTTP.
* [ ] If the API sits behind a hosting platform's proxy, set `TRUST_PROXY=1` so the login rate limit works per person.
* [ ] Consider a shorter `JWT_EXPIRES_IN` (for example `12h`) so a lost laptop stays signed in for less time.

### Data and operations

* [ ] Run `npx prisma migrate deploy` against the production database (see [Deploying](#4-deploying-to-production)).
* [ ] Turn on **automatic database backups** at your database provider, and test a restore once (see [Database](#9-database)).
* [ ] Set `NEXT_PUBLIC_API_URL` on the frontend to the production API address **before building** it.
* [ ] Run the smoke test against a staging copy ([Testing](#10-testing-and-verification)).

### Content (a person must do this)

The public website still shows placeholder text in these places. It is real-people content that only the organization can supply. See [Section 7](#7-the-public-website) for exactly where to edit.

* [ ] **BLOCKER (content):** Three Stories cards show `[Add a real quote from …]` and `[Add school/community]`.
* [ ] **BLOCKER (content):** Nine "Girls in Action" entries show `[Add a real story about this activity]`.
* [ ] Replace stand-in illustrations with real photos when available (Programs and Girls in Action). Two program cards (Community Cleanups, Waste Management) still show a dashed "Placeholder" box.

---

## 3. Setup and configuration

### Requirements

* Node.js 22 (developed on 22.20) and npm
* PostgreSQL 16
* Git

### Backend environment variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and fill it in. On a hosting platform, set the same names in its environment settings instead of committing a `.env` file (the file is git-ignored on purpose).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/dbname` |
| `PORT` | no (3000 if unset) | Port the API listens on. The frontend expects **4000** locally. |
| `NODE_ENV` | production: yes | `production` turns on the safety checks below. |
| `JWT_SECRET` | yes | Signs login tokens. 32+ random characters. **Changing it signs everyone out.** |
| `JWT_EXPIRES_IN` | no (`1d`) | How long a login lasts (`12h`, `1d`, `7d`…). |
| `FRONTEND_URL` | production: yes | Allowed website origin(s) for browsers, comma-separated, no trailing slash. |
| `LOGIN_RATE_LIMIT` | no (`10`) | Login attempts per minute per IP address. |
| `TRUST_PROXY` | behind a proxy: `1` | Use the real client IP from the proxy's `X-Forwarded-For`. |
| `ENABLE_SWAGGER` | no | `true` shows the API docs page at `/api` in production. Always on in development. |
| `SEED_ADMIN_EMAIL` | no | Email of the first admin (default `admin@ecogirlscollective.org`). |
| `SEED_ADMIN_PASSWORD` | production: yes, first time | Password for the first admin. Also the way to reset a forgotten admin password (see [Troubleshooting](#11-troubleshooting)). |

**Production safety checks built into the backend**

* Refuses to start if `JWT_SECRET` is missing, is the placeholder, or is under 32 characters.
* Logs a warning if `FRONTEND_URL` is not set (it then accepts requests from any website).
* The seed script refuses to create the first admin without `SEED_ADMIN_PASSWORD`.

### Frontend environment variable (`frontend/.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Public address of the backend API (default `http://localhost:4000`). **It is baked into the website at build time**, so change it *before* `npm run build`, and rebuild if it ever changes. |

### Run it locally

```bash
# 1. Backend
cd backend
cp .env.example .env            # then edit DATABASE_URL etc.
npm install
npx prisma migrate deploy       # creates the tables
npm run seed                    # creates the first admin (dev default password: ChangeMe123!)
npm run start:dev               # API on http://localhost:4000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                     # site on http://localhost:3000
```

Sign in at `http://localhost:3000/login` with the seeded admin.

---

## 4. Deploying to production

The exact clicks depend on your hosting provider; the steps do not.

### Backend

```bash
npm ci                          # install ALL dependencies (the build, migrate and seed steps need the dev tools)
npm run build                   # generates the database client and compiles to dist/
npx prisma migrate deploy       # applies database migrations (safe: only applies what is missing)
npm run seed                    # first deploy: creates the admin. Later deploys: leaves the password alone.
npm run start:prod              # node dist/src/main.js
```

Set the [environment variables](#backend-environment-variables-backendenv) first. `package.json` also has a `postdeploy` script (`npx prisma db seed`) for hosts that run one automatically.

**Order matters:** migrate **before** starting the new version, so the code never runs against an out-of-date database.

Use `migrate deploy` in production, never `migrate dev` (which is for development and can reset data).

### Frontend

```bash
npm ci
npm run build                   # NEXT_PUBLIC_API_URL must already be set
npm run start                   # serves on port 3000 (or your host's PORT)
```

Hosts that build Next.js natively (Vercel, Netlify, and similar) only need `NEXT_PUBLIC_API_URL` set in their environment settings.

### After deploying: verify

1. Open the API root URL: it should return `200` with a short greeting.
2. Open the website: the landing page should show real numbers (not dashes) under the headline.
3. Visit `/dashboard` while signed out: you must be redirected to `/login`.
4. Sign in, open **Settings**, change the admin password.
5. Optionally run the [smoke test](#10-testing-and-verification) against the live API using a staging account.

### Rolling back

Redeploy the previous version of the code. The migrations so far only add tables and columns, so an older backend keeps working with a newer schema. If a bad migration must be undone, restore the database from a backup (see [Database](#9-database)).

---

## 5. Security model

### What is public and what needs login

The backend blocks everything by default. Only the routes below are open to the internet.

| Open route | Why it is public |
|---|---|
| `GET /` | Health check |
| `GET /public/summary` | Landing page headline numbers (4 fields only: participants, schools, communities, kg of waste) |
| `GET /public/reach` | "Where we work" list (names and states only) |
| `GET /public/impact` | Landing page charts (waste by type, participants by status) |
| `POST /auth/login` | Sign in (rate-limited) |
| `POST /newsletter` | Newsletter signup form |
| `POST /partnerships` | "Become a Partner" form |
| `POST /donations` | Donation pledge form |

Everything else needs a valid login token, including all of the dashboard's data and the **lists** of newsletter subscribers, partnership inquiries and donors. Submitting a form is public; *reading* what people submitted is not.

The public pages deliberately use the trimmed `/public/*` routes rather than the full dashboard routes, so the public website can never expose staff-only fields.

### Roles

| Role | Can do |
|---|---|
| **ADMIN** | Everything a manager can, plus manage team members (Settings → Team members) |
| **MANAGER** | Use every dashboard page; cannot see or change who has access |

### How login works

1. Staff sign in with email and password. Passwords are stored only as bcrypt hashes and are never returned by any API.
2. The API returns a signed token (JWT) valid for `JWT_EXPIRES_IN`. The browser keeps it and sends it with every request.
3. On every request the backend re-checks that the user still exists and is active, so **removing a team member takes effect immediately**, even if they still hold an unexpired token.
4. **Logout** clears the token in that browser. The dashboard also signs the user out automatically if the API answers "401 unauthorized".

### Protections in place

| Protection | Detail |
|---|---|
| Brute-force limit | 10 login attempts per minute per IP (`LOGIN_RATE_LIMIT`); then `429 Too Many Requests`, even for a correct password, until the minute passes |
| Startup checks | Production will not boot with a weak `JWT_SECRET` |
| CORS allow-list | In production only `FRONTEND_URL` origins are accepted from browsers |
| API docs hidden | `/api` (Swagger) returns 404 in production |
| Input validation | Unknown or malformed fields are rejected with `400` |
| Secrets stay out of Git | `.env` files are ignored; `.env.example` documents each variable |
| No secrets in API output | Password hashes are stripped from user lists and report data |

### Things that are true, but worth knowing

* The token is stored in the browser's `localStorage`. This is common and simple, but it means a cross-site-scripting bug could steal it. The site does not render user-supplied HTML, which limits this risk.
* Changing your password does **not** sign out other browsers already holding a token; those expire on their own after `JWT_EXPIRES_IN`. Removing the user does cut them off immediately.

---

## 6. Staff guide: using the dashboard

### Signing in and out

Go to `/login`, enter your email and password. **Logout** is in the top-right of every dashboard page. Only people an administrator has added can sign in; there is no public sign-up.

### Changing your password

**Settings → Change password.** Enter your current password and a new one (8+ characters) twice.

### Adding or removing staff (administrators only)

**Settings → Team members.**

* **Add:** enter name, email, a temporary password (8+ characters) and a role, then **Add team member**. Tell the person their temporary password privately and ask them to change it after first sign-in.
* **Remove:** click **Remove** on their row. They can no longer sign in, and any active session stops working immediately. You cannot remove yourself.

### The dashboard pages

| Page | What it is for |
|---|---|
| **Dashboard** | Overview counts, waste by type, recent activity |
| **Participants** | The girls in the programme: add, edit, search, and track status (Active / Inactive / Graduated) |
| **Schools**, **Communities** | Partner schools and communities |
| **Events** | Cleanup events. Open an event's **Manage** panel to record who attended and to **enter the waste collected** (type, weight, bags). This is where waste figures come from. |
| **Waste Tracking** | Read-only overview of waste collected, by type, with the latest records (enter new waste from an Event) |
| **Inventory** | Supplies, stock levels, restock/usage transactions, low-stock warnings |
| **Env Clubs** | Environmental clubs per school |
| **Reports** | Weekly reports; approve or reject submitted ones |
| **Donations** | Pledges from the public donation page; update status (Pending → Completed…) |
| **Partnerships** | Inquiries from "Become a Partner"; open one to read it, then mark **New → Contacted → Closed** |
| **Newsletter** | Everyone who signed up; **Copy all emails** puts the list on your clipboard to paste into an email tool |

**Deleting records.** "Delete" hides a record everywhere (lists, counts, charts, the public website's numbers) but keeps it in the database, so nothing is lost by accident. Restoring is currently done through the API (`POST /<resource>/:id/restore`), not a button.

**Who did what.** Weekly reports and inventory transactions record the signed-in person who created them.

---

## 7. The public website

### Where its numbers come from

The landing page reads live data from the API through the open `/public/*` routes, so the numbers update as staff record data. If the API is unreachable the number areas show `—` instead of breaking.

### Forms

| Form | What happens |
|---|---|
| Footer **Subscribe** | Stores the email in the newsletter list (repeat signups are ignored). Staff see it under **Dashboard → Newsletter**. |
| **Become a Partner** | Stores the inquiry. Staff see it under **Dashboard → Partnerships**. |
| **Donate** | Records a **pledge** with status *Pending*. **No payment is taken** (see [limitations](#12-known-limitations-and-next-steps)). Staff follow up and mark it *Completed*. |

### Content that still needs real information

These are edited in code today. Change the text, save, rebuild and redeploy the frontend.

| What | Where |
|---|---|
| Three Stories: quote and school/community | `frontend/app/page.tsx` (search for `Add a real quote`). The portrait photos are already real. |
| Nine "Girls in Action" stories | `frontend/data/girls.ts`, the `description` of each entry (search for `Add a real story`). Add a real `name` too, if the person has consented to being named. |
| Program and story photos | Put images in `frontend/public/images/` and set `photoSrc` in `frontend/data/girls.ts`, or `illustrationSrc` for the programs in `frontend/app/page.tsx`. Entries without one show a placeholder box. |
| Hero numbers (`80+` girls, `3+` schools) and the headline strip | `frontend/app/page.tsx`. Some figures are typed in by hand rather than read live, so review them. |

> Please only publish quotes and names of participants (many are young people) with their, and a guardian's, consent.

### Files worth knowing in the frontend

| Path | Purpose |
|---|---|
| `app/page.tsx` | The landing page |
| `app/donate/page.tsx` | Donation flow |
| `app/login/page.tsx` | Staff sign-in |
| `app/dashboard/layout.tsx` | Sidebar, top bar, sign-in guard, Logout |
| `app/dashboard/*/page.tsx` | One file per dashboard page |
| `lib/api.ts` | Every API call and response type; attaches the login token |
| `lib/auth.ts`, `lib/use-session.ts` | Login token storage and the session hook |
| `components/` | Shared pieces (modal, cards, charts, illustrations) |
| `public/images/` | Logos, portraits, illustrations |

---

## 8. API reference

Base URL: the backend address (locally `http://localhost:4000`). Send `Authorization: Bearer <token>` on every route not marked **Public**. Errors return JSON like `{ "statusCode": 400, "message": "…" }`.

| Area | Routes | Access |
|---|---|---|
| Health | `GET /` | Public |
| Public site data | `GET /public/summary`, `/public/reach`, `/public/impact` | Public |
| Auth | `POST /auth/login` | Public |
| | `PATCH /auth/password` (`currentPassword`, `newPassword`) | Login |
| Users | `GET/POST /users`, `GET/PATCH/DELETE /users/:id`, `POST /users/:id/restore` | **Admin** |
| Dashboard | `GET /dashboard/summary`, `/dashboard/recent-activity` | Login |
| Participants | `GET/POST /participants`, `GET/PATCH/DELETE /participants/:id`, `POST …/:id/restore` | Login |
| Schools | same pattern at `/schools` | Login |
| Communities | same pattern at `/communities` | Login |
| Cleanup events | `/cleanup/events` (CRUD + restore), `POST …/:id/attendance`, `GET/POST …/:id/waste-records`, `GET /cleanup/events/recent-waste-records` | Login |
| Inventory | `/inventory` (CRUD + restore), `GET /inventory/low-stock`, `POST /inventory/:id/transactions` | Login |
| Clubs | same pattern at `/clubs` | Login |
| Reports | `/reports` (CRUD + restore), `PATCH /reports/:id/status` | Login |
| Donations | `POST /donations` | Public |
| | `GET /donations`, `/donations/stats`, `/donations/:id`, `PATCH /donations/:id/status` | Login |
| Newsletter | `POST /newsletter` | Public |
| | `GET /newsletter` | Login |
| Partnerships | `POST /partnerships` | Public |
| | `GET /partnerships`, `/partnerships/:id`, `PATCH /partnerships/:id/status` | Login |
| Analytics | `GET /analytics/waste-by-type`, `participants-by-status`, `cleanup-events-by-status`, `inventory-transactions-by-type`, `reports-by-status`, `donations-by-status` | Login |

In development, interactive API docs are at `/api` on the backend.

---

## 9. Database

PostgreSQL, managed with Prisma. The schema is `backend/prisma/schema.prisma`; migrations are in `backend/prisma/migrations/` (committed to Git, applied in order).

### Main tables

| Table | Holds |
|---|---|
| `users` | Staff accounts (email, bcrypt password hash, role, active flag) |
| `communities`, `schools`, `participants` | People and places |
| `cleanup_events`, `cleanup_attendances`, `waste_records` | Cleanup activity and waste collected |
| `inventory_items`, `inventory_transactions` | Supplies and stock movements |
| `environmental_clubs`, `weekly_reports` | Clubs and their weekly reports |
| `donors`, `donations` | Supporters and their pledges |
| `newsletter_subscribers` | Newsletter signups |
| `partnership_inquiries` | "Become a Partner" submissions |

### Soft deletes

Most tables have a `deleted_at` column. Deleting sets it instead of removing the row; every list, count and chart ignores rows where it is set. To permanently remove data you must do it in SQL.

### Changing the schema

```bash
# development only
npx prisma migrate dev --name describe_the_change
# production
npx prisma migrate deploy
```

Commit the new folder in `prisma/migrations/`. After schema changes run `npx prisma generate` (part of `npm run build`).

### Backups (do this)

Enable automatic backups at your database provider. To take one yourself:

```bash
pg_dump "$DATABASE_URL" -Fc -f eco-girls-$(date +%F).dump
```

Restore into an empty database:

```bash
pg_restore --clean --no-owner -d "$DATABASE_URL" eco-girls-YYYY-MM-DD.dump
```

Store backups somewhere other than the server that hosts the database, and test a restore before you need one. The dashboard does **not** have a working backup button (an earlier version had a fake one, which was removed).

---

## 10. Testing and verification

### Quality checks

```bash
# backend
cd backend && npx tsc --noEmit && npx eslint "src/**/*.ts" && npm run build
# frontend
cd frontend && npx eslint app lib components && npm run build
```

### The smoke test

`backend/scripts/smoke-test.mjs` checks the security model of a **running** backend with 64 checks: what is public, what needs login, forged tokens, form validation, login, change password (and restore), roles (manager blocked from user management), removed users losing access immediately, and that deleted records disappear from counts.

```bash
cd backend
API_URL=http://localhost:4000 \
ADMIN_EMAIL=admin@ecogirlscollective.org \
ADMIN_PASSWORD='your-admin-password' \
node scripts/smoke-test.mjs
```

* Start the backend with `LOGIN_RATE_LIMIT=1000` for this run, otherwise the test's own logins hit the rate limit.
* It creates records named `SMOKE-TEST…` / `smoke-…@example.com`. It hides its temporary manager and community with a normal delete, but the rows stay in the database, along with the newsletter, partnership and donation test entries. Purge them all with SQL:
  `DELETE FROM newsletter_subscribers WHERE email LIKE 'smoke-%'; DELETE FROM partnership_inquiries WHERE organization_name = 'SMOKE-TEST Org'; DELETE FROM donations WHERE donor_id IN (SELECT id FROM donors WHERE email LIKE 'smoke-%'); DELETE FROM donors WHERE email LIKE 'smoke-%'; DELETE FROM users WHERE email LIKE 'smoke-manager-%'; DELETE FROM communities WHERE name LIKE 'SMOKE-TEST Community%';`
* It temporarily changes the admin password and changes it back.
* Prefer running it on a staging copy. Expected last line: `Result: 64 passed, 0 failed`.

Run it after every deploy that touches the backend, and any time you change which routes are public.

### Verified at handover

Backend and frontend production builds, lint and type checks all pass; the smoke test passes 64/64 against the production build; the browser flows (public site data, login redirect, dashboard pages, settings) were exercised in a real browser with no console errors.

---

## 11. Troubleshooting

Start with: **which side is failing?** Open the browser's developer tools (F12) → **Network** tab and look at the failing request's status code.

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend exits at startup with *"JWT_SECRET is missing, the placeholder value, or shorter than 32 characters"* | Production safety check | Set a random 32+ character `JWT_SECRET` |
| Seed fails with *"SEED_ADMIN_PASSWORD must be set…"* | First admin in production needs a password | Set `SEED_ADMIN_PASSWORD` for that run |
| **Can't sign in** ("Invalid credentials") | Wrong password, user removed, or user inactive | Have an admin check **Settings → Team members**; reset via the seed (below) if it is the only admin |
| **"Too Many Requests"** on login | More than `LOGIN_RATE_LIMIT` attempts in a minute | Wait a minute. If it happens to everyone constantly, the API is behind a proxy: set `TRUST_PROXY=1` |
| Dashboard keeps returning to the login page | Token expired, or `JWT_SECRET` was changed (signs everyone out) | Sign in again |
| **Forgot the only admin's password** | | On the backend: `SEED_ADMIN_EMAIL=you@org SEED_ADMIN_PASSWORD='new-password' npm run seed`. This resets that admin's password (and re-activates the account). |
| Public site shows `—` for numbers, empty "Where we work", missing charts | Website cannot reach the API | Check `NEXT_PUBLIC_API_URL` (**rebuild** after changing), that the API is running, and the Network tab |
| Browser console: **CORS error** | `FRONTEND_URL` does not match the site's address | Must match exactly: scheme + host (+ port), no trailing slash; `www.` and non-`www.` are different |
| Forms say "Could not send / subscribe" | API unreachable or validation error | Network tab: `400` = bad input (message shows which field), `5xx` = check backend logs |
| Dashboard pages show *"Failed to load …"* | Session expired (401) or API down | Sign in again; check the API |
| `Cannot find module '…/generated/prisma'` or missing model errors | Database client not generated (`generated/` is git-ignored) | `npx prisma generate` (also run by `npm run build`) |
| Migration errors on deploy | Database unreachable or a migration conflicts | Check `DATABASE_URL`; `npx prisma migrate status` shows what is applied |
| `EADDRINUSE` / *"Port 3000 is in use"* | An old server is still running | Stop the old process. Windows: `Get-NetTCPConnection -LocalPort 3000 \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| `/api` returns 404 in production | Swagger is intentionally hidden | Set `ENABLE_SWAGGER=true` if you really need it |
| Donation stays "Pending" forever | No payment provider is connected | Expected; see limitations |
| Git shows "LF will be replaced by CRLF" warnings | Windows line-ending setting | Harmless |

### Where to look

* **Backend logs:** the process output of `npm run start:prod` (or your host's log viewer). Each request error and startup message appears here.
* **What the browser sent/received:** developer tools → Network.
* **Database:** connect with `psql "$DATABASE_URL"` and inspect tables directly.

### Debugging a security question

Reproduce it with the smoke test's approach: request the route with no token (expect `401`), with a valid token (expect `200`), and, for admin-only routes, with a manager's token (expect `403`). To make a route public, add `@Public()` to its controller method; to protect it, remove it. Update the table in [Section 5](#5-security-model) and re-run the smoke test.

---

## 12. Known limitations and next steps

| Area | State | Suggested next step |
|---|---|---|
| **Payments** | The donate page records a pledge only. No card, mobile-money or bank payment is processed. | Connect a payment provider (for example Stripe, Flutterwave, or a local mobile-money gateway). The `Donation` table and status workflow are ready; you need provider credentials and a webhook route to mark donations *Completed*. |
| **Email** | Nothing sends email. Newsletter and inquiries are lists staff read in the dashboard. | Connect an email service, or export the newsletter list into your existing tool. |
| **Content** | Story quotes, story descriptions and some photos are placeholders. | See [Section 7](#7-the-public-website). |
| **Restore deleted records** | API only, no button. | Add a "recently deleted" view. |
| **Session storage** | Login token lives in `localStorage`. | Move to an HTTP-only cookie if you later add user-generated content or more third-party scripts. |
| **Password changes** | Do not sign out other devices. | Add a token version to the user record. |
| **Automated tests** | The smoke test covers security and behaviour end to end; there are no unit tests. | Add tests around donations and reports as they gain logic. |
| **Dependency warnings** | `npm audit` lists 4 "high" items, all inside the Prisma **command-line tool** (`mysql2`, `deepmerge-ts`), which this PostgreSQL project does not use at runtime. The only offered fix downgrades Prisma to an older major version, so it was not applied. | Re-check `npm audit` when upgrading Prisma. |
| **Monitoring** | None. | Add uptime monitoring on the API root (`GET /`) and error alerts. |
| **Manual figures** | Some landing page numbers (`80+` girls, `3+` schools) are typed in. | Replace with live values from `/public/summary` once you trust the data. |
