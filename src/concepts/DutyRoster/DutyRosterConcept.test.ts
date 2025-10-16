// file: src/concepts/DutyRoster/DutyRosterConcept.test.ts
import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DutyRosterConcept, { OrganizerGuard } from "./DutyRosterConcept.ts";

// Test identities
const alice = "user:Alice" as ID; // organizer for our test event
const bob   = "user:Bob"   as ID; // regular member
const cara  = "user:Cara"  as ID; // regular member
const evt   = "event:HouseChores-Oct20" as ID;

// Simple organizer guard: Alice is the only organizer for `evt`
const guard: OrganizerGuard = async ({ event, actor }) =>
  event === evt && actor === alice;

// Utility to build the concept with guard
async function newConcept(db: any) {
  return new DutyRosterConcept(db, { organizerGuard: guard });
}

Deno.test("Principle: Organizer adds duty, assigns it, assignee marks done", async () => {
  const [db, client] = await testDb();
  const dr = await newConcept(db);

  try {
    // 1) Organizer creates a duty (Open)
    const dueAt = new Date("2025-10-21T20:00:00Z");
    const addRes = await dr.addDuty({
      event: evt, actor: alice, title: "Trash & Recycling", dueAt,
    });
    assertEquals("error" in addRes, false, "addDuty should succeed for organizer");
    const { duty } = addRes as { duty: ID };
    assertExists(duty);

    let doc = await dr._getDuty({ duty });
    assertEquals(doc?.status, "Open");
    assertEquals(doc?.assignee, null);

    // 2) Organizer assigns the duty to Bob (Assigned)
    const assignRes = await dr.assignDuty({ duty, actor: alice, assignee: bob });
    assertEquals("error" in assignRes, false, "assignDuty should succeed for organizer");

    doc = await dr._getDuty({ duty });
    assertEquals(doc?.status, "Assigned");
    assertEquals(doc?.assignee, bob);

    // 3) Assignee (Bob) marks it done (Done)
    const doneRes = await dr.markDone({ duty, actor: bob });
    assertEquals("error" in doneRes, false, "assignee should be able to markDone");

    doc = await dr._getDuty({ duty });
    assertEquals(doc?.status, "Done");
  } finally {
    await client.close();
  }
});

Deno.test("Permissions: only organizer can mutate (add/assign/unassign/update/reOpen/delete)", async () => {
  const [db, client] = await testDb();
  const dr = await newConcept(db);

  try {
    // Non-organizer cannot add
    const addFail = await dr.addDuty({
      event: evt, actor: bob, title: "Kitchen Clean", dueAt: new Date(),
    });
    assertEquals("error" in addFail, true, "non-organizer addDuty should fail");

    // Organizer adds
    const { duty } = (await dr.addDuty({
      event: evt, actor: alice, title: "Kitchen Clean", dueAt: new Date(),
    })) as { duty: ID };

    // Non-organizer cannot assign
    const assignFail = await dr.assignDuty({ duty, actor: bob, assignee: cara });
    assertEquals("error" in assignFail, true, "non-organizer assign should fail");

    // Organizer assigns
    assertEquals("error" in await dr.assignDuty({ duty, actor: alice, assignee: cara }), false);

    // Non-organizer cannot unassign
    const unassignFail = await dr.unassignDuty({ duty, actor: bob });
    assertEquals("error" in unassignFail, true);

    // Organizer unassigns
    assertEquals("error" in await dr.unassignDuty({ duty, actor: alice }), false);

    // Non-organizer cannot update
    const updateFail = await dr.updateDuty({ duty, actor: bob, title: "Kitchen Deep Clean" });
    assertEquals("error" in updateFail, true);

    // Organizer updates
    assertEquals("error" in await dr.updateDuty({ duty, actor: alice, title: "Kitchen Deep Clean" }), false);

    // Non-organizer cannot reopen or delete
    const reopenFail = await dr.reOpen({ duty, actor: bob });
    const deleteFail = await dr.deleteDuty({ duty, actor: bob });
    assertEquals("error" in reopenFail, true);
    assertEquals("error" in deleteFail, true);
  } finally {
    await client.close();
  }
});

Deno.test("Status transitions: assign/unassign constraints; reopen only from Done", async () => {
  const [db, client] = await testDb();
  const dr = await newConcept(db);

  try {
    const { duty } = (await dr.addDuty({
      event: evt, actor: alice, title: "Common Room Vacuum", dueAt: new Date(),
    })) as { duty: ID };

    // Assign from Open → Assigned
    assertEquals("error" in await dr.assignDuty({ duty, actor: alice, assignee: bob }), false);

    // Unassign from Assigned → Open
    assertEquals("error" in await dr.unassignDuty({ duty, actor: alice }), false);

    // Can't unassign when Open
    const unassignOpen = await dr.unassignDuty({ duty, actor: alice });
    assertEquals("error" in unassignOpen, true);

    // Assign, then markDone; can't assign after Done
    await dr.assignDuty({ duty, actor: alice, assignee: bob });
    await dr.markDone({ duty, actor: bob });

    const assignAfterDone = await dr.assignDuty({ duty, actor: alice, assignee: cara });
    assertEquals("error" in assignAfterDone, true, "cannot assign when Done");

    // Reopen from Done → Open (organizer)
    assertEquals("error" in await dr.reOpen({ duty, actor: alice }), false);

    // Now assignment allowed again
    assertEquals("error" in await dr.assignDuty({ duty, actor: alice, assignee: cara }), false);
  } finally {
    await client.close();
  }
});

Deno.test("updateDuty validates dueAt and applies partial edits", async () => {
  const [db, client] = await testDb();
  const dr = await newConcept(db);

  try {
    const { duty } = (await dr.addDuty({
      event: evt, actor: alice, title: "Bathroom Scrub", dueAt: new Date("2025-10-23T12:00:00Z"),
    })) as { duty: ID };

    // Invalid dueAt
    // @ts-ignore intentional wrong type to trigger runtime guard
    const badDue = await dr.updateDuty({ duty, actor: alice, dueAt: "not-a-date" });
    assertEquals("error" in badDue, true, "dueAt must be a Date");

    // Partial edit: title only
    const upd1 = await dr.updateDuty({ duty, actor: alice, title: "Bathroom Deep Scrub" });
    assertEquals("error" in upd1, false);

    // Partial edit: dueAt only
    const newDue = new Date("2025-10-24T18:00:00Z");
    const upd2 = await dr.updateDuty({ duty, actor: alice, dueAt: newDue });
    assertEquals("error" in upd2, false);

    const doc = await dr._getDuty({ duty });
    assertEquals(doc?.title, "Bathroom Deep Scrub");
    assertEquals(doc?.dueAt?.toISOString(), newDue.toISOString());
  } finally {
    await client.close();
  }
});

Deno.test("deleteDuty removes the duty", async () => {
  const [db, client] = await testDb();
  const dr = await newConcept(db);

  try {
    const { duty } = (await dr.addDuty({
      event: evt, actor: alice, title: "Common Area Mop", dueAt: new Date(),
    })) as { duty: ID };

    const delRes = await dr.deleteDuty({ duty, actor: alice });
    assertEquals("error" in delRes, false, "deleteDuty should succeed");

    const doc = await dr._getDuty({ duty });
    assertEquals(doc, null, "Duty should no longer exist after deletion");
  } finally {
    await client.close();
  }
});
