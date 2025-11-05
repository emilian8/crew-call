# CrewCall — Final Design Document

## Overview
CrewCall is a web application that organizes and tracks shared household duties. It evolved from the early conceptual model in **Assignment 2** into a polished, deployed, full-stack app with secure synchronizations and a refined Vue-based interface. This document summarizes how the final design differs from the original concept design and the visual prototype in **Assignment 4b**.

---

## 1. Concept Evolution

### 1.1 Initial Concept (Assignment 2)
- **Core Concepts:**
  - `EventDirectory` for creating and managing shared events.
  - `DutyRoster` for defining, assigning, and marking duties.
  - `Members` for participant tracking.
  - `Notify` for reminders and updates.
- All concept actions were callable directly from the front end (no sync layer).
- No authentication, authorization, or data validation at the backend level.

### 1.2 Visual Design (Assignment 4b)
- Implemented a **Vue 3 frontend** with reactive lists and component-based architecture.
- Added a **Members tab** and progress indicators for assigned/completed duties.
- Introduced color-coded status markers and the ability to archive completed duties.
- Focused on accessibility and modern aesthetics with:
  - **Typography:** Inter & Nunito Sans.
  - **Color Palette:** Purples, teals, and warm coral tones.
- Backend still relied on direct API calls without secure mediation.

---

## 2. Final Implementation (Assignment 6)

### 2.1 Synchronizations and Security
- Integrated the **Requesting concept** and sync engine for secure backend coordination.
- Divided routes into:
  - **Included (read-only)** — e.g., `_getDuty`, `_getEventDuties`.
  - **Excluded (mutating)** — e.g., `addDuty`, `assignDuty`, `markDone`.
- Each excluded route now uses:
  ```
  Requesting.request → Concept Action → Requesting.respond
  ```
- Added **AuthGate sync** to enforce authentication before executing any excluded route.

### 2.2 Authentication Layer
- Implemented lightweight token-based authentication:
  - `Auth.login(email, password)` issues a token.
  - `Auth.validate(token)` verifies validity and identifies the user.
- Tokens are attached automatically to frontend POST requests.
- Frontend requires login for event creation and duty management actions.

### 2.3 Authorization Logic
- **Event Owners** — can create, invite, and delete members or events.
- **Members** — can assign and complete their own duties.
- Unauthorized users are blocked by backend syncs via `Requesting.respond(error)`.

### 2.4 Reactive Counters and Archiving
- Backend syncs automatically update counters for completed and active duties.
- Completed duties can be archived for cleaner overviews.
- This logic, previously in the frontend, now lives entirely in the backend for reliability.

---

## 3. Visual and UX Refinements
| Aspect | Assignment 4b | Final Version |
|:--|:--|:--|
| **API Calls** | Direct concept access | Routed through syncs |
| **Auth** | None | Token-based validation |
| **Frontend Logic** | Local state updates | Reactive via backend responses |
| **Error Handling** | Console logs only | Structured backend responses |
| **Counters & Archive** | Managed client-side | Handled by backend syncs |
| **Security** | None | Enforced by AuthGate |

### Design Highlights
- **Layout:** Split panel view — sidebar for events/members, main panel for duties.
- **Color palette:** Gradient purples, indigo, and coral accents.
- **Typography:** Rounded sans-serif fonts for a friendly look.
- **Responsiveness:** Reactive components update in real-time using Pinia store.

---

## 4. Notable Design Moments
1. Migrated duty operations from direct calls to backend syncs.
2. Debugged AuthGate to ensure excluded routes properly returned 401s.
3. Consolidated all API calls behind one global `post()` helper that attaches tokens.
4. Improved UX by moving counter and archive logic server-side.
5. Simplified error feedback with consistent backend responses.

---

## 5. Reflection Summary
- Moving sync logic server-side significantly improved maintainability.
- The addition of minimal authentication satisfied the course’s security goals with low complexity.
- Using the Context tool for backend development allowed fast iteration and traceability.
- The final app mirrors the original CrewCall user journey precisely:
  - **Create Event → Add Members → Add Duty → Assign → Mark Done → Archive → Track Progress.**
