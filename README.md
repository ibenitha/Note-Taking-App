# Notes — A Vanilla JS Note-Taking App

A single-page note-taking app built for the "DOM & Browser APIs" lab assignment, using only HTML, CSS, and vanilla JavaScript (ES6 modules) — no frameworks, no build step, no dependencies.

This project is a Note-Taking Web Application built using HTML, CSS, and JavaScript (ES6 modules). It is a Single Page Application (SPA), meaning all screens and features are managed within one HTML page without navigating to different pages.

The purpose of the application is to allow users to create, organize, edit, search, archive, and manage notes while demonstrating the concepts required in the assignment, including DOM manipulation, event handling, browser storage APIs, modular JavaScript, accessibility, and responsive design.

![Desktop, dark mode](screenshots/desktop-dark.png)

## Project Overview

The app lets a user create, edit, tag, archive, and search notes, with everything persisted in the browser via `localStorage`. It's gated behind a small simulated login (no backend — see [Known limitations](#known-limitations)), and includes light/dark/system color themes, three font themes, unsaved-draft recovery, and optional geolocation tagging.

The focus of the assignment is DOM manipulation, event handling (especially delegation), and browser storage APIs — not visual design — but the UI was built to match a provided Figma spec as closely as possible, and the Figma design is treated as a project requirement in its own right (see [Intentional design decisions](#intentional-design-decisions)).

## Features

_Note: four Git-workflow lab features (export/import, categories, rich text, and note sharing) are being added via separate feature branches — see the open pull requests._

- **Auth (simulated)**: Login, Sign Up, Forgot Password, and Reset Password screens gate the app, plus a Change Password panel in Settings.
- **Notes**: create, read, update, delete, with a title-required validation rule.
- **Archive**: archive/restore notes, with a separate Archived Notes view and its own empty state.
- **Tags**: add multiple tags to a note, filter by tag from a dynamically generated tag list (sidebar on desktop/tablet, a dedicated full-screen Tags page on mobile).
- **Search**: live search across title, content, and tags, spanning both active and archived notes, with a no-results state.
- **Themes**: light, dark, and "System" (follows the OS's `prefers-color-scheme`) color themes; sans-serif, serif, and monospace font themes — both persisted.
- **Validation**: a note's title is required, with an inline error, a disabled Save button, and validation on both blur and submit.
- **Drafts**: unsaved edits auto-save to `sessionStorage` and restore if the page reloads mid-edit.
- **Geolocation (bonus)**: attach your current coordinates to a note via the browser's Geolocation API, with graceful handling of denied permission or an unsupported browser.
- **Keyboard & accessibility**: full tab order, a focus trap in the confirmation modal, Escape to cancel/close, arrow-key navigation between notes, visible focus rings, and ARIA labels throughout.
- **Responsive**: three distinct layouts (see [Responsive design](#responsive-design)) — not just one breakpoint scaled down.

## Technologies

- **HTML5** — semantic elements, no `<div>` soup.
- **CSS3** — custom properties (design tokens) for colors/spacing/typography, Flexbox and Grid for layout, no preprocessor.
- **Vanilla JavaScript (ES6 modules)** — `import`/`export`, classes, arrow functions, template literals. No framework, no bundler, no npm dependencies at runtime.
- **Browser APIs** — `localStorage`, `sessionStorage`, Geolocation, `matchMedia`.

## Folder Structure

```
index.html            Semantic HTML skeleton for every screen/state
README.md
screenshots/           Images used in this README
src/
  css/
    styles.css         All styling: design tokens, base styles, dark theme, font themes, responsive breakpoints
  js/
    main.js            Bootstrap + the shared "core" engine (app state, renderApp, the confirmation modal)
    storage/
      storage.js       The only module that touches localStorage/sessionStorage
    models/
      noteManager.js   The Note data model and note business rules (create/delete/search/filter/tag/archive)
      auth.js          Password validation and login-matching rules for the simulated account
    themes/
      themes.js        Applies the color/font theme by setting attributes on <html>
    ui/
      renderNotes.js   Note cards, the notes list, the panel title/active nav
      renderDetail.js  The note detail/editor form, including its archived-state row
      renderTags.js    The sidebar's tag list
      renderAuth.js    Login/signup/reset screens, password show/hide toggle
      feedback.js      Toast messages, the confirmation modal, validation error text
      icons.js         Shared SVG icon path data (trash, archive/restore, password eye, tag)
    events/
      noteEvents.js       Note CRUD, archive/restore, location, draft/validation — event delegation on the notes list
      navigationEvents.js All Notes / Archived / tag filter / search / opening Settings
      settingsEvents.js   Color theme + font theme selection and the mobile Settings sub-panel
      authEvents.js       Login, signup, logout, forgot/reset/change password
      keyboardEvents.js   Escape, Tab-trap in the modal, Arrow-key note navigation
    utils/
      id.js            generateId()
      date.js          formatDate()
      location.js      formatLocation()
      tags.js          parseTags()
      validation.js    isRequired(), isValidEmail() — pure, DOM-free checks
```

## Installation

There's nothing to install — no `npm install`, no dependencies. Just clone or download the project folder.

## Running the Project

Because the app uses ES6 modules (`import`/`export`), it must be served over HTTP rather than opened directly as a `file://` URL — browsers block module imports from the filesystem for security reasons. Any static file server works, for example:

```bash
npx serve .
```

Then open the printed `localhost` URL in a browser.

## Architecture

Every module has one job. `main.js` is the only file every other module is reachable from (directly or indirectly) — it is never imported by anything else, so there's exactly one entry point and one place that owns the app's shared state.

```
main.js
 ├─ storage/storage.js         (localStorage / sessionStorage)
 ├─ models/noteManager.js      (Note class + note business rules)
 ├─ models/auth.js             (password/login rules)
 ├─ themes/themes.js           (apply color/font theme)
 ├─ ui/*.js                    (render note cards, the detail form, tags, auth screens, toasts, the modal)
 ├─ utils/*.js                 (generateId, formatDate, formatLocation, parseTags, isRequired/isValidEmail)
 └─ events/*.js                (noteEvents, navigationEvents, settingsEvents, authEvents, keyboardEvents)
```

`main.js` holds the app's shared state — the notes array, which note is selected, which view is active — in one plain object (`state`), and builds a small `core` object (`state` plus `renderApp()` and a handful of actions every feature needs: discarding an unsaved note, switching views, opening the confirmation modal). Each `events/*.js` module's `init(core)` receives this object by reference, so a change made in one module (e.g. `state.selectedNoteId = ...` inside `noteEvents.js`) is immediately visible to every other module — no state-management library, just an object passed to whoever needs it, the same way a function's parameters work.

`events/*.js` modules never call `localStorage`/`sessionStorage` directly and never build DOM markup themselves — they call into `storage/`, `models/`, and `ui/` for that. `ui/*.js` modules never call `localStorage` and never decide business rules like "which notes match a search." `models/noteManager.js` and `models/auth.js` never touch the DOM or storage at all — they're pure data/rule functions, which is also what makes them straightforward to reason about (and to unit-test, if this project ever added a test runner).

### A typical flow

```
User clicks "Save Note"
  → events/noteEvents.js's saveSelectedNote() validates the title
  → models/noteManager.js's updateNote() applies the change to the notes array
  → storage/storage.js's saveNotes() persists it
  → core.renderApp() re-draws the list/detail panel via the ui/ modules
  → ui/feedback.js's showToast() confirms it to the user
```

Not every action touches every layer (switching a color theme goes through `events/settingsEvents.js` → `themes/themes.js` + `storage/storage.js`, never touching note data), but the direction — events modules orchestrate, everything else does one job — is consistent throughout.

## Browser APIs Used

- **`localStorage`** — notes, user preferences (theme/font), and the simulated account/session, all as JSON strings via `JSON.stringify`/`JSON.parse`. Wrapped in a shared try/catch so a quota-exceeded error shows a message instead of crashing the app.
- **`sessionStorage`** — unsaved note drafts, so an accidental reload doesn't lose in-progress edits, but a draft doesn't outlive the browser tab the way a saved note does.
- **Geolocation API** — `navigator.geolocation.getCurrentPosition`, with a real error callback that distinguishes a denied permission from an unsupported browser, both shown as a toast rather than failing silently.
- **`matchMedia`** — used once, to resolve the "System" color theme against `prefers-color-scheme: dark` when the app starts.

## Accessibility

- Every interactive element is a real, natively-focusable HTML element (`<button>`, `<a href>`, form inputs) — no click-only `<div>`s.
- `aria-label` on every icon-only button, `aria-live="polite"` on the toast, `role="alertdialog"` + `aria-modal` + `aria-labelledby`/`aria-describedby` on the confirmation modal, `role="alert"` on inline field errors, `aria-current="page"` on the active nav link.
- Opening the confirmation modal moves focus onto its Confirm button and traps Tab/Shift+Tab between Cancel and Confirm while it's open; closing it (by Confirm, Cancel, backdrop click, or Escape) returns focus to whatever originally opened it.
- Escape closes the modal if one is open, or cancels an in-progress note edit if focus is inside the note form.
- A single global `:focus-visible` rule puts a visible outline on every interactive element for keyboard users, without showing it on a mouse click.
- Arrow-key (Up/Down) navigation between note cards, as a bonus beyond plain Tab order.
- Color contrast was checked against WCAG AA (4.5:1 for normal text) using the actual rendered colors, not just the raw Figma values — see [Intentional design decisions](#intentional-design-decisions) for the two places this required deviating from the literal Figma export.

## Responsive Design

Three genuinely distinct layouts, not one design squeezed to fit every width:

| Breakpoint | Layout |
|---|---|
| **Phones** (<600px) | Single-column, one view at a time (list *or* detail *or* tags *or* settings), an icon navigation bar, and a floating "+" button. |
| **Tablets and narrow desktops** (600–1199px) | Single-panel views with a full-width, labelled five-item navigation bar and touch-friendly controls. |
| **Wide desktop** (≥1200px) | A 4-column grid — sidebar, notes list, note detail, and a dedicated actions panel — all visible at once. |

Tested in both portrait and landscape at each breakpoint; nothing depends on a fixed aspect ratio.

## Screenshots

| Desktop (light) | Desktop (dark) |
|---|---|
| ![Desktop light mode](screenshots/desktop-light.png) | ![Desktop dark mode](screenshots/desktop-dark.png) |

| Mobile — login | Mobile — notes list | Mobile — note detail |
|---|---|---|
| ![Mobile login](screenshots/mobile-login.png) | ![Mobile home](screenshots/mobile-home.png) | ![Mobile note detail](screenshots/mobile-note-detail.png) |

## Intentional Design Decisions

A few choices that look like they might be bugs or oversights during a review, but aren't:

- **Auth is kept even though it isn't in the grading rubric.** The assignment's evaluation criteria don't mention login/signup at all — but the provided Figma design includes Login, Sign Up, Forgot Password, Reset Password, and Change Password screens, and the Figma design is a project requirement independent of the grading rubric. Rather than cut it to shrink the codebase, it's isolated into its own files (`models/auth.js` for the rules, `events/authEvents.js` for the wiring, `ui/renderAuth.js` for the screens) so it never clutters the note-taking code, and can be explained as one self-contained piece.
- **Saving a note doesn't clear the form.** The assignment's wording describes a "clear the form after submission" pattern, but this app's Figma design is a persistent master-detail layout (like most real note apps): saving keeps the note open and re-displays its (now-saved) content in the same panel, so you don't lose your place. This matches the Figma interaction, not the literal assignment wording — per the brief, Figma behavior wins when the two disagree.
- **Theme/font changes use an explicit "Apply Changes" button rather than applying on `change`.** The Figma design shows a deliberate Apply step (so you can preview a radio selection before committing), rather than switching the whole app's theme the instant a radio button is clicked. The assignment's task list mentions a `change` event for "theme and font selectors"; this app reads the checked radio when Apply is clicked instead, again following the Figma interaction.
- **Two colors deviate slightly from the literal Figma export.** `--color-danger` (a validation/delete red) and `--color-text-muted` (secondary gray text) came from the Figma Dev Mode CSS export, but at their exported values they failed WCAG AA's 4.5:1 text-contrast minimum (3.91:1 and 4.49:1 respectively). Both were darkened by the smallest amount that clears 4.5:1, keeping the same hue. The red additionally needed a *second*, per-theme token (`--color-danger-text`, used for `.field-error`/`.form-error` text) because the button-background red and the error-message-text red have opposite constraints — a color can't simultaneously be dark enough to read on white and light enough to read on the dark theme's near-black background. `--color-danger` itself is unchanged in dark mode (it's always paired with white button text, which doesn't depend on the page's background), while `--color-danger-text` gets a lighter dark-mode override.
- **The one required field is the title, not every field.** The assignment says "Check for required fields (title minimum)" — title is therefore the only field with a required-field validation error; content and tags are optional, matching both the wording and the Figma form (which shows no required-field indicator on either).

## Known Limitations

- **Auth is simulated, not real security.** The assignment describes a single-user, client-side-only app with no backend, so there is nowhere secure to check a password. Sign Up stores one plain-text `{ email, password }` account in `localStorage` (see `models/auth.js`'s file comment); Login compares against it directly. This is enough to demonstrate the full flow (including validation, a "forgot password" simulation, and session persistence across reloads) but must never be mistaken for real authentication — anyone with access to the browser's dev tools can read or change the stored credentials. The "Log in with Google" button is decorative (shows a toast) since real OAuth requires a backend and a registered client ID.
- **Geolocation stores raw coordinates**, not a city name. Reverse-geocoding a coordinate into a city requires a third-party API (and typically an API key), which would add an external network dependency this project otherwise avoids.
- **Sample data is 3 notes**, not a large dataset, since the point of the seed data is just to demonstrate the app on first run, not to stress-test it.
- **Bonus search-term highlighting is not implemented.** Search itself (title/content/tags, real-time, no-results state) is complete; highlighting the matched substring in results was left out as a bonus, not a core requirement.

## Future Improvements

- Reverse-geocode a note's coordinates into a readable city/place name.
- Highlight the matched search term within note titles/content (the bonus mentioned above).
- Export/import notes as a JSON file.
- A reactive "System" theme that responds live to an OS theme change while the tab is open, instead of only checking once at load/apply time.

## How to Test

There's no test runner or build step — every feature is meant to be checked by hand in a browser (see [Running the Project](#running-the-project)). This table doubles as a demo script for a lab review:

| Feature | How to test it |
|---|---|
| Auth (simulated) | Sign Up with any email + 8+ character password (auto-logs you in). Settings → Logout. Log back in with the same credentials. Try "Forgot" → wrong email shows an error, the account's email reveals a "continue to reset" link (simulating the emailed link) → set a new password → log in with it. Or Settings → Change Password (wrong old password / weak new password / mismatched confirm all show inline errors). |
| Create/Read/Update/Delete | Click "+ Create New Note", fill it in, Save. Edit any field on an existing note and Save. Click Delete Note and confirm. |
| Archive/Restore | Open a note, click Archive Note, confirm. Click "Archived Notes" in the sidebar to see it; open it and click Restore Note. Following the toast's "Archived Notes"/"All Notes" link should land you on the matching view. |
| Tags | Type tags (comma-separated) into a note, save, then click that tag in the sidebar (or the mobile Tags page) to filter. |
| Search | Type into the header search box; try a term that only matches an archived note's tag. |
| Validation | Create a new note and leave the title blank — Save is disabled and an error shows on blur/submit. |
| Drafts | Start editing a note, type something, then reload the page — the unsaved text is still there. |
| Themes/Fonts | Settings (gear icon) → Color Theme / Font Theme → pick an option → Apply Changes. Reload to confirm it persisted. |
| Geolocation | Open a note, click "+ Add Location" (browser will prompt for permission). Deny it once to see the graceful error toast. |
| Keyboard | Tab through the app; use Up/Down arrows on a focused note card; open a modal and press Tab (it stays trapped) or Escape (it closes and focus returns); with a note open, press Escape to cancel an edit. |
| Responsive | Resize across ~600px and ~1200px, or use a device toolbar — check phone portrait, phone landscape, tablet portrait, tablet landscape, and desktop. |
| The "unsaved new note" edge case | Click "+ Create New Note", don't type anything, then navigate away (search, a tag, Archived Notes, Settings, or mobile's "Go Back") — the blank note should disappear rather than lingering in the list. |

## Commit History

The commit history is organized as one commit per feature milestone or fix, each independently reviewable and testable. Run `git log --oneline` to see the full sequence.
