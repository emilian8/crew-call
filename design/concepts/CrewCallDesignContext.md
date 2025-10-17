# CrewCall Context (Assignment 4a)

CrewCall is a modular backend built from four concepts: **EventDirectory**, **DutyRoster**, **RotationGroups**, and **Notify**.
This context bundles the specs, implementations, tests, and design notes used for grading.

## Specs
[@EventDirectory.md](/design/concepts/EventDirectory/EventDirectory.md)
[@DutyRoster.md](/design/concepts/DutyRoster/DutyRoster.md)
[@RotationGroups.md](/design/concepts/RotationGroups/RotationGroups.md)
[@Notify.md](/design/concepts/Notify/Notify.md)

## Implementations
[@EventDirectoryConcept.ts](/src/concepts/EventDirectory/EventDirectoryConcept.ts)
[@DutyRosterConcept.ts](/src/concepts/DutyRoster/DutyRosterConcept.ts)
[@RotationGroupsConcept.ts](/src/concepts/RotationGroups/RotationGroupsConcept.ts)
[@NotifyConcept.ts](/src/concepts/Notify/NotifyConcept.ts)

## Tests
[@EventDirectoryConcept.test.ts](/src/concepts/EventDirectory/EventDirectoryConcept.test.ts)
[@DutyRosterConcept.test.ts](/src/concepts/DutyRoster/DutyRosterConcept.test.ts)
[@RotationGroupsConcept.test.ts](/src/concepts/RotationGroups/RotationGroupsConcept.test.ts)
[@NotifyConcept.test.ts](/src/concepts/Notify/NotifyConcept.test.ts)

## Test Output
[@EventDirectoryTesting.md](/design/concepts/EventDirectory/EventDirectoryTesting.md)
[@DutyRosterTesting.md](/design/concepts/DutyRoster/DutyRosterTesting.md)
[@RotationGroupsTesting.md](/design/concepts/RotationGroups/RotationGroupsTesting.md)
[@NotifyTesting.md](/design/concepts/Notify/NotifyTesting.md)

## Design Notes (Concept-level)
[@EventDirectoryDesignChanges.md](/design/concepts/EventDirectory/EventDirectoryDesignChanges.md)
[@DutyRosterDesignChanges.md](/design/concepts/DutyRoster/DutyRosterDesignChanges.md)
[@RotationGroupsDesignChanges.md](/design/concepts/RotationGroups/RotationGroupsDesignChanges.md)
[@NotifyDesignChanges.md](/design/concepts/Notify/NotifyDesignChanges.md)

## Final Application Design Notes
[@CrewCallDesignChanges.md](/design/concepts/CrewCallDesignChanges.md)

# prompt:
Give a concise, high-level summary (less than 300 words) of CrewCall’s architecture and how the four concepts interact, citing the linked files by name when relevant.


# response:

CrewCall is a modular backend organized around four distinct concepts: **EventDirectory**, **DutyRoster**, **RotationGroups**, and **Notify**. This architecture promotes strict separation of concerns, with each concept managing its own state and communicating through shared identifiers and declarative synchronizations.

The **EventDirectory** (`src/concepts/EventDirectory/EventDirectoryConcept.ts`) establishes the foundation by defining events and managing participant roles (Organizer, DutyMember). It's the source of truth for events and their members, which other concepts can reference by `Event` ID.

Building on this, **DutyRoster** manages the creation and assignment of specific duties *within* events established by the EventDirectory. It handles the "who does what" for a given event.

**RotationGroups** provides a mechanism for reusability, allowing the definition of templates that specify recurring duties or member groupings. When applied to an EventDirectory event, these templates generate structured data that feeds into the DutyRoster, automating duty creation and assignment.

Lastly, **Notify** acts as the system's communication layer. It consumes triggers from other concepts (e.g., new assignments from DutyRoster) to deliver relevant messages and reminders to users.

As detailed in the "Application-Wide Design Notes," this creates a clear dependency flow: EventDirectory underpins both DutyRoster and RotationGroups, with RotationGroups then feeding DutyRoster. Notify is a recipient of information from these concepts, ensuring a cohesive and extensible system.
