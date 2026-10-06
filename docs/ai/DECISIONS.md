# Architectural Decisions: Nestar → Autore

Each entry gives the decision, why it was made, risks, and alternatives that were considered or are still open.

| # | Decision | Status |
|---|---|---|
| D1 | Fork the Nestar monorepo instead of starting fresh | Done |
| D2 | Rename the domain one-for-one (Property → Car, Agent → Dealer) | Done |
| D3 | Keep the GraphQL API shape and conventions | Done |
| D4 | Fresh database, no migration of Nestar data | Done |
| D5 | Add `CarStatus.RESERVED` and expose it publicly | Done |
| D6 | Store car attributes as enums (brand, fuel, transmission, condition, type) | Done |
| D7 | `carVin` unique sparse index | Done |
| D8 | Keep environment variable names brand-neutral and unchanged | Done |
| D9 | The rename layer is separate from logic changes | Done |
| D10 | Lint tooling: upgrade to ESLint 9 flat config instead of downgrading the config | Done |
| D11 | Don't auto-fix lint as part of the migration | Done |
| D12 | Keep the batch app as a separate process using API schemas | Done |
| D13 | Keep the socket as a global chat for now | Open |
| D14 | Leave Notice/Notification unimplemented in the migration | Open |
| D15 | Frontend enums mirror nestar-next one for one, with only domain renames | Done |

---

### D1: Fork the Nestar monorepo

- **Why:** Nestar already has working auth (JWT + roles), likes, views, follows, comments, board articles, uploads, batch ranking and a WebSocket chat. A listing marketplace for cars has the same shape as one for properties.
- **Risks:** Inherited technical debt: many `//@ts-ignore`, 500 errors for "not found", ~2,000 Prettier violations, and placeholder e2e tests.
- **Alternatives:** A fresh NestJS project (cleaner but slower); a shared `libs/` package used by both platforms (too much overhead for one product).

### D2: Rename the domain one-for-one

- **Why:** Keeping each identifier a direct substitute (`property*` → `car*`, `agent*` → `dealer*`, `PROPERTY` → `CAR`) keeps the diff mechanical, so the frontend can be migrated with search and replace.
- **Risks:** Some real-estate semantics don't fit cars: `propertyRent` became `carCredit`, a different concept that reuses the same `options` mechanism. Field names are prefixed (`carPrice`), which is verbose but consistent with Nestar.
- **Alternatives:** A generic `Listing` entity with a `category` field. It would support multiple verticals, but makes typed car filters harder.

### D3: Keep the GraphQL API shape

- **Why:** Same guard placement (`WithoutGuard` / `AuthGuard` / `RolesGuard`), same inquiry pattern (`page`, `limit`, `sort`, `direction`, `search`), same `$facet { list, metaCounter }` response shape. The frontend Apollo hooks and pagination code can be reused.
- **Risks:** It's still a breaking change for any Nestar client, because operation and type names changed.
- **Alternatives:** Keep the Nestar operation names as aliases. Rejected: it would leave the old domain in the public schema permanently.

### D4: Fresh database

- **Why:** Different domain data. Real-estate listings have no meaning as cars. `scripts/seed-korean-cars.js` provides idempotent demo data (VIN prefix `AUTORESEED`, `--reset` removes only seeded cars).
- **Risks:** Pointing `MONGO_DEV` at an old Nestar database would mix `properties` / `AGENT` documents with the new enums, and enum validation would fail when those documents are updated.
- **Alternatives:** A migration script that renames `memberProperties` → `memberCars`, `AGENT` → `DEALER` and the `PROPERTY` groups. Only needed if real Nestar users must be carried over.

### D5: `CarStatus.RESERVED`

- **Why:** Car sales have an agreed-but-not-yet-paid state. Reserved cars stay visible (`VISIBLE_CAR_STATUSES = [ACTIVE, RESERVED]`) so buyers can see they're taken.
- **Risks:** The batch app only re-ranks `ACTIVE` cars, so RESERVED cars keep a stale `carRank`. There's no buyer record, so "reserved for whom" isn't stored.
- **Alternatives:** A separate `carReserved: boolean` flag; a full `Inquiry` / `Deal` entity (planned, see NEXT_STEPS).

### D6: Car attributes as enums

