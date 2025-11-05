import { actions, type Sync } from "@engine";
import { DutyRoster, EventDirectory, Requesting } from "@concepts";
import { exclusions } from "@concepts/Requesting/passthrough.ts";

function isValidToken(token?: string): token is string {
  return typeof token === "string" && token.trim().length > 0;
}

// Simple in-memory auth store
const tokenStore = new Map<string,string>();
const userStore = new Map<string,{ userId: string; pw: string }>();
function newToken(){ return 't.'+Math.random().toString(36).slice(2) }
function createAccount(email: string, pw: string): { created?: boolean; message?: string; error?: string }{
  const key = email.toLowerCase();
  if (userStore.has(key)) return { error: 'User already exists' };
  const userId = key;
  userStore.set(key, { userId, pw });
  // Do NOT auto-login; require explicit login
  return { created: true, message: 'Account created, please log in' };
}
function login(email: string, pw: string): { token?: string; userId?: string; error?: string }{
  const key = email.toLowerCase();
  const rec = userStore.get(key);
  if (!rec || rec.pw !== pw) return { error: 'Log In Failed' };
  const token = newToken();
  tokenStore.set(token, rec.userId);
  return { token, userId: rec.userId };
}
function validateToken(token?: string){ return (token && tokenStore.get(token)) || undefined }

// Auth gate for excluded routes: block if excluded && token invalid
export const AuthGate_Unauthorized: Sync = ({ request, path, token }) => ({
  when: actions([Requesting.request, { path, token }, { request }]),
  where: (frames) => frames.filter((f) => {
    const p = f[path] as string; const t = f[token] as string | undefined;
    const full = `/api${p && p.startsWith('/') ? p : '/' + (p || '')}`;
    const isExcluded = exclusions.includes(full);
    return isExcluded && !validateToken(t);
  }),
  then: actions([Requesting.respond, { request, error: 'Unauthorized' }]),
});

// Auth.login -> { token, userId }
export const Auth_login: Sync = ({ request, email, pw, token, userId, authError }) => ({
  when: actions([Requesting.request, { path: '/Auth/login', email, pw }, { request }]),
  where: (frames) => frames.query((i:{email:string,pw:string})=>{
    const out = login(i.email, i.pw);
    return [{
      token: out.token ?? null,
      userId: out.userId ?? null,
      authError: out.error ?? null,
    }];
  }, { email, pw }, { token, userId, authError }),
  then: actions([Requesting.respond, { request, token, userId, error: authError }]),
});

export const Auth_createAccount: Sync = ({ request, email, pw, created, message, authError }) => ({
  when: actions([Requesting.request, { path: '/Auth/createAccount', email, pw }, { request }]),
  where: (frames) => frames.query((i:{email:string,pw:string})=>{
    const out = createAccount(i.email, i.pw);
    return [{
      created: out.created ?? false,
      message: out.message ?? null,
      authError: out.error ?? null,
    }];
  }, { email, pw }, { created, message, authError }),
  then: actions([Requesting.respond, { request, created, message, error: authError }]),
});

// Compatibility: also match paths without leading '/'
export const Auth_createAccount_NoSlash: Sync = ({ request, email, pw, created, message, authError }) => ({
  when: actions([Requesting.request, { path: 'Auth/createAccount', email, pw }, { request }]),
  where: (frames) => frames.query((i:{email:string,pw:string})=>{
    const out = createAccount(i.email, i.pw);
    return [{
      created: out.created ?? false,
      message: out.message ?? null,
      authError: out.error ?? null,
    }];
  }, { email, pw }, { created, message, authError }),
  then: actions([Requesting.respond, { request, created, message, error: authError }]),
});

// ------------------------ DutyRoster ------------------------

export const DutyRoster_addDuty_Request: Sync = ({ request, event, actor, title, dueAt }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/addDuty", event, actor, title, dueAt }, { request }]),
  then: actions([DutyRoster.addDuty, { event, actor, title, dueAt }]),
});

export const DutyRoster_addDuty_Response: Sync = ({ request, duty }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/addDuty" }, { request }],
    [DutyRoster.addDuty, {}, { duty }],
  ),
  then: actions([Requesting.respond, { request, duty }]),
});

export const DutyRoster_assignDuty_Request: Sync = ({ request, duty, actor, assignee }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/assignDuty", duty, actor, assignee }, { request }]),
  then: actions([DutyRoster.assignDuty, { duty, actor, assignee }]),
});

