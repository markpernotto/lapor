# ...existing code...
FROM node:20-alpine AS builder
WORKDIR /app

# install deps (use lockfile if present)
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --no-audit --no-fund

# copy source, generate Prisma client (before TS build), and build
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# install production deps
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --production --no-audit --no-fund

# copy compiled app + prisma artifacts generated in builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
# ...existing code...