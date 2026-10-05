# Backend Migration: Nestar → Autore

Status as of 2026-10-05. Branch: `develop`. Last commit: `a572b61 feat: start backend migration process`.

## 1. Original project (Nestar)

| Item | Value |
|---|---|
| Location | `~/Desktop/nestar` |
| Domain | Real estate listing platform (apartments, villas, houses) |
| Package name | `nestar` |
| Apps | `apps/nestar-api` (GraphQL API), `apps/nestar-batch` (cron) |
| Stack | NestJS 10, Apollo GraphQL (code-first), Mongoose 8, MongoDB, `ws` WebSocket, `graphql-upload` |
| Core entity | `Property` (collection `properties`) |
| Seller role | `MemberType.AGENT` |

## 2. New project (Autore)

| Item | Value |
|---|---|
| Location | `~/Desktop/autore` |
| Domain | Car selling platform (dealers list new/used cars, Korean market) |
| Package name | `autore` |
| Apps | `apps/autore-api` (GraphQL API), `apps/autore-batch` (cron) |
| Stack | Unchanged from Nestar |
| Core entity | `Car` (collection `cars`) |
| Seller role | `MemberType.DEALER` |
| Seed data | `scripts/seed-korean-cars.js` + `scripts/data/korean-cars.json` (`npm run seed:cars`) |

## 3. Migration goal

Reuse the Nestar architecture unchanged (modules, guards, aggregation helpers, batch ranking, socket, upload pipeline). Replace the real-estate domain with a car domain. The GraphQL API should keep the same shape and conventions, so the Next.js frontend can be migrated by mechanical renaming.

## 4. Naming changes

### 4.1 Project / app identifiers

| Nestar | Autore | Location |
|---|---|---|
| `nestar` | `autore` | `package.json`, `package-lock.json` |
| `nestar-api` | `autore-api` | `nest-cli.json`, `apps/`, npm scripts |
| `nestar-batch` | `autore-batch` | `nest-cli.json`, `apps/`, npm scripts |
| `Welcome to Nestar ...` | `Welcome to Autore API Server!` / `Welcome to Autore BATCH Server!` | `app.service.ts`, `batch.service.ts` |
| `BATCH_TOP_PROPERTIES` | `BATCH_TOP_CARS` | `autore-batch/src/lib/config.ts` |
| `BATCH_TOP_AGENTS` | `BATCH_TOP_DEALERS` | `autore-batch/src/lib/config.ts` |

A repo-wide search (case-insensitive, excluding `node_modules` and `.git`) finds **zero** remaining `nestar` references in code, config or `dist/`.

### 4.2 Domain identifiers

| Nestar | Autore |
|---|---|
| `Property`, `Properties` (DTO / type) | `Car`, `Cars` |
| `PropertyInput`, `PropertyUpdate` | `CarInput`, `CarUpdate` |
| `PropertiesInquiry` | `CarsInquiry` |
| `AgentPropertiesInquiry` | `DealerCarsInquiry` |
| `AllPropertiesInquiry` | `AllCarsInquiry` |
| `PropertyType` (APARTMENT, VILLA, HOUSE) | `CarType` (SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, WAGON, VAN, PICKUP) |
| `PropertyStatus` (ACTIVE, SOLD, DELETE) | `CarStatus` (ACTIVE, **RESERVED**, SOLD, DELETE) |
| `PropertyLocation` | `CarLocation` (SEOUL, BUSAN, INCHEON, DAEGU, GYEONGJU, GWANGJU, CHONJU, DAEJON, JEJU) |
| n/a | New enums: `CarBrand`, `CarFuelType`, `CarTransmission`, `CarCondition` |
| `MemberType.AGENT` | `MemberType.DEALER` |
| `availableAgentSorts` | `availableDealerSorts` |
| `availablePropertySorts` | `availableCarSorts` (adds `carPrice`, `carYear`, `carMileage`) |
| `availableOptions = ['propertyBarter','propertyRent']` | `['carBarter','carCredit']` |
| `LikeGroup / ViewGroup / CommentGroup / NotificationGroup .PROPERTY` | `.CAR` |
| `favoriteProperty`, `visitedProperty` (lookup paths) | `favoriteCar`, `visitedCar` |
| `BoardArticleCategory` (FREE, RECOMMEND, NEWS, HUMOR) | FREE, REVIEW, NEWS, TIPS |

## 5. Module changes

| Module | Change |
|---|---|
| `components/property` | Replaced by `components/car` (`car.module.ts`, `car.resolver.ts`, `car.service.ts`) |
| `components/member` | `getAgents` → `getDealers`; counters `memberProperties` → `memberCars` |
| `components/like`, `view` | `getFavoriteProperties` / `getVisitedProperties` → `getFavoriteCars` / `getVisitedCars` |
| `components/comment` | `CommentGroup.CAR` increments `carComments` |
| `components/auth`, `follow`, `board-article` | Logic unchanged |
| `socket/` | Unchanged pattern (global chat on `ws`, `?token=` auth, last 5 messages in memory) |
| `autore-batch` | `batchTopProperties` → `batchTopCars`; `batchTopAgents` → `batchTopDealers` |

