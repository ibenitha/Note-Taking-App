// main.js
//
// This is the entry point script, loaded as an ES6 module from index.html.
// It imports the other modules and wires them together: storage.js reads
// and writes data, noteManager.js applies the rules for that data, ui.js
// draws it on screen, and this file connects events to all of that.

import * as storage from "./storage.js";
import * as noteManager from "./noteManager.js";
import * as ui from "./ui.js";

// --- Element references ---------------------------------------------------
// Looked up once, at the top, so every function below can just use them.

const notesList = document.querySelector(".notes-list");
const backButton = document.querySelector(".back-btn");

const settingsButton = document.querySelector(".settings-btn");
const settingsNavButton = document.querySelector(".settings-nav-btn");
const homeNavButton = document.querySelector(".home-nav-btn");
const allNotesLink = document.querySelector(".all-notes-link");
const settingsNav = document.querySelector(".settings-nav");
const settingsSections = document.querySelectorAll(".settings-section");
const settingsNavItems = document.querySelectorAll(".settings-nav-item");

const createNoteButton = document.querySelector(".create-note-btn");
const fabButton = document.querySelector(".fab");
const noteForm = document.querySelector(".note-detail-panel");
const cancelButtons = document.querySelectorAll(".cancel-btn");
const titleInput = document.querySelector('[data-field="title"]');
const tagsInput = document.querySelector('[data-field="tags"]');
const contentInput = document.querySelector('[data-field="content"]');

// --- App state -------------------------------------------------------------
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

// Which note is currently shown in the detail panel. Starts as the first
// note, or null if there are no notes at all.
let selectedNoteId = notes.length > 0 ? notes[0].id : null;

// Tracks a note that was just created by clicking "+ Create New Note" but
// has not been saved yet. If the user cancels or navigates away without
// saving, this note is removed instead of being kept as an empty note.
let unsavedNewNoteId = null;

// --- Rendering helpers -------------------------------------------------

function getSelectedNote() {
  return notes.find((note) => note.id === selectedNoteId) || null;
}

function renderApp() {
  ui.renderAllNotes(notes, selectedNoteId);
  ui.renderNoteDetail(getSelectedNote());
}

function showNotesView() {
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "list";
}

function showSettingsView() {
  document.body.dataset.appView = "settings";
}

// --- Create / save / cancel note ----------------------------------------

function discardUnsavedNewNote() {
  if (unsavedNewNoteId === null) return;

  noteManager.deleteNote(notes, unsavedNewNoteId);
  if (selectedNoteId === unsavedNewNoteId) {
    selectedNoteId = notes.length > 0 ? notes[0].id : null;
  }
  unsavedNewNoteId = null;
}

function createNewNote() {
  discardUnsavedNewNote();

  const note = noteManager.createNote(notes, "", "", []);
  unsavedNewNoteId = note.id;
  selectedNoteId = note.id;

  renderApp();
  document.body.dataset.mobileView = "detail";
  titleInput.focus();
}

function saveSelectedNote() {
  const note = getSelectedNote();
  if (!note) return;

  note.title = titleInput.value;
  note.tags = ui.parseTagsInput(tagsInput.value);
  note.content = contentInput.value;
  note.timestamp = new Date().toISOString();

  unsavedNewNoteId = null;
  storage.saveNotes(notes);
  renderApp();
}

function cancelEditingSelectedNote() {
  if (selectedNoteId === unsavedNewNoteId) {
    discardUnsavedNewNote();
  }
  renderApp(); // re-fill the form from the saved note, discarding any typed edits
}

// --- Initial render ------------------------------------------------------

renderApp();

// --- Event listeners -------------------------------------------------------

// Event delegation: one listener on the <ul> handles clicks on any note
// card, instead of attaching a separate listener to each <li>. This is the
// same pattern the assignment requires later for edit/delete/archive
// buttons, so it's worth using correctly from the start.
notesList.addEventListener("click", (event) => {
  const clickedCard = event.target.closest(".note-card");
  if (!clickedCard) return;

  const clickedNoteId = clickedCard.dataset.noteId;
  if (clickedNoteId !== unsavedNewNoteId) {
    discardUnsavedNewNote();
  }

  selectedNoteId = clickedNoteId;
  renderApp();
  document.body.dataset.mobileView = "detail";
});

backButton.addEventListener("click", () => {
  document.body.dataset.mobileView = "list";
});

createNoteButton.addEventListener("click", createNewNote);
fabButton.addEventListener("click", createNewNote);

noteForm.addEventListener("submit", (event) => {
  event.preventDefault(); // this is a real <form>, so stop the page from reloading
  saveSelectedNote();
});

cancelButtons.forEach((button) => {
  button.addEventListener("click", cancelEditingSelectedNote);
});

// Settings is a second top-level view. Switching between "notes" and
// "settings" just changes an attribute on <body>; styles.css decides what
// to show or hide based on that attribute.
settingsButton.addEventListener("click", showSettingsView);

settingsNavButton.addEventListener("click", (event) => {
  event.preventDefault(); // these are <a href="#">, so stop the page jumping to the top
  showSettingsView();
});

homeNavButton.addEventListener("click", (event) => {
  event.preventDefault();
  showNotesView();
});

allNotesLink.addEventListener("click", (event) => {
  event.preventDefault();
  showNotesView();
});

// Inside Settings, clicking a nav item (Color Theme / Font Theme) shows
// the matching section and hides the others. One delegated listener on
// the settings-nav container handles clicks on any of its buttons.
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
