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
