# Backend Engineering Handbook

Course Marketplace Platform

## Project Philosophy

This backend must:

- Be production-ready
- Be secure
- Be modular
- Be migration-friendly during the commerce-to-course cutover
- Follow clear service and data boundaries

The target system is a course marketplace with instructor-owned content, student enrollments, protected lesson playback, and payment-backed access control.

## Architecture Standard

We use a modular monolith architecture.

Each module should follow this structure:

```text
module/
  controller.ts
  service.ts
  repository.ts
  validator.ts
  routes.ts
  types.ts
```

Rules:

- Controllers handle request/response only.
- Services contain business logic.
- Repositories contain Prisma queries only.
- Shared middleware, shared errors, and shared response helpers should stay centralized.

## Authentication Standard

- Better Auth is the platform auth standard.
- Manual email/password auth and Google login must resolve to the same session model.
- Protected routes must use Better Auth session lookup.
- Role-based authorization is mandatory.
- Unverified or blocked users must be rejected on protected routes where appropriate.

## Core Domain Direction

The target domain is:

- Users
- Courses
- Lessons
- Enrollments
- Payments
- Reviews
- Course categories
- Lesson progress

The old store/product/cart domain is being retired.

## Payment And Access Rules

- Course access is granted only after trusted payment confirmation.
- Stripe webhook handling must be signature-verified and idempotent.
- Payment confirmation and enrollment creation must be transactional.
- Students must not receive protected playback access without enrollment.

## Security Standards

- Helmet middleware
- CORS whitelist
- Rate limiting
- Centralized error handling
- Zod validation on all route inputs
- No raw internal errors in production responses
- Environment validation at startup

## Performance Standards

- Pagination required for listing endpoints
- Avoid N+1 queries
- Add indexes for slugs, foreign keys, Stripe identifiers, and progress lookups
- Use explicit Prisma selects to limit payload size

## API Response Standard

All APIs should use the shared response envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "meta": {}
}
```

Do not return raw Prisma payloads directly.

## Implementation Tracking

The ordered execution checklist for the conversion lives in `plan.md`.

## Production Readiness Checklist

- All endpoints validated
- All protected routes authenticated and authorized
- Payment and enrollment flows transactional
- Required indexes added
- Sensitive fields excluded from public responses
- Operational logging added for money/access-critical flows
- Environment documented and validated
