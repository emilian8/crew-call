# Design Notes — Notify
**Concept:** Notify
**Purpose:** Deliver notifications to users when duties are assigned or due soon, and allow users to
mark them as read or delete them.
**Date:** 2025-10-16
---
## Key Changes from Assignment 2
| Change | Reason |
|--------|---------|
| **Added `deleteNotification` action** | Addresses feedback on missing lifecycle/cleanup actions. |
| **Added explicit access control checks** (`user = recipient`) | Ensures users can only modify or delete
their own notifications. |
| **Refined `notify` to include subject/body validation** | Prevents empty or malformed notifications. |
| **Introduced optional `userExists` guard** | Keeps the concept modular while still allowing validation
against external user directories. |
| **Added timestamps (`createdAt`)** | Improves auditability and aligns with other concept structures. |
| **Defined clear return types** (`{ notification }` or `{ error }`) | Consistency with EventDirectory,
DutyRoster, and RotationGroups implementations. |
---
## Implementation Notes
- **Persistence:** Uses a single MongoDB collection `Notify.notifications` with minimal fields for
readability and query simplicity.
- **Access Control:** Enforced via runtime checks; external modules cannot alter another user's
notifications.
- **Validation:** Ensures non-empty `subject` and `body` before insertion.
- **Guard Function:** The `userExists` guard allows recipient validation but keeps Notify independent of
EventDirectory.
- **Testing:** Five tests validate the principle workflow, permission rules, validation, idempotency, and
optional guard behavior.
---
## Issues & Fixes
| Issue | Resolution |
|-------|-------------|
| **TypeScript type union issues** | Resolved by explicitly returning `{ error: auth.error }` instead of
direct unions. |
| **Idempotent read marking** | Implemented early return when a notification is already read, ensuring
repeat calls are safe. |
| **Guard flexibility** | Implemented Notify to work both with and without a guard function, satisfying
modularity requirements. |
---
## Result
The **Notify** concept now provides a complete and independent notification subsystem that integrates
cleanly with other components via synchronizations.
