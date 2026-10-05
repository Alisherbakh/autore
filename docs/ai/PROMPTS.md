# Prompts

## 1. Useful prompts from this session

Original wording, lightly corrected.

### 1.1 Structure analysis (read-only)

```
Only analyze the current Nestar monorepo structure to transform the existing
NestJS monorepo Nestar platform into the Autore car selling platform.
```

Result: found that the domain migration was already done, and listed the gaps (Notice/Notification, sales flow, socket, model catalog) and bugs.

### 1.2 Safe rename layer

```
Safe rename layer (no business logic change): rename all visible project/app
identifiers from Nestar to Autore. Do not change domain logic. Keep the API
unchanged. Update package names, environment labels, constants. Run lint and
typecheck after refactoring. Please make a plan first!
```

Result: a repo-wide audit, a plan with a baseline check, one README edit, and the lint tooling repaired.

### 1.3 Session documentation

```
Create a docs folder with BACKEND_MIGRATION.md, DECISIONS.md,
FRONTEND_MIGRATION.md, COMPLETED_TASKS.md, NEXT_STEPS.md, PROMPTS.md
summarizing the Nestar → Autore migration state. Do not change application
source code. Be precise and technical. Use markdown tables.
```

## 2. Reusable prompts for the next session

### 2.1 Session start

```
Read AGENTS.md and docs/ai/*.md. Summarize the current migration state in 10
lines and propose today's top 3 tasks from docs/ai/NEXT_STEPS.md. Don't edit
anything yet.
```

### 2.2 Prettier-only commit

```
Run Prettier over apps/**/*.ts only. No other edits. Then run
`npx tsc --noEmit` for autore-api and autore-batch and
`npx eslint "apps/**/*.ts"` (WITHOUT --fix), and report the error counts
before and after. Show `git diff --stat`, but don't commit until I approve.
```

### 2.3 Targeted backend fix

```
Fix <issue from docs/ai/NEXT_STEPS.md> in autore-api. Keep the GraphQL API
unchanged (same operation names, args, return types). Make the minimal
change, match the existing code style (tabs/spaces, Uzbek comments,
console.log('Query: ...') convention). Run typecheck after. Update
docs/ai/COMPLETED_TASKS.md and NEXT_STEPS.md.
```

### 2.4 New component module (follow the Nestar pattern)

```
Add a <Notice|Notification|Inquiry> module to autore-api following the
existing car module pattern exactly:
- schemas/<X>.model.ts (already exists for Notice/Notification, so reuse it)
- libs/dto/<x>/<x>.ts, <x>.input.ts, <x>.update.ts with class-validator
- components/<x>/<x>.module.ts, .service.ts, .resolver.ts
- register in components.module.ts
- guards: WithoutGuard for public reads, AuthGuard for member writes,
  RolesGuard(ADMIN) for admin operations
- inquiry shape: page, limit, sort, direction, search; $facet list/metaCounter
Make a plan first, listing every file and GraphQL operation name.
```

### 2.5 Frontend leftover sweep (autore-next)

```
In ~/Desktop/autore-next, find every remaining real-estate/Nestar term
(nestar, property, agent, villa, apartment, rooms, beds, square) in pages,
libs, apollo, scss and public. Ignore false positives such as
navigator.userAgent and the MUI `square` prop. Make a table: file:line,
leftover, proposed rename. Don't edit until I approve.
```

### 2.6 Frontend ↔ backend contract check

```
Compare every gql operation in ~/Desktop/autore-next/apollo with the
autore-api resolvers and DTOs. For each operation, list the fields selected
on the frontend that don't exist on the backend type, and argument names or
types that don't match. Read-only.
```

### 2.7 e2e car flow test

```
Write an e2e test in apps/autore-api/test for the car flow: signup DEALER →
createCar → getCars (brand + price filter) → updateCar to RESERVED → SOLD →
check that memberCars decremented. Use a separate test database from env.
Replace the scaffold "Hello World!" spec. Run it and report the output.
```

### 2.8 Session close

```
Update docs/ai/COMPLETED_TASKS.md (what changed today, files, validation
results) and docs/ai/NEXT_STEPS.md (re-prioritize). Don't change source code.
```

## 3. Prompting rules that worked

| Rule | Why |
|---|---|
| Say "plan first" for any multi-file change | You see the scope before any edits |
| Say "read-only" / "only analyze" for audits | Prevents unrequested edits |
| State constraints explicitly: "keep API unchanged", "no business logic change" | Keeps diffs reviewable |
| Ask for lint **without `--fix`** | `npm run lint` rewrites about 2,000 lines |
| Ask for before/after validation counts | Makes regressions visible |
