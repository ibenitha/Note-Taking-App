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
const tagList = document.querySelector(".tag-list");

const settingsButton = document.querySelector(".settings-btn");
const settingsNavButton = document.querySelector(".settings-nav-btn");
const homeNavButton = document.querySelector(".home-nav-btn");
const allNotesLink = document.querySelector(".all-notes-link");
const archivedNotesLinks = document.querySelectorAll(".archived-notes-link");
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
const submitButtons = noteForm.querySelectorAll('[type="submit"]');

const deleteButtons = document.querySelectorAll(".delete-btn");
const archiveButtons = document.querySelectorAll(".archive-btn");
const modalOverlay = document.querySelector(".modal-overlay");
const modalConfirmButton = document.querySelector(".modal-confirm-btn");
const modalCancelButton = document.querySelector(".modal-cancel-btn");

const searchForm = document.querySelector(".header-search");
const searchInput = document.querySelector("#search-input");
const mobileSearchButton = document.querySelector(".mobile-search-btn");

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

// Whether the notes list is currently showing archived notes instead of
// active ones. The sidebar/bottom-nav "All Notes" and "Archived Notes"
// links just flip this and re-render.
let showingArchived = false;

// The tag currently being filtered by, or null if no tag filter is active.
let activeTag = null;

// The current search box text. An empty string means "not searching".
let searchQuery = "";

// Which note is currently shown in the detail panel. Starts as the first
// visible note, or null if there are no notes at all.
let selectedNoteId = notes.length > 0 ? notes[0].id : null;

// Tracks a note that was just created by clicking "+ Create New Note" but
// has not been saved yet. If the user cancels or navigates away without
// saving, this note is removed instead of being kept as an empty note.
let unsavedNewNoteId = null;

// Holds the function to run if the user confirms the currently open
// confirmation modal (delete, archive, ...). Null when no modal is open.
let pendingConfirmAction = null;

// If the user was mid-edit when they left or reloaded the page, sessionStorage
// has a draft of what they were typing. Restore it now, before the first
// render, so the app opens exactly where they left off.
const savedDraft = storage.loadDraft();

if (savedDraft !== null) {
  const draftNoteExists = notes.some((note) => note.id === savedDraft.noteId);

  if (draftNoteExists) {
    selectedNoteId = savedDraft.noteId;
  } else {
    // The draft belonged to a note that was never saved (the page was
    // reloaded before clicking Save on a brand new note). Re-create it.
    const restoredNote = noteManager.createNote(notes, "", "", []);
    unsavedNewNoteId = restoredNote.id;
    selectedNoteId = restoredNote.id;
  }
}

// --- Rendering helpers -------------------------------------------------

function getSelectedNote() {
  return notes.find((note) => note.id === selectedNoteId) || null;
}

// Only the notes matching the current view should appear in the list.
// Searching looks across every note (active and archived together) and
// takes over from the "All Notes" / "Archived Notes" / tag filter views,
// matching the design: a search is its own view, not layered on top.
function getVisibleNotes() {
  if (searchQuery !== "") {
    return noteManager.searchNotes(notes, searchQuery);
  }

  const notesInCurrentView = notes.filter((note) => note.archived === showingArchived);
  if (activeTag === null) {
    return notesInCurrentView;
  }
  return noteManager.filterByTag(notesInCurrentView, activeTag);
}

function getPanelTitle() {
  if (searchQuery !== "") {
    return `Showing results for: ${searchQuery}`;
  }
  if (activeTag !== null) {
    return `Notes Tagged: ${activeTag}`;
  }
  return showingArchived ? "Archived Notes" : "All Notes";
}

function getEmptyMessage() {
  if (searchQuery !== "") {
    return "No notes match your search. Try a different keyword or create a new note.";
  }
  if (showingArchived) {
    return "No notes have been archived yet. Move notes here for safekeeping, or create a new note.";
  }
  return "You don't have any notes yet. Start a new note to capture your thoughts and ideas.";
}

