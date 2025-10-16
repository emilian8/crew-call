# DutyRoster — Test Execution Output


**Command used**
```bash
deno test -A
```

**Timestamp**
2025-10-16T23:52:38.759740

---

## Console Output

```
running 5 tests from ./src/concepts/DutyRoster/DutyRosterConcept.test.ts
Principle: Organizer adds duty, assigns it, assignee marks done ... ok (666ms)
Permissions: only organizer can mutate (add/assign/unassign/update/reOpen/delete) ... ok (674ms)
Status transitions: assign/unassign constraints; reopen only from Done ... ok (744ms)
updateDuty validates dueAt and applies partial edits ... ok (591ms)
deleteDuty removes the duty ... ok (633ms)
```
