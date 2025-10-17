// file: src/concepts/Notify/NotifyConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// ---------------------------------------------------------------------------
// Concept: Notify
// ---------------------------------------------------------------------------
const PREFIX = "Notify" + ".";

// Shared external identifiers
type User = ID;
type Notification = ID;

// Optional user-existence guard to keep this concept independent
// from any user directory. If provided, it's used to validate recipients.
export type UserExistenceGuard = (user: User) => Promise<boolean>;

// ---------------------------------------------------------------------------
// State documents
// ---------------------------------------------------------------------------
interface NotificationDoc {
  _id: Notification;
  recipient: User;
  subject: string;
  body: string;
  createdAt: Date;
  unread: boolean;
}

// ---------------------------------------------------------------------------
// Concept class
// ---------------------------------------------------------------------------
/**
 * @concept Notify
 * @purpose Deliver notifications to users (e.g., duty assignment & due-soon reminders)
 *          and allow users to mark/read or delete their own notifications.
 * @notes   No cross-concept calls; optional guard allows recipient validation.
 */
export default class NotifyConcept {
  private notifications: Collection<NotificationDoc>;
  private userExists?: UserExistenceGuard;

  constructor(
    private readonly db: Db,
    opts?: { userExists?: UserExistenceGuard },
  ) {
    this.notifications = this.db.collection(PREFIX + "notifications");
    this.userExists = opts?.userExists;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  private async ensureRecipient(user: User): Promise<Empty | { error: string }> {
    if (!this.userExists) return {}; // accept any ID if no guard is provided
    const ok = await this.userExists(user);
    return ok ? {} : { error: `Recipient ${user} is not a valid user` };
  }

  private async requireNotification(
    notification: Notification,
  ): Promise<NotificationDoc | { error: string }> {
    const n = await this.notifications.findOne({ _id: notification });
    if (!n) return { error: `Notification ${notification} not found` };
    return n;
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  /**
   * notify
   * @requires recipient is a valid user (if guard provided)
   * @effects  Creates a new notification with unread = true
   */
  async notify(
    { recipient, subject, body }: {
      recipient: User;
      subject: string;
      body: string;
    },
  ): Promise<{ notification: Notification } | { error: string }> {
    // Minimal validation
    if (typeof subject !== "string" || subject.trim() === "") {
      return { error: "subject must be a non-empty string" };
    }
    if (typeof body !== "string" || body.trim() === "") {
      return { error: "body must be a non-empty string" };
    }

    const valid = await this.ensureRecipient(recipient);
    if ("error" in valid) {
      return { error: valid.error };
    }

    const now = new Date();
    const notificationId = freshID() as Notification;

    await this.notifications.insertOne({
      _id: notificationId,
      recipient,
      subject: subject.trim(),
      body: body.trim(),
      createdAt: now,
      unread: true,
    });

    return { notification: notificationId };
  }

  /**
   * markRead
   * @requires notification.recipient = user
   * @effects  Sets unread = false
   */
  async markRead(
    { notification, user }: {
      notification: Notification;
      user: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireNotification(notification);
    if ("error" in found) return { error: found.error };

    if (found.recipient !== user) {
      return { error: "Users may only modify their own notifications" };
    }

    if (!found.unread) return {}; // idempotent: already read

    await this.notifications.updateOne(
      { _id: notification },
      { $set: { unread: false } },
    );
    return {};
  }

  /**
   * deleteNotification
   * @requires notification.recipient = user
   * @effects  Removes the notification
   */
  async deleteNotification(
    { notification, user }: {
      notification: Notification;
      user: User;
    },
  ): Promise<Empty | { error: string }> {
    const found = await this.requireNotification(notification);
    if ("error" in found) return { error: found.error };

    if (found.recipient !== user) {
      return { error: "Users may only delete their own notifications" };
    }

    const res = await this.notifications.deleteOne({ _id: notification });
    if (res.deletedCount === 0) {
      return { error: `Notification ${notification} not found` };
    }
    return {};
  }

  // -------------------------------------------------------------------------
  // Queries (non-actions; useful for tests/UI)
  // -------------------------------------------------------------------------

  async _getNotification(
    { notification }: { notification: Notification },
  ): Promise<NotificationDoc | null> {
    return await this.notifications.findOne({ _id: notification });
  }

  async _listUserNotifications(
    { user, onlyUnread = false }: { user: User; onlyUnread?: boolean },
  ): Promise<NotificationDoc[]> {
    const q: Record<string, unknown> = { recipient: user };
    if (onlyUnread) q.unread = true;
    return await this.notifications.find(q).sort({ createdAt: -1 }).toArray();
  }
}