export const DutyRoster_assignDuty_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/assignDuty" }, { request }],
    [DutyRoster.assignDuty, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const DutyRoster_unassignDuty_Request: Sync = ({ request, duty, actor }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/unassignDuty", duty, actor }, { request }]),
  then: actions([DutyRoster.unassignDuty, { duty, actor }]),
});

export const DutyRoster_unassignDuty_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/unassignDuty" }, { request }],
    [DutyRoster.unassignDuty, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const DutyRoster_updateDuty_Request: Sync = ({ request, duty, actor, title, dueAt }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/updateDuty", duty, actor, title, dueAt }, { request }]),
  then: actions([DutyRoster.updateDuty, { duty, actor, title, dueAt }]),
});

export const DutyRoster_updateDuty_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/updateDuty" }, { request }],
    [DutyRoster.updateDuty, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const DutyRoster_markDone_Request: Sync = ({ request, duty, actor }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/markDone", duty, actor }, { request }]),
  then: actions([DutyRoster.markDone, { duty, actor }]),
});

export const DutyRoster_markDone_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/markDone" }, { request }],
    [DutyRoster.markDone, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const DutyRoster_reOpen_Request: Sync = ({ request, duty, actor }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/reOpen", duty, actor }, { request }]),
  then: actions([DutyRoster.reOpen, { duty, actor }]),
});

export const DutyRoster_reOpen_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/reOpen" }, { request }],
    [DutyRoster.reOpen, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const DutyRoster_deleteDuty_Request: Sync = ({ request, duty, actor }) => ({
  when: actions([Requesting.request, { path: "/DutyRoster/deleteDuty", duty, actor }, { request }]),
  then: actions([DutyRoster.deleteDuty, { duty, actor }]),
});

export const DutyRoster_deleteDuty_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/DutyRoster/deleteDuty" }, { request }],
    [DutyRoster.deleteDuty, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

// ---------------------- EventDirectory ----------------------

export const EventDirectory_createEvent_Request: Sync = ({ request, creator, title, startsAt, endsAt }) => ({
  when: actions([Requesting.request, { path: "/EventDirectory/createEvent", creator, title, startsAt, endsAt }, { request }]),
  then: actions([EventDirectory.createEvent, { creator, title, startsAt, endsAt }]),
});

export const EventDirectory_createEvent_Response: Sync = ({ request, event }) => ({
  when: actions(
    [Requesting.request, { path: "/EventDirectory/createEvent" }, { request }],
    [EventDirectory.createEvent, {}, { event }],
  ),
  then: actions([Requesting.respond, { request, event }]),
});

export const EventDirectory_invite_Request: Sync = ({ request, event, inviter, invitee, role }) => ({
  when: actions([Requesting.request, { path: "/EventDirectory/invite", event, inviter, invitee, role }, { request }]),
  then: actions([EventDirectory.invite, { event, inviter, invitee, role }]),
});

export const EventDirectory_invite_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/EventDirectory/invite" }, { request }],
    [EventDirectory.invite, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const EventDirectory_setActive_Request: Sync = ({ request, event, setter, flag }) => ({
  when: actions([Requesting.request, { path: "/EventDirectory/setActive", event, setter, flag }, { request }]),
  then: actions([EventDirectory.setActive, { event, setter, flag }]),
});

export const EventDirectory_setActive_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/EventDirectory/setActive" }, { request }],
    [EventDirectory.setActive, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const EventDirectory_removeMember_Request: Sync = ({ request, event, actor, member }) => ({
  when: actions([Requesting.request, { path: "/EventDirectory/removeMember", event, actor, member }, { request }]),
  then: actions([EventDirectory.removeMember, { event, actor, member }]),
});

export const EventDirectory_removeMember_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/EventDirectory/removeMember" }, { request }],
    [EventDirectory.removeMember, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});

export const EventDirectory_deleteEvent_Request: Sync = ({ request, event, actor }) => ({
  when: actions([Requesting.request, { path: "/EventDirectory/deleteEvent", event, actor }, { request }]),
  then: actions([EventDirectory.deleteEvent, { event, actor }]),
});

export const EventDirectory_deleteEvent_Response: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/EventDirectory/deleteEvent" }, { request }],
    [EventDirectory.deleteEvent, {}, {}],
  ),
  then: actions([Requesting.respond, { request, ok: true }]),
});



