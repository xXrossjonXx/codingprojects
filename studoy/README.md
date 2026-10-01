# Studoy (like duh doy)

A responsive Next.js / TypeScript / Tailwind app for tracking **how much** you study, without scheduling when. Supabase PostgreSQL stores your data and Supabase Auth handles email accounts. Recharts provides the weekly chart.

## Navigation

- **Home:** courses and their management menus, timers and logging, followed by weekly totals.
- **History:** sessions, weekly summaries and statistics.
- **Settings:** account, appearance and database setup.

## What works

- Add, edit, reorder, archive and restore courses; choose weekly goals, symbols and colors.
- Monday–Sunday Home page with completed time, course-specific remaining time and percentages above 100%.
- One persistent timer per account. Pause, resume, refresh, close the tab and continue. Server timestamps and database row locks prevent concurrent active timers. Finishing saves the session and removes the timer in one transaction.
- Manual logs with duration shortcuts, optional topic, notes and productivity rating; a single manual logging form.
- Edit sessions, confirm deletion, filter history by course/day/week/month and browse earlier weekly summaries.
- All-time statistics with 3-, 6- and 12-month filters, monthly/yearly charts, course totals, session count, average duration and goal consistency.
- Light/dark preference saved to Supabase; compact navigation on desktop and mobile.
- Email signup/sign-in/sign-out; database-enforced account isolation.

**The published app initially displays clearly labeled sample data.** No real courses or study sessions are stored in the browser. Connect a Supabase project and sign in to save your own data. Samples are never imported into your account. The browser stores only the public connection configuration and authentication session. Course/session writes are acknowledged only after a successful database response.

## Quick setup on the published app

1. Go to https://supabase.com and create a project. Wait for it to finish provisioning.
2. Open the project's **SQL Editor**, create a query and paste the entire contents of `supabase/migrations/001_study_hours.sql`. Click **Run** once. This creates the tables, validation, ownership policies and timer functions.
3. In Supabase **Project Settings**, copy the project URL. In **API Keys**, copy the **publishable** key (`sb_publishable_…`). A legacy `anon` key also works. Never use a secret or service-role key.
4. Open the app → **Connect Supabase**. Paste the URL and publishable key.
5. Create an account. If email confirmation is enabled, confirm your email and then sign in.
6. Click **Add course**, choose a weekly target and start a timer or log a session.
7. For a second browser/device, enter the same public project configuration and sign in with the same account. For a deployment with configuration already supplied to everyone, use the environment variables below.

In Supabase **Authentication → URL Configuration**, set your deployed app as the Site URL. Keep email confirmation enabled for public use. Do not paste account passwords into code or chat.

## Run the source on your computer

Install Node.js 22.13 or later from https://nodejs.org. Unzip this project and open a terminal in its folder. The project uses pnpm and includes `pnpm-lock.yaml`.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project's **public** values:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

Run the SQL migration in Supabase as explained above, then:

```bash
pnpm dev:next
```

Open http://localhost:3000. Stop with Ctrl+C. If Corepack is unavailable, install pnpm with `npm install -g pnpm` first. On Windows, copy `.env.example` to `.env.local` in File Explorer instead of using `cp`.

The default `dev` script is retained for the managed Sites preview. **Use `dev:next` for local Next.js development.** The production `build` script uses actual Next.js, not the Sites preview framework.

## Verify

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tests run 17 calculation scenarios in UTC, Asia/Seoul and America/New_York (51 checks): local weeks, midnight, Sunday/Monday, spring and fall DST, paused intervals, adjusted duration allocation, course totals, goals, timer timestamp restoration duration validation, long-term ranges, monthly/yearly totals and eligible goal weeks.

Cloud integration must also be checked against your configured project: create two test accounts, confirm each sees only its own rows, save/edit/delete a session, run/pause/reload/finish a timer, and open a second tab to verify the single-timer guard. The delivered build has no project credentials, so live Auth/PostgreSQL integration could not be exercised during creation. Browser UI and WebMCP testing were unavailable in this execution environment; these are not claimed as passing.

## Deploy to Vercel

