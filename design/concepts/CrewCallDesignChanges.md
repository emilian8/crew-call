# Application-Wide Design Notes
**Project:** CrewCall – Group Duty Management System
**Purpose:** Centralize duty assignment, event management, reusable rotations, and notifications
across group events.
**Date:** 2025-10-16
---
## 1. Overall Architecture
The backend was implemented through four modular concepts — **EventDirectory**, **DutyRoster**,
**RotationGroups**, and **Notify** — each with its own MongoDB-backed state, actions, and
synchronizations.
Every concept is independent and communicates only through shared identifiers and declarative syncs,
maintaining strict separation of concerns.
---
## 2. System Integration Overview
- **EventDirectory** defines events and memberships (organizers vs. members).
- **DutyRoster** manages duties within those events.
- **RotationGroups** applies pre-defined templates of duties to new events, producing granular sync
data.
- **Notify** delivers assignment and reminder messages when triggered by other concepts.
This dependency graph (EventDirectory → DutyRoster → Notify, EventDirectory → RotationGroups →
DutyRoster) ensures a clean, top-down flow of control.
---
## 3. Key Changes from Assignment 2
| Change | Reason |
|--------|---------|
| **Added explicit access control** | All modifying actions now verify organizer/owner roles explicitly. |
| **Added lifecycle and cleanup actions** | Enables full CRUD coverage and consistent database state
management. |
| **Introduced timestamps and uniform return types** | Improves traceability and consistent testing
across concepts. |
| **Separated reusable logic via helpers** | Common guards and validation helpers reduce redundancy
and errors. |
---
## 4. Six Key Development Moments
### (1) **Explicit Role Enforcement**
Implementing true permission guards inside each concept was the most impactful improvement. This
clarified ownership rules and matched the real-world structure of group organization systems.
### (2) **Granular Synchronizations**
RotationGroups initially bundled all duty creation in a loop; refactoring into one record per emitted duty
enabled declarative sync behavior and smoother DutyRoster integration.
### (3) **Idempotent and Safe Actions**
Several actions (e.g., `markRead`, `setActive`, `reOpen`) were redesigned to be idempotent —
ensuring repeated calls don’t introduce side effects or inconsistent states.
### (4) **Access-Control via Guards**
Organizer and user existence guards were added to maintain modular independence. This allowed
each concept to enforce permissions without coupling to EventDirectory or a shared user store.
### (5) **Normalization of Template Data**
Duplicate member and duty names caused subtle testing issues in RotationGroups. Adding
normalization logic ensured clean, predictable templates and consistent sync outputs.
### (6) **Consistent Design Across All Concepts**
Enforcing identical return shapes, timestamps, and naming conventions made all tests easier to write,
reuse, and verify. It also created a unified backend style consistent with 6.1040 design principles.
---
## 5. Result
The final CrewCall backend forms a cohesive, modular architecture supporting event-based duty
management with reusable rotations and reliable notifications.
