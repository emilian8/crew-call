# Design Notes — DutyRoster (Assignment 4a)

**Concept:** DutyRoster
**Purpose:** Represent and manage all duties for an event, including their assignment and completion lifecycle.
**Date:** 2025-10-16

---

## Key Changes from Assignment 2

| Change | Reason |
|--------|---------|
| **Added lifecycle actions** (`unassignDuty`, `updateDuty`, `deleteDuty`) | Addressed feedback noting missing edit/cleanup actions. These now allow organizers to modify and clean up duties. |
| **Added explicit permission guards** (`requires Organizer`) | Enforces that only organizers can modify or assign duties. Fulfills feedback on explicit access control. |
| **Extended duty lifecycle** | Clarified legal transitions (Open → Assigned → Done → ReOpen → Open). Matches real usage and supports better testing. |
| **Added timestamps (`createdAt`, `updatedAt`)** | Supports persistence and auditability, aligning with MongoDB backend design. |
| **Separated state and permissions logic** | Implemented `requireOrganizer()` helper for modularity and reused across actions. |
| **Implemented consistent return types** (`{}`, `{ duty: ID }`, `{ error: string }`) | Matches LikertSurvey and EventDirectory conventions for Deno testing. |

---

## Implementation Notes

- **Persistence:** Uses a single MongoDB collection `DutyRoster.duties` for simplicity.
- **Access Control:** Organizer checks implemented through a generic `organizerGuard`, keeping this concept independent from `EventDirectory`.
- **Validation:** Ensures `dueAt` is a valid `Date` object before inserts or updates.
- **Status Transitions:** Prevents illegal transitions (e.g., assigning a duty already `Done`, reopening only from `Done`).
- **Testing:** Five tests — one principle and four variants — covering permission enforcement, transitions, validation, and deletion.

---

## Issues & Fixes

| Issue | Resolution |
|-------|-------------|
| **TypeScript type error (TS2322)** | Fixed by explicitly returning `{ error: auth.error }` to satisfy the union type. |
| **Need for flexible role validation** | Added injectable `organizerGuard` to simulate EventDirectory’s permissions without direct coupling. |
| **Date validation failures** | Added `isDate()` helper for strong runtime checks. |

---

## Result

The DutyRoster implementation now supports a complete, testable duty lifecycle with explicit permission control, realistic data persistence, and clean modular separation.
It fully addresses all Assignment 2 feedback and aligns with 6.1040’s Assignment 4a backend design expectations.
