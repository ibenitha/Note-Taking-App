// main.js
//
// The entry point script, loaded as an ES6 module from index.html. It has
// two jobs:
//
// 1. Bootstrap: load saved notes/preferences/session from storage.js, and
//    render the app for the first time.
// 2. Core engine: hold the app's shared state (the notes array, which
//    view is active, which note is selected, ...) and the render/action
//    functions that need that state — renderApp(), discardUnsavedNewNote(),
//    the confirmation modal, and so on.
//
// Everything else — note editing, navigation, settings, auth, keyboard
// shortcuts — lives in its own events/ module. Those modules never touch
// storage or the notes array directly; they call the small "core" API
// this file builds and hands to each of them, so there is exactly one
// place that owns the app's shared state.

import * as storage from "./storage/storage.js";
import * as noteManager from "./models/noteManager.js";
import * as categoryModel from "./models/category.js";
import * as themes from "./themes/themes.js";
import * as renderNotes from "./ui/renderNotes.js";
import * as renderDetail from "./ui/renderDetail.js";
import * as renderTags from "./ui/renderTags.js";
import * as renderCategories from "./ui/renderCategories.js";
import * as feedback from "./ui/feedback.js";
import { isRequired } from "./utils/validation.js";

import * as noteEvents from "./events/noteEvents.js";
import * as navigationEvents from "./events/navigationEvents.js";
import * as settingsEvents from "./events/settingsEvents.js";
import * as authEvents from "./events/authEvents.js";
import * as keyboardEvents from "./events/keyboardEvents.js";
import * as dataEvents from "./events/dataEvents.js";
import * as categoryEvents from "./events/categoryEvents.js";
import * as shareEvents from "./events/shareEvents.js";
import * as renderShared from "./ui/renderShared.js";
import { decodeShareLink } from "./utils/shareLink.js";

// --- Element references used directly by the core engine -------------------

const notesList = document.querySelector(".notes-list");
const titleInput = document.querySelector('[data-field="title"]');
const submitButtons = document.querySelectorAll('.note-detail-panel [type="submit"]');

const colorThemeRadios = document.querySelectorAll('input[name="color-theme"]');
const fontThemeRadios = document.querySelectorAll('input[name="font-theme"]');

const modalOverlay = document.querySelector(".modal-overlay");
const modalConfirmButton = document.querySelector(".modal-confirm-btn");
const modalCancelButton = document.querySelector(".modal-cancel-btn");
const toastCloseButton = document.querySelector(".toast-close-btn");

// --- Session ---------------------------------------------------------------
// Checked immediately, before anything else renders, so a returning logged-in
// user never sees a flash of the login screen.

document.body.dataset.session = storage.loadSession() ? "loggedIn" : "loggedOut";

// --- App state -------------------------------------------------------------
// The app's shared state lives in this one object for as long as the page
// is open. It's a plain object (not a class) passed by reference to every
// events/ module, so mutating a property here (state.selectedNoteId = ...)
// is visible everywhere else immediately — the simplest way to share
// mutable state across modules without a framework.

const state = {
  notes: storage.loadNotes(),
  categories: storage.loadCategories() || [],
  showingArchived: false,
  activeTag: null,
  activeCategory: null,
  searchQuery: "",
  selectedNoteId: null,
  // The note behind "Create New Note", while it's still unsaved. It is
  // deliberately NOT a member of state.notes — a note only becomes part
  // of that array (and only then appears in the list or gets persisted)
  // once the user actually clicks Save. Null when there is no draft.
  draftNote: null,
};

if (state.notes === null) {
  // First time the app has ever run in this browser: start with sample
  // notes instead of an empty list, and save them right away.
  state.notes = noteManager.getSampleNotes();
  storage.saveNotes(state.notes);
} else {
  // Notes loaded from storage are plain JSON objects, not Note instances —
  // rebuild them so note.addTag()/archive()/restore() work correctly.
  state.notes = state.notes.map(noteManager.reviveNote);
}

state.selectedNoteId = state.notes.length > 0 ? state.notes[0].id : null;

// Apply the saved color/font theme immediately (defaulting to light +
// sans-serif for a first-time visitor), and check the matching radio
// button in Settings so it reflects what's actually applied.
const preferences = storage.loadPreferences() || { theme: "light", font: "sans-serif" };
themes.applyTheme(preferences.theme);
themes.applyFont(preferences.font);

colorThemeRadios.forEach((radio) => {
  radio.checked = radio.value === preferences.theme;
});
fontThemeRadios.forEach((radio) => {
  radio.checked = radio.value === preferences.font;
});

// If the user was mid-edit when they left or reloaded the page, sessionStorage
// has a draft of what they were typing. Restore it now, before the first
// render, so the app opens exactly where they left off.
const savedDraft = storage.loadDraft();

