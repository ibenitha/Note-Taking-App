// ui/renderDetail.js
//
// Only responsibility: render one note into the detail form/editor,
// including its archived-state row and the archive/restore button's icon.

import { formatDate } from "../utils/date.js";
import { formatLocation } from "../utils/location.js";
import { ARCHIVE_ICON_PATHS, RESTORE_ICON_PATHS } from "./icons.js";
import { clearValidationError } from "./feedback.js";

// Cached DOM element references
const titleField = document.querySelector('[data-field="title"]');
const tagsField = document.querySelector('[data-field="tags"]');
const lastEditedField = document.querySelector('[data-field="last-edited"]');
const contentField = document.querySelector('[data-field="content"]');
const statusRow = document.querySelector(".status-row");
const archiveButtonLabels = document.querySelectorAll(".archive-btn-label");
const mobileArchiveButton = document.querySelector(".toolbar-actions .archive-btn");
const archiveButtonSvgs = document.querySelectorAll(".archive-btn svg");

const locationRow = document.querySelector(".location-row");
const locationField = document.querySelector('[data-field="location"]');
const locationButton = document.querySelector(".location-btn");
const locationButtonIcon = document.querySelector(".location-btn-icon");
const locationButtonLabel = document.querySelector(".location-btn-label");

// Updates just the location row and the Add/Remove Location button —
// nothing else in the form. Exported so a location change can be reflected
// on screen without a full renderNoteDetail() call, which would overwrite
// whatever the user has typed into title/tags/content but not saved yet
// (renderNoteDetail always re-fills those fields from the note object).
export function updateLocationUI(note) {
  locationButton.hidden = false;
  if (note.location === null) {
    locationRow.hidden = true;
    locationButtonIcon.hidden = false;
    locationButtonLabel.textContent = "Add Location";
  } else {
    locationRow.hidden = false;
    locationField.textContent = formatLocation(note.location);
    locationButtonIcon.hidden = true;
    locationButtonLabel.textContent = "Remove Location";
  }
}

// Fills in the detail form with one note's data. Passing null clears the
// form instead (used when there is no note to display, e.g. every note
// has been deleted).
export function renderNoteDetail(note) {
  clearValidationError();

  if (note === null) {
    titleField.value = "";
    tagsField.value = "";
    lastEditedField.textContent = "Not yet saved";
    contentField.innerHTML = "";
    statusRow.hidden = true;
    locationRow.hidden = true;
    locationButton.hidden = true;
    return;
  }

  titleField.value = note.title;
  tagsField.value = note.tags.join(", ");
  lastEditedField.textContent = formatDate(note.timestamp);
  contentField.innerHTML = note.content;
  statusRow.hidden = !note.archived;

  archiveButtonLabels.forEach((label) => {
    label.textContent = note.archived ? "Restore Note" : "Archive Note";
  });
  mobileArchiveButton.setAttribute("aria-label", note.archived ? "Restore note" : "Archive note");

  archiveButtonSvgs.forEach((svg) => {
    svg.innerHTML = note.archived ? RESTORE_ICON_PATHS : ARCHIVE_ICON_PATHS;
  });

  updateLocationUI(note);
}
