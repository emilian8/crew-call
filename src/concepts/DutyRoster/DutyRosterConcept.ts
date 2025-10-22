import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// ---------------------------------------------------------------------------
// Concept: DutyRoster
// ---------------------------------------------------------------------------
const PREFIX = "DutyRoster" + ".";

// Shared external identifiers
type User = ID;
type Event = ID;
type Duty  = ID;

type DutyStatus = "Open" | "Assigned" | "Done";

// Optional organizer guard to keep this concept independent from EventDirectory.
// If provided, the guard will be consulted before organizer-only mutations.
export type OrganizerGuard = (args: { event: Event; actor: User }) => Promise<boolean>;

// ---------------------------------------------------------------------------
// State documents
// ---------------------------------------------------------------------------
interface DutyDoc {
  _id: Duty;
  event: Event;
  title: string;
  dueAt: Date;
  status: DutyStatus;      // Open | Assigned | Done
  assignee: User | null;   // null when Open
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Concept class
// ---------------------------------------------------------------------------
/**
 * @concept DutyRoster
 * @purpose Represent duties for an event and manage each duty’s lifecycle
 *          (Open → Assigned → Done) with clear ownership and due times.
 * @notes   No cross-concept calls. Organizer authorization may be provided
 *          via an optional guard function passed to the constructor.
 */
export default class DutyRosterConcept {
  private duties: Collection<DutyDoc>;
  private organizerGuard?: OrganizerGuard;