if (savedDraft !== null) {
  const draftNoteExists = state.notes.some((note) => note.id === savedDraft.noteId);

  if (draftNoteExists) {
    state.selectedNoteId = savedDraft.noteId;
  } else {
    // The draft belonged to a note that was never saved (the page was
    // reloaded before clicking Save on a brand new note). Re-create it
    // as a fresh draft — noteEvents.js refills its *text* from savedDraft
    // once the form exists (see restoreDraftIntoForm).
    state.draftNote = noteManager.createDraftNote();
    state.selectedNoteId = state.draftNote.id;
  }
}

// --- Rendering ---------------------------------------------------------

function getSelectedNote() {
  if (state.draftNote !== null && state.draftNote.id === state.selectedNoteId) {
    return state.draftNote;
  }
  return state.notes.find((note) => note.id === state.selectedNoteId) || null;
}

// Only the notes matching the current view should appear in the list.
// Searching looks across every note (active and archived together) and
// takes over from the "All Notes" / "Archived Notes" / tag filter views,
// matching the design: a search is its own view, not layered on top.
function getVisibleNotes() {
  if (state.searchQuery !== "") {
    return noteManager.searchNotes(state.notes, state.searchQuery);
  }

  const notesInCurrentView = state.notes.filter((note) => note.archived === state.showingArchived);
  // A category filter and a tag filter are mutually exclusive views (see
  // categoryEvents.js's showCategoryFilter / navigationEvents.js's
  // showTagFilter, which each clear the other), so only one is ever set.
  if (state.activeCategory !== null) {
    return noteManager.filterByCategory(notesInCurrentView, state.activeCategory);
  }
  if (state.activeTag === null) {
    return notesInCurrentView;
  }
  return noteManager.filterByTag(notesInCurrentView, state.activeTag);
}

function getPanelTitle() {
  if (state.searchQuery !== "") {
    return `Showing results for: ${state.searchQuery}`;
  }
  if (state.activeCategory !== null) {
    const category = categoryModel.findCategoryById(state.categories, state.activeCategory);
    return `Category: ${category ? category.name : ""}`;
  }
  if (state.activeTag !== null) {
    return `Notes Tagged: ${state.activeTag}`;
  }
  return state.showingArchived ? "Archived Notes" : "All Notes";
}

function getEmptyMessage() {
  if (state.searchQuery !== "") {
    return "No notes match your search. Try a different keyword or create a new note.";
  }
  if (state.showingArchived) {
    return "No notes have been archived yet. Move notes here for safekeeping, or create a new note.";
  }
  return "You don't have any notes yet. Start a new note to capture your thoughts and ideas.";
}

function isTitleValid() {
  return isRequired(titleInput.value);
}

