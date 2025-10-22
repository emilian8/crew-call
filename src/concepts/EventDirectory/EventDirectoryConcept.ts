import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// ----------------------------------------------------------------------------
// Concept: EventDirectory
// Namespace prefix to keep collections scoped
// ----------------------------------------------------------------------------
const PREFIX = "EventDirectory" + ".";

// External identifiers
type User = ID;
type Event = ID;

// Role type
type Role = "Organizer" | "DutyMember";

// ----------------------------------------------------------------------------
// State documents
// ----------------------------------------------------------------------------
interface EventDoc {
  _id: Event;
  title: string;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipDoc {
  _id: ID;            // separate doc id
  event: Event;
  user: User;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------------------------------------------------------------
// Concept class
// ----------------------------------------------------------------------------
/**
 * @concept EventDirectory
 * @purpose Define and manage events, including membership and participant roles.
 * @principle Organizers create events and manage memberships; other concepts
 *            can reference events by id without depending on membership internals.
 */
export default class EventDirectoryConcept {
  private events: Collection<EventDoc>;
  private memberships: Collection<MembershipDoc>;

  constructor(private readonly db: Db) {
    this.events = this.db.collection(PREFIX + "events");
    this.memberships = this.db.collection(PREFIX + "memberships");
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private async eventExists(event: Event): Promise<boolean> {
    const e = await this.events.findOne({ _id: event }, { projection: { _id: 1 } });
    return !!e;
  }

  private async hasOrganizerRole(event: Event, user: User): Promise<boolean> {
    const m = await this.memberships.findOne(
      { event, user, role: "Organizer" },
      { projection: { _id: 1 } },
    );
    return !!m;
  }

  private isValidRole(role: string): role is Role {
    return role === "Organizer" || role === "DutyMember";
  }

  private toDate(val: unknown): Date | null {
    if (val instanceof Date && !isNaN(val.valueOf())) return val;
    if (typeof val === "string" || typeof val === "number") {
      const d = new Date(val as any);
      return isNaN(d.valueOf()) ? null : d;
    }
    if (val && typeof val === "object" && "$date" in (val as Record<string, unknown>)) {
      const raw = (val as Record<string, unknown>)["$date"];
      const d = new Date(raw as any);
      return isNaN(d.valueOf()) ? null : d;
    }
    return null;
  }

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  /**
   * Action: createEvent
   * @requires startsAt < endsAt
   * @effects Creates a new event and records creator as Organizer.
   */
  async createEvent(
    { creator, title, startsAt, endsAt }: {
      creator: User;
      title: string;
      startsAt: Date | string | number | { $date: string | number };
      endsAt: Date | string | number | { $date: string | number };
    },
  ): Promise<{ event: Event } | { error: string }> {
    const s = this.toDate(startsAt);
    const e = this.toDate(endsAt);
    if (!s || !e) {
      return { error: "startsAt and endsAt must be valid dates" };
    }
    if (s >= e) {
      return { error: "startsAt must be earlier than endsAt" };
    }

    const now = new Date();
    const eventId = freshID() as Event;

    // Create event
    await this.events.insertOne({
      _id: eventId,
      title,
      startsAt: s,
      endsAt: e,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create organizer membership for creator
    await this.memberships.insertOne({
      _id: freshID(),
      event: eventId,
      user: creator,
      role: "Organizer",
      createdAt: now,
      updatedAt: now,
    });

    return { event: eventId };
  }

  /**
   * Action: invite
   * @requires inviter has Organizer role in event
   * @requires role ∈ {Organizer, DutyMember}
   * @effects Adds invitee as member with given role (idempotent on (event,user))
   */
  async invite(
    { event, inviter, invitee, role }: {
      event: Event;
      inviter: User;
      invitee: User;
      role: Role;
    },
  ): Promise<Empty | { error: string }> {
    if (!await this.eventExists(event)) {
      return { error: `Event ${event} not found` };
    }
    if (!await this.hasOrganizerRole(event, inviter)) {
      return { error: "Only organizers may invite members" };
    }
    if (!this.isValidRole(role)) {
      return { error: `Invalid role ${role}` };
    }

    const now = new Date();
    // Upsert membership so repeated invites don't error, but do update role
    await this.memberships.updateOne(
      { event, user: invitee },
      {
        $set: {
          event,
          user: invitee,
          role,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: freshID(),
          createdAt: now,
        },
      },
      { upsert: true },
    );

    return {};
  }

  /**
   * Action: setActive
   * @requires setter has Organizer role in event
   * @effects Sets the event's active flag
   */
  async setActive(
    { event, setter, flag }: {
      event: Event;
      setter: User;
      flag: boolean;
    },
  ): Promise<Empty | { error: string }> {
    if (!await this.eventExists(event)) {
      return { error: `Event ${event} not found` };
    }
    if (!await this.hasOrganizerRole(event, setter)) {
      return { error: "Only organizers may modify event active status" };
    }

    const res = await this.events.updateOne(
      { _id: event },
      { $set: { active: flag, updatedAt: new Date() } },
    );

    if (res.matchedCount === 0) {
      return { error: `Event ${event} not found` };
    }
    return {};
  }

  /**
   * Action: removeMember
   * @requires actor has Organizer role in event
   * @requires member currently belongs to the event
   * @effects Removes the member's membership
   */
  async removeMember(
    { event, actor, member }: {
      event: Event;
      actor: User;
      member: User;
    },
  ): Promise<Empty | { error: string }> {
    if (!await this.eventExists(event)) {
      return { error: `Event ${event} not found` };
    }
    if (!await this.hasOrganizerRole(event, actor)) {
      return { error: "Only organizers may remove members" };
    }

    const res = await this.memberships.deleteOne({ event, user: member });
    if (res.deletedCount === 0) {
      return { error: `User ${member} is not a member of event ${event}` };
    }
    return {};
  }

  /**
   * Action: deleteEvent
   * @requires actor has Organizer role in event
   * @effects Deletes the event and all associated memberships
   */
  async deleteEvent(
    { event, actor }: {
      event: Event;
      actor: User;
    },
  ): Promise<Empty | { error: string }> {
    if (!await this.eventExists(event)) {
      return { error: `Event ${event} not found` };
    }
    if (!await this.hasOrganizerRole(event, actor)) {
      return { error: "Only organizers may delete events" };
    }

    const evtRes = await this.events.deleteOne({ _id: event });
    if (evtRes.deletedCount === 0) {
      return { error: `Event ${event} not found` };
    }

    await this.memberships.deleteMany({ event });
    return {};
  }

  // --------------------------------------------------------------------------
  // Queries (helpers for tests / other layers) — not actions
  // --------------------------------------------------------------------------

  /**
   * Query: list members for an event
   */
  async _getEventMembers(
    { event }: { event: Event },
  ): Promise<Array<{ user: User; role: Role }>> {
    const rows = await this.memberships.find({ event }).project({
      user: 1,
      role: 1,
      _id: 0,
    }).toArray();
    return rows as Array<{ user: User; role: Role }>;
  }

  /**
   * Query: list events for a user (any role)
   */
  async _getUserEvents(
    { user }: { user: User },
  ): Promise<Array<{ event: Event; role: Role }>> {
    const rows = await this.memberships.find({ user }).project({
      event: 1,
      role: 1,
      _id: 0,
    }).toArray();
    return rows as Array<{ event: Event; role: Role }>;
  }

  /**
   * Query: fetch event doc
   */
  async _getEvent({ event }: { event: Event }): Promise<EventDoc | null> {
    return await this.events.findOne({ _id: event });
  }
}
