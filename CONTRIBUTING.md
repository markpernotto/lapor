# Contributing

Thanks for wanting to contribute! A few ground rules and developer notes to get started:

- Work on TypeScript sources (do not commit compiled `.js` test artifacts).
- Keep tests in `api/test/*.ts` and run `npm test` from `api` or `make test-api` from the repo root.
- Use Docker for local Postgres when running integration tests. The repo includes `api/docker-compose.yml`.

Typical dev loop:

1. Install: `make install-api`
2. Start DB: `make start-db`
3. Run migrations: `make migrate-api`
4. Run dev server: `make dev-api`

If you add tests, ensure they are TypeScript test files (extension `.ts`).
