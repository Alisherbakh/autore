# Autore Backend Agent Instruction

Autore is a NestJS GraphQL monorepo migrated from Real estate platform into a car platform

## Read First

Before changing code, read the current AI handoff docs:

- `docs/ai/BACKEND_MIGRATION.md`
- `docs/ai/DECISIONS.md`
- `docs/ai/COMPLETED_TASKS.md`
- `docs/ai/NEXT_STEPS.md`

Use those files as the source of truth for AI Agent related migration history, accepted decisions, remaining work and validation status.

## Project Shape

- Backend apps are `autore-api` and `autore-batch`.
- Keep the existing NestJS resolver/service/module pattern based on MVC and DI.
- Keep DTOs, enums, schemas under `apps/autore-api/src/libs`.
- Keep shared modules reusable: auth, member, like, view, comment, follow, board article, socket.


## Domain Rules

- Use Autore/car terminology for the main catalog entity.
- Do not reintroduce property or real-estate fields.
- Keep `MemberType.USER`, `MemberType.DEALER` and `MemberType.ADMIN` unchanged.
- Car ownership continues to use `MemberType.DEALER` unless a later migration explicitly changes it.
- Car enum values are:
  - `CarType`: `SEDAN`, `SUV`, `HATCHBACK`, `COUPE`, `CONVERTIBLE`, `WAGON`, `VAN`, `PICKUP`
  - `CarStatus`: `ACTIVE`, `RESERVED`, `SOLD`, `DELETE`
  - `CarLocation`: `SEOUL`, `BUSAN`, `INCHEON`, `DAEGU`, `GYEONGJU`, `GWANGJU`, `CHONJU`, `DAEJON`, `JEJU`
  - `CarBrand`: `HYUNDAI`, `KIA`, `GENESIS`, `KGM`, `CHEVROLET`, `RENAULT`, `TOYOTA`, `BMW`, `MERCEDES`, `AUDI`, `VOLKSWAGEN`, `TESLA`, `OTHER`
  - `CarFuelType`: `GASOLINE`, `DIESEL`, `HYBRID`, `ELECTRIC`, `LPG`, `HYDROGEN`
  - `CarTransmission`: `AUTOMATIC`, `MANUAL`
  - `CarCondition`: `NEW`, `USED`

## Workflow

1. Analyze before editing.
2. Keep changes small and consistent with existing project patterns.
3. Do not remove working logic unless it is replaced safely.
4. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
5. Add or update focused tests when behavior changes.

## Validation

Use these checks for backend work:

```bash
npx tsc -p apps/autore-api/tsconfig.app.json --noEmit
npx tsc -p apps/autore-batch/tsconfig.app.json --noEmit
npm run build
```

`npm run lint` runs ESLint with `--fix`, so use it only when file rewriting is acceptable!
