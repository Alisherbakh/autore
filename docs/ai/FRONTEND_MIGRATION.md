# Frontend Migration: nestar-next → autore-next

| Item | Nestar | Autore |
|---|---|---|
| Location | `~/Desktop/nestar-next` | `~/Desktop/autore-next` |
| Package name | `nestar-next` | `autore-next` |
| Stack | Next.js (pages router), Apollo Client, MUI, SCSS, next-i18next (`en`, `kr`, `ru`) | Same |
| Commit | n/a | `83297e6 feat: start client  migration process` (working tree clean) |

**Current state:** the rename is mostly complete. Pages, components, Apollo operations, types and enums already use Car/Dealer names, and every Apollo operation matches an existing backend operation. What's left are SCSS class names, comments, one image, and checking that the app builds and works against the API. **`autore-next` has not been type-checked or built in this session.**

---

## 1. Step-by-step plan

| Step | Task | Status |
|---|---|---|
| 1 | Copy `nestar-next` → `autore-next`, rename the package | Done |
| 2 | Rename routes: `pages/property/*` → `pages/car/*`, `pages/agent/*` → `pages/dealer/*`, `_admin/properties` → `_admin/cars` | Done |
| 3 | Rename components (table 2) | Done |
| 4 | Mirror backend DTOs in `libs/types/car/*` and `libs/enums/car.enum.ts`, keeping them in sync with `autore-api/src/libs` | Done (field-by-field check pending) |
| 5 | Rename Apollo operations in `apollo/user/*` and `apollo/admin/*` (table 3) | Done |
| 6 | Rewrite filters (`car/Filter.tsx`, `homepage/HeaderFilter.tsx`) for brand, fuel, transmission, condition and year/mileage/price ranges | Done |
| 7 | Update i18n terminology in `public/locales/{en,kr,ru}/common.json` | Done (no property/agent strings left) |
| 8 | Remove leftovers (section 5) | **To do** |
| 9 | `npx tsc --noEmit` and `next build` | **To do** |
| 10 | Smoke test against `autore-api` with seed data (`npm run seed:cars`) | **To do** |
| 11 | Wire `_admin/cs/*` and the notice pages once the backend Notice/Notification modules exist | Blocked by backend |
| 12 | Replace the Chat with buyer↔dealer chat once the backend socket is redesigned | Blocked by backend |

## 2. Page and component mapping

### Pages

| Nestar | Autore |
|---|---|
| `pages/property/index.tsx` | `pages/car/index.tsx` |
| `pages/property/detail.tsx` | `pages/car/detail.tsx` |
| `pages/agent/index.tsx` | `pages/dealer/index.tsx` |
| `pages/agent/detail.tsx` | `pages/dealer/detail.tsx` |
| `pages/_admin/properties/index.tsx` | `pages/_admin/cars/index.tsx` |
| `index`, `about`, `account/join`, `community/*`, `cs`, `member`, `mypage`, `_admin/{index,users,community,cs/*}` | Unchanged paths |

### Components (`libs/components/`)

| Nestar | Autore |
|---|---|
| `property/Filter.tsx`, `PropertyCard.tsx`, `Review.tsx` | `car/Filter.tsx`, `CarCard.tsx`, `Review.tsx` |
| `agent/ReviewCard.tsx` | `dealer/ReviewCard.tsx` |
| `admin/properties/` | `admin/cars/` |
| `common/PropertyBigCard.tsx` | `common/CarBigCard.tsx` |
| `common/AgentCard.tsx` | `common/DealerCard.tsx` |
| `common/FiberContainer.tsx`, `ScrollControls.tsx` | Removed |
| n/a | `common/Logo.tsx` (new) |
| `homepage/PopularProperties.tsx`, `PopularPropertyCard.tsx` | `homepage/PopularCars.tsx`, `PopularCarCard.tsx` |
| `homepage/TopProperties.tsx`, `TopPropertyCard.tsx` | `homepage/TopCars.tsx`, `TopCarCard.tsx` |
| `homepage/TrendProperties.tsx`, `TrendPropertyCard.tsx` | `homepage/TrendCars.tsx`, `TrendCarCard.tsx` |
| `homepage/TopAgents.tsx`, `TopAgentCard.tsx` | `homepage/TopDealers.tsx`, `TopDealerCard.tsx` |
| n/a | `homepage/HeroSection.tsx`, `BrandStrip.tsx`, `CarTypes.tsx` (new) |
| `member/MemberProperties.tsx` | `member/MemberCars.tsx` |
| `mypage/AddNewProperty.tsx`, `MyProperties.tsx`, `PropertyCard.tsx` | `mypage/AddNewCar.tsx`, `MyCars.tsx`, `CarCard.tsx` |
| `libs/types/property/*`, `libs/enums/property.enum.ts` | `libs/types/car/*`, `libs/enums/car.enum.ts` |
| SCSS `scss/pc/property`, `scss/pc/agent` | `scss/pc/car`, `scss/pc/dealer` |

