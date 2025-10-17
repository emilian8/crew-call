# Design Notes — RotationGroups (Assignment 4a)
**Concept:** RotationGroups
**Purpose:** Enable organizers to define reusable templates of members and duties that can be
applied to new events.
**Date:** 2025-10-16
---
## Key Changes from Assignment 2
| Change | Reason |
|--------|---------|
| **Added update and delete actions** (`updateTemplate`, `deleteTemplate`) | Addresses missing
lifecycle actions mentioned in feedback. |
| **Added permission guards** (`requires actor = owner`) | Makes access control explicit rather than
implied. |
| **Refined applyTemplate into granular structure** | Uses per-duty "applied duty" records to ensure
declarative, sync-friendly operation. |
| **Added timestamps (`createdAt`, `updatedAt`)** | Enables consistent audit tracking and aligns with
other implemented concepts. |
| **Normalized member and duty lists** | Ensures duplicates and blank entries are removed, improving
data integrity. |
| **Introduced separate collections for templates, applications, and applied duties** | Clarifies lifecycle:
templates are static definitions, while applications are event-specific instances. |
---
## Implementation Notes
- **Persistence:** Three MongoDB collections:
- `RotationGroups.templates` — stores reusable templates.
- `RotationGroups.applications` — records each template application to an event.
- `RotationGroups.applied_duties` — stores granular duty records emitted by applications.
- **Access Control:** Owner-only modification and application enforced through `requireOwner()`
helper.
- **Synchronization Readiness:** Each emitted duty entry allows DutyRoster synchronizations to create
real duties automatically.
- **Return Types:** Consistent with EventDirectory and DutyRoster — `{}` or `{ error }` for void actions,
IDs returned on create/apply.
- **Testing:** Five comprehensive tests cover the principle flow, permission enforcement, input
validation, normalization, and delete semantics.
---
## Issues & Fixes
| Issue | Resolution |
|-------|-------------|
| **TypeScript type error (TS2322)** | Fixed by returning `{ error: auth.error }` explicitly instead of union
type. |
| **Normalization edge cases** | Added `normalizeUsers()` and `normalizeStrings()` helpers to clean
data. |
| **Data modeling complexity** | Introduced `applied_duties` collection to separate template design
from instantiation logic. |
---
## Result
`RotationGroups` now fully supports reusable and declarative rotation planning. It incorporates strong
access control, clean data modeling, and testable integration with other concepts.