- **Why:** Gives validated values, GraphQL-registered filter lists and fast `$in` filtering. Korean brands come first to fit the target market.
- **Risks:** `CarBrand` is a closed list (`OTHER` is the escape hatch). `carModel` is free text, so you can't filter brand → model reliably.
- **Alternatives:** Brand and model catalog collections (more flexible, more joins).

### D7: Unique sparse index on `carVin`

- **Why:** Prevents the same physical car being listed twice while keeping VIN optional.
- **Risks:** A seller who lists, deletes (soft delete) and relists the same car hits a duplicate-key error, because the soft-deleted document still holds the VIN.
- **Alternatives:** A partial index on `carStatus != DELETE`.

### D8: Brand-neutral environment variables

- **Why:** `PORT_API`, `PORT_BATCH`, `MONGO_DEV`, `MONGO_PROD` and `SECRET_TOKEN` contain no brand name. Leaving them unchanged avoids breaking deployments.
- **Risks:** None identified.
- **Alternatives:** An `AUTORE_` prefix. Rejected as an unnecessary change.

### D9: Separate rename layer

- **Why:** Requested explicitly. A pure-rename pass ("no business logic change, keep API unchanged") is easy to review and can be reverted independently. A search confirmed only `README.md:3` still mentioned Nestar.
- **Risks:** None. The pass touched documentation only.
- **Alternatives:** n/a

### D10: Upgrade to ESLint 9 flat config

- **Why:** `eslint.config.mjs` (flat config) imports `@eslint/js`, `typescript-eslint` and `globals`, which weren't installed, and ESLint 8.57 was installed. Lint crashed before checking any file. Installing the missing packages makes the existing config work without rewriting it.
- **Changes:** `eslint` ^8 → ^9; added `@eslint/js`, `typescript-eslint` ^8 and `globals`; removed `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` v6 (they only work with ESLint 8 and the config doesn't use them).
- **Risks:** `recommendedTypeChecked` is strict: 2,351 problems surfaced.
- **Alternatives:** Downgrade to a legacy `.eslintrc` for ESLint 8. Rejected: it moves away from the NestJS default.

### D11: No lint auto-fix during the migration

- **Why:** `npm run lint` runs `eslint --fix`, which would reformat about 2,030 Prettier violations across almost every file. That would break the "no business logic change" rule and hide the rename diff.
- **Risks:** Lint stays red until cleanup is done.
- **Alternatives:** A dedicated Prettier-only commit followed by a type-safety pass (planned).

### D12: Batch app imports API schemas

- **Why:** One source of truth for the `Car` and `Member` schemas and enums. `autore-batch` imports from `../../autore-api/src/...`.
- **Risks:** Cross-app relative imports couple the two builds. A shared Nest library would be cleaner.
- **Alternatives:** Move schemas, enums and DTOs to `libs/common` (`nest g library`).

### D13: Socket stays a global chat (open)

- **Why:** Out of scope for the rename. The Nestar behaviour is kept: a single room, the last 5 messages in memory, and guests allowed.
- **Risks:** Doesn't fit buyer↔dealer conversations. Messages are lost on restart, and there's no horizontal scaling.
- **Alternatives:** Per-car rooms with persisted messages, or a `Message` collection plus GraphQL subscriptions.

### D14: Notice/Notification unimplemented (open)

- **Why:** Nestar never implemented them either; the schemas exist only.
- **Risks:** The frontend `_admin/cs/*` and notice pages have no backend.
- **Alternatives:** Implement the modules next (planned as the first backend feature).

### D15: Frontend enums mirror nestar-next

- **Why:** The frontend should stay a mechanical rename of `nestar-next`. Every enum file and value is kept; only domain names change (`PROPERTY` → `CAR`, `AGENT` → `DEALER`, `Property*` → `Car*`). `CommentGroup.COMMENT` stays on the frontend only, exactly as in Nestar.
- **Car-specific on purpose:** board categories `REVIEW` / `TIPS` replace `RECOMMEND` / `HUMOR` (same four slots); `CarType` values are car body types; `CarStatus.RESERVED`, `CarBrand`, `CarFuelType`, `CarTransmission` and `CarCondition` are kept because the car filters, add-car form and backend schema depend on them.
- **Risks:** None. `COMMENT` is never sent to the API.
- **Alternatives:** Revert to RECOMMEND/HUMOR or strip the extra car enums. Both rejected by the user on 2026-10-06.
