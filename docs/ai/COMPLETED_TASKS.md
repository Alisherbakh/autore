# Completed Tasks

Session date: 2026-10-05. Repository: `~/Desktop/autore`, branch `develop`.

## 1. Before this session (already in git)

| Commit | Content |
|---|---|
| `85313f0 feat: modified full project` | Domain migration Property → Car and Agent → Dealer across `autore-api` and `autore-batch` (see `BACKEND_MIGRATION.md`) |
| `a572b61 feat: start backend migration process` | Member resolver, car enums, socket gateway/module and `package.json` changes; `scripts/` seed (committed during the session) |

## 2. Completed in this session

| # | Task | Files | Type |
|---|---|---|---|
| 1 | Created the agent instructions file (from a Petoria template, adapted to Autore) | `AGENTS.md` (later renamed to `CLAUDE.md`) | Docs |
| 2 | Created the skills index file (from a Petoria template; later edited by the user to say "Claude skills") | `SKILLS.md` | Docs |
| 3 | Read-only analysis of the monorepo structure and migration completeness | n/a | Analysis |
| 4 | Repo-wide search for `nestar` (case-insensitive) | n/a | Audit |
| 5 | Rename layer: removed the last Nestar reference | `README.md:3` ("…monorepo (same structure as nestar)." → "…monorepo.") | Rename |
| 6 | Fixed lint tooling so lint runs | `package.json`, `package-lock.json` | Dev tooling |
| 7 | Migration documentation | `docs/ai/*.md` (this folder) | Docs |

Tasks 5 and 6 were committed by the user as `20acce5 fix: Modify project name into autore`. `docs/` was committed in `e6bc385` and later moved to `docs/ai/`.

### Property → car completion pass (backend only, `MemberType` unchanged)

Audit method: searched `apps/` and `scripts/` for English and Uzbek real-estate terms; normalized the Nestar backend (property→car, agent→dealer) and diffed every resolver, service, DTO, schema, config and batch file against Autore; checked the Car schema against `car.ts`, `car.input.ts` and `car.update.ts` (all fields and nullability agree).

| # | File | Change | Type |
|---|---|---|---|
| 8 | `apps/autore-api/src/libs/config.ts:47` | Comment "ko'chmas mulk" → "mashina" | Comment |
| 9 | `apps/autore-api/src/components/comment/comment.service.ts:39` | Comment "mulkning" → "mashinaning" | Comment |
| 10 | `apps/autore-api/src/components/member/member.service.ts:177` | `match.MemberStatus` → `match.memberStatus`. The `getAllMembersByAdmin` status filter had matched a field that doesn't exist, so it returned no members. This regression came from the migration. | Bug fix |
| 11 | `apps/autore-api/src/libs/dto/member/member.update.ts:55` | `deleteAt` → `deletedAt` (no `@Field`, so no GraphQL change; restores the Nestar name) | Internal rename |

Validation: real-estate term search is clean; `tsc` passes for both apps; `npm run build` passes; ESLint is still 2,351 problems (no new ones).

### Task 6 details: dev dependencies

| Package | Before | After |
|---|---|---|
| `eslint` | ^8.42.0 (8.57.1 installed) | ^9.39.5 |
| `@eslint/js` | missing | ^9.39.5 |
| `typescript-eslint` | missing | ^8.71.0 |
| `globals` | missing | ^17.13.0 |
| `@typescript-eslint/eslint-plugin` | ^6.0.0 | removed |
| `@typescript-eslint/parser` | ^6.0.0 | removed |

No runtime dependency changed. No file under `apps/` or `scripts/` was modified in this session.

## 3. Rename audit result

