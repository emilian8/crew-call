# Design Notes — EventDirectory (Assignment 4a)

**Concept:** EventDirectory
**Purpose:** Manage events, memberships, and participant roles (Organizer, DutyMember).
**Date:** 2025-10-16

---

## Key Changes from Assignment 2

| Change | Reason |
|--------|---------|
| **Added lifecycle actions** (`removeMember`, `deleteEvent`) | Addressed grader note on missing cleanup actions. |
| **Added permission guards** (`requires Organizer`) | Enforced explicit access control instead of implied permissions. |
| **Refined `setActive` action** | Made activation/deactivation explicit and testable. |
| **Introduced timestamps and IDs** (`createdAt`, `updatedAt`, `Membership ._id`) | Needed for database integrity and auditability. |
| **Added access-control sync rule** | Demonstrates declarative enforcement of organizer-only mutations. |
| **Unified error handling** → `{}` or `{ error }` | Matches LikertSurvey convention for consistent test logic. |

---

## Implementation Notes

- Two MongoDB collections: `EventDirectory.events` and `EventDirectory.memberships`.
- Helpers `eventExists()` and `hasOrganizerRole()` prevent duplicate logic.
- Tests cover one principle flow (create → invite → setActive) and 4 variant scenarios (validation, permissions, idempotent invites, deletion).
- No inter-concept calls; other concepts reference only `Event` IDs.

---

## Issues & Fixes

- **Env var mismatch:** `MONGODB_URL` expected → added to `.env`.
- **Date validation:** ensured `startsAt < endsAt` and instances of `Date`.
- **Cascade delete:** verified that `deleteEvent` also removes memberships.

---

**Result:**
EventDirectory now fully enforces permissions, supports proper lifecycle cleanup, and aligns with the modularity and testing expectations of Assignment 4a.
