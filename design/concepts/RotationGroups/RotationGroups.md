# concept: RotationGroups
* **concept**: RotationGroups [User, Event, Template]
* **purpose**: To allow organizers to create reusable templates that define groups of members and
standard duties which can be quickly applied to new events.
* **principle**: If an organizer defines a rotation template of standard duties and members, then they
can apply that template to an event to automatically populate its duties and assignments, saving time
and ensuring fairness across recurring schedules.
* **state**:
* A set of `Templates` with
* an `id` of type `Template`
* an `owner` of type `User`
* a `title` of type `String`
* a `members` of type `Set`
* a `standardDuties` of type `Set`
* a `createdAt` of type `Time`
* an `updatedAt` of type `Time`
* **actions**:
* `createTemplate (owner: User, title: String, members: Set, standardDuties: Set): (template:
Template)`
* **requires**: `members` and `standardDuties` are non-empty.
* **effects**: Creates a new reusable rotation template owned by `owner`.
* `updateTemplate (template: Template, actor: User, title?: String, members?: Set, standardDuties?:
Set)`
* **requires**: `actor = template.owner`.
* **effects**: Updates the template’s metadata or membership/duties; sets `updatedAt` to now.
* `deleteTemplate (template: Template, actor: User)`
* **requires**: `actor = template.owner`.
* **effects**: Deletes the template and all its stored metadata.
* `applyTemplate (template: Template, event: Event, actor: User)`
* **requires**: `actor = template.owner`.
* **effects**: Applies the template to `event`, creating a new set of duties based on `standardDuties`
and linking `members` to those duties through synchronizations.
* **synchronizations**:
* **Template Application (granular)**
* when `applyTemplate(template t, event e, actor)` succeeds
where `dutyName ∈ t.standardDuties`
then `DutyRoster.addDuty(e, actor, dutyName, dueAt)`
for each `dutyName` in `t.standardDuties`.
* **Access Control**
* when any action modifies or deletes `Template t`
where `actor ≠ t.owner`
then error `"Only the template owner may modify or apply this template."`
* **notes on modularity**:
* `RotationGroups` defines its own data (templates) and does not directly manipulate state in
`DutyRoster` or `EventDirectory`.
* Duty creation and assignment are triggered declaratively via synchronizations, not by direct function
calls.
* Role permissions are enforced through `requires` clauses and access-control syncs.
* Ensures templates are reusable and maintain separation of concerns between planning
(RotationGroups) and execution (DutyRoster).
