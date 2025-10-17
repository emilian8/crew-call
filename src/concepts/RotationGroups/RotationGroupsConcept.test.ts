// file: src/concepts/RotationGroups/RotationGroupsConcept.test.ts
import { assertEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import RotationGroupsConcept from "./RotationGroupsConcept.ts";

// Test identities
const owner = "user:Owner" as ID;
const nonOwner = "user:Other" as ID;
const u1 = "user:Alice" as ID;
const u2 = "user:Bob" as ID;
const u3 = "user:Cara" as ID;

const evt1 = "event:HouseChores-Oct27" as ID;

Deno.test("Principle: Owner creates a template and applies it to an event (granular applied duties emitted)", async () => {
  const [db, client] = await testDb();
  const rg = new RotationGroupsConcept(db);

  try {
    // 1) createTemplate
    const createRes = await rg.createTemplate({
      owner,
      title: "Weekly Cleaning Rotation",
      members: [u1, u2, u3],
      standardDuties: ["Kitchen clean-up", "Bathroom scrub", "Trash & recycling"],
    });
    assertEquals("error" in createRes, false, "createTemplate should succeed");
    const { template } = createRes as { template: ID };
    assertExists(template);

    // sanity: template exists & is listed for owner
    const tDoc = await rg._getTemplate({ template });
    assertEquals(tDoc?.title, "Weekly Cleaning Rotation");
    const list = await rg._listTemplatesByOwner({ owner });
    assertEquals(list.find((t) => t._id === template) != null, true);

    // 2) applyTemplate → creates an application + per-duty applied records
    const applyRes = await rg.applyTemplate({ template, event: evt1, actor: owner });
    assertEquals("error" in applyRes, false, "applyTemplate should succeed for owner");
    const { application, dutiesEmitted } = applyRes as { application: ID; dutiesEmitted: number };
    assertEquals(dutiesEmitted, 3, "should emit one applied duty per standard duty");

    const appDoc = await rg._getApplication({ application });
    assertEquals(appDoc?.event, evt1);

    const applied = await rg._getAppliedDutiesForApplication({ application });
    assertEquals(applied.length, 3, "should have 3 applied duties");
    const names = applied.map(a => a.dutyName).sort();
    assertEquals(names, ["Bathroom scrub", "Kitchen clean-up", "Trash & recycling"].sort());
  } finally {
    await client.close();
  }
});

Deno.test("Permissions: only owner may update/apply/delete a template", async () => {
  const [db, client] = await testDb();
  const rg = new RotationGroupsConcept(db);

  try {
    const { template } = (await rg.createTemplate({
      owner,
      title: "Party Crew",
      members: [u1, u2],
      standardDuties: ["Setup", "Cleanup"],
    })) as { template: ID };

    // Non-owner cannot update
    const upd1 = await rg.updateTemplate({
      template, actor: nonOwner, title: "Party Crew v2",
    });
    assertEquals("error" in upd1, true, "non-owner update should fail");

    // Non-owner cannot apply
    const app1 = await rg.applyTemplate({ template, event: evt1, actor: nonOwner });
    assertEquals("error" in app1, true, "non-owner apply should fail");

    // Non-owner cannot delete
    const del1 = await rg.deleteTemplate({ template, actor: nonOwner });
    assertEquals("error" in del1, true, "non-owner delete should fail");

    // Owner can update/apply/delete
    const upd2 = await rg.updateTemplate({
      template, actor: owner, title: "Party Crew v2",
    });
    assertEquals("error" in upd2, false);

    const app2 = await rg.applyTemplate({ template, event: evt1, actor: owner });
    assertEquals("error" in app2, false);

    const del2 = await rg.deleteTemplate({ template, actor: owner });
    assertEquals("error" in del2, false);
  } finally {
    await client.close();
  }
});

Deno.test("Validation: createTemplate requires non-empty members and standardDuties; update preserves same rule when provided", async () => {
  const [db, client] = await testDb();
  const rg = new RotationGroupsConcept(db);

  try {
    // Empty members
    const c1 = await rg.createTemplate({
      owner,
      title: "Invalid",
      members: [],
      standardDuties: ["A"],
    });
    assertEquals("error" in c1, true, "empty members should fail");

    // Empty standardDuties
    const c2 = await rg.createTemplate({
      owner,
      title: "Invalid",
      members: [u1],
      standardDuties: [],
    });
    assertEquals("error" in c2, true, "empty standardDuties should fail");

    // Valid create
    const { template } = (await rg.createTemplate({
      owner,
      title: "Valid",
      members: [u1],
      standardDuties: ["A"],
    })) as { template: ID };

    // Update with empty members should fail
    const uMembers = await rg.updateTemplate({ template, actor: owner, members: [] });
    assertEquals("error" in uMembers, true);

    // Update with empty duties should fail
    const uDuties = await rg.updateTemplate({ template, actor: owner, standardDuties: [] });
    assertEquals("error" in uDuties, true);
  } finally {
    await client.close();
  }
});

Deno.test("Normalization: members and standardDuties are de-duplicated and trimmed", async () => {
  const [db, client] = await testDb();
  const rg = new RotationGroupsConcept(db);

  try {
    const { template } = (await rg.createTemplate({
      owner,
      title: "Normalize Me",
      members: [u1, u1, u2, u2, u3],
      standardDuties: ["  Setup  ", "Setup", "Cleanup", "Cleanup "],
    })) as { template: ID };

    const t = await rg._getTemplate({ template });
    assertEquals(t?.members, [u1, u2, u3], "members should be unique in order of first appearance");
    assertEquals(t?.standardDuties, ["Setup", "Cleanup"], "duties should be trimmed & unique");
  } finally {
    await client.close();
  }
});

Deno.test("Delete semantics: deleting a template prevents future apply; prior applications remain queryable", async () => {
  const [db, client] = await testDb();
  const rg = new RotationGroupsConcept(db);

  try {
    // Create template and apply once
    const { template } = (await rg.createTemplate({
      owner,
      title: "One-shot",
      members: [u1, u2],
      standardDuties: ["D1", "D2"],
    })) as { template: ID };

    const { application } = (await rg.applyTemplate({
      template, event: evt1, actor: owner,
    })) as { application: ID };

    // Delete template
    const del = await rg.deleteTemplate({ template, actor: owner });
    assertEquals("error" in del, false);

    // Applying again should fail (template gone)
    const appAgain = await rg.applyTemplate({ template, event: evt1, actor: owner });
    assertEquals("error" in appAgain, true);

    // Prior application & applied duties remain
    const appDoc = await rg._getApplication({ application });
    assertExists(appDoc, "prior application should remain for auditing");

    const applied = await rg._getAppliedDutiesForApplication({ application });
    assertEquals(applied.length, 2, "applied duties for prior application should remain");
  } finally {
    await client.close();
  }
});