1. Create a GitHub repository and upload the project files, including `pnpm-lock.yaml`. Do **not** upload `.env.local` or `node_modules`.
2. Open https://vercel.com → Add New → Project and import the repository.
3. Choose **Next.js**. Set the build command to `pnpm build`. The project uses `output: 'export'`; its static output is `out`.
4. Add both `NEXT_PUBLIC_…` environment variables above. They are public build-time configuration; no service-role key is required.
5. Deploy, then add the new origin as your Supabase Authentication Site URL.
6. Create an account and perform the cloud checks above before relying on the tracker.

The same exported `out/` folder is hosted by Sites for the delivered preview. All durable data resides in your Supabase project, independently of the frontend host.

## Important files

- `app/page.tsx`, `app/layout.tsx`, `app/globals.css`: page, metadata and responsive theme.
- `components/studoy/`: separate shell, Home, history/statistics, forms and shared controls.
- `lib/studoy/time.ts`: pure date, duration, progress and allocation calculations.
- `lib/studoy/use-study.ts`: cloud reads/writes and shared application state.
- `lib/studoy/supabase.ts`: Supabase REST/Auth client, token refresh and explicit errors. Uses public Supabase HTTP APIs and RLS, without an admin credential.
- `lib/studoy/types.ts`: shared models.
- `supabase/migrations/001_study_hours.sql`: complete initial schema and timer transactions.
- `tests/time.test.mjs`: timezone-sensitive tests.
- `.env.example`: public configuration template.

## Time and data behavior

- Timestamps are stored in PostgreSQL as `timestamptz`; dates and Monday boundaries use the viewing device's local timezone.
- Sessions spanning a boundary are allocated by interval overlap. Paused intervals do not count. If a timer's duration is adjusted before saving, its active intervals are scaled proportionally.
- Manual entries with no start time use local noon on the selected date. To place a session accurately around midnight, provide its start time.
- Durations must be 1–1,440 minutes in the UI. Longer unattended timers can be corrected before saving.
- A zero-hour target is allowed and displays “No weekly target.” Overall remaining time sums unmet goals per course, so extra time in one course does not erase another course's remaining goal.
- Historical comparisons use the **current** goal; goal changes are not versioned.
- Refresh/focus and a 30-second poll load changes made on another device. This is not a realtime collaboration app.
- Failed saves keep the form open. Retrying uses the same session ID. Active timers remain in Supabase even if the browser closes while the finish form is open.
- Archiving keeps history. Course deletion is intentionally absent from the interface.
- RLS restricts every table to the authenticated owner. Composite foreign keys prevent attaching sessions, timers or assessments to another user's course. Timer functions use `security invoker` so RLS remains enforced.

## Next steps / intentionally deferred

The focus of this version is the core tracking loop. The assessment table is ready, but exams/grades entry and grade comparisons are not implemented. Also deferred: password-reset UI, optional social login, historical goal snapshots and offline queued writes. Without a network connection, the app reports errors and does not pretend a session is saved.

## Update later

Edit the components or styling, run the four verification commands, commit and push to GitHub. Vercel rebuilds automatically. After editing Supabase public configuration, redeploy because `NEXT_PUBLIC_` variables are embedded at build time. For schema changes, create a **new** numbered migration rather than rerunning the initial migration or deleting your data.

Public API references: https://supabase.com/docs/guides/auth/passwords, https://supabase.com/docs/guides/database/postgres/row-level-security, https://nextjs.org/docs/app/guides/static-exports.

Statistics defaults to all time, beginning with the month of the earliest session. Date-range filters include the current calendar month. Charts use monthly buckets, switching to years for histories longer than 36 months. Average time per session uses the portion within the selected range. Goal consistency excludes the current week, partial boundary weeks, and weeks before a course was added; it compares against current goals.

The project is named Studoy (like duh doy), with package name `studoy` and download `studoy-source.zip`. The original migration filename and browser authentication-storage keys are retained for compatibility with existing setups.

## Deploy this GitHub folder

On Vercel, import `xXrossjonXx/codingprojects`, set **Root Directory** to `studoy`, select **Next.js**, use `pnpm build`, and add the two environment variables from `.env.example`. The Supabase migration must be run once in your own project.
