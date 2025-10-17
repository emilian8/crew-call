---
timestamp: 'Thu Oct 16 2025 21:27:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251016_212748.7f9f481a.md]]'
content_id: 327ff62357908cbb1715ad7c4ebe10fa4cdc16ec496985cb305ed1eb7935df07
---

# concept: EventDirectory

* **concept**: EventDirectory \[User, Event]
* **purpose**: To define and manage events, including membership and participant roles (Organizer
  and DutyMember).
* **principle**: If an organizer creates an event and invites members, then all participants and their
  roles are clearly defined, allowing other concepts to reference events without needing internal
  membership details.
* **state**:
* A set of `Events` with
* an `id` of type `Event`
* a `title` of type `String`
* a `startsAt` of type `Time`
* an `endsAt` of type `Time`
* an `active` of type `Flag`
* a `createdAt` of type `Time`
* an `updatedAt` of type `Time`
* A set of `Memberships` with
* an `event` of type `Event`
* a `user` of type `User`
* a `role` of type `Enum{Organizer, DutyMember}`
* **actions**:
* `createEvent (creator: User, title: String, startsAt: Time, endsAt: Time): (event: Event)`
* **requires**: `startsAt < endsAt`
* **effects**: Creates a new event with the specified title and duration, and marks the creator as
  Organizer.
* `invite (event: Event, inviter: User, invitee: User, role: Role)`
* **requires**: `inviter` must have Organizer role in the given event.
* **effects**: Adds the invitee as a member of the event with the specified role.
* `setActive (event: Event, setter: User, flag: Flag)`
* **requires**: `setter` must have Organizer role in the given event.
* **effects**: Sets the event’s active status to the given flag.
* `removeMember (event: Event, actor: User, member: User)`
* **requires**: `actor` must have Organizer role in the event. `member` must currently belong to the
  event.
* **effects**: Removes the member from the event’s membership list.
* `deleteEvent (event: Event, actor: User)`
* **requires**: `actor` must have Organizer role in the event.
* **effects**: Deletes the event and all associated memberships.
* **synchronizations**:
* **Access Control Rule**
  When any action (add, modify, or delete) is attempted
  where `actor.role(event) ≠ Organizer`
  then reject with error \`"Only organizers may modify events or memberships."

## Implementations
