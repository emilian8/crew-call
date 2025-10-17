import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import NotifyConcept, { UserExistenceGuard } from "./NotifyConcept.ts";

// Test identities
const alice = "user:Alice" as ID; // recipient
const bob   = "user:Bob"   as ID; // another user
const fake  = "user:DoesNotExist" as ID;

// Simple guard: only Alice and Bob exist
const userGuard: UserExistenceGuard = async (u) => u === alice || u === bob;

// Utility
async function newConcept(db: any, withGuard = true) {
  return new NotifyConcept(db, withGuard ? { userExists: userGuard } : undefined);
}

Deno.test("Principle: notify -> recipient sees it -> markRead -> list reflects read state", async () => {
  const [db, client] = await testDb();
  const notify = await newConcept(db);

  try {
    // 1) Create a notification for Alice
    const res = await notify.notify({
      recipient: alice,
      subject: "New duty assigned",
      body: "Kitchen clean-up due 2025-10-21 8pm",
    });
    assertEquals("error" in res, false, "notify should succeed");
    const { notification } = res as { notification: ID };
    assertExists(notification);

    // 2) Recipient can list and see it unread
    let list = await notify._listUserNotifications({ user: alice });
    assertEquals(list.length, 1);
    assertEquals(list[0].unread, true);
    assertEquals(list[0].subject, "New duty assigned");

    // 3) Recipient marks it read
    const mr = await notify.markRead({ notification, user: alice });
    assertEquals("error" in mr, false);

    // 4) Lists reflect read status; onlyUnread hides it
    list = await notify._listUserNotifications({ user: alice });
    assertEquals(list[0].unread, false);

    const unreadOnly = await notify._listUserNotifications({ user: alice, onlyUnread: true });
    assertEquals(unreadOnly.length, 0, "no unread after markRead");
  } finally {
    await client.close();
  }
});

Deno.test("Validation & guard: non-empty subject/body; user existence enforced", async () => {
  const [db, client] = await testDb();
  const notify = await newConcept(db); // guard enabled

  try {
    // Empty subject
    const s1 = await notify.notify({ recipient: alice, subject: "   ", body: "hello" });
    assertEquals("error" in s1, true, "empty subject should fail");

    // Empty body
    const s2 = await notify.notify({ recipient: alice, subject: "hi", body: "" });
    assertEquals("error" in s2, true, "empty body should fail");

    // Non-existent user fails (guard)
    const s3 = await notify.notify({ recipient: fake, subject: "x", body: "y" });
    assertEquals("error" in s3, true, "invalid recipient should fail");

    // Existing user passes
    const ok = await notify.notify({ recipient: bob, subject: "ok", body: "works" });
    assertEquals("error" in ok, false, "valid recipient should pass");
  } finally {
    await client.close();
  }
});

Deno.test("Access control: users can only markRead/delete their own notifications", async () => {
  const [db, client] = await testDb();
  const notify = await newConcept(db);

  try {
    // Create a notification for Alice
    const { notification } =
      (await notify.notify({
        recipient: alice,
        subject: "Reminder",
        body: "Due soon",
      })) as { notification: ID };

    // Bob cannot mark Alice's notification read
    const mrBob = await notify.markRead({ notification, user: bob });
    assertEquals("error" in mrBob, true, "non-owner markRead should fail");

    // Bob cannot delete Alice's notification
    const delBob = await notify.deleteNotification({ notification, user: bob });
    assertEquals("error" in delBob, true, "non-owner delete should fail");

    // Alice can mark it read
    const mrAlice = await notify.markRead({ notification, user: alice });
    assertEquals("error" in mrAlice, false);

    // Alice can delete it
    const delAlice = await notify.deleteNotification({ notification, user: alice });
    assertEquals("error" in delAlice, false);

    // Verify deletion
    const n = await notify._getNotification({ notification });
    assertEquals(n, null, "notification should be deleted");
  } finally {
    await client.close();
  }
});

Deno.test("Idempotency: markRead is safe to call repeatedly", async () => {
  const [db, client] = await testDb();
  const notify = await newConcept(db);

  try {
    const { notification } =
      (await notify.notify({
        recipient: alice,
        subject: "Once",
        body: "Read me twice",
      })) as { notification: ID };

    // First markRead
    const mr1 = await notify.markRead({ notification, user: alice });
    assertEquals("error" in mr1, false);

    // Second markRead — should be a no-op success
    const mr2 = await notify.markRead({ notification, user: alice });
    assertEquals("error" in mr2, false);

    const doc = await notify._getNotification({ notification });
    assertEquals(doc?.unread, false);
  } finally {
    await client.close();
  }
});

Deno.test("Optional guard off: notify accepts any recipient when no guard is provided", async () => {
  const [db, client] = await testDb();
  const notify = await new NotifyConcept(db); // no guard

  try {
    const res = await notify.notify({
      recipient: fake,
      subject: "No guard",
      body: "Allows any user id",
    });
    assertEquals("error" in res, false, "should allow arbitrary recipient when guard is absent");

    const { notification } = res as { notification: ID };
    assertExists(notification);
  } finally {
    await client.close();
  }
});
