# Shiksha Setu — Demo Guide

*"Five-Minute Assessment. Next-Day Teaching Action."*

This guide explains how to run, install, and demo the prototype end to end — on a laptop and on a phone — and walks through every screen and workflow.

---

## 1. About mobile installation (read this first)

**No separate native app is needed or built.** Shiksha Setu is a **Progressive Web App (PWA)**. The exact same code that runs in a desktop browser can be **installed on an Android or iPhone home screen** and then **launches and works fully offline**, like a native app icon — no app store, no Docker, no paid services, no second codebase.

This is intentional and matches the project's own constraints (offline-first, low-cost, no mandatory cloud services, single maintainable codebase). Building a true native app (Swift/Kotlin) would require separate toolchains, app-store review, and ongoing dual maintenance — unnecessary for this goal and against the "keep it simple / single stack" requirement.

**Verified proof it works offline:** the production build was served, the service worker was confirmed `activated` and in control of the page, the server process was then killed entirely, and a fresh full-page navigation to a new route still rendered the complete app with live business logic (assessment generation). This confirms the offline behavior is real, not just claimed.

---

## 2. Running it yourself

From the project folder:

```powershell
npm install        # first time only
npm run build       # produces the installable, offline-capable build in dist/
npm run preview -- --host 0.0.0.0 --port 4173
```

You'll see two URLs:

