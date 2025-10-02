# Makefile for Lapor (dev helper)

.PHONY: install-api start-db migrate-api dev-api test-api clean-tests

install-api:
	cd api && npm install

start-db:
	docker-compose -f api/docker-compose.yml up -d db

migrate-api:
	cd api && npm run prisma:generate && npm run prisma:migrate

dev-api:
	cd api && npm run dev

test-api:
	cd api && npm test

clean-tests:
	cd api && npm run clean:tests

integration-test:
	@echo "Starting Postgres and running integration test..."
	cd api && docker-compose up -d db
	cd api && npm run prisma:generate && npx prisma migrate deploy || true
	cd api && npx vitest run test/integration/integration.test.ts --reporter verbose
	@echo "Integration test completed; see /tmp/lapor_integration.log for server logs (if created)"
