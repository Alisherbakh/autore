# Next Steps

Priority: **P0** = do first (blocks other work), **P1** = this week, **P2** = later. Each task should be its own commit.

## Backend cleanup

| Pri | Task | Files | Done when |
|---|---|---|---|
| P0 | Commit `docs/` (the lint tooling and README rename are already committed in `20acce5`) | `docs/*.md` | Committed on `develop` |
| P0 | Prettier-only formatting pass: `npx prettier --write "apps/**/*.ts"`. No other edits in this commit | `apps/**` | `prettier/prettier` count = 0; `tsc` still passes |
| P0 | Make the batch app rank RESERVED cars too: use `$in: [ACTIVE, RESERVED]` in `batchRollback` and `batchTopCars` | `apps/autore-batch/src/batch.service.ts` | Reserved cars get re-ranked |
| P1 | Escape the regex input in all text searches | `car.service.ts:184`, `board-article.service.ts:98`, `member.service.ts:131,179` | Searching `"("` doesn't throw |
| P1 | Return 404 (`NotFoundException`) instead of 500 for missing documents | All `*.service.ts` | `getCar` with an unknown id returns 404 |
| P1 | Fix the `checkAuth` log label | `member.resolver.ts:46` | n/a |
| P1 | Add `dotenv` to `devDependencies` | `package.json` | `npm ls dotenv` shows a direct dependency |
| P1 | Implement the Notice module (CRUD; admin-only writes) | `components/notice/*`, `libs/dto/notice/*` | `_admin/cs/notice` and `faq` pages can load data |
| P1 | Implement the Notification module; create notifications on like and comment | `components/notification/*`, `like.service.ts`, `comment.service.ts` | Liking a car notifies its dealer |
| P1 | Type-safety lint pass: remove `//@ts-ignore` (67) and `no-unsafe-*` (~170) | `apps/**` | ESLint error count < 50 |
| P2 | Partial unique index for `carVin` (exclude `DELETE`) | `schemas/Car.model.ts` | A soft-deleted car can be relisted |
| P2 | `Inquiry`/lead entity (buyer → dealer about a car; optionally links to RESERVED) | New `components/inquiry` | n/a |
| P2 | Redesign the socket as per-car buyer↔dealer rooms with persisted messages | `socket/*` | n/a |
| P2 | Move shared schemas, enums and DTOs to `libs/common` so the batch app doesn't use `../../autore-api` imports | `nest-cli.json`, `libs/` | n/a |

## Frontend migration (`~/Desktop/autore-next`)

| Pri | Task | Done when |
|---|---|---|
| P0 | Run `npx tsc --noEmit` and `yarn build`, and record the results | Build passes or the errors are listed |
| P0 | Smoke test against the local API with `npm run seed:cars`: home, car list and filters, car detail, dealer list and detail, like, add car (dealer), admin cars | All pages render with seed data |
| P1 | Check every Apollo selection set against the API schema in the `/graphql` playground | No "Cannot query field" errors |
| P1 | Remove leftovers: `filter-rooms`, `room`, `square-year-input` classes (+ SCSS); `apartmentMain.png`; `header3.svg` ("VillA"); "nestar" comments | `grep -riE "nestar\|villa\|apartment\|square\|rooms"` finds only false positives |
| P1 | Check that `libs/types/car/*` and `libs/enums/*` match the backend DTOs field by field | Diff is empty |
| P2 | Wire the CS and notice pages once the backend modules exist | n/a |
| P2 | Chat UI for buyer↔dealer once the backend socket is redesigned | n/a |

## Testing

| Pri | Task | Done when |
|---|---|---|
| P0 | Fix the scaffold e2e specs (they expect `"Hello World!"`; the API returns "Welcome to Autore API Server!") | `npm run test:e2e` passes |
| P1 | e2e car flow: dealer signup → `createCar` → `getCars` with filters → `updateCar` RESERVED → SOLD (`memberCars` decrements) | Spec passes on a test database |
| P1 | Unit tests for `CarService.shapeMatchQuery` (each filter becomes the expected Mongo `match`) | n/a |
| P1 | Unit tests for the batch rank formulas | n/a |
| P2 | Role guard tests: USER can't call `createCar`; ADMIN-only queries reject DEALER | n/a |

## Documentation

| Pri | Task |
|---|---|
| P0 | Keep `docs/COMPLETED_TASKS.md` and this file updated at the end of each session |
| P1 | Expand `AGENTS.md`: structure, conventions (field prefixes, guard usage, inquiry shape), commands, and "don't run `npm run lint`, it uses `--fix`" |
| P1 | Expand `SKILLS.md` with repeatable workflows (add a component module, add an enum, add a filter) |
| P1 | README: setup, `.env` keys, seed script, ports |
| P2 | GraphQL API reference generated from the schema |
