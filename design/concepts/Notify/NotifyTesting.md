# Notify — Test Execution Output
**Command used**
```bash
deno test -A
```
**Timestamp**
2025-10-17T00:49:31.020578
---
## Console Output
```
running 5 tests from ./src/concepts/Notify/NotifyConcept.test.ts
Principle: notify -> recipient sees it -> markRead -> list reflects read state ... ok (688ms)
Validation & guard: non-empty subject/body; user existence enforced ... ok (591ms)
Access control: users can only markRead/delete their own notifications ... ok (659ms)
Idempotency: markRead is safe to call repeatedly ... ok (600ms)
Optional guard off: notify accepts any recipient when no guard is provided ... ok (589ms)
```
