/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // DutyRoster — read-only queries
  "/api/DutyRoster/_getDuty":"read-only duty details for UI",
  "/api/DutyRoster/_getEventDuties":"read-only list for event view",
  "/api/DutyRoster/_getUserDuties":"read-only list for My Duties",

  // EventDirectory — read-only queries
  "/api/EventDirectory/eventExists":"public existence check for routing",
  "/api/EventDirectory/_getEventMembers":"read-only members list",
  "/api/EventDirectory/_getUserEvents":"read-only user’s events",
  "/api/EventDirectory/_getEvent":"read-only event details",

  // Notify — read-only queries
  "/api/Notify/_getNotification":"read-only single notification",
  "/api/Notify/_listUserNotifications":"read-only inbox list",

  // RotationGroups — read-only queries (only if surfaced in FE)
  "/api/RotationGroups/getTemplate":"read-only template lookup",
  "/api/RotationGroups/_getTemplate":"read-only template details",
  "/api/RotationGroups/_listTemplatesByOwner":"read-only owner’s templates",
  "/api/RotationGroups/_getApplication":"read-only application details",
  "/api/RotationGroups/_getAppliedDutiesForApplication":"read-only applied duties",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // DutyRoster — mutating + helpers
  "/api/DutyRoster/requireDuty",
  "/api/DutyRoster/requireOrganizer",
  "/api/DutyRoster/isDate",
  "/api/DutyRoster/toDate",
  "/api/DutyRoster/addDuty",
  "/api/DutyRoster/assignDuty",
  "/api/DutyRoster/unassignDuty",
  "/api/DutyRoster/updateDuty",
  "/api/DutyRoster/markDone",
  "/api/DutyRoster/reOpen",
  "/api/DutyRoster/deleteDuty",

  // EventDirectory — mutating + helpers
  "/api/EventDirectory/hasOrganizerRole",
  "/api/EventDirectory/isValidRole",
  "/api/EventDirectory/toDate",
  "/api/EventDirectory/createEvent",
  "/api/EventDirectory/invite",
  "/api/EventDirectory/setActive",
  "/api/EventDirectory/removeMember",
  "/api/EventDirectory/deleteEvent",

  // Notify — mutating + helpers
  "/api/Notify/ensureRecipient",
  "/api/Notify/requireNotification",
  "/api/Notify/notify",
  "/api/Notify/markRead",
  "/api/Notify/deleteNotification",

  // RotationGroups — mutating + helpers
  "/api/RotationGroups/normalizeUsers",
  "/api/RotationGroups/normalizeStrings",
  "/api/RotationGroups/requireOwner",
  "/api/RotationGroups/createTemplate",
  "/api/RotationGroups/updateTemplate",
  "/api/RotationGroups/deleteTemplate",
  "/api/RotationGroups/applyTemplate",
];
