---
timestamp: 'Thu Oct 16 2025 21:27:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[..\20251016_212754.e3ea6ce8.md]]'
content_id: e01421ab8c5c2530f5d6a8db36c1be0c568bf845592a4f24aed875eb756a1928
---

# response:

CrewCall is a modular backend organized around four distinct concepts: **EventDirectory**, **DutyRoster**, **RotationGroups**, and **Notify**. This architecture promotes strict separation of concerns, with each concept managing its own state and communicating through shared identifiers and declarative synchronizations.

The **EventDirectory** (`src/concepts/EventDirectory/EventDirectoryConcept.ts`) establishes the foundation by defining events and managing participant roles (Organizer, DutyMember). It's the source of truth for events and their members, which other concepts can reference by `Event` ID.

Building on this, **DutyRoster** manages the creation and assignment of specific duties *within* events established by the EventDirectory. It handles the "who does what" for a given event.

**RotationGroups** provides a mechanism for reusability, allowing the definition of templates that specify recurring duties or member groupings. When applied to an EventDirectory event, these templates generate structured data that feeds into the DutyRoster, automating duty creation and assignment.

Lastly, **Notify** acts as the system's communication layer. It consumes triggers from other concepts (e.g., new assignments from DutyRoster) to deliver relevant messages and reminders to users.

As detailed in the "Application-Wide Design Notes," this creates a clear dependency flow: EventDirectory underpins both DutyRoster and RotationGroups, with RotationGroups then feeding DutyRoster. Notify is a recipient of information from these concepts, ensuring a cohesive and extensible system.
