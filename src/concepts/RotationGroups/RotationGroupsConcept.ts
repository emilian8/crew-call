// file: src/concepts/RotationGroups/RotationGroupsConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// ---------------------------------------------------------------------------
// Concept: RotationGroups
// ---------------------------------------------------------------------------
const PREFIX = "RotationGroups" + ".";

// Shared external identifiers
type User = ID;
type Event = ID;
type Template = ID;
type TemplateApplication = ID;
type AppliedDuty = ID;

// ---------------------------------------------------------------------------
// State documents
// ---------------------------------------------------------------------------
interface TemplateDoc {
  _id: Template;
  owner: User;
  title: string;
  members: User[];          // stored as unique array
  standardDuties: string[]; // stored as unique array of duty names
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateApplicationDoc {
  _id: TemplateApplication;
  template: Template;
  event: Event;
  actor: User;      // the applier; must be owner
  createdAt: Date;
}

interface AppliedDutyDoc {
  _id: AppliedDuty;
  application: TemplateApplication;
  template: Template;
  event: Event;
  dutyName: string;
  actor: User;
  createdAt: Date;
  // Note: no dueAt here — later synchronizations can decide it (or enrich schema).
}

// ---------------------------------------------------------------------------
// Concept class
// ---------------------------------------------------------------------------
/**
 * @concept RotationGroups
 * @purpose Create reusable templates of members and standard duties; applying
 *          a template emits per-duty application records that synchronizations
 *          can consume to create actual duties in DutyRoster.
 */
export default class RotationGroupsConcept {
  private templates: Collection<TemplateDoc>;
  private applications: Collection<TemplateApplicationDoc>;
  private appliedDuties: Collection<AppliedDutyDoc>;

  constructor(private readonly db: Db) {
    this.templates = this.db.collection(PREFIX + "templates");
    this.applications = this.db.collection(PREFIX + "applications");
    this.appliedDuties = this.db.collection(PREFIX + "applied_duties");
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private normalizeUsers(arr: User[]): User[] {
    // unique, preserve order of first appearance
    const seen = new Set<string>();
    const out: User[] = [];
    for (const u of arr ?? []) {
      const key = String(u);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(u);
      }
    }
    return out;
  }

  private normalizeStrings(arr: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of arr ?? []) {
      const v = String(s).trim();
      if (!v) continue;
      if (!seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  }

  private async getTemplate(template: Template): Promise<TemplateDoc | { error: string }> {
    const t = await this.templates.findOne({ _id: template });
    if (!t) return { error: `Template ${template} not found` };
    return t;
  }

  private requireOwner(t: TemplateDoc, actor: User): Empty | { error: string } {
    return t.owner === actor ? {} : { error: "Only the template owner may modify/apply this template" };
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * createTemplate
   * @requires members and standardDuties are non-empty
   * @effects  Creates a reusable template owned by `owner`
   */
  async createTemplate(
    { owner, title, members, standardDuties }: {
      owner: User;
      title: string;
      members: User[];
      standardDuties: string[];
    },
  ): Promise<{ template: Template } | { error: string }> {
    const normMembers = this.normalizeUsers(members);
    const normDuties = this.normalizeStrings(standardDuties);

    if (normMembers.length === 0) return { error: "members must be non-empty" };
    if (normDuties.length === 0) return { error: "standardDuties must be non-empty" };

    const now = new Date();
    const templateId = freshID() as Template;

    await this.templates.insertOne({
      _id: templateId,
      owner,
      title,
      members: normMembers,
      standardDuties: normDuties,
      createdAt: now,
      updatedAt: now,
    });

    return { template: templateId };
  }

  /**
   * updateTemplate
   * @requires actor = template.owner
   * @effects  Updates title/members/standardDuties (replace semantics)
   */
  async updateTemplate(
    { template, actor, title, members, standardDuties }: {
      template: Template;
      actor: User;
      title?: string;
      members?: User[];
      standardDuties?: string[];
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.getTemplate(template);
    if ("error" in found) return found;

    const auth = this.requireOwner(found, actor);
    if ("error" in auth) return { error: auth.error };

    const update: Partial<Pick<TemplateDoc, "title" | "members" | "standardDuties">> = {};
    if (typeof title === "string") update.title = title;
    if (members !== undefined) {
      const nm = this.normalizeUsers(members);
      if (nm.length === 0) return { error: "members must be non-empty when provided" };
      update.members = nm;
    }
    if (standardDuties !== undefined) {
      const nd = this.normalizeStrings(standardDuties);
      if (nd.length === 0) return { error: "standardDuties must be non-empty when provided" };
      update.standardDuties = nd;
    }

    if (Object.keys(update).length === 0) return {}; // nothing to do

    await this.templates.updateOne(
      { _id: template },
      { $set: { ...update, updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * deleteTemplate
   * @requires actor = template.owner
   * @effects  Deletes the template (application history retained for auditing)
   */
  async deleteTemplate(
    { template, actor }: {
      template: Template;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.getTemplate(template);
    if ("error" in found) return found;

    const auth = this.requireOwner(found, actor);
    if ("error" in auth) return { error: auth.error };

    const res = await this.templates.deleteOne({ _id: template });
    if (res.deletedCount === 0) return { error: `Template ${template} not found` };
    return {};
  }

  /**
   * applyTemplate
   * @requires actor = template.owner
   * @effects  Creates an application record and emits granular per-duty application
   *           documents (one per duty name). Later synchronizations can consume
   *           these to create concrete duties in DutyRoster.
   */
  async applyTemplate(
    { template, event, actor }: {
      template: Template;
      event: Event;
      actor: User;
    },
  ): Promise<{ application: TemplateApplication; dutiesEmitted: number } | { error: string }> {
    const found = await this.getTemplate(template);
    if ("error" in found) return found;

    const auth = this.requireOwner(found, actor);
    if ("error" in auth) return { error: auth.error };

    const now = new Date();
    const applicationId = freshID() as TemplateApplication;

    await this.applications.insertOne({
      _id: applicationId,
      template,
      event,
      actor,
      createdAt: now,
    });

    // Emit granular applied duties (no loops in syncs later; we pre-expand here)
    if (found.standardDuties.length > 0) {
      const docs: AppliedDutyDoc[] = found.standardDuties.map((dutyName) => ({
        _id: freshID() as AppliedDuty,
        application: applicationId,
        template,
        event,
        dutyName,
        actor,
        createdAt: now,
      }));

      if (docs.length > 0) {
        await this.appliedDuties.insertMany(docs);
      }
    }

    return { application: applicationId, dutiesEmitted: found.standardDuties.length };
  }

  // -------------------------------------------------------------------------
  // Queries (non-actions; useful for tests/UI)
  // -------------------------------------------------------------------------
  async _getTemplate({ template }: { template: Template }): Promise<TemplateDoc | null> {
    return await this.templates.findOne({ _id: template });
  }

  async _listTemplatesByOwner({ owner }: { owner: User }): Promise<TemplateDoc[]> {
    return await this.templates.find({ owner }).toArray();
  }

  async _getApplication({ application }: { application: TemplateApplication }): Promise<TemplateApplicationDoc | null> {
    return await this.applications.findOne({ _id: application });
  }

  async _getAppliedDutiesForApplication(
    { application }: { application: TemplateApplication },
  ): Promise<AppliedDutyDoc[]> {
    return await this.appliedDuties.find({ application }).toArray();
  }
}
