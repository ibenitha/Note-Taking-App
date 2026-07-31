// main.js
//
// This is the entry point script, loaded as an ES6 module from index.html.
// It imports the other modules and wires them together: storage.js reads
// and writes data, noteManager.js applies the rules for that data, ui.js
// draws it on screen, and this file connects events to all of that.

import * as storage from "./storage.js";
import * as noteManager from "./noteManager.js";
import * as ui from "./ui.js";

// The app's notes live in this one array for as long as the page is open.
// Every change (create, edit, delete, archive) updates this array first,
// then asks storage.js to persist it.
let notes = storage.loadNotes();

if (notes === null) {
  // First time the app has ever run in this browser: start with sample
  // notes instead of an empty list, and save them right away.
  notes = noteManager.getSampleNotes();
  storage.saveNotes(notes);
}

// Tracks which note is currently shown in the detail panel. Starts as the
// first note, or null if there are no notes at all.
let selectedNoteId = notes.length > 0 ? notes[0].id : null;

function getSelectedNote() {
  return notes.find((note) => note.id === selectedNoteId) || null;
}

function renderApp() {
  ui.renderAllNotes(notes, selectedNoteId);
  ui.renderNoteDetail(getSelectedNote());
}

renderApp();

const notesList = document.querySelector(".notes-list");
const backButton = document.querySelector(".back-btn");

// The view state lives on <body> (not .app-body) because the bottom nav and
// FAB are also mobile-view-dependent but sit outside .app-body in the DOM.
// A single attribute on <body> lets CSS reach all of them with one selector.

// Event delegation: one listener on the <ul> handles clicks on any note
// card, instead of attaching a separate listener to each <li>. This is the
// same pattern the assignment requires later for edit/delete/archive
// buttons, so it's worth using correctly from the start.
notesList.addEventListener("click", (event) => {
  const clickedCard = event.target.closest(".note-card");
  if (!clickedCard) return;

  selectedNoteId = clickedCard.dataset.noteId;
  renderApp();
  document.body.dataset.mobileView = "detail";
});

backButton.addEventListener("click", () => {
  document.body.dataset.mobileView = "list";
});

// --- Settings view -----------------------------------------------------
// The app has two top-level views: "notes" (list + detail) and "settings".
// Switching between them just changes an attribute on <body>; the CSS in
// styles.css decides what to show or hide based on that attribute.

const settingsButton = document.querySelector(".settings-btn");
const settingsNavButton = document.querySelector(".settings-nav-btn");
const homeNavButton = document.querySelector(".home-nav-btn");
const allNotesLink = document.querySelector(".all-notes-link");

function showSettingsView() {
  document.body.dataset.appView = "settings";
}

function showNotesView() {
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "list";
}

settingsButton.addEventListener("click", showSettingsView);
settingsNavButton.addEventListener("click", showSettingsView);
homeNavButton.addEventListener("click", showNotesView);
allNotesLink.addEventListener("click", showNotesView);

// Inside Settings, clicking a nav item (Color Theme / Font Theme) shows
// the matching section and hides the others. One delegated listener on
// the settings-nav container handles clicks on any of its buttons.
const settingsNav = document.querySelector(".settings-nav");
const settingsSections = document.querySelectorAll(".settings-section");
const settingsNavItems = document.querySelectorAll(".settings-nav-item");

settingsNav.addEventListener("click", (event) => {
  const clickedItem = event.target.closest(".settings-nav-item");
  if (!clickedItem) return;

  const targetSection = clickedItem.dataset.settingsSection;

  settingsNavItems.forEach((item) => {
    item.classList.toggle("is-active", item === clickedItem);
  });

  settingsSections.forEach((section) => {
    section.hidden = section.dataset.settingsPanel !== targetSection;
  });
});
