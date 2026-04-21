# Gym Tracker

A Vite + React gym tracking app with a Convex backend for daily check-ins, workout entries, streaks, and recent-progress summaries.

If `VITE_CONVEX_URL` is not set, the app automatically falls back to browser storage so a static deployment can still be used without a public backend.

## What is built

- Daily check-in form for sleep, energy, mood, soreness, hydration, body weight, and notes
- Workout logging for exercise, muscle group, sets, reps, weight, duration, effort, and notes
- Recent-day history, 7-day volume, streak tracking, and exercise highlights
- Optional self-hosted Convex container flow for OrbStack via [`docker-compose.convex.yml`](/Users/amiretminanrad/Documents/Github/Gym/docker-compose.convex.yml)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and add your Convex URL:

   ```bash
   cp .env.example .env.local
   ```

3. Start Convex with the hosted dev flow:

   ```bash
   npm run convex:dev
   ```

4. Put the deployment URL from Convex into `.env.local`:

   ```bash
   VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

## OrbStack / self-hosted Convex

Convex’s self-hosted backend officially ships as Docker services. OrbStack works fine as the Docker runtime.

1. Start the backend and dashboard:

   ```bash
   docker compose -f docker-compose.convex.yml up -d
   ```

2. Generate an admin key:

   ```bash
   docker compose -f docker-compose.convex.yml exec backend ./generate_admin_key.sh
   ```

3. Add these values to `.env.local`:

   ```bash
   VITE_CONVEX_URL=http://127.0.0.1:3210
   CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
   CONVEX_SELF_HOSTED_ADMIN_KEY=<generated-admin-key>
   ```

4. Open the local Convex dashboard at `http://127.0.0.1:6791`.

The app talks to `VITE_CONVEX_URL`. The `CONVEX_SELF_HOSTED_*` values are only for the Convex CLI when you want to push schema/function changes to the local container.

## Project structure

- [`src/App.tsx`](/Users/amiretminanrad/Documents/Github/Gym/src/App.tsx): main React UI
- [`convex/schema.ts`](/Users/amiretminanrad/Documents/Github/Gym/convex/schema.ts): Convex tables and indexes
- [`convex/checkins.ts`](/Users/amiretminanrad/Documents/Github/Gym/convex/checkins.ts): daily check-in mutation
- [`convex/workoutLogs.ts`](/Users/amiretminanrad/Documents/Github/Gym/convex/workoutLogs.ts): workout create/remove mutations
- [`convex/dashboard.ts`](/Users/amiretminanrad/Documents/Github/Gym/convex/dashboard.ts): dashboard query and aggregates
