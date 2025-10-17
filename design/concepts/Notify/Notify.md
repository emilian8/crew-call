# concept: Notify
* **concept**: Notify [User, Notification]
* **purpose**: To deliver notifications to users when duties are assigned or due soon, and to allow
users to mark notifications as read.
* **principle**: If a duty is assigned or nearing its due time, then the assigned user receives a
notification; users can view their notifications and mark them as read to acknowledge receipt.
* **state**:
* A set of `Notifications` with
* an `id` of type `Notification`
* a `recipient` of type `User`
* a `subject` of type `String`
* a `body` of type `String`
* a `createdAt` of type `Time`
* an `unread` of type `Flag`
* **actions**:
* `notify (recipient: User, subject: String, body: String): (notification: Notification)`
* **requires**: `recipient` is a valid user.
* **effects**: Creates a new notification with `unread = true`, delivered to the specified recipient.
* `markRead (notification: Notification, user: User)`
* **requires**: `notification.recipient = user`.
* **effects**: Sets `notification.unread = false`, marking it as read.
* `deleteNotification (notification: Notification, user: User)`
* **requires**: `notification.recipient = user`.
* **effects**: Removes the notification from state.
* **synchronizations**:
* **Duty Assignment Notification**
* when a duty is assigned to a user
then `Notify.notify(assignee, "New duty assigned", duty.title + " due " + duty.dueAt)`
* **Due-Soon Reminder**
* when a duty’s due time is within 24 hours
then `Notify.notify(assignee, "Duty due soon", duty.title + " is due by " + duty.dueAt)`
* **Access Control**
* when any action modifies or deletes a notification
where `user ≠ notification.recipient`
then error `"Users may only modify or delete their own notifications."`
* **notes on modularity**:
* `Notify` is a standalone delivery concept that does not depend on `EventDirectory` or `DutyRoster`.
* It reacts to synchronizations from other concepts rather than direct calls.
* All state changes are local to `Notify`, and only notification identifiers are referenced externally.
* Follows clear separation of concerns: other concepts trigger, but only Notify stores and manages user
notifications.
