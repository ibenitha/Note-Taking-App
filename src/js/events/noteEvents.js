// events/noteEvents.js
//
// Only responsibility: everything that reads or changes note data —
// opening a note from the list, creating/saving/cancelling, deleting,
// archiving/restoring, adding a location, and the draft/validation
// behaviour of the note editor. Filtering *which* notes are visible
// (search, tags, archived view) is navigationEvents.js's job; this file
// just asks the shared core to re-render after a change.

import * as storage from "../storage/storage.js";
import * as noteManager from "../models/noteManager.js";
import * as renderDetail from "../ui/renderDetail.js";
import * as renderNotes from "../ui/renderNotes.js";
import * as feedback from "../ui/feedback.js";
import * as icons from "../ui/icons.js";
import { parseTags } from "../utils/tags.js";
import { isRequired } from "../utils/validation.js";

const notesList = document.querySelector(".notes-list");
const backButton = document.querySelector(".back-btn");

const createNoteButton = document.querySelector(".create-note-btn");
const fabButton = document.querySelector(".fab");
const noteForm = document.querySelector(".note-detail-panel");
const cancelButtons = document.querySelectorAll(".cancel-btn");
const titleInput = document.querySelector('[data-field="title"]');
const tagsInput = document.querySelector('[data-field="tags"]');
const contentInput = document.querySelector('[data-field="content"]');

const deleteButtons = document.querySelectorAll(".delete-btn");
const archiveButtons = document.querySelectorAll(".archive-btn");
const locationButton = document.querySelector(".location-btn");

// Set once by init() and used by every handler function below — see
// main.js for what core contains (state + renderApp + the shared actions).
let core;
let state;

function isTitleValid() {
  return isRequired(titleInput.value);
}

// --- Create / save / cancel --------------------------------------------

function createNewNote() {
  core.discardUnsavedNewNote();
  state.showingArchived = false; // a brand new note is never archived, so show the All Notes view

  // A brand-new note is a draft, not yet part of state.notes — it must
  // not appear in the list or be persisted until the user clicks Save.
  state.draftNote = noteManager.createDraftNote();
  state.selectedNoteId = state.draftNote.id;

  core.renderApp();
  document.body.dataset.mobileView = "detail";
  titleInput.focus();
}

// --- Validation ---------------------------------------------------------
// The only required field is the title. Validation runs on blur (so the
// user sees the error as soon as they leave the field) and again on
// submit (so it can never be skipped).

function validateTitle() {
  if (isTitleValid()) {
    feedback.clearValidationError();
    return true;
  }
  feedback.showValidationError("Title is required.");
  return false;
}

// While the user is typing, clear the error as soon as it becomes valid
// again, instead of making them wait until they blur the field.
function handleTitleInput() {
  core.updateSaveButtonState();
  if (isTitleValid()) {
    feedback.clearValidationError();
  }
}

// --- Drafts (sessionStorage) --------------------------------------------
// Saved on every keystroke so a reload or accidental tab close doesn't
// lose unsaved edits. Cleared once the note is actually saved or the
// edit is cancelled, since at that point there is nothing left to restore.

