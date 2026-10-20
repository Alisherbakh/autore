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

#### Logo assets (2026-10-07)

`public/img/logo/favicon.svg`, `logoText.svg` and `logoWhite.svg` still showed the Nestar brand (orange icosahedron, "NESTAR"). They were replaced, keeping the same file names so no code changed, with the Autore mark from `libs/components/common/Logo.tsx` (blue `#0057FF` rounded square, white chevron and dot). `logoWhite.svg` is the mark plus a white "AUTORE" wordmark (129×52). Used by the browser favicon, `/account/join` and the community pages. `yarn build` passes.

#### Logo hover animation (2026-10-07, refined)

`libs/components/common/Logo.tsx`: class hooks on the SVG parts; "AUTORE" split into per-letter spans (`--i` index, `aria-label` on the wrapper). `scss/pc/theme/v01.scss` `.autore-logo` hover, motion only, as requested (no background, glow, shadow or colour change): the badge lifts 1px (600ms easeOutQuint), the chevron re-draws (700ms easeInOut), the dot fades and scales in after it (500ms, starting at 450ms), and the letters rise 2px in a left-to-right wave (45ms stagger). Turned off under `prefers-reduced-motion`. The first version (tilt, blue drop-shadow glow, bouncy dot, letter-spacing) was replaced at the user's request. `tsc` and `yarn build` pass.

#### 3D car gallery on the homepage (2026-10-07)

Restored nestar-next's `threeJSContainer` gallery with luxury and famous car photos. It replaces the video hero.

| Area | Change |
|---|---|
| Dependencies | `three@0.150.1`, `@react-three/fiber@8.12.0`, `@react-three/drei@9.58.5`, `@types/three@0.150.0` (same versions as nestar-next; installed with yarn) |
| Components | `libs/components/common/ScrollControls.tsx` (copied verbatim) and `FiberContainer.tsx` (copied; image URLs → `car1–8.jpg`, same 5-page wrap pattern) |
| Hero | `homepage/HeroSection.tsx` is now FiberContainer + "Scroll to explore" + `HeaderFilter` (logic unchanged). The video, title block and their `v01.scss` rules were removed; `.hero-gallery` styles were added. `/video/*` and the `hero_*` i18n keys are kept |
| Images | `public/img/fiber/car1–8.jpg` (Ferrari F8 Tributo, Lamborghini Aventador S, Rolls-Royce Phantom, Bugatti Chiron, Porsche 911 Turbo S, McLaren 720S, Aston Martin DB11, Lamborghini Aventador), 1600px, 3.3 MB, all from Wikimedia Commons under CC BY-SA 4.0. Each photo was checked by eye: no legible plates or prominent faces |
| Attribution | `public/img/fiber/CREDITS.md`, linked from the desktop footer ("Gallery photos: Wikimedia Commons (CC BY-SA)") |

Checks: `tsc` and `yarn build` pass (homepage first load 334 → 532 kB, from `three`); 36/36 operations valid, `apollo/` untouched. The homepage was rendered with headless Chrome (WebGL): the gallery shows with depth and there are no gallery errors in the console. Found along the way: `yarn start` (production) has no `REACT_APP_API_*` values because only `.env.development` exists, so GraphQL returns 404 there. This doesn't affect `yarn dev`. A `.env.production` is needed before deploying.

#### Gallery background: Seoul night light trails (2026-10-07)

Like Nestar's `.header-main` background photo. `public/img/banner/home-seoul-night.jpg` ("Trails in Seoul1" by Carmine.shot, CC BY 2.0, Wikimedia Commons; 1920px, 412 KB) sits behind the 3D gallery via `.header-main.hero-search.hero-gallery` in `scss/pc/theme/v01.scss`, with a Graphite gradient overlay (0.55 → 0.35 → 0.8), `min-height: 860px` (Nestar's height), and the "Scroll to explore" hint in white at 75%. Credit added to `public/img/fiber/CREDITS.md`; the footer link now reads "Homepage photos: Wikimedia Commons (CC BY / BY-SA)". `yarn build` passes, and a headless render at 1440 shows the background behind the floating car images. In later headless runs the WebGL textures didn't always load (software renderer), so this needs one check in a real browser. Note: running `yarn build` while `yarn dev` is running overwrites the shared `.next` folder, so restart `yarn dev` afterwards.

