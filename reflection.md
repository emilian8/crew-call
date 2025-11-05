# CrewCall — Reflection Document

## Overall Experience
Building **CrewCall** was an end-to-end experience in full-stack software design — from abstract concept modeling to a fully deployed, authenticated web app. It combined design thinking, backend synchronization, and frontend polish, mirroring how professional systems evolve from prototype to production.

---

## 1. What Went Well
- **Incremental Structure:** The assignment sequence (concept → UI → syncs → deploy) provided a clear build-up path that made each stage feel achievable.
- **Backend Syncs:** Using the Requesting concept made backend control much more structured than ad hoc REST routes. It was satisfying to see Request → Action → Respond traces behaving predictably.
- **Frontend Reactivity:** Vue + Pinia made it simple to keep the UI synced with backend state. The counters and archive views updated automatically once syncs returned updated data.
- **Auth Integration:** Adding token-based authentication was easier than expected. A single global API wrapper handled most of the logic.

---

## 2. Challenges and Lessons Learned
- **Initial Confusion with Syncs:** Understanding how excluded routes converted into `Requesting.request` actions took time. Early on, I mismatched path formats (`"/DutyRoster/addDuty"` vs `"DutyRoster/addDuty"`), which caused silent failures.
- **Render Deployment Issues:** The build pipeline required cleaning up mixed npm/yarn usage, adjusting type configs, and fixing path aliases. This improved my understanding of CI/CD details.
- **TypeScript Strictness:** Type errors during deployment were unexpectedly strict. Relaxing rules temporarily while keeping `vue-tsc` for local checks taught me to balance type safety with practical deadlines.
- **Auth Logic:** While adding tokens wasn’t complex, integrating them into sync conditions without overcomplicating state handling required care.

---

## 3. Skills Acquired
- Designing **synchronizations** that replace fragile frontend orchestration.
- Implementing **auth gates** and role-based permissions at the backend level.
- Debugging **build and deployment** issues under a CI environment.
- Structuring code to be readable by both humans and LLM tooling (Context integration).

---

## 4. Use of the Context and Agentic Tools
- **Context Tool:** Used extensively for managing design versions and generating immutable snapshots for sync specs. It helped maintain a clear evolution record of concepts.
- **Agentic Coding (LLM) Tools:** These were invaluable for scaffolding sync logic and debugging. Instead of writing boilerplate, I focused on reasoning about architecture and security.
- The LLM was particularly useful for generating structured API specs, clarifying path routing, and resolving Render deployment errors.

---

## 5. Reflections on LLMs in Software Development
- **Strengths:** LLMs excel at code templating, refactoring, and architectural scaffolding. They accelerate development when humans remain responsible for reasoning and testing.
- **Limits:** They shouldn’t replace conceptual thinking or debugging intuition; a developer still needs to interpret and verify output.
- **Ideal Role:** A partner that handles repetitive structure and helps visualize patterns while the human focuses on correctness, maintainability, and product goals.

---

## 6. Future Improvements
- Add user-level role management beyond “owner” and “member.”
- Implement richer notification logic and automated duty rotation.
- Strengthen testing by integrating end-to-end tests for sync workflows.
- Explore a CI-based static analysis pipeline for automatic type enforcement.

---

**Summary:**  
This project demonstrated the balance between conceptual design and implementation discipline. The shift from “frontend orchestrated” to “backend synchronized” thinking was the biggest leap. CrewCall evolved from an academic prototype into a deployable, secure app — a microcosm of real-world software engineering.