function saveDraftFromForm() {
  storage.saveDraft({
    noteId: state.selectedNoteId,
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

  const updates = {
    title: titleInput.value,
    content: contentInput.value,
    tags: parseTags(tagsInput.value),
  };

  const isSavingTheDraft = state.draftNote !== null && state.draftNote.id === state.selectedNoteId;
  if (isSavingTheDraft) {
    // First save of a brand-new note: promote the draft into state.notes.
    noteManager.saveDraftNote(state.notes, state.draftNote, updates);
    state.draftNote = null;
  } else {
    const note = core.getSelectedNote();
    if (!note) return;
    noteManager.updateNote(state.notes, note.id, updates);
  }

  storage.saveNotes(state.notes);
  storage.clearDraft();
  core.renderApp();
  feedback.showToast("Note saved successfully!");
}

function cancelEditingSelectedNote() {
  const wasUnsavedDraft = state.draftNote !== null && state.selectedNoteId === state.draftNote.id;
  if (wasUnsavedDraft) {
    core.discardUnsavedNewNote();
  }

  storage.clearDraft();
  core.renderApp(); // re-fill the form from the saved note, discarding any typed edits

  // A cancelled new note leaves nothing to show in its place, so return
  // to the list (on mobile, staying on the detail view here would strand
  // the user: it has no back button of its own outside of "Go Back").
  if (wasUnsavedDraft) {
    core.showNotesView();
  }
}

// --- Delete --------------------------------------------------------------

function deleteSelectedNote() {
  if (!state.selectedNoteId) return;

  noteManager.deleteNote(state.notes, state.selectedNoteId);
  core.selectFirstVisibleNote();
  storage.saveNotes(state.notes);

  core.renderApp();
  core.showNotesView(); // go back to the list view, since the deleted note's detail is gone
  feedback.showToast("Note permanently deleted.");
}

function openDeleteConfirmation() {
  const note = core.getSelectedNote();
  if (!note) return;

  core.openConfirmModal(deleteSelectedNote, {
    title: "Delete Note",
    message: "Are you sure you want to permanently delete this note? This action cannot be undone.",
    confirmLabel: "Delete Note",
    isDangerous: true,
    icon: icons.TRASH_ICON_PATHS,
  });
}

// --- Archive / restore -----------------------------------------------------
// Archiving asks for confirmation (it moves the note out of the main
// list); restoring is a quick, reversible action, so it happens
// immediately.

function archiveSelectedNote() {
  if (!state.selectedNoteId) return;

  noteManager.updateArchivedStatus(state.notes, state.selectedNoteId, true);
  core.selectFirstVisibleNote();
  storage.saveNotes(state.notes);

  core.renderApp();
  core.showNotesView();
  feedback.showToast("Note archived.", { label: "Archived Notes", onClick: core.showArchivedNotes });
}

function restoreSelectedNote() {
  if (!state.selectedNoteId) return;

  noteManager.updateArchivedStatus(state.notes, state.selectedNoteId, false);
  core.selectFirstVisibleNote();
  storage.saveNotes(state.notes);

  core.renderApp();
  feedback.showToast("Note restored to active notes.", { label: "All Notes", onClick: core.showAllNotes });
}

function handleArchiveButtonClick() {
  const note = core.getSelectedNote();
  if (!note) return;

  if (note.archived) {
    restoreSelectedNote();
    return;
  }

  core.openConfirmModal(archiveSelectedNote, {
    title: "Archive Note",
    message: "Are you sure you want to archive this note? You can find it in the Archived Notes section and restore it anytime.",
    confirmLabel: "Archive Note",
    isDangerous: false,
    icon: icons.ARCHIVE_ICON_PATHS,
  });
}

// --- Geolocation (bonus) ---------------------------------------------------
// Adding a location is reversible and low-risk, so it needs no
// confirmation modal — just the browser's own native permission prompt.

// A location change only updates the location row/button and (if the note
// is already saved and visible) its card — never a full core.renderApp().
// That full render re-fills title/tags/content from the note object,
// which would silently discard anything typed but not yet saved (and, for
// a still-blank draft, wipe the fields back to empty). Only persist to
// storage if the note is already a saved member of state.notes; an
// unsaved draft's location just travels with it in memory until Save.
function applyLocationChange(note, location) {
  note.location = location;
  if (state.notes.includes(note)) {
    storage.saveNotes(state.notes);
  }
  renderDetail.updateLocationUI(note);
  renderNotes.updateNoteCard(note, state.selectedNoteId);
}

function handleLocationSuccess(position) {
  const note = core.getSelectedNote();
  if (!note) return;

  applyLocationChange(note, {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  feedback.showToast("Location added!");
}

function handleLocationError(error) {
  if (error.code === error.PERMISSION_DENIED) {
    feedback.showToast("Location permission was denied.");
  } else {
    feedback.showToast("Could not get your location.");
  }
}

function handleLocationButtonClick() {
  const note = core.getSelectedNote();
  if (!note) return;

  if (note.location !== null) {
    applyLocationChange(note, null);
    return;
  }

  if (!("geolocation" in navigator)) {
    feedback.showToast("Geolocation is not supported in this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(handleLocationSuccess, handleLocationError);
}

// --- Event listeners -------------------------------------------------------

function handleNotesListClick(event) {
  const clickedCard = event.target.closest(".note-card");
  if (!clickedCard) return;

  core.selectNoteAndOpenDetail(clickedCard.dataset.noteId);
}

function handleBackButtonClick() {
  // "Go Back" is also how a brand new, unsaved note gets abandoned on
  // mobile (Cancel isn't the only way off this screen), so it needs the
  // same discard-if-unsaved check Cancel and the notes list already do.
  core.discardUnsavedNewNote();
  core.renderApp();

  // Go back to the view the user came from
  if (state.showingArchived) {
    document.body.dataset.mobileView = "list";
  } else if (state.activeTag !== null) {
    document.body.dataset.mobileView = "tag-detail";
  } else if (state.searchQuery !== "") {
    document.body.dataset.mobileView = "search";
  } else {
    document.body.dataset.mobileView = "list";
  }
}

function handleNoteFormSubmit(event) {
  event.preventDefault(); // this is a real <form>, so stop the page from reloading
  saveSelectedNote();
}

// Restores a sessionStorage draft's *text* into the form after the very
// first render. main.js already used the draft to decide which note is
// selected before this module ever ran; this just refills the fields
// renderApp() would otherwise have overwritten with the saved note's
// (unedited) content.
function restoreDraftIntoForm(savedDraft) {
  if (savedDraft === null) return;

  titleInput.value = savedDraft.title;
  tagsInput.value = savedDraft.tags;
  contentInput.value = savedDraft.content;
  core.updateSaveButtonState();
}

// init(coreArg, savedDraft) — coreArg is the shared app engine (state +
// render + the few cross-cutting helpers every feature needs); savedDraft
// is the sessionStorage draft loaded once at startup.
//
// Returns { cancelEditingSelectedNote } so keyboardEvents.js can trigger
// the same "leave the editor" behaviour on Escape.
export function init(coreArg, savedDraft) {
  core = coreArg;
  state = core.state;

  notesList.addEventListener("click", handleNotesListClick);
  backButton.addEventListener("click", handleBackButtonClick);

  createNoteButton.addEventListener("click", createNewNote);
  fabButton.addEventListener("click", createNewNote);

  noteForm.addEventListener("submit", handleNoteFormSubmit);

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

  locationButton.addEventListener("click", handleLocationButtonClick);

  restoreDraftIntoForm(savedDraft);

  return { cancelEditingSelectedNote };
}