function renderApp() {
  const visibleNotes = getVisibleNotes();

  ui.setPanelTitle(getPanelTitle());
  // A search or tag filter is a view of its own, so neither "All Notes"
  // nor "Archived Notes" should show as active in the nav while applied.
  if (searchQuery === "" && activeTag === null) {
    ui.setActiveNav(showingArchived ? "archived" : "all");
  } else {
    ui.setActiveNav(null);
  }
  ui.renderAllNotes(visibleNotes, selectedNoteId, getEmptyMessage());
  ui.renderNoteDetail(getSelectedNote());
  ui.renderTagList(noteManager.getUniqueTags(notes), activeTag);
  updateSaveButtonState();
}

function showNotesView() {
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "list";
  document.body.dataset.mobileSearch = "closed";
}

function showSettingsView() {
  document.body.dataset.appView = "settings";
}

// Clears the search box itself (not just the searchQuery state) so the
// three nav actions below always leave the app in a consistent state.
function clearSearch() {
  searchQuery = "";
  searchInput.value = "";
}

function showAllNotes() {
  clearSearch();
  showingArchived = false;
  activeTag = null;
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  renderApp();
  showNotesView();
}

function showArchivedNotes() {
  clearSearch();
  showingArchived = true;
  activeTag = null;
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  renderApp();
  showNotesView();
}

function showTagFilter(tag) {
  clearSearch();
  showingArchived = false;
  activeTag = tag;
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  renderApp();
  showNotesView();
}

function handleSearchInput() {
  searchQuery = searchInput.value.trim();
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  renderApp();
}

function openMobileSearch() {
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileSearch = "open";
  searchInput.focus();
}

// --- Create / save / cancel note ----------------------------------------

function discardUnsavedNewNote() {
  if (unsavedNewNoteId === null) return;

  noteManager.deleteNote(notes, unsavedNewNoteId);
  if (selectedNoteId === unsavedNewNoteId) {
    const visibleNotes = getVisibleNotes();
    selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  }
  unsavedNewNoteId = null;
}

function createNewNote() {
  discardUnsavedNewNote();
  showingArchived = false; // a brand new note is never archived, so show the All Notes view

  const note = noteManager.createNote(notes, "", "", []);
  unsavedNewNoteId = note.id;
  selectedNoteId = note.id;

  renderApp();
  document.body.dataset.mobileView = "detail";
  titleInput.focus();
}

// --- Validation ----------------------------------------------------------
// The only required field is the title. Validation runs on blur (so the
// user sees the error as soon as they leave the field) and again on
// submit (so it can never be skipped).

function isTitleValid() {
  return titleInput.value.trim().length > 0;
}

function validateTitle() {
  if (isTitleValid()) {
    ui.clearValidationError();
    return true;
  }
  ui.showValidationError("Title is required.");
  return false;
}

