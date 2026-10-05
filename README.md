# Autore

Car selling platform backend — NestJS + GraphQL + MongoDB monorepo.

## Apps

- `apps/autore-api` — GraphQL API (members, cars, board articles, comments, likes, views, follows, socket)
- `apps/autore-batch` — cron jobs (rank rollback, top cars, top dealers)

## Setup

```bash
npm install
```

Create `.env`:

```
PORT_API=3009
PORT_BATCH=3010
MONGO_DEV=mongodb+srv://...
MONGO_PROD=mongodb+srv://...
SECRET_TOKEN=...
```

## Run

```bash
npm run start:dev         # API
npm run start:dev:batch   # batch
npm run build
```

GraphQL playground: http://localhost:3009/graphql