- `http://localhost:4173/` — use this on the same laptop.
- `http://10.140.165.33:4173/` (your machine's Wi-Fi IP; yours may differ) — use this from a **phone on the same Wi-Fi network**.

> For day-to-day development (hot reload, no offline caching), use `npm run dev` instead — that mode is for coding, not for the offline/mobile demo.

---

## 3. Installing it on a phone

### Android (Chrome)
1. Connect the phone to the **same Wi-Fi** as the laptop running the server.
2. Open Chrome and go to `http://<your-laptop-ip>:4173/`.
3. Tap the **⋮ menu → "Install app"** (or a banner may appear automatically).
4. The app icon appears on the home screen. Opening it launches full-screen, no browser bar.
5. Turn on **Airplane Mode** and reopen the app from the home screen — it still works (login session, dashboard, assessments, everything already loaded).

### iPhone (Safari)
1. Same Wi-Fi as above.
2. Open Safari and go to `http://<your-laptop-ip>:4173/`.
3. Tap the **Share icon → "Add to Home Screen"**.
4. The app icon appears on the home screen with the proper icon (not a screenshot thumbnail).
5. Turn on Airplane Mode and reopen from the home screen — same offline behavior.

### Important real-world note
The phone must load the app **once while connected** to that address so the service worker can cache the app shell. After that first load, it works fully offline. This is standard, expected PWA behavior — the same is true of any offline-capable app before its first install.

---

## 4. Demo accounts

| Role | Username | Password |
|---|---|---|
| Administrator | `admin.demo` | `Admin@123` |
| Teacher | `teacher.anita` | `Teacher@123` |
| Teacher | `teacher.rekha` | `Teacher@123` |

Authentication is local and for demonstration only — no external identity service is used.

---

## 5. Suggested demo flow (10–12 minutes)

### A. Open with the story (1 min)
Show the login screen. Point out:
- The tagline and the offline/synthetic-data signals on the left panel.
- The account switcher — pick **Anita Sharma (Teacher)** first, since the teacher journey is the primary demo path.

### B. Teacher dashboard — "today's action" (2 min)
Login as `teacher.anita`. Highlight:
- **"Your next best actions"** — the app leads with what to *do*, not just data.
- The notice banner: *"Tomorrow's groups are ready"* — this is the core value proposition (assessment → grouping → action).
- The stat row: assigned learners, pulse due, evidence captured, parent cards ready.
- The **class learning signals** table — mixed levels flagged per class.
- Quick actions panel on the right (generate pulse, open groups, print parent cards).

### C. Generate a Monthly Pulse assessment (2–3 min)
Navigate to **Assessments**. Click **"Generate pulse"**.
- Explain: **one question per active performance level** — not a fixed count. With the 5-level framework seeded, that's 5 questions; if an admin later enables a 6-level framework, this becomes 6 automatically.
- Point out the generated set name pattern (e.g. `STD6_MAT_202609_SET01`) and its **Draft** status.
- Walk through the **question coverage** list — one row per level (L1 Foundation → L5 Advanced), each mapped to a real competency.
- Show the **"Designed for action"** panel — this is the explainability requirement: every question maps to one competency and one level, and results will point to the *earliest unmet prerequisite*, not just a raw score.
- Click **"Print student paper"** to show the paper-first workflow.

### D. Teaching groups — the "next-day action" payoff (2 min)
Navigate to **Teaching Groups**. Show:
- Groups formed by **evidence**, not fixed labels (e.g. "Foundation · Fractions", "Developing · Patterns").
- Each group's **next-day activity** recommendation — concrete, classroom-ready, not just a score.

### E. Parent progress cards (1 min)
Navigate to **Parent Progress**. Emphasize:
- Cards are **simple by design** — no diagnostic jargon, just a focus area and a home-practice suggestion.
- Built for low-literacy and low-digital-access households (printable, not dependent on a working phone number).

### F. Switch to Admin — show the configuration depth (3 min)
Sign out, log in as `admin.demo`. Show:
- **Admin dashboard** — school/teacher/student counts, assessments this month, sync queue, all from the seeded synthetic dataset.
- **Academic structure** page — tabs for Standards, Subjects, Level Frameworks, Competencies:
  - Standards tab: Grade 5 and "Bridge Course A" shown as **inactive**, Grades 6–12 configured — proving standards are *data*, not hardcoded arrays.
  - Level Frameworks tab: the five-level framework with **configurable mastery thresholds**, colors, and icons — nothing hardcoded in components.
  - Competencies tab: sample of the 150 seeded competencies, each tied to a standard/subject/domain and an observable learning outcome.
- **Question bank** — searchable, 360 original synthetic questions, each marked print-ready and `DEMO_NOT_VALIDATED`.
- **Knowledge graph** — the hierarchical explorer: Academic Year → Curriculum → Standard → Subject → Domain → Competency, with a detail panel showing prerequisites, evidence counts, and connected resources when a node is selected.
- **Schools & classes** — delivery hierarchy kept separate from academic standards (a "Class" is a delivery unit; a "Standard" is the grade definition).
- **Sync queue** — pending local records, proving the offline-first, "nothing is lost" design.

### G. Close with the offline proof (1 min)
This is the most convincing moment for a hackathon judge:
1. On the phone (already installed to the home screen per Section 3), turn on **Airplane Mode**.
2. Open the app from the home screen icon.
3. Navigate between screens — dashboard, assessments, teaching groups — all work with zero connectivity.
4. State clearly: *"This is the same app a teacher would use in a school with no reliable internet."*

---

## 6. What's demonstrated vs. what's flagged as future work

**Fully working in this prototype:**
- Offline-first installable web app (PWA) on desktop, Android, and iPhone
- Role-based login and navigation (Admin / Teacher)
- Synthetic, internally consistent demo dataset (students, competencies, questions, subjects, levels, schools)
- Dynamic, configuration-driven standards and performance-level frameworks (not hardcoded)
- Monthly Pulse assessment generation (one question per active level)
- Knowledge graph explorer with explainable relationships
- Teaching groups and next-day activity recommendations
- Parent progress card concept
- Local IndexedDB persistence with a demo-data reset action

**Clearly marked as prototype-stage (consistent with the brief's own requirement to flag demo assumptions):**
- All academic content is synthetic and labeled `DEMO_NOT_VALIDATED` — requires subject-matter expert review before classroom use.
- CSV import/export, full CRUD admin forms, and the GenAI-assistance screen are structured but not the focus of this walkthrough — extend from the existing repository/service pattern.
- A future FastAPI + cloud database backend can be added without rewriting the UI, since data access already goes through a repository-style service layer (`src/db.ts`, `src/services.ts`) rather than being embedded in components.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| Phone can't reach `http://<ip>:4173/` | Confirm both devices are on the *same* Wi-Fi network and no firewall is blocking port 4173. |
| "Install app" option missing on Android | Reload the page once; Chrome sometimes needs one full load before offering install. |
| iPhone home screen icon looks blank/generic | Confirm you're loading the rebuilt app (`npm run build` was run after any icon changes) and hard-refresh Safari once before adding to home screen. |
| Changes not appearing after `npm run build` | The service worker auto-updates in the background; force it by closing and reopening the installed app, or hard-refresh once in the browser tab. |
