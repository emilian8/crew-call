---
timestamp: 'Tue Oct 21 2025 19:55:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_195507.cd1a39d8.md]]'
content_id: c63c8952596260737280698372a853563f7807bbb62d83e27af351fcbac6d1d2
---

# concept: DutyRoster

* **concept**: DutyRoster \[User, Event, Duty]
* **purpose**: To represent all duties for an event and manage each duty’s lifecycle (Open → Assigned
  → Done) with clear ownership and due times.
* **principle**: If an organizer creates duties for an event and assigns each to a member with a due
  time, then assignees can see and complete their duties, and the organizer can track status changes.
* **state**:
* A set of `Duties` with
* an `id` of type `Duty`
* an `event` of type `Event`
* a `title` of type `String`
* a `dueAt` of type `Time`
* a `status` of type `Enum{Open, Assigned, Done}`
* an `assignee` of type `User?`
* a `createdAt` of type `Time`
* an `updatedAt` of type `Time`
* **actions**:
* `addDuty (event: Event, actor: User, title: String, dueAt: Time): (duty: Duty)`
* **requires**: `dueAt` is a valid future or present time. `actor.role(event) = Organizer`.
* **effects**: Creates a duty with `status = Open`, `assignee = null`. Returns its `duty` id.
* `assignDuty (duty: Duty, actor: User, assignee: User)`
* **requires**: `actor.role(duty.event) = Organizer`. `duty.status ∈ {Open, Assigned}`.
* **effects**: Sets `duty.assignee = assignee`, `duty.status = Assigned`, updates `updatedAt`.
* `unassignDuty (duty: Duty, actor: User)`
* **requires**: `actor.role(duty.event) = Organizer`. `duty.status = Assigned`.
* **effects**: Sets `duty.assignee = null`, `duty.status = Open`, updates `updatedAt`.
* `updateDuty (duty: Duty, actor: User, title?: String, dueAt?: Time)`
* **requires**: `actor.role(duty.event) = Organizer`. If `dueAt` provided, it is a valid time.
* **effects**: Applies provided edits to the duty; updates `updatedAt`.
* `markDone (duty: Duty, actor: User)`
* **requires**: (`actor = duty.assignee`) **or** (`actor.role(duty.event) = Organizer`). `duty.status ∈
  {Open, Assigned}`.
* **effects**: Sets `duty.status = Done`, updates `updatedAt`.
* `reOpen (duty: Duty, actor: User)`
* **requires**: `actor.role(duty.event) = Organizer`. `duty.status = Done`.
* **effects**: Sets `duty.status = Open`, leaves `assignee` unchanged, updates `updatedAt`.
* `deleteDuty (duty: Duty, actor: User)`
* **requires**: `actor.role(duty.event) = Organizer`.
* **effects**: Removes the duty from state.
* **synchronizations**:
* **Access Control (representative)**
* when any action mutates a `Duty` (create, assign, unassign, update, reopen, delete)
  where the `actor.role(event)` condition in **requires** is not satisfied
  then error `"Only organizers may modify duties for this event."`
* **Assignment Notification (granular)**
* when `assignDuty(duty d, actor, assignee u)` succeeds
  then `Notify.notify(u, "New duty assigned", "“" + d.title + "” due " + d.dueAt)`
* **Due-Soon Reminder (granular)**
* when `Duty d` with `d.status = Assigned` and `now + 24h >= d.dueAt`
  then `Notify.notify(d.assignee, "Duty due soon", "“" + d.title + "” due " + d.dueAt)`
* **notes on modularity**:
* `DutyRoster` does not read or write `EventDirectory` state directly; it only stores `event: Event`
  identifiers.
* Role checks are expressed declaratively in **requires**/**synchronizations** and enforced within this
  concept’s actions without cross-concept calls.
