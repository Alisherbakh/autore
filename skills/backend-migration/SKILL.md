---
name: backend-migration
description: Continue the Autore backend migration from Nestar property concepts to Autore car concepts while preserving the existing NestJS architecture.
---

# Autore Backend Migration

Use this skill when changing backend code for the Autore car migration.

## Workflow

1. Search for affected property/car references before editing.
2. Preserve the resolver/service/module structure already used by `autore-api`.
3. Keep DTOs, enums, and schemas in their existing folders.
4. Keep `MemberType.USER | DEALER | ADMIN` unchanged.
5. Use car terminology for catalog behavior and database lookups.
6. Update social modules consistently when car counters, likes, views, comments, or notifications are involved.
7. Update batch logic when car ranking or `memberCars` affects rank calculations.
8. Update `docs/ai/COMPLETED_TASKS.md` after major completed work.