#### Inner page banners (2026-10-07)

`LayoutBasic` banners now use dark car photos (Wikimedia Commons, credited in `public/img/fiber/CREDITS.md`; plates blurred where readable), cropped to 1920×640 at 185–346 KB each:

| Route(s) | File | Subject |
|---|---|---|
| `/car` | `page-car.jpg` | Rolls-Royce showroom |
| `/dealer`, `/dealer/detail` | `page-dealer.jpg` | Jaguar showroom |
| `/community`, `/community/detail` | `page-community.jpg` | Classic car line-up |
| `/mypage`, `/member` | `page-mypage.jpg` | DS 7 cockpit |
| `/cs` | `page-cs.jpg` | Beetle restoration workshop |
| `/account/join` | `page-join.jpg` | Mountain road at sunrise |
| `/about` | `home-seoul-night.jpg` | Reused. New case: title "About Autore" |

Styling (revised at the user's request: "like nestar-next, different pictures"): the V01 `.header-basic` override was removed entirely, so Nestar's original rule in `scss/pc/main.scss` applies again (557px, auth 300px, inline inset vignette, white 48px/24px text). The only addition is a soft `text-shadow` on the title and subtitle so white text stays readable on bright car photos. Footer link now reads "Site photos: Wikimedia Commons (CC BY / BY-SA)". Checks: `tsc` passes, `main.scss` compiles, `apollo/` untouched. No `yarn build` was run because `yarn dev` was running; the banners were verified on the dev server (all pages except `/mypage`, which redirects when logged out).

**Fixed: WebGL crash.** `FiberContainer` checks `webgl2`/`webgl` support on mount. Unsupported browsers get `StaticGallery` (car1–3 side by side, `.gallery-fallback` in v01.scss; the "Scroll to explore" hint is hidden via `:has`). The 3D canvas is also wrapped in `GalleryErrorBoundary`, so any runtime 3D error falls back the same way instead of crashing the homepage. Verified on the dev server: with GPU off there's a static gallery and no error overlay; with WebGL on, the 3D gallery works as before.

#### Login/About pictures (2026-10-07)

Replaced the remaining Nestar real-estate art with Genesis photos (Wikimedia Commons, CC BY-SA 4.0, credited in CREDITS.md): `join-genesis.jpg` (login right panel, `scss/pc/account/join.scss`), and `about-stats.jpg` and `about-genesis.jpg` (`pages/about/index.tsx`). Deleted the now-unused `joinBg.svg`, `aboutBanner.svg` and `header2.svg`. Checked on the dev server.

Open: the single shared inner-page banner (an "AUTORE" lit dealership) was not generated, because Higgsfield's free plan rejected the image models (gpt_image_2_5, recraft_v4_1, soul_location need the Basic plan; the z_image job failed). No credits were spent.

#### One shared inner-page banner (2026-10-08)

All `LayoutBasic` pages (car, dealer, dealer detail, community, community detail, mypage, member, cs, join, about) now use `public/img/banner/page-autore.jpg`: the owner-supplied `~/Desktop/uploads/autore.png` (a night showroom with a lit "AUTORE" sign and Genesis cars), as a 1536×1024 JPEG of 412 KB. The inline style `backgroundPosition: 'center calc(100px - 12.4vw)'` keeps the sign just below the fixed navbar at any width. Checked at 1280, 1440 and 1920, and on the 300px login banner. The old per-page `page-*.jpg` photos were removed and CREDITS.md updated. `tsc` passes.

#### Banner image updated: autore-new.png (2026-10-08)

`page-autore.jpg` is now built from the owner's `~/Desktop/uploads/autore-new.png` (the same showroom with Autore logos instead of Genesis; 424 KB). The `LayoutBasic` inline style was adjusted: `backgroundSize: min(100%, 1536px)` so the image never grows past its natural width (otherwise at 1920px+ the page title overlapped the logo tile); position `center calc(100px - min(8.8vw, 135px))` keeps the sign below the navbar; a gradient layer fades the image edges into `#080b14` on wide screens. Checked at 1280, 1440, 1920 and 2560, plus the login banner, on the dev server. `tsc` passes.

#### "Pick a body style": real photos (2026-10-08)

`libs/components/homepage/CarTypes.tsx`: the two drawn SVG silhouettes (and `tallTypes`) were replaced with real photos at `public/img/types/<type>.jpg` (800px wide, 100–200 KB). Cars: Sonata (sedan), Sorento (SUV), i30 (hatchback), Stinger (coupe), Mazda MX-5 (convertible, no Korean model), i30 Wagon, Carnival (van), Santa Cruz (pickup). All from Wikimedia Commons under CC BY-SA, credited in CREDITS.md; plates blurred on the convertible and van. `v01.scss` `.type-tile` is now a photo card: 16:10 photo on top (cover, zoom on hover), name and "Browse →" below. Click routing unchanged. `tsc` and SCSS pass; checked on the dev server at 1440 and 1280.

#### Demo members and listings (2026-10-08)

New seed `scripts/seed-demo-members.js` + `scripts/data/demo-members.json` (idempotent; `--reset` removes only these members and cars with VIN prefix `AUTOREDEMO`). It ran against `MONGO_DEV`:

- 5 USER accounts: `jiyoon_kim`, `minho_park`, `sora_lee`, `daniel_choi`, `hana_jung`
- 5 DEALER accounts: `gangnam_auto` (Genesis), `hanriver_car` (Hyundai), `busan_kia` (Kia), `green_ev` (EV/hybrid), `daegu_city` (city cars)
- Password for all 10: `alisher2908` (bcryptjs, same as the auth service)
- Avatars: AI-generated faces (thispersondoesnotexist), watermark cropped, saved to `uploads/member/demo-member-1..10.jpg`
- 25 cars (5 per dealer), each with 5 real Wikimedia Commons photos of the same model and color (`uploads/car/demo-<model>-1..5.jpg`, 125 files, 31 MB, credited in `autore-next/public/img/fiber/CREDITS.md`)

Verified: all 10 log in through the API with the password; dealers have `memberCars: 5`; images are served from `/uploads`; the dealer page and the car detail gallery render on the dev server. Note: `uploads/` is gitignored, so the images exist only on this machine. Plates in the car photos were not blurred one by one; many are already obscured in the source photos.

#### Real photos for the original seed dealers and cars (2026-10-09)

- **Dealers:** `seoul_motors`, `busan_auto`, `incheon_ev` and `daegu_motors` now have AI-generated face avatars (`uploads/member/seed-dealer-<key>.jpg`).
- **Cars:** all 32 cars from `seed-korean-cars.js` now have 2–5 real Wikimedia Commons photos each (`uploads/car/seed-<slug>.jpg` + `-2..5.jpg`, 140 files). None overlap with the demo-dealer photos.
- **Colors:** 13 cars' `color` in `scripts/data/korean-cars.json` was changed to match the photos, so the generated descriptions match: Avante, Tucson, Ioniq 5, Ioniq 6, Sportage, EV6, EV9, Seltos, GV70, G90, Torres, Trax, Trailblazer.
- **Seed script:** `seed-korean-cars.js` now picks up the extra gallery photos and dealer avatars when the files exist (re-running keeps them). It was re-run against `MONGO_DEV`.
- **Credits:** in `autore-next/public/img/fiber/CREDITS.md`.

Verified through the API (32 cars, 0 missing files) and in the browser (`/car` and `/dealer`).

#### Liked-heart color unified (2026-10-09)

Filled `FavoriteIcon` was red on home, blue (`color="primary"`) on car list/detail/community/member pages, and gray on dealer cards (the `v01-pages.scss` `.buttons svg { color: $c-muted }` rule overrode it). Added `LIKED_COLOR = 'red'` in `libs/config.ts`; all 12 filled hearts in 9 files now use `style={{ color: LIKED_COLOR }}` (an inline style beats the theme rule). `tsc` passes.

#### Navbar and homepage search redesign (2026-10-09)

Flow: Impeccable critique (18/40) → frontend-design + web-design-guidelines → motion (Emil Kowalski) → review-animations → Impeccable polish.

**Navbar (`libs/components/Top.tsx`)**
- Transparent with white text over the homepage hero; turns porcelain after 50px of scroll.
- Active-page underline with `aria-current`.
- Login is now a ghost button, so "Search cars" is the only primary CTA.
- Gap-based layout replaces the fixed widths.
- **Bug fixed:** the Korean flag image had `id="uz"` and sent users to an `uz` locale; `langChoice` now takes the locale code.
- Language names show in their own script.
- Avatar is a real button, with a My Page item in its menu.
- Removed the dead bell icon.
- Scroll listener moved into a `useEffect` with cleanup.
- Logo link labelled "Autore home".

**Search (`libs/components/homepage/HeaderFilter.tsx`)**
- All controls are semantic buttons with listbox/option roles, `aria-expanded`, Esc that returns focus to the trigger, and focus rings.
- Fields show a label plus a readable value ("Seoul", not `SEOUL`).
- Type tiles use the real `/img/types/*.jpg` photos.
- **New model search:**
  - It expands over the fields on focus (`clip-path`, 200ms; instant when reached by keyboard).
  - A live results dropdown uses the existing `GET_CARS` with `text`: 5 rows, "See all N cars", ↑/↓/Enter, `aria-live`, and an empty state with brand chips.
- **Advanced modal:**
  - Blue CTA labelled "Search cars".
  - Wrapping fuel chips with `aria-pressed`.
  - Labelled selects.
  - All copy translated.

**Motion**
- Dropdowns: 180ms in, 120ms out, strong ease-out from the trigger origin.
- Press feedback: `scale(.97)` over 160ms.
- Hover is limited to mouse devices, and every animation has a reduced-motion fallback.
- Logo hover gated to mouse devices and shortened.
- Deleted the dead `.community_menu { transition: all 2s }`.

**i18n:** 32 new keys in en/kr/ru.

**Checks**
- `tsc` and SCSS pass. GraphQL ops 36/36; `apollo/` untouched. Impeccable detector: 0 findings.
- Browser check via CDP at 1440 and 1280, in EN/RU/KR:
  - live "Sonata" results returned 2 rows
  - Tab order is logo → links → Login → Language → search → Location → Car type → Brand → Advanced
  - Esc restores focus
  - the Korean flag goes to `/kr`
- Remaining, out of scope: mobile nav/search, New/Used and budget fields, other sections' 1300px container overflow at widths under 1300px.

#### Trend Cars: premium card (2026-10-09)

**Card (`TrendCarCard.tsx`)**
- One render path for mobile and desktop; the duplicate branch is gone.
- Structure: `<article>` containing a `<Link>` card and a separate favorite `<button>` (`aria-pressed`, translated label).
- 16:10 `<img>` framed 8px inside the card.
- Price at 24px/800 with tabular numerals, the strongest element.
- Title, plus the address line.
- 2×2 specs: year, mileage, fuel, transmission, with the existing svg icons.
- "Reserved" badge.
- **Removed property leftovers:** the description, Credit/Barter text, view and like counters, and the scale-on-hover.
- `TrendCarSkeleton` is exported from the same file.

**Section (`TrendCars.tsx`)**
- 4 skeleton slides while loading, with `aria-busy`.
- Translated empty state.
- Debug logs removed; `list ?? []` guard added.

**Shared:** `formatEnum` moved to `libs/utils.ts` (used by `HeaderFilter` too).

**Styles:**
- New `.tc-card` / `.tc-skeleton` in `v01.scss`; old `.trend-card-box` removed from `homepage.scss` and `v01.scss`.
- Swiper and section heights are now auto.
- **Motion:**
  - Image zoom 1.03 on hover (mouse only).
  - Favorite press `scale(.92)` over 160ms.
  - One-shot 220ms heart pop on like.
  - Linear shimmer on the skeleton.
  - All of it is off under reduced motion.

**i18n:** 6 new keys in en/kr/ru.

**Checks**
- `tsc` and SCSS pass; detector: 0 findings; GraphQL 36/36; `apollo/` untouched.
- CDP checks at 1440 and 1280:
  - 4 skeletons appear with GraphQL held back
  - 8 cards render with no leftovers
  - image ratio is exactly 1.600
  - font sizes: price 24, title 15, specs 13
  - favorite as jiyoon_kim: false → true → false
  - Tab goes from the card link to "Save to favorites"

#### Homepage redesign, desktop (2026-10-09)

UI layer only. No queries, mutations, handlers, routes, `defaultProps` or types changed (a diff scan for `useQuery`/`useMutation`/`router.push`/handler definitions/`initialInput` finds nothing). Mobile branches and `scss/mobile/**` are untouched by choice, so phones still get the previous mobile homepage.

**Styles**
- The homepage-only blocks were moved out of `scss/pc/theme/v01.scss` into `scss/pc/homepage/homepage.scss`: hero, search panel (`.sf-bar`, unchanged), `.home-page`, body types, brand strip, events, community, and `.tc-card`. A screenshot diff before and after the move was identical.
- The old Nestar `#pc-wrap .home-page` rules were replaced by one scoped system:
  - 8px rhythm, sections at 96/80/64/48px
  - one `SectionHead`
  - shared `.tc-card` language
  - graphite band (`#15171c`) for Top cars
  - hover limited to mouse devices, with reduced-motion fallbacks everywhere
- Fluid `.container` (`min(1300px, 100% - 48px)`) with breakpoints at 1024, 768 and 480. The search bar gets a 3-column layout at 900px and a 1-column layout at 520px.

**Sections** (new desktop order: Brands → Trend → Body styles → Popular → Ad → Top cars → Dealers → Events → Community)
- **Hero:** `<h1>` `hero_title`, `hero_sub`, CTAs "Search cars" → `/car` and "Dealers" → `/dealer`, and a trust row, all from existing i18n keys. Below them the 3D gallery (the `FiberContainer` inline size is overridden to 380px), then the search bar. One staggered fade-up on load.
- **Brands:** "Shop by brand" pill chips in a `<nav>`.
- **Body styles:** 12-column bento (Sedan and SUV large), photo tiles with the label overlaid; labels use `formatEnum`, so "SUV" stays SUV.
- **Popular and Top cards:** rebuilt on `.tc-card`, keeping every datum: top badge, price, title, address, year, mileage, fuel, credit/sale or Credit/Barter, views, likes. Top keeps the like button as `<button aria-pressed>` calling `likeCarHandler`.
- **Ad video:** contained 21:9 rounded frame.
- **Dealers:** profile tiles. "See All Dealers" is now a `Link` to `/dealer` (approved fix; it was dead text).
- **Events:** replaced the four tourism festivals with three verified Korean car events: Seoul Mobility Show (Goyang), Busan International Mobility Show (Busan), Superrace Championship (Yongin). No dates are shown. Photos from Wikimedia Commons (CC BY-SA 4.0) are credited in `public/img/fiber/CREDITS.md`, and the old `.webp` files were deleted. No free photo exists for EV Trend Korea or the Jeju e-Mobility Expo, so they were left out rather than mislabelled.
- **Community:** `<h2>` replaces the mid-page `<h1>`. Numbered News grid, Free list, skeleton rows while loading, and a designed empty state.
- New file `libs/components/homepage/SectionHead.tsx`. Swiper arrows are now real `<button>`s with the same nav classes.

**Checks**
- `tsc` and `yarn build` pass.
- Impeccable detector: 0 findings.
- CDP at 1440, 1280, 768 and 375:
  - headings run h1 → h2 → h3
  - card counts unchanged: Trend 8, Popular 7, Top 8, Dealers 10
  - no horizontal scroll at 1280 or 768
  - at 375 the remaining overflow comes from the footer (731px), navbar and chat, which are shared and out of scope
- Behaviour as `jiyoon_kim`:
  - Top and Trend likes go false → true → false
  - brand chip and body tile open `/car` with the filter
  - card click opens `/car/detail?id=`
  - hero CTA and "See All Dealers" go to the right routes
  - the swiper next button moves the carousel
- iPhone user agent renders the unchanged mobile homepage.

**Open**
- `CommunityCard` labels News cards "Free Board" (existing text bug).
- The navbar and footer are not fluid below about 730px.

**Follow-up (same day):** the ad video (desktop and mobile branches of `Advertisement.tsx`) now plays `/video/hero.mp4` with `poster="/video/hero-poster.jpg"` instead of Nestar's apartment ad `/video/ads.mov`. `ads.mov` is no longer referenced. `tsc` passes, and the change was checked on the dev server.

#### Community board demo data (2026-10-09)

New seed `scripts/seed-community.js` + `scripts/data/community-articles.json`.
- Idempotent: articles are upserted by title + author.
- `--reset` removes only these articles.
- Members are never modified except for `memberArticles`, which is recomputed from ACTIVE articles.
- Ran against `MONGO_DEV`.

**Posts:** 18, from existing members.

| Category | Count | Authors | Content |
|---|---|---|---|
| NEWS | 6 | dealers `seoul_motors`, `hanriver_car`, `busan_kia`, `busan_auto`, `green_ev`, `incheon_ev` | Verified facts only (see sources below) |
| FREE | 4 | users `jiyoon_kim`, `minho_park`, `sora_lee`, `daniel_choi` | Demo opinion posts; no spec, price or offer claims |
| REVIEW | 4 | users | Demo opinion posts; no spec, price or offer claims |
| TIPS | 4 | dealers `gangnam_auto`, `green_ev`, `hanriver_car`, `busan_kia` | Demo opinion posts; no spec, price or offer claims |

- `hana_jung` (DEALER in the DB) and `daegu_city` (USER in the DB) were left out: their member types are the reverse of `demo-members.json`.
- `articleViews` range from 310 to 1240, so homepage ordering is meaningful.
- `articleLikes` and `articleComments` are 0, because there are no like or comment records to back them.
- `createdAt` is spread over the last 26 days.

**News sources**
- Seoul Mobility Show 2025 dates and figures: Wikipedia, Seoul Motor Show.
- Ioniq 9: Hyundai's first three-row EV, E-GMP, 5,060 mm, on sale in Korea H1 2025.
- Kia Tasman: Kia's first pickup, shown at SMS 2025, production from February 2025.
- BIMOS: 2001 start, renamed 2024, 2026 is the 25th anniversary.
- Superrace 2026: circuits and round calendar.

**Images:** `uploads/article/community-*.jpg` (gitignored, so local only).
- 6 news photos come from Wikimedia Commons (CC BY-SA 4.0).
- 12 are copies of credited demo car photos.
- Credits are in `autore-next/public/img/fiber/CREDITS.md`.

**Verified**
- API: 18 posts with correct authors and `memberArticles`.
- Images are served from `/uploads/article`.
- Homepage Community section shows 6 News and 3 Free.
- `/community` tabs list the posts.
- An article detail page renders HTML content (ordered list).

**Known:** the homepage `CommunityCard` still labels News cards "Free Board" (an existing UI text bug, now visible with real data).

## Mobile live chat (`~/Desktop/autore-next`, 2026-10-21)

The existing WebSocket chat (`libs/components/Chat.tsx`) was rendered only in the desktop branch of the layouts, and its styles existed only under `#pc-wrap`. It is now available on mobile too. Backend and desktop behavior are unchanged.

**Changes**
- `LayoutHome.tsx`, `LayoutFull.tsx`, `LayoutBasic.tsx`: `<Chat />` added to the `device == 'mobile'` branch (between `#main` and `#footer`). `LayoutAdmin` unchanged.
- `scss/mobile/chat.scss` (new, imported in `scss/mobile/main.scss` after `mobileV2.scss`): styles scoped to `#mobile-wrap .chatting`.
  - Button: bottom-right, above the tab bar (`z-index: 1150`).
  - On `/car/detail` (`.raised`), the button sits above `.cd-mbar`.
  - Frame: full screen (`100dvh`, `z-index: 1200`), slides up from the bottom, uses safe-area insets, and has a 16px input to prevent iOS zoom.
- `Chat.tsx`:
  - Adds a mobile-only close button (`.chat-close`) to the chat header.
  - Locks body scroll while the chat is open on mobile.
  - Adds the `raised` class on `/car/detail`.
  - Bug fix: new messages no longer mutate state (`setMessagesList((prev) => [...prev, newMessage])`, effect deps `[socket]`), and `onmessage` is not attached until the socket exists.

**Verified**
- `tsc --noEmit` passes.
- `yarn build` passes (72 pages).
- Playwright iPhone 13 emulation:
  - The button sits above the tab bar.
  - The chat opens full screen.
  - Messages between a mobile client and a desktop client appear on both.
  - Body scroll is locked and unlocked correctly.
  - The `/car/detail` button sits above `.cd-mbar`.
  - No page errors.
- The desktop chat looks the same as before.

## AI assistant, phase 1 (2026-10-21)

The mobile chat now has two tabs: **AI assistant** (new) and **Live chat** (the existing WebSocket chat). The assistant turns a plain-language request into a car search. The AI never invents cars: it only produces filters, and the results come from the existing `CarService.getCars`.

**How it works:** one Gemini `generateContent` call (REST through the existing `axios` dependency, so no new package) returns JSON in this shape:

```
{ intent, reply, filters, sort, direction, chips }
```

The backend validates the filters against the enums and ranges, builds a `CarsInquiry`, and runs `getCars`.

### Backend (`apps/autore-api`)

**New `components/ai/` module:**
- `ai.module.ts` imports `AuthModule` and `CarModule`. It is registered in `components.module.ts`.
- `ai.resolver.ts` exposes `askAssistant(input: AiAskInput): AiAnswer`, a mutation guarded by `WithoutGuard`, so guests can use it too.

**`ai.service.ts`:**
- Configuration:
  - Model: `gemini-3.5-flash-lite`, which can be overridden with `GEMINI_MODEL`.
  - Key: `GEMINI_API_KEY`. It is sent only in the `x-goog-api-key` header and is never logged.
- Filter sanitising:
  - Only enum values are kept.
  - Numbers are clamped to `0..2,000,000,000` (the GraphQL Int limit).
  - Reversed ranges are swapped.
  - The keyword is regex-escaped and capped at 40 characters.
- Limits: 30 questions per day per member, or per IP for guests (taken from `x-forwarded-for` when present). Usage is counted in memory.
- Fallback: a localized `fallback: true` answer (en/kr/ru) is returned when the key is missing, the daily limit is reached, Gemini fails (429/timeout), the JSON is invalid, or the database search fails.
- Privacy: only the user's text and chat history are sent to Gemini, never member data.
- `searchInput` is a `CarsInquiry` with `Direction` as `"ASC"`/`"DESC"`, ready to use as `/car?input=...`.

**DTOs:** `libs/dto/ai/ai.input.ts` and `libs/dto/ai/ai.ts`.
- `message` is 1–500 characters.
- `history` holds at most 8 items, each with role `user` or `assistant` and 1–600 characters of text.
- `lang` is `en`, `kr` or `ru`.

### Frontend (`~/Desktop/autore-next`)

**New files:**
- `apollo/user/mutation.ts`: `ASK_ASSISTANT`.
- `libs/types/ai/ai.ts`.
- `libs/components/AiAssistant.tsx`:
  - Shows starter chips, typing dots, a horizontal row of car cards (links to `/car/detail`), and "See all (N)" (opens `/car?input=...`).
  - Shows follow-up chips and an "AI answers can be inaccurate" note.
  - Keeps the conversation in `sessionStorage`, so it survives page changes.
  - Pressing Enter while a Korean IME is composing does not send the message.

**Changes:**
- `Chat.tsx`: on mobile, the header has tabs (AI / Live, with the online count). The AI pane stays mounted when hidden, so its history is kept. Desktop markup is unchanged.
- `scss/mobile/chat.scss`: styles for the tabs and the AI pane.
- `public/locales/{en,kr,ru}/common.json`: 12 new keys. Existing keys are untouched.

### Verified
- Backend: `tsc` (api + batch) and `nest build` pass.
- 30/30 service unit checks pass, covering:
  - Enum filtering and deduplication.
  - Ranges and caps.
  - Regex escaping.
  - Chips.
  - The chat intent, where no database query runs.
  - Zero results (localized message).
  - Invalid JSON, 429 and database errors.
  - History role mapping.
  - The daily limit (the 31st request is blocked without calling the AI).
- GraphQL e2e with the real resolver, `ValidationPipe` and `WithoutGuard`:
  - Guests and members both work.
  - Invalid input (empty or long message, bad `lang`, bad role, history over 8 items) is rejected.
  - `searchInput` is accepted by the real `getCars` schema.
- Frontend: `tsc` and `yarn build` pass.
- Playwright on an iPhone 13, against the real AI module, the seed cars and a mocked Gemini:
  - Chip → typing → cars → refine ("cheaper" sends the history).
  - Live tab message, and switching back keeps the AI history.
  - "See all" opens `/car` with the filters and closes the chat.
  - The history is restored on the new page, and a car card opens the detail page.
  - Korean UI and replies.
  - Desktop is unchanged.
  - No page errors.

### Not verified
A live Gemini call. Neither test environment can reach `generativelanguage.googleapis.com`, so it has to be tested on the Mac.

### AI assistant on PC (2026-10-21)

The AI assistant and Live chat tabs are now shown on desktop as well as mobile.

**Changes**
- `Chat.tsx`:
  - The tabs and the AI pane render on every device.
  - The old "Online Chat" title and `RippleBadge` header was removed. The online count now appears on the Live tab.
  - The ✕ close button and the body scroll lock remain mobile only.
- Styles:
  - The tab and AI pane styles moved out of `scss/mobile/chat.scss` into the new shared file `scss/chat-ai.scss`.
  - That file uses the selector `#mobile-wrap, #pc-wrap .chatting .chat-frame` and is imported at the end of `scss/app.scss`.
- PC chat frame:
  - Size is 400×600, with `max-height: calc(100vh - 180px)`.
  - When closed it sits at `right: -440px`, so no part of it shows.
  - The selector is `body #pc-wrap#pc-wrap ...`, which is needed to beat the same-specificity V01 rule that loads later.

**Verified**
- `tsc` and `yarn build` pass.
- Playwright at 1440×900 and 1280×720:
  - The closed frame is fully off-screen.
  - The open frame stays inside the viewport.
  - The AI chip returns 6 cars and "See all (9)".
  - Live chat messages work.
  - "See all" opens `/car` and closes the chat.
- The iPhone 13 regression check passes.
- No page errors.