New business behaviour introduced during the domain migration (not in the rename layer):

- `CarStatus.RESERVED`. Public queries (`getCar`, `getCars`, `likeTargetCar`, `updateCar`) match `VISIBLE_CAR_STATUSES = { $in: [ACTIVE, RESERVED] }`.
- New search filters (brand, fuel, transmission, condition, year range, mileage range) and new sort keys (`carPrice`, `carYear`, `carMileage`).

Ranking formulas are the same as Nestar, only renamed: dealer `memberCars*5 + memberArticles*3 + memberLikes*2 + memberViews*1`; car `carLikes*2 + carViews*1`.

## 6. GraphQL changes

Operation names (Nestar → Autore). Every operation not listed here is unchanged.

| Kind | Nestar | Autore | Guard |
|---|---|---|---|
| Mutation | `createProperty` | `createCar` | `RolesGuard(DEALER)` |
| Query | `getProperty(propertyId)` | `getCar(carId)` | `WithoutGuard` |
| Mutation | `updateProperty` | `updateCar` | `RolesGuard(DEALER)` |
| Query | `getProperties` | `getCars` | `WithoutGuard` |
| Query | `getAgentProperties` | `getDealerCars` | `RolesGuard(DEALER)` |
| Mutation | `likeTargetProperty(propertyId)` | `likeTargetCar(carId)` | `AuthGuard` |
| Query | `getAllPropertiesByAdmin` | `getAllCarsByAdmin` | `RolesGuard(ADMIN)` |
| Mutation | `updatePropertyByAdmin` | `updateCarByAdmin` | `RolesGuard(ADMIN)` |
| Mutation | `removePropertyByAdmin(propertyId)` | `removeCarByAdmin(carId)` | `RolesGuard(ADMIN)` |
| Query | `getAgents` | `getDealers` | `WithoutGuard` |
| Query | `getFavorites`, `getVisited` | Same names, now return `Cars` | `AuthGuard` |

Unchanged operations: `signup`, `login`, `checkAuth`, `checkAuthRoles`, `updateMember`, `getMember`, `likeTargetMember`, `getAllMembersByAdmin`, `updateMemberByAdmin`, `imageUploader`, `imagesUploader`, all `*BoardArticle*`, `createComment`, `updateComment`, `getComments`, `removeCommentByAdmin`, `subscribe`, `unsubscribe`, `getMemberFollowings`, `getMemberFollowers`, `sayHello`.

`CarsInquiry.search` filters: `memberId`, `locationList`, `typeList`, `brandList`, `fuelTypeList`, `transmissionList`, `conditionList`, `pricesRange`, `yearsRange`, `mileageRange`, `periodsRange`, `options`, `text`. These replace Nestar's rooms, beds and squares filters.

## 7. MongoDB collection / schema changes

| Collection | Change |
|---|---|
| `properties` | **Replaced by `cars`.** No data migration: Autore starts from an empty DB plus the seed script. |
| `members` | `memberProperties` → `memberCars`. `memberType` value `AGENT` → `DEALER`. |
| `likes`, `views`, `comments`, `notifications` | `*Group` value `PROPERTY` → `CAR` |
| `boardArticles` | Category values changed (see 4.2) |
| `follows`, `notices` | Unchanged |

### `cars` schema

| Field | Type | Notes |
|---|---|---|
| `carType`, `carLocation`, `carBrand`, `carFuelType`, `carTransmission` | enum string | required |
| `carStatus` | enum | default `ACTIVE` |
| `carCondition` | enum | default `USED` |
| `carAddress`, `carTitle`, `carModel` | string | required |
| `carPrice`, `carYear`, `carMileage` | number | required |
| `carEngineSize`, `carSeats`, `carColor` | optional | |
| `carVin` | string | unique, sparse index |
| `carViews`, `carLikes`, `carComments`, `carRank` | number | default 0 |
| `carImages` | string[] | required |
| `carDesc` | string | |
| `carBarter`, `carCredit` | boolean | default false |
| `memberId` | ObjectId → `Member` | required |
| `soldAt`, `deletedAt` | Date | Nestar's `constructedAt` was removed |

## 8. Compatibility notes

- **Not wire-compatible with Nestar clients.** Every operation, type and enum value that mentioned property or agent was renamed, so a Nestar frontend can't call Autore without changes. The `autore-next` frontend already uses the new names (see `FRONTEND_MIGRATION.md`).
- **No database migration path.** A Nestar database (with `properties` and `AGENT` members) isn't readable by Autore without a migration script. The intended setup is a fresh database.
- **Environment variables are unchanged and brand-neutral:** `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD`, `SECRET_TOKEN`. A Nestar `.env` works as-is.
- **Upload folders:** `uploads/property` → `uploads/car`. `uploads/member` and `uploads/article` are unchanged.
- **Socket protocol is unchanged:** events `info`, `message`, `getMessages`.
- **Defined but unused:** `Notice` and `Notification` have schemas and enums but no module, service or resolver (same as Nestar).