| Area | Result |
|---|---|
| Package name (`package.json`, lockfile) | `autore` |
| Nest projects (`nest-cli.json`) | `autore-api`, `autore-batch` |
| npm scripts | `start:dev:batch`, `start:prod`, `start:prod:batch` and `test:e2e` all point to `autore-*` |
| Server labels | "Welcome to Autore API Server!", "Welcome to Autore BATCH Server!" |
| Environment variables | `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, `SECRET_TOKEN` (brand-neutral, unchanged) |
| Batch constants | `BATCH_ROLLBACK`, `BATCH_TOP_CARS`, `BATCH_TOP_DEALERS` |
| `dist/` | No `nestar` strings |
| Remaining `nestar` references | 0 (after task 5) |
| GraphQL API | Unchanged by this session |

## 4. Validation status

| Check | Command | Result |
|---|---|---|
| Typecheck API | `npx tsc --noEmit -p apps/autore-api/tsconfig.app.json` | Pass |
| Typecheck batch | `npx tsc --noEmit -p apps/autore-batch/tsconfig.app.json` | Pass |
| Lint (before task 6) | `npx eslint "apps/**/*.ts"` | Crashed (missing `@eslint/js`, `typescript-eslint`, `globals`) |
| Lint (after task 6) | `npx eslint "apps/**/*.ts"` (no `--fix`) | **Fail: 2,351 problems (2,326 errors, 25 warnings)**, all in code that existed before this session |
| Unit tests | `npm test` | Not run |
| e2e tests | `npm run test:e2e` | Not run (spec still expects `"Hello World!"` and will fail) |
| `nest build` | `npm run build` | Not run |
| Frontend (`autore-next`) | `tsc` / `next build` | Not run |

### Lint breakdown (top rules)

| Count | Rule |
|---|---|
| 2,030 | `prettier/prettier` |
| 68 | `@typescript-eslint/no-unsafe-member-access` |
| 67 | `@typescript-eslint/ban-ts-comment` |
| 48 | `@typescript-eslint/no-unsafe-assignment` |
| 39 | `@typescript-eslint/no-unused-vars` |
| 31 | `@typescript-eslint/no-unsafe-call` |
| 23 | `@typescript-eslint/no-unsafe-argument` (warning) |
| 20 | `@typescript-eslint/no-unsafe-return` |
| 25 | Other (`require-await`, `restrict-template-expressions`, `no-redundant-type-constituents`, `no-base-to-string`, `prefer-const`, …) |

## 5. Issues found but not fixed (out of scope)

| Issue | Location |
|---|---|
| Batch rollback and ranking only touch `ACTIVE` cars, so `RESERVED` cars keep a stale `carRank` | `apps/autore-batch/src/batch.service.ts` |
| Unescaped user input in `new RegExp(text, 'i')` | `car.service.ts` `shapeMatchQuery` |
| "Not found" errors use `InternalServerErrorException` (500) | All services |
| `checkAuth` logs `"Query: updateMember"` | `member.resolver.ts:46` |
| The seed script requires `dotenv`, which is only present as a transitive dependency of `@nestjs/config` | `scripts/seed-korean-cars.js` |
| `carVin` unique index conflicts when a soft-deleted car is relisted | `schemas/Car.model.ts` |
| Notice/Notification have schemas only | `schemas/Notice.model.ts`, `schemas/Notification.model.ts` |

## 6. Frontend migration session (`~/Desktop/autore-next`)

Session date: 2026-10-06. Repository: `~/Desktop/autore-next`, branch `modification`. Changes are uncommitted.

### Validation (before any edits)

| Check | Command | Result |
|---|---|---|
| Typecheck | `yarn tsc --noEmit` | Pass |
| Build | `yarn build` | Pass (21 routes) |
| Operation contract | All 36 gql documents in `apollo/` validated against the live `autore-api` introspection schema (graphql-js `validate`) | 0 errors |
| Enums | `libs/enums/*` compared with schema enums and backend source | All match. `CommentGroup.COMMENT` exists only in the frontend and is unused |
| Types | `libs/types/*` compared field by field with the schema | No runtime mismatches: every mutation sends only fields the backend accepts. TS-only differences listed in NEXT_STEPS |

### Seed data

`seed:cars` is **not** in the backend `package.json`, so the seed was run as `node scripts/seed-korean-cars.js` against `MONGO_DEV`: 4 dealers (`seoul_motors`, `busan_auto`, `incheon_ev`, `daegu_motors`, password `autore123`) and 32 cars. `uploads/car/seed-*.jpg` are missing, so seeded car images are broken.

### API smoke test (frontend gql documents, page inputs)

41/41 pass: car list with every sort (createdAt, carViews, carRank, carLikes, carPrice, carYear, carMileage) and every filter (brand, type, location, fuel, transmission, condition, year, mileage, price, credit option, text); RESERVED cars in public lists; car detail; dealer list and detail; comments; community FREE/REVIEW/NEWS/TIPS; member cars, followers and followings; dealer login; my cars; favorites; recently visited; like on/off; `updateCar` ACTIVE → RESERVED → ACTIVE (state restored).

### Changes

| # | Area | Files | Change |
|---|---|---|---|
| F1 | Leftover CSS classes | `homepage/HeaderFilter.tsx`, `car/Filter.tsx`, `scss/pc/main.scss`, `scss/pc/theme/v01.scss`, `scss/pc/car/car.scss` | `filter-rooms` → `filter-brands`, `room` → `fuel-chip`, `square-year-input` → `range-input` (component and SCSS renamed together) |
| F2 | NESTAR-branded / real-estate images | `layout/LayoutBasic.tsx`, `pages/car/detail.tsx`, `car/CarCard.tsx`, `mypage/Article.tsx` | `/car` and `/dealer` banners (`banner/cars.png`, `banner/dealers.webp` had "NESTAR" in the image), the car detail fallback (`car/bigImage.png`, a living room) and the CarCard fallback (`banner/header1.svg`, a house) now use `/video/hero-poster.jpg` |
| F3 | Unused assets removed | `public/img/apartmentMain.png`, `car/floorPlan.png`, `car/bigImage.png`, `banner/header3.svg`, `banner/cars.png`, `banner/dealers.webp` | Deleted (no references left) |
| F4 | Comments | `mypage/AddNewCar.tsx`, `scss/pc/theme/v01-pages.scss` | "nestar" wording removed. `grep -ri nestar` over `libs pages scss apollo public/locales` is clean |
| F5 | WebSocket fallback | `apollo/client.ts` | `ws://127.0.0.1:3007` → `3009` (matches `PORT_API`) |
| F6 | RESERVED: My Cars | `mypage/MyCars.tsx`, `mypage/CarCard.tsx` | New "Reserved" tab; status menu offers Reserved/Sold for ACTIVE and Active/Sold for RESERVED. Reserved cars were previously invisible to their dealer |
| F7 | RESERVED: admin | `pages/_admin/cars/index.tsx`, `admin/cars/CarList.tsx` | New "Reserved" tab; RESERVED rows get a badge (`badge block`) and status menu, and link to the detail page. Previously the status cell was empty |
| F8 | RESERVED: public | `car/CarCard.tsx`, `pages/car/detail.tsx` | Orange "RESERVED" badge on cards and next to the price on the detail page |

Validation after the changes: `yarn tsc --noEmit` passes; `yarn build` passes. No browser smoke test was run (UI changes are unverified visually).

#### Type tidy-ups (F9)

| File | Change |
|---|---|
| `libs/types/car/car.input.ts` | Removed `CarInput.memberId` (the backend sets it from the token); car search type `CISearch` → `CarISearch` (schema name; no longer shares a name with the comment search type) |
| `libs/types/car/car.update.ts` | Removed `soldAt`, `deletedAt` (not in the backend `CarUpdate`) |
| `libs/types/comment/comment.input.ts` | Removed `CommentInput.memberId` |
| `libs/types/board-article/board-article.input.ts` | Removed `BoardArticleInput.memberId`; `articleImage` optional; `BAISearch.articleCategory` optional and `memberId` added (matches the schema) |
| `pages/community/index.tsx` | `TabContext value` falls back to `'FREE'` (needed now that `articleCategory` is optional) |

`yarn tsc --noEmit` passes, `yarn build` passes, 36/36 operations still validate. Left as-is on purpose: output-type nullability (`metaCounter`, `TotalCounter.total`, some `Member` / `BoardArticle` fields) and frontend-only helper fields (`Comment.meLiked`, `Member.memberPassword`, `MemberUpdate.deletedAt`). These never reach the backend, and tightening them would add null checks across many pages.

`CommentGroup.COMMENT` was briefly removed in F9 (not in the backend schema, unused) and then **restored** for parity with `nestar-next`, where it is also frontend-only (see DECISIONS D15).