## 3. GraphQL query/mutation rename plan

Operation constants live in `apollo/user/{query,mutation}.ts` and `apollo/admin/{query,mutation}.ts`.

| Nestar operation | Autore operation | Variable / argument |
|---|---|---|
| `GET_PROPERTIES` / `getProperties` | `GET_CARS` / `getCars` | `input: CarsInquiry` |
| `GET_PROPERTY` / `getProperty` | `GET_CAR` / `getCar` | `carId` |
| `GET_AGENT_PROPERTIES` / `getAgentProperties` | `GET_DEALER_CARS` / `getDealerCars` | `input: DealerCarsInquiry` |
| `GET_AGENTS` / `getAgents` | `GET_DEALERS` / `getDealers` | `input: DealersInquiry` |
| `CREATE_PROPERTY` / `createProperty` | `CREATE_CAR` / `createCar` | `input: CarInput` |
| `UPDATE_PROPERTY` / `updateProperty` | `UPDATE_CAR` / `updateCar` | `input: CarUpdate` |
| `LIKE_TARGET_PROPERTY` / `likeTargetProperty` | `LIKE_TARGET_CAR` / `likeTargetCar` | `carId` |
| `GET_ALL_PROPERTIES_BY_ADMIN` | `GET_ALL_CARS_BY_ADMIN` / `getAllCarsByAdmin` | `input: AllCarsInquiry` |
| `UPDATE_PROPERTY_BY_ADMIN` | `UPDATE_CAR_BY_ADMIN` / `updateCarByAdmin` | `input: CarUpdate` |
| `REMOVE_PROPERTY_BY_ADMIN` | `REMOVE_CAR_BY_ADMIN` / `removeCarByAdmin` | `carId` |
| `GET_FAVORITES`, `GET_VISITED` | Same names, now return `Cars` | `input: OrdinaryInquiry` |

**Selection-set field changes** apply to every Car query:

- Removed: `propertySquare`, `propertyBeds`, `propertyRooms`, `propertyRent`, `constructedAt`.
- Renamed: every `property*` field becomes `car*`, and `memberProperties` becomes `memberCars`.
- Added: `carBrand`, `carModel`, `carYear`, `carMileage`, `carFuelType`, `carTransmission`, `carCondition`, `carEngineSize`, `carSeats`, `carColor`, `carVin`, `carCredit`.

**Verification:** the operation names in `autore-next/apollo` (35 total) were compared with the `autore-api` resolvers and all of them exist in the backend. Selection sets have **not** yet been validated against the generated schema. Do that in step 9, for example by running each operation in the Apollo playground at `/graphql`.

## 4. UI terminology changes

| Nestar term | Autore term |
|---|---|
| Property / Properties | Car / Cars |
| Agent / Agents | Dealer / Dealers |
| Property Search | Car Search |
| Property type (Apartment, Villa, House) | Car type (Sedan, SUV, Hatchback, Coupe, Convertible, Wagon, Van, Pickup) |
| Rooms / Beds / Square (m²) | Brand / Fuel / Transmission / Year / Mileage (km) |
| Rent option | Credit option (`carCredit`) |
| Barter option | Barter option (unchanged, `carBarter`) |
| Agent Page | Dealer Page |
| My Properties / Add New Property | My Cars / Add New Car |
| Status: Active / Sold | Active / Reserved / Sold |
| Board categories: Free / Recommend / News / Humor | Free / Review / News / Tips |
| Price | Price in ₩ (KRW), as used in the `en` locale's hero text |

## 5. Remaining leftovers in autore-next

| File | Leftover | Action |
|---|---|---|
| `libs/components/homepage/HeaderFilter.tsx:390,438,445` | CSS classes `filter-rooms`, `room` | Rename to `filter-brands` / `chip`, and update `scss/pc/main.scss` and `scss/pc/theme/v01.scss` |
| `libs/components/car/Filter.tsx:249,295,341` | CSS class `square-year-input` | Rename to `range-input`, and update `scss/pc/car/car.scss` |
| `libs/components/mypage/Article.tsx:14` | `/img/apartmentMain.png` | Replace with a car image under `public/img/car/` |
| `public/img/banner/header3.svg` | Contains the text "VillA" | Replace the asset |
| `libs/components/mypage/AddNewCar.tsx:23`, `scss/pc/theme/v01-pages.scss:5` | Comments mention "nestar" | Reword the comments |
| `.env` | `REACT_APP_API_URL`, `REACT_APP_API_GRAPHQL_URL`, `REACT_APP_API_WS` | Brand-neutral; keep. Point them at `autore-api` (`PORT_API`). |

`libs/hooks/useDeviceDetect.ts` matches "agent" only through `navigator.userAgent`, so it's not a leftover.
