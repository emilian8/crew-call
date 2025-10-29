# CrewCall Updates (4b)

This document summarizes the notable backend and frontend changes implemented during this iteration, with focus on event creation UX, duty management, membership integration, and API alignment.

## Summary

- Backend now accepts Date-like payloads for Event creation and exposes permissive CORS for local frontend integration.
- Frontend implements a clearer event flow (create, list, delete), a tabbed Duty Board (Duties, Members), and membership-aware assignment.
- Removed the “Apply Template” feature from the UI to simplify workflows.
- Added a lightweight “Archive” for duties (UI-only) to remove items from the board without losing credit toward done counts.

## Backend Changes

- CORS enabled for browser development:
  - `src/concept_server.ts`: Added Hono CORS middleware (`jsr:@hono/hono/cors`) and wired via `app.use("/*", cors(...))` so `localhost:3000` can call `localhost:8000`.
- EventDirectory date parsing:
  - `src/concepts/EventDirectory/EventDirectoryConcept.ts`: Added `toDate(...)` and updated `createEvent` to accept `Date | string | number | { $date: string | number }`, mirroring DutyRoster’s flexible date inputs.

## Frontend Changes (crew-call-frontend-1)

### API Client

- `src/services/api.ts`
  - Robust error handling: treats HTTP 200 bodies with `{ error }` as errors.
  - Added full surface for EventDirectory, DutyRoster, RotationGroups (not used in UI), and Notify.

### Stores

- Duty store `src/stores/dutyStore.ts`
  - `loadEventDuties(eventId)` hydrates UI from backend `_getEventDuties`.
  - `addDuty(title, dueAt, assignee?)` now accepts optional assignee and immediately assigns the new duty after creation.
  - Added UI-only archive set: `isArchived(eventId, dutyId)`, `archiveDuty(dutyId)`; archived duties are hidden from the board but still contribute to done counts.

- Event store `src/stores/eventStore.ts`
  - Tracks `roles[eventId]` for current user; used to gate organizer-only actions (delete event, manage members).
  - `createEvent(...)` unshifts the new event so it appears immediately.
  - `loadMyEvents()`, `loadMembers(eventId)`, `inviteMember`, `removeMember`, `setActive`, `deleteEvent` wired to EventDirectory API.

### UI Components

- Event list `src/components/EventList.vue`
  - Displays Start → End times and Active/Inactive.
  - Organizer-only Delete action added.

- Create event modal `src/components/CreateEventModal.vue`
  - Replaces prompts with a modal and date/time dropdowns.
  - Validates end after start; emits ISO datetimes.

- Duty board `src/components/DutyBoard.vue`
  - Redesigned with tabs: Duties and Members.
  - Duties tab: filters out archived duties; Delete Event button only in Duties (not in Members).
  - Passes member list to duty forms and duty items for correct assignment options.
  - Removed all “Apply Template” UI and handlers.

- Duty item `src/components/DutyItem.vue`
  - Assignment modal options are sourced from event members (`memberOptions`).
  - Added Archive action (on Done): hides from board but preserves credit.

- Members panel `src/components/MembersPanel2.vue`
  - Shows members with Role and aggregates from DutyRoster: `Assigned`, `Done` (based on current event duties).
  - Sorting: ascending by `Done`, tie-breaker by `Assigned`.
  - Copy updates: “Invite Member” → “Add Member”; “Invite” → “Add”.

## Behavior & UX Notes

- Assignment source of truth is EventDirectory membership: all assignment dropdowns reflect the event’s current members.
- When adding a duty with a selected assignee, the UI now creates the duty then immediately assigns it.
- Archiving is non-destructive and local to the UI session; archived items are still counted in members’ Done totals.
- Organizer-only operations: Delete Event, Invite/Remove members, Set Active.
- “Apply Template” (RotationGroups) removed from the UI to reduce complexity; backend endpoints remain if needed later.

## Open Items / Future Work
- Display names: membership and assignment currently show user IDs; integrate a user directory or mapping for friendly names.
- Notify UI: a panel for unread/read notifications could surface actions from NotifyConcept.
- Role-aware UI gating: optionally hide assignment/management actions for non-organizers instead of relying on backend errors.

## Quick Start (Dev)

- Backend: `deno task concepts` (defaults to `http://localhost:8000/api`). Ensure `.env` contains `MONGODB_URL` and `DB_NAME`.
- Frontend: in `crew-call-frontend-1`, run `npm i && npm run dev` (opens on `http://localhost:3000`).
