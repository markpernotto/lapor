# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # Lapor (React + TypeScript + Vite + API)

    This repository contains a Vite React frontend and an Express + TypeScript API located in the `/api` folder. The API uses Prisma and PostgreSQL (via Docker) for local development.

    This README explains how to get a complete local development environment up and running, including Docker, Prisma migrations, and tests.

    ## Quick overview
    - Frontend: root (`/`) — Vite + React (TypeScript)
    - Backend / API: `/api` — Express + TypeScript + Prisma (Postgres)
    - Tests: backend tests live in `/api/test` and use Vitest + Supertest

    ---

    ## Prerequisites
    - Node.js 18+ (install from https://nodejs.org)
    - npm (comes with Node) or your preferred package manager
    - Docker & Docker Compose (for running Postgres locally)

    If you don't have Docker installed, follow instructions for your OS:
    - https://docs.docker.com/get-docker/

    Note: the API integration tests will try to bring up a Postgres container using Docker Compose.

    ---

    ## Quick start (backend first)

    1. Clone the repository

       git clone <REPO_URL>
       cd lapor

    2. Start the API (recommended flow)

       cd api
       npm install

       # copy environment example
       cp .env.example .env || true

       # Bring up Postgres via Docker Compose (background)
       docker-compose up -d db

       # Generate Prisma client and run migrations
       npm run prisma:generate
       npm run prisma:migrate

       # Start the API in dev mode
       npm run dev

    The API will be available at http://localhost:4000 and exposes endpoints under `/api` (for example: `GET /api/questions`).

    If you prefer to run the DB manually (not using Docker Compose), set `DATABASE_URL` in `api/.env` to point to your Postgres instance and run the Prisma commands above.

    ---

    ## Frontend quickstart

    In a separate terminal (from repo root):

       npm install
       npm run dev

    The Vite frontend runs on http://localhost:5173 by default (your port may vary). The frontend is intentionally decoupled; configure the API base URL in the frontend code or use a proxy during development.

    ---

    ## Running tests

    Backend unit and mocked tests (fast):

       cd api
       npm test

    This runs Vitest which executes the TypeScript tests in `api/test/`.

    Integration test (requires Docker):

       cd api
       # ensure Docker is running
       docker-compose up -d db
       npm test -- test/integration/integration.test.ts

    The integration test will skip itself if Docker isn't available.

    ---

    ## Useful scripts (in `/api/package.json`)
    - `npm run dev` — run API in dev mode (ts-node-dev)
    - `npm run build` — compile TypeScript to `dist/`
    - `npm start` — run `node dist/index.js` (start compiled app)
    - `npm test` — run Vitest tests
    - `npm run prisma:generate` — generate Prisma client
    - `npm run prisma:migrate` — run Prisma migrations (dev flow)

    ---

    ## Environment variables
    The API reads config from `api/.env`. Copy `api/.env.example` to create your `.env`. Key variables:
    - `DATABASE_URL` — Postgres connection string (Prisma uses this)
    - `PORT` — API port (defaults to 4000)

    ---

    ## Troubleshooting
    - Vitest discovering compiled `.js` test artifacts: if you see errors like `Cannot read properties of undefined (reading 'mock')` or `describe is not a function`, remove any compiled test `.js` files in `api/test/` (they are generated artifacts). The repository is configured to only include TypeScript tests, but stale `.js` files can still be picked up by some runners.

      Safe commands (from `/api`):

        # move compiled tests to backup
        mkdir -p tmp/test-backup && mv test/*.js tmp/test-backup/ || true

        # or delete them if you prefer
        rm -f test/*.js || true

    - Port conflict on 4000: if `npm run dev` fails with `EADDRINUSE`, find and kill the process using that port, or change `PORT` in `api/.env`.

    ---

    ## Notes for contributors
    - Keep `test/` TypeScript-only (avoid committing compiled `.js` test files).
    - Prefer to run integration tests only when Docker is available locally or in CI with services configured.

    ---

    If you'd like, I can also add a small `Makefile` or npm scripts to automate the common steps (bring up DB, migrate, start server, run tests). Tell me which you'd prefer and I'll add it.