  constructor(
    private readonly db: Db,
    opts?: { organizerGuard?: OrganizerGuard },
  ) {
    this.duties = this.db.collection(PREFIX + "duties");
    this.organizerGuard = opts?.organizerGuard;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private async requireDuty(duty: Duty): Promise<DutyDoc | { error: string }> {
    const d = await this.duties.findOne({ _id: duty });
    if (!d) return { error: `Duty ${duty} not found` };
    return d;
  }

  private async requireOrganizer(event: Event, actor: User): Promise<Empty | { error: string }> {
    if (!this.organizerGuard) {
      // If no guard is provided, we can't check organizer role here.
      // Keep concept independent; callers/tests can inject a guard if desired.
      return {};
    }
    const ok = await this.organizerGuard({ event, actor });
    return ok ? {} : { error: "Only organizers may modify duties for this event" };
  }

  private isDate(val: unknown): val is Date {
    return val instanceof Date && !isNaN(val.valueOf());
  }

  /**
   * Accepts a Date instance, an ISO-8601 string, a numeric epoch, or Mongo
   * Extended JSON { "$date": <string|number> } and returns a valid Date.
   */
  private toDate(val: unknown): Date | null {
    // Already a Date
    if (val instanceof Date && !isNaN(val.valueOf())) return val;

    // ISO string
    if (typeof val === "string") {
      const d = new Date(val);
      return isNaN(d.valueOf()) ? null : d;
    }

    // Epoch number (ms since 1970)
    if (typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.valueOf()) ? null : d;
    }

    // Mongo Extended JSON
    if (val && typeof val === "object" && "$date" in (val as Record<string, unknown>)) {
      const raw = (val as Record<string, unknown>)["$date"];
      if (typeof raw === "string" || typeof raw === "number") {
        const d = new Date(raw as string | number);
        return isNaN(d.valueOf()) ? null : d;
      }
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * addDuty
   * @requires dueAt is a valid time; actor is Organizer (if guard provided)
   * @effects  Creates a duty with status=Open, assignee=null
   */
  async addDuty(
    { event, actor, title, dueAt }: {
      event: Event;
      actor: User;
      title: string;
      // Accept flexible JSON inputs, but store as Date
      dueAt: Date | string | number | { $date: string | number };
    },
  ): Promise<{ duty: Duty } | { error: string }> {
    const parsedDue = this.toDate(dueAt);
    if (!parsedDue) return { error: "dueAt must be a Date" };

    const auth = await this.requireOrganizer(event, actor);
    if ("error" in auth) return { error: auth.error };

    const now = new Date();
    const dutyId = freshID() as Duty;

    await this.duties.insertOne({
      _id: dutyId,
      event,
      title,
      dueAt: parsedDue,
      status: "Open",
      assignee: null,
      createdAt: now,
      updatedAt: now,
    });

    return { duty: dutyId };
  }

  /**
   * assignDuty
   * @requires actor is Organizer (if guard provided); duty.status ∈ {Open, Assigned}
   * @effects  Sets assignee and status=Assigned
   */
  async assignDuty(
    { duty, actor, assignee }: {
      duty: Duty;
      actor: User;
      assignee: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    const auth = await this.requireOrganizer(found.event, actor);
    if ("error" in auth) return { error: auth.error };

    if (found.status !== "Open" && found.status !== "Assigned") {
      return { error: `Cannot assign when status is ${found.status}` };
    }

    await this.duties.updateOne(
      { _id: duty },
      { $set: { assignee, status: "Assigned", updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * unassignDuty
   * @requires actor is Organizer (if guard provided); duty.status = Assigned
   * @effects  Clears assignee and sets status=Open
   */
  async unassignDuty(
    { duty, actor }: {
      duty: Duty;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    const auth = await this.requireOrganizer(found.event, actor);
    if ("error" in auth) return { error: auth.error };

    if (found.status !== "Assigned") {
      return { error: `Cannot unassign when status is ${found.status}` };
    }

    await this.duties.updateOne(
      { _id: duty },
      { $set: { assignee: null, status: "Open", updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * updateDuty
   * @requires actor is Organizer (if guard provided); dueAt (if provided) is Date-like
   * @effects  Applies edits to title/dueAt
   */
  async updateDuty(
    { duty, actor, title, dueAt }: {
      duty: Duty;
      actor: User;
      title?: string;
      // Accept flexible inputs
      dueAt?: Date | string | number | { $date: string | number };
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    const auth = await this.requireOrganizer(found.event, actor);
    if ("error" in auth) return { error: auth.error };

    const update: Partial<Pick<DutyDoc, "title" | "dueAt">> = {};
    if (typeof title === "string") update.title = title;

    if (dueAt !== undefined) {
      const parsed = this.toDate(dueAt);
      if (!parsed) return { error: "dueAt must be a Date" };
      update.dueAt = parsed;
    }

    if (Object.keys(update).length === 0) return {};

    await this.duties.updateOne(
      { _id: duty },
      { $set: { ...update, updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * markDone
   * @requires actor == assignee OR actor is Organizer (if guard provided)
   *           duty.status ∈ {Open, Assigned}
   * @effects  Sets status=Done
   */
  async markDone(
    { duty, actor }: {
      duty: Duty;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    if (found.status !== "Open" && found.status !== "Assigned") {
      return { error: `Cannot markDone when status is ${found.status}` };
    }

    // Assignee may self-complete; otherwise organizer required (if guard provided).
    if (found.assignee !== actor) {
      const auth = await this.requireOrganizer(found.event, actor);
      if ("error" in auth) return { error: auth.error };
    }

    await this.duties.updateOne(
      { _id: duty },
      { $set: { status: "Done", updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * reOpen
   * @requires actor is Organizer (if guard provided); duty.status = Done
   * @effects  Sets status=Open (assignee unchanged)
   */
  async reOpen(
    { duty, actor }: {
      duty: Duty;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    const auth = await this.requireOrganizer(found.event, actor);
    if ("error" in auth) return { error: auth.error };

    if (found.status !== "Done") {
      return { error: `Cannot reopen when status is ${found.status}` };
    }

    await this.duties.updateOne(
      { _id: duty },
      { $set: { status: "Open", updatedAt: new Date() } },
    );
    return {};
  }

  /**
   * deleteDuty
   * @requires actor is Organizer (if guard provided)
   * @effects  Removes the duty
   */
  async deleteDuty(
    { duty, actor }: {
      duty: Duty;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireDuty(duty);
    if ("error" in found) return found;

    const auth = await this.requireOrganizer(found.event, actor);
    if ("error" in auth) return { error: auth.error };

    const res = await this.duties.deleteOne({ _id: duty });
    if (res.deletedCount === 0) return { error: `Duty ${duty} not found` };
    return {};
  }

  // -------------------------------------------------------------------------
  // Queries (non-actions; useful for tests/UI)
  // -------------------------------------------------------------------------

  async _getDuty({ duty }: { duty: Duty }): Promise<DutyDoc | null> {
    return await this.duties.findOne({ _id: duty });
  }

  async _getEventDuties({ event }: { event: Event }): Promise<DutyDoc[]> {
    return await this.duties.find({ event }).toArray();
  }

  async _getUserDuties({ user }: { user: User }): Promise<DutyDoc[]> {
    return await this.duties.find({ assignee: user }).toArray();
  }
}
