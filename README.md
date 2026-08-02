# Notes — A Vanilla JS Note-Taking App

A single-page note-taking app built for the "DOM & Browser APIs" lab assignment, using only HTML, CSS, and vanilla JavaScript (ES6 modules) — no frameworks, no build step.

## Running it

There's no build step. Because the app uses ES6 modules (`import`/`export`), it must be served over HTTP rather than opened directly as a `file://` URL (browsers block module imports from the filesystem). Any static file server works, for example:

```bash
npx serve .
```

Then open the printed `localhost` URL.

## Features

- **Auth (simulated)**: Login, Sign Up, Forgot Password, and Reset Password screens gate the app, plus a Change Password panel in Settings. There is no backend, so this is a client-side simulation — see "Known simplifications" below.
- **Notes**: create, read, update, delete
- **Archive**: archive/restore notes, with a separate Archived Notes view
- **Tags**: add tags to a note, filter by tag from a dynamically generated sidebar list
- **Search**: live search across title, content, and tags, spanning both active and archived notes
- **Themes**: light, dark, and "System" (follows the OS's `prefers-color-scheme`) color themes; sans-serif, serif, and monospace font themes — both persisted
- **Validation**: a note's title is required, with an inline error, disabled Save button, and validation on both blur and submit
- **Drafts**: unsaved edits auto-save to `sessionStorage` and restore if the page reloads
- **Geolocation (bonus)**: attach your current coordinates to a note via the browser's Geolocation API, with graceful handling of denied permission or an unsupported browser
- **Keyboard & accessibility**: full tab order, a focus trap in the confirmation modal, Escape to cancel/close, arrow-key navigation between notes, visible focus rings, and ARIA labels throughout
- **Responsive**: single-view list/detail on mobile, a 4-column layout on desktop

## Project structure

```
index.html          Semantic HTML skeleton for every screen/state
src/
  css/
    styles.css       All styling, including dark theme and font theme variables
  js/
    main.js          Entry point: wires the other modules together, owns app state, handles events
    storage.js       The only module that touches localStorage/sessionStorage
    noteManager.js   The Note data model and note business rules (create/delete/search/filter/tag)
    auth.js          Password validation and login-matching rules for the simulated account
    ui.js            The only module that touches the DOM for rendering
    themes.js        Applies the color/font theme by setting attributes on <html>
```

Each module has one job, and data flows in one direction: `main.js` reacts to an event → asks `noteManager.js` to change the data → asks `storage.js` to persist it → asks `ui.js` to re-render. No module skips a layer (e.g. `ui.js` never reads `localStorage` directly).

## Known simplifications

These were deliberate choices, not oversights — noted here in case they come up in review:

- **Auth is simulated, not real security.** The assignment describes a single-user, client-side-only app with no backend, so there is nowhere secure to check a password. Sign Up stores one plain-text `{ email, password }` account in `localStorage` (see `auth.js`'s file comment); Login compares against it directly. This is enough to demonstrate the full flow (including validation, a "forgot password" simulation, and session persistence across reloads) but must never be mistaken for real authentication — anyone with access to the browser's dev tools can read or change the stored credentials. The "Log in with Google" button is decorative (shows a toast) since real OAuth requires a backend and a registered client ID.
- **`main.js` is larger than the "~250 lines" guideline** (around 900 lines). It's the composition root for a genuinely multi-feature app (auth, CRUD, archive, tags, search, settings, modals, drafts, geolocation, keyboard handling), and splitting it further would mean adding files beyond the assignment's specified five modules (`auth.js` was already an intentional, justified exception — see Project structure above). Each concern is grouped under a clear section comment and is independently easy to point to and explain in a walkthrough.
- **Tablet uses the mobile layout.** There's one responsive breakpoint at 900px (mobile-style single view below it, 4-column desktop layout above it) rather than a distinct third tablet layout, since no tablet-specific Figma frame was provided and the mobile layout reads fine at tablet widths.
- **Geolocation stores raw coordinates**, not a city name. Reverse-geocoding a coordinate into a city requires a third-party API (and typically an API key), which would add an external network dependency this project otherwise avoids.
- **Sample data is 3 notes**, not the full set shown in the Figma mockups, since the point of the seed data is just to demonstrate the app on first run, not to reproduce the mockup exactly.

## Demoing each feature (for the lab review)

| Feature | How to show it |
|---|---|
| Auth (simulated) | Sign Up with any email + 8+ character password (auto-logs you in). Settings → Logout. Log back in with the same credentials. Try "Forgot" → wrong email shows an error, the account's email reveals a "continue to reset" link (simulating the emailed link) → set a new password → log in with it. Or Settings → Change Password (wrong old password / weak new password / mismatched confirm all show inline errors). |
| Create/Read/Update/Delete | Click "+ Create New Note", fill it in, Save. Edit any field on an existing note and Save. Click Delete Note and confirm. |
| Archive/Restore | Open a note, click Archive Note, confirm. Click "Archived Notes" in the sidebar to see it; open it and click Restore Note. |
| Tags | Type tags (comma-separated) into a note, save, then click that tag in the sidebar to filter. |
| Search | Type into the header search box; try a term that only matches an archived note's tag. |
| Validation | Create a new note and leave the title blank — Save is disabled and an error shows on blur/submit. |
| Drafts | Start editing a note, type something, then reload the page — the unsaved text is still there. |
| Themes/Fonts | Settings (gear icon) → Color Theme / Font Theme → pick an option → Apply Changes. |
| Geolocation | Open a note, click "+ Add Location" (browser will prompt for permission). |
| Keyboard | Tab through the app; use Up/Down arrows on a focused note card; open a modal and press Tab (it stays trapped) or Escape (it closes and focus returns). |
| Responsive | Resize the browser below ~900px width, or open dev tools' device toolbar. |

## Commit history

The commit history is organized as one commit per feature milestone (data layer → read → create → update → validation → drafts → delete → archive → tags → search → accessibility → themes → responsive → geolocation → auth), each independently reviewable and testable. Run `git log --oneline` to see the full sequence.