function updateSaveButtonState() {
  const disabled = !isTitleValid();
  submitButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

// Renders the subtitle text under the panel title on mobile list views.
function renderPanelSubtitle() {
  const subtitle = document.querySelector(".panel-subtitle");
  if (!subtitle) return;
  if (state.showingArchived && state.activeTag === null && state.searchQuery === "") {
    subtitle.textContent = "All your archived notes are stored here. You can restore or delete them anytime.";
    subtitle.hidden = false;
  } else {
    subtitle.hidden = true;
  }
}

function renderApp() {
  const visibleNotes = getVisibleNotes();

  // renderAllNotes() replaces every note card with a new element, which
  // would otherwise silently drop keyboard focus back to <body>. Note
  // whether focus was in the list first, then restore it afterwards.
  const focusWasInNotesList = notesList.contains(document.activeElement);

  renderNotes.setPanelTitle(getPanelTitle());
  // A search, tag filter, or category filter is a view of its own, so
  // neither "All Notes" nor "Archived Notes" should show as active in
  // the nav while any of them is applied.
  if (state.searchQuery === "" && state.activeTag === null && state.activeCategory === null) {
    renderNotes.setActiveNav(state.showingArchived ? "archived" : "all");
  } else {
    renderNotes.setActiveNav(null);
  }
  const selectedNote = getSelectedNote();
  renderNotes.renderAllNotes(visibleNotes, state.selectedNoteId, getEmptyMessage(), state.categories);
  renderDetail.renderNoteDetail(selectedNote);
  renderTags.renderTagList(noteManager.getUniqueTags(state.notes), state.activeTag);
  renderCategories.renderCategoryList(state.categories, state.activeCategory);
  renderCategories.renderCategorySelect(state.categories, selectedNote ? selectedNote.category : null);
  updateSaveButtonState();
  renderPanelSubtitle();

  if (focusWasInNotesList) {
    const activeCard = notesList.querySelector(".note-card.is-active");
    if (activeCard) {
      activeCard.focus();
    }
  }
}

function showNotesView() {
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "list";
  delete document.body.dataset.mobileSettingsView;
  renderPanelSubtitle();
}

function showSettingsView() {
  // Leaving the note editor for Settings without saving should discard an
  // unsaved new note, the same as every other way of navigating away from it.
  discardUnsavedNewNote();
  document.body.dataset.appView = "settings";
  delete document.body.dataset.mobileSettingsView;
  renderNotes.setActiveNav("settings"); // highlights the mobile bottom nav's Settings icon
}

// Sets selectedNoteId to the first note in the current visible list, or null if empty.
function selectFirstVisibleNote() {
  const visibleNotes = getVisibleNotes();
  state.selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
}

// Selects a note by ID, discards any unsaved draft, re-renders the app, and switches mobile view to detail.
function selectNoteAndOpenDetail(noteId) {
  discardUnsavedNewNote();
  state.selectedNoteId = noteId;
  renderApp();
  document.body.dataset.mobileView = "detail";
}

// Tracks a note that was just created by clicking "+ Create New Note" but
// has not been saved yet. If the user cancels or navigates away without
// saving, this note is removed instead of being kept as an empty note.
// Drops the in-progress "Create New Note" draft, if there is one. Since
// the draft was never added to state.notes, there is nothing to remove
// from it — just clear the reference and, if it was the selected note,
// fall back to whatever is now first in the current view.
function discardUnsavedNewNote() {
  if (state.draftNote === null) return;

  if (state.selectedNoteId === state.draftNote.id) {
    selectFirstVisibleNote();
  }
  state.draftNote = null;
}

// --- Confirmation modal ----------------------------------------------------
// One modal element in the HTML is reused for every confirmation (delete,
// archive, ...) instead of building a separate modal per action. Whichever
// events/ module opens it decides what happens if confirmed; this is just
// the shared open/close mechanism.

// Holds the function to run if the user confirms the currently open
// confirmation modal. Null when no modal is open.
let pendingConfirmAction = null;

// Remembers whatever had focus before a modal opened, so closing it
// (however the user does that) returns focus there instead of losing it.
let lastFocusedElementBeforeModal = null;

function openConfirmModal(action, modalOptions) {
  lastFocusedElementBeforeModal = document.activeElement;
  pendingConfirmAction = action;
  feedback.showModal(modalOptions);
}

function closeConfirmationModal() {
  pendingConfirmAction = null;
  feedback.hideModal();

  if (lastFocusedElementBeforeModal) {
    lastFocusedElementBeforeModal.focus();
    lastFocusedElementBeforeModal = null;
  }
}

modalConfirmButton.addEventListener("click", () => {
  if (pendingConfirmAction) {
    pendingConfirmAction();
  }
  closeConfirmationModal();
});

modalCancelButton.addEventListener("click", closeConfirmationModal);

// Clicking the dimmed backdrop (not the modal box itself) cancels, the
// same as clicking the Cancel button.
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeConfirmationModal();
  }
});

toastCloseButton.addEventListener("click", feedback.hideToast);

// --- Wire up the feature modules --------------------------------------------
// Each events/ module gets this same "core" object: the shared state, the
// render function, and the handful of actions more than one feature needs
// (discarding an unsaved note, switching to the notes/settings view,
// opening the confirmation modal). navigationEvents.js additionally
// returns showAllNotes/showArchivedNotes, which get added to core so
// noteEvents.js's archive/restore toasts can link back to those views.

const core = {
  state,
  renderApp,
  getSelectedNote,
  getVisibleNotes,
  selectFirstVisibleNote,
  selectNoteAndOpenDetail,
  updateSaveButtonState,
  discardUnsavedNewNote,
  showNotesView,
  showSettingsView,
  openConfirmModal,
  closeConfirmationModal,
};

renderApp();

const { showAllNotes, showArchivedNotes } = navigationEvents.init(core);
core.showAllNotes = showAllNotes;
core.showArchivedNotes = showArchivedNotes;

const { cancelEditingSelectedNote } = noteEvents.init(core, savedDraft);
keyboardEvents.init(core, { cancelEditingSelectedNote });

settingsEvents.init(core);
authEvents.init(core);
dataEvents.init(core);
categoryEvents.init(core);
shareEvents.init(core);

// --- Shared note link -----------------------------------------------------
// Checked last, so it overrides whatever the rest of bootstrap just set
// up: a visitor opening a ?share=... link sees only the read-only note,
// regardless of session state or which view main.js otherwise landed on.
// No login required — the note's data travels inside the link itself
// (see utils/shareLink.js), so there's nothing to look up or authorize.

const sharedNote = decodeShareLink(window.location.search);
if (sharedNote !== null) {
  renderShared.renderSharedNoteView(sharedNote);
  document.body.dataset.appView = "shared";
}
