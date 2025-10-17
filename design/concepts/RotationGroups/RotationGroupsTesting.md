# RotationGroups — Test Execution Output
**Command used**
```bash
deno test -A
```
**Timestamp**
2025-10-17T00:32:50.581142
---
## Console Output
```
running 5 tests from ./src/concepts/RotationGroups/RotationGroupsConcept.test.ts
Principle: Owner creates a template and applies it to an event (granular applied duties emitted) ... ok
(791ms)
Permissions: only owner may update/apply/delete a template ... ok (957ms)
Validation: createTemplate requires non-empty members and standardDuties; update preserves same
rule when provided ... ok (561ms)
Normalization: members and standardDuties are de-duplicated and trimmed ... ok (508ms)
Delete semantics: deleting a template prevents future apply; prior applications remain queryable ... ok
(652ms)
```
