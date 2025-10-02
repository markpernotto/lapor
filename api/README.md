Lapor API

This folder contains a small TypeScript + Express API using Prisma with PostgreSQL.

Quick start

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres dev database.
2. Install dependencies:

```bash
cd api
npm install
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Start dev server:

```bash
npm run dev
```

Running with the Vite frontend

Run the API on port 4000 (default). Run your Vite frontend (root) normally with `npm run dev` there. The frontend should call the API on http://localhost:4000. During production on Azure Static Web Apps, the API will be deployed separately (e.g., Azure Functions or container) — we'll add deployment notes later.
