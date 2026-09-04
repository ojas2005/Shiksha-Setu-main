# Shiksha Setu — Clickable HTML Prototype: How to Use

This folder contains a **single, standalone, self-contained prototype** (`index.html`) of the Shiksha Setu mobile experience. It is completely separate from the main React application — nothing here affects or depends on it.

---

## 1. What this is

- One HTML file. No installation, no build step, no server, no internet connection required.
- Shown inside a **realistic phone-frame mockup** on a laptop/desktop screen.
- Opened directly on a real phone browser, the frame disappears and the app fills the whole screen edge-to-edge.
- Every button, tab, search box, and card is genuinely interactive (not a static image).

---

## 2. How to open it

### On a laptop / desktop
Double-click `index.html`, or drag it into any browser window (Chrome, Edge, Firefox, Safari all work).

### On a phone
Copy `index.html` to the phone (email it to yourself, AirDrop it, upload it to Google Drive/OneDrive, or use a USB cable), then open it with the phone's browser. No Wi-Fi or server is needed — it works completely offline from the moment it opens because it's just one local file.

---

## 3. Signing in

You'll land on the **login screen** with three demo accounts already listed:

| Account | Role |
|---|---|
| Anita Sharma (`teacher.anita`) | Teacher |
| Rekha Verma (`teacher.rekha`) | Teacher |
| Aarav Mehta (`admin.demo`) | Admin |

Tap an account card to select it (it highlights with a teal border), then tap **"Enter workspace →"**. There's no real password check — this is a click-through prototype, so selecting an account is enough.

---

## 4. Navigating the app

- A **bottom tab bar** appears once logged in — different tabs for Teacher vs. Admin roles.
- Tapping a top-left **back arrow (←)** on any inner screen returns you to wherever you came from.
- **"Sign out"** in the tab bar always returns you to the login screen.
- A small **toast message** pops up at the bottom after key actions (login, generating an assessment, opening a resource) to confirm what just happened.

---

## 5. Teacher walkthrough

Log in as **Anita Sharma**, then explore in this order:

1. **Home** — the teacher dashboard. Shows today's recommended actions, class stats, and a "class learning signals" summary.
2. **Assess** tab → tap **"⚡ Generate pulse"**.
   - Watch the status chip change from *Draft* to *Generated*.
   - Scroll down to see **one question per performance level** (L1 Foundation through L5 Advanced) — this is the core "Monthly Pulse" idea: five minutes, one question per level, not a fixed generic test.
   - Tap **"🖨️ Print student paper"** to see the actual print-ready output (your browser's print dialog will open; the printed sheet shows only the questions, no diagnostic labels).
3. **Groups** tab — shows evidence-based teaching groups (e.g. "Foundation · Fractions", 12 learners) each with a concrete **next-day classroom activity**, not just a score. Tap **"Open resource →"** to see the confirmation toast.
4. **Parents** tab — simple, print-friendly parent progress cards. Tap **"🖨️ Print selected cards"** to see the actual printable output.

---

## 6. Admin walkthrough

Sign out, then log in as **Aarav Mehta**:

1. **Home** — admin dashboard with school/teacher/student counts and a "needs attention" list of flagged students.
2. **Academic** tab — four sub-tabs across the top:
   - **Standards** — Grades 5–12 with active/inactive status (Grade 5 and "Bridge Course A" are intentionally inactive, showing the system supports future/extra grades without code changes).
   - **Subjects** — the full subject catalogue.
   - **Level frameworks** — the five-level mastery framework with real threshold percentages, plus a preview of a six-level extended framework.
   - **Competencies** — has a **live search box**. Try typing `fractions` or `angles` and watch the list filter instantly.
3. **Questions** tab — the question bank, also with a live search box. Try typing `sequence` or a Hindi word fragment.
4. **Graph** tab — a **knowledge graph explorer**. Tap through the chain of nodes (Academic Year → Standard → Subject → Domain → Competency). Tapping the highlighted **Competency** node at the bottom opens a detail panel showing its prerequisites, assessment evidence, and connected learning resources.

---

## 7. What's real vs. what's simulated

| Behavior | Status |
|---|---|
| Navigation, tabs, back button, sign out | Fully working |
| Live search/filter on Competencies and Questions | Fully working |
| Assessment generation status change + toast | Fully working |
| Print student paper / print parent cards | Fully working (uses your browser's real print function) |
| Knowledge graph node click → detail panel | Fully working |
| Underlying data (students, questions, competencies) | Fixed sample data for demo purposes — not connected to a database |
| Login password check | Not enforced — this is a click-through demo, any selected account works |

---

## 8. Relationship to the full application

This prototype is a **visual/interaction demo only**. The full, functionally complete application (with real IndexedDB-backed data, dynamic level frameworks, assessment logic, and installable PWA support) lives in the main project and is described in [`../DEMO_GUIDE.md`](../DEMO_GUIDE.md). Use this HTML prototype when you need something you can hand to someone instantly with zero setup — e.g. for a quick pitch, a judge's phone, or a no-Wi-Fi room.