function updateSaveButtonState() {
  const disabled = !isTitleValid();
  submitButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

// While the user is typing, clear the error as soon as it becomes valid
// again, instead of making them wait until they blur the field.
function handleTitleInput() {
  updateSaveButtonState();
  if (isTitleValid()) {
    ui.clearValidationError();
  }
}

// --- Drafts (sessionStorage) ---------------------------------------------
// Saved on every keystroke so a reload or accidental tab close doesn't
// lose unsaved edits. Cleared once the note is actually saved or the edit
// is cancelled, since at that point there is nothing left to restore.

function saveDraftFromForm() {
  storage.saveDraft({
    noteId: selectedNoteId,
    title: titleInput.value,
    tags: tagsInput.value,
    content: contentInput.value,
  });
}

function saveSelectedNote() {
  if (!validateTitle()) {
    titleInput.focus();
    return;
  }

  const note = getSelectedNote();
  if (!note) return;

  note.title = titleInput.value;
  note.tags = ui.parseTagsInput(tagsInput.value);
  note.content = contentInput.value;
  note.timestamp = new Date().toISOString();

  unsavedNewNoteId = null;
  storage.saveNotes(notes);
  storage.clearDraft();
  renderApp();
  ui.showToast("Note saved!");
}

function cancelEditingSelectedNote() {
  if (selectedNoteId === unsavedNewNoteId) {
    discardUnsavedNewNote();
  }
  storage.clearDraft();
  renderApp(); // re-fill the form from the saved note, discarding any typed edits
}

// --- Delete note -----------------------------------------------------------

function closeConfirmationModal() {
  pendingConfirmAction = null;
  ui.hideModal();
}

function deleteSelectedNote() {
  if (!selectedNoteId) return;

  noteManager.deleteNote(notes, selectedNoteId);
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  storage.saveNotes(notes);

  renderApp();
  showNotesView(); // go back to the list view, since the deleted note's detail is gone
  ui.showToast("Note deleted.");
}

function openDeleteConfirmation() {
  const note = getSelectedNote();
  if (!note) return;

  pendingConfirmAction = deleteSelectedNote;
  ui.showModal({
    title: "Delete Note",
    message: "Are you sure you want to permanently delete this note? This action cannot be undone.",
    confirmLabel: "Delete Note",
    isDangerous: true,
  });
}

// --- Archive / restore note ------------------------------------------------
// Archiving asks for confirmation (it moves the note out of the main list);
// restoring is a quick, reversible action, so it happens immediately.

function archiveSelectedNote() {
  if (!selectedNoteId) return;

  noteManager.updateArchivedStatus(notes, selectedNoteId, true);
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  storage.saveNotes(notes);

  renderApp();
  showNotesView();
  ui.showToast("Note archived.");
}

function restoreSelectedNote() {
  if (!selectedNoteId) return;

  noteManager.updateArchivedStatus(notes, selectedNoteId, false);
  const visibleNotes = getVisibleNotes();
  selectedNoteId = visibleNotes.length > 0 ? visibleNotes[0].id : null;
  storage.saveNotes(notes);

  renderApp();
  ui.showToast("Note restored.");
}

function handleArchiveButtonClick() {
  const note = getSelectedNote();
  if (!note) return;

  if (note.archived) {
    restoreSelectedNote();
    return;
  }

  pendingConfirmAction = archiveSelectedNote;
  ui.showModal({
    title: "Archive Note",
    message: "Are you sure you want to archive this note? You can find it in the Archived Notes section and restore it anytime.",
    confirmLabel: "Archive Note",
    isDangerous: false,
  });
}

// --- Initial render ------------------------------------------------------

renderApp();

// renderApp() just filled the form from the saved note, which overwrites
// any draft text with the note's real content. If there was a draft,
// re-apply its (unsaved) text on top now that the form exists.
if (savedDraft !== null) {
  titleInput.value = savedDraft.title;
  tagsInput.value = savedDraft.tags;
  contentInput.value = savedDraft.content;
  updateSaveButtonState();
}

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

// Same event delegation pattern as the notes list: one listener on the
// <ul> handles clicks on any tag link, however many tags there are.
tagList.addEventListener("click", (event) => {
  const clickedLink = event.target.closest(".tag-link");
  if (!clickedLink) return;

  event.preventDefault();
  showTagFilter(clickedLink.dataset.tag);
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault(); // search happens live as you type; Enter shouldn't reload the page
});

searchInput.addEventListener("input", handleSearchInput);

mobileSearchButton.addEventListener("click", (event) => {
  event.preventDefault();
  openMobileSearch();
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

titleInput.addEventListener("blur", validateTitle);
titleInput.addEventListener("input", handleTitleInput);

titleInput.addEventListener("input", saveDraftFromForm);
tagsInput.addEventListener("input", saveDraftFromForm);
contentInput.addEventListener("input", saveDraftFromForm);

deleteButtons.forEach((button) => {
  button.addEventListener("click", openDeleteConfirmation);
});

archiveButtons.forEach((button) => {
  button.addEventListener("click", handleArchiveButtonClick);
});

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

// Escape cancels the modal, matching the assignment's keyboard requirement.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalOverlay.hidden) {
    closeConfirmationModal();
  }
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
  showAllNotes();
});

allNotesLink.addEventListener("click", (event) => {
  event.preventDefault();
  showAllNotes();
});

archivedNotesLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showArchivedNotes();
  });
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
