---
timestamp: 'Tue Oct 21 2025 19:55:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251021_195522.2161f26b.md]]'
content_id: bf965b10613b6e250ecd41909551613fd2e9770288d0ae1c8455ccf67dcc203c
---

# API Specification: DutyRoster Concept

**Purpose:** To represent all duties for an event and manage each duty’s lifecycle (Open → Assigned → Done) with clear ownership and due times.

***

## API Endpoints

### POST /api/DutyRoster/addDuty

**Description:** Creates a new duty for an event with an open status and no initial assignee.

**Requirements:**

* `dueAt` is a valid future or present time.
* `actor.role(event) = Organizer`.

**Effects:**

* Creates a duty with `status = Open`.
* Sets `assignee = null`.
* Returns its `duty` id.

**Request Body:**

```json
{
  "event": "ID",
  "actor": "ID",
  "title": "string",
  "dueAt": "string"
}
```

**Success Response Body (Action):**

```json
{
  "duty": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/assignDuty

**Description:** Assigns an existing duty to a specified user.

**Requirements:**

* `actor.role(duty.event) = Organizer`.
* `duty.status ∈ {Open, Assigned}`.

**Effects:**

* Sets `duty.assignee = assignee`.
* Sets `duty.status = Assigned`.
* Updates `updatedAt`.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID",
  "assignee": "ID"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/unassignDuty

**Description:** Removes the assignee from a duty, returning it to an open status.

**Requirements:**

* `actor.role(duty.event) = Organizer`.
* `duty.status = Assigned`.

**Effects:**

* Sets `duty.assignee = null`.
* Sets `duty.status = Open`.
* Updates `updatedAt`.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/updateDuty

**Description:** Modifies the title or due time of an existing duty.

**Requirements:**

* `actor.role(duty.event) = Organizer`.
* If `dueAt` provided, it is a valid time.

**Effects:**

* Applies provided edits to the duty.
* Updates `updatedAt`.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID",
  "title": "string (optional)",
  "dueAt": "string (optional)"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/markDone

**Description:** Marks a duty as complete.

**Requirements:**

* (`actor = duty.assignee`) **or** (`actor.role(duty.event) = Organizer`).
* `duty.status ∈ {Open, Assigned}`.

**Effects:**

* Sets `duty.status = Done`.
* Updates `updatedAt`.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/reOpen

**Description:** Reopens a duty that was previously marked as done.

**Requirements:**

* `actor.role(duty.event) = Organizer`.
* `duty.status = Done`.

**Effects:**

* Sets `duty.status = Open`.
* Leaves `assignee` unchanged.
* Updates `updatedAt`.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DutyRoster/deleteDuty

**Description:** Permanently removes a duty from the roster.

**Requirements:**

* `actor.role(duty.event) = Organizer`.

**Effects:**

* Removes the duty from state.

**Request Body:**

```json
{
  "duty": "ID",
  "actor": "ID"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
