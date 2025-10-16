# EventDirectory — Test Execution Output

This file preserves the raw console output from running the EventDirectory test suite with Deno.
It satisfies **Assignment 4a**'s deliverable: *"a copy of the console output showing the execution of the test script (in markdown)."*

**Command used**
```bash
deno test -A
```

**Timestamp**
2025-10-16T23:09:08.783299

---

## Console Output

```
running 5 tests from ./src/concepts/EventDirectory/EventDirectoryConcept.test.ts
Principle: Organizer creates event, invites members, manages active flag ... ok (930ms)
Action: createEvent enforces startsAt < endsAt and Date types ... ok (512ms)
Permissions: only organizers may invite, setActive, removeMember, deleteEvent ... ok (921ms)
Invite is idempotent on (event, user) and can update role ... ok (661ms)
removeMember errors if user is not currently a member; deleteEvent removes memberships ... ok (971ms)
```
