---
name: product-logic
description: Review Autore car API consistency across GraphQL operations, DTOs, schemas, enums, filters, and remaining legacy terminology.
---

# Autore Car API Review

Use this skill for review-only passes or pre-edit analysis of the car API.

## Review Checklist

- Confirm GraphQL operation names use car terminology:
  - `createCar`
  - `getCar`
  - and where it is related
- Confirm shared operations such as `getFavorites` and `getVisited` return car data.
- Confirm DTOs, schemas, and enums agree on car fields and nullability.
- Confirm filters use car type, brand, fuel type, transmission, condition, price, year, mileage and etc.
- Report real findings with paths and behavior impact.
