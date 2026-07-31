// ui.js
//
// This file is the only one that touches the DOM for rendering. It builds
// note card elements, fills in the detail panel, and shows empty-state
// messages. It never calls localStorage (storage.js's job) and never
// decides business rules like which notes match a search (noteManager.js's
// job) — it only draws whatever data it is given.

// Turns an ISO date string (e.g. "2024-10-29T10:00:00.000Z") into the
// short display format used throughout the design, e.g. "29 Oct 2024".
function formatDate(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Rounds coordinates to 4 decimal places (about 11m of precision, plenty
// for "where was I when I wrote this") and joins them into one string.
function formatLocation(location) {
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}

// Builds one <li><button class="note-card">...</button></li> element for
// the notes list, using document.createElement instead of innerHTML so
// note titles/content can never be interpreted as HTML.
function createNoteCard(note, selectedNoteId) {
  const listItem = document.createElement("li");

  const card = document.createElement("button");
  card.type = "button";
  card.className = "note-card";
  card.dataset.noteId = note.id;
  if (note.id === selectedNoteId) {
    card.classList.add("is-active");
  }

  const title = document.createElement("h3");
  title.className = "note-card-title";
  title.textContent = note.title;

  const tagPills = document.createElement("div");
  tagPills.className = "tag-pills";
  note.tags.forEach((tag) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = tag;
    tagPills.appendChild(pill);
  });

  const date = document.createElement("time");
  date.className = "note-card-date";
  date.textContent = formatDate(note.timestamp);

  card.append(title, tagPills, date);

  if (note.location !== null) {
    const locationBadge = document.createElement("span");
    locationBadge.className = "location-badge";
    locationBadge.textContent = `📍 ${formatLocation(note.location)}`;
    card.appendChild(locationBadge);
  }

  listItem.appendChild(card);
  return listItem;
}

// The tag icon is the same small outline for every tag, so its path data
// is kept here once instead of being duplicated in every generated link.
const TAG_ICON_PATH = "M20.59 13.41L11 3.83V3H3v8h.83l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83z";

function createTagIcon() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(svgNamespace, "path");
  path.setAttribute("d", TAG_ICON_PATH);

  const dot = document.createElementNS(svgNamespace, "circle");
  dot.setAttribute("cx", "6.5");
  dot.setAttribute("cy", "6.5");
  dot.setAttribute("r", "1.5");

  svg.append(path, dot);
  return svg;
}

// Renders the sidebar's tag list from whatever tags currently exist on
// the notes, highlighting the tag being filtered by (if any).
export function renderTagList(tags, activeTag) {
  const tagList = document.querySelector(".tag-list");
  tagList.innerHTML = "";

  if (tags.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";
    message.textContent = "Tags you add to notes will show up here.";
    tagList.appendChild(message);
    return;
  }

  tags.forEach((tag) => {
    const listItem = document.createElement("li");

    const link = document.createElement("a");
    link.href = "#";
    link.className = "tag-link";
    link.dataset.tag = tag;
    if (tag === activeTag) {
      link.classList.add("is-active");
    }

    const label = document.createElement("span");
    label.textContent = tag;

    link.append(createTagIcon(), label);
    listItem.appendChild(link);
    tagList.appendChild(listItem);
  });
}

// Renders the given notes into the notes list, replacing whatever was
// there before. Pass the id of the currently open note so its card can
// be highlighted, and the message to show if the list is empty (the
// wording is different for "All Notes" vs "Archived Notes").
export function renderAllNotes(notes, selectedNoteId, emptyMessage) {
  const notesList = document.querySelector(".notes-list");
  notesList.innerHTML = "";

  if (notes.length === 0) {
    showEmptyNotesMessage(notesList, emptyMessage);
    return;
  }

  notes.forEach((note) => {
    notesList.appendChild(createNoteCard(note, selectedNoteId));
  });
}

function showEmptyNotesMessage(container, message) {
  const messageItem = document.createElement("li");
  messageItem.className = "empty-state";
  messageItem.textContent = message;
  container.appendChild(messageItem);
}

export function setPanelTitle(text) {
  document.querySelector(".panel-title").textContent = text;
}

// Shows the nav link(s) matching the given view ("all" or "archived") as
// active, and un-marks every other nav link. Both the sidebar and the
// mobile bottom nav share the same data-nav-view attribute, so this
// updates both at once.
export function setActiveNav(viewName) {
  document.querySelectorAll("[data-nav-view]").forEach((link) => {
    const isActive = link.dataset.navView === viewName;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// Fills in the detail form with one note's data. Passing null clears the
// form instead (used when there is no note to display, e.g. every note
// has been deleted).
export function renderNoteDetail(note) {
  const titleField = document.querySelector('[data-field="title"]');
  const tagsField = document.querySelector('[data-field="tags"]');
  const lastEditedField = document.querySelector('[data-field="last-edited"]');
  const contentField = document.querySelector('[data-field="content"]');
  const statusRow = document.querySelector(".status-row");
  const archiveButtonLabels = document.querySelectorAll(".archive-btn-label");
  const mobileArchiveButton = document.querySelector(".toolbar-actions .archive-btn");
  const locationRow = document.querySelector(".location-row");
  const locationField = document.querySelector('[data-field="location"]');
  const locationButton = document.querySelector(".location-btn");

  clearValidationError();

  if (note === null) {
    titleField.value = "";
    tagsField.value = "";
    lastEditedField.textContent = "Not yet saved";
    contentField.value = "";
    statusRow.hidden = true;
    locationRow.hidden = true;
    locationButton.hidden = true;
    return;
  }

  titleField.value = note.title;
  tagsField.value = note.tags.join(", ");
  lastEditedField.textContent = formatDate(note.timestamp);
  contentField.value = note.content;
  statusRow.hidden = !note.archived;

  archiveButtonLabels.forEach((label) => {
    label.textContent = note.archived ? "Restore Note" : "Archive Note";
  });
  mobileArchiveButton.setAttribute("aria-label", note.archived ? "Restore note" : "Archive note");

  locationButton.hidden = false;
  if (note.location === null) {
    locationRow.hidden = true;
    locationButton.textContent = "+ Add Location";
  } else {
    locationRow.hidden = false;
    locationField.textContent = formatLocation(note.location);
    locationButton.textContent = "Remove Location";
  }
}

// --- Validation feedback -------------------------------------------------
// Only the title field is validated (it is the assignment's one required
// field), so these functions work with that specific field and its error
// message element rather than taking them as parameters every time.

export function showValidationError(message) {
  const titleField = document.querySelector('[data-field="title"]');
  const errorText = document.querySelector("#title-error");

  titleField.classList.add("has-error");
  errorText.textContent = message;
}

export function clearValidationError() {
  const titleField = document.querySelector('[data-field="title"]');
  const errorText = document.querySelector("#title-error");

  titleField.classList.remove("has-error");
  errorText.textContent = "";
}

// --- Toast feedback --------------------------------------------------------

let toastTimeoutId = null;

// Shows a brief success message, then hides it again after a couple of
// seconds. Calling this again while a toast is already showing restarts
// the timer instead of stacking messages.
export function showToast(message) {
  const toast = document.querySelector(".toast");

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toast.hidden = true;
  }, 2500);
}

// --- Confirmation modal ----------------------------------------------------
// One modal element in the HTML is reused for every confirmation (delete,
// archive, ...) instead of building a separate modal per action. Callers
// pass in the text to show; main.js decides what happens if confirmed.

export function showModal({ title, message, confirmLabel, isDangerous }) {
  const overlay = document.querySelector(".modal-overlay");
  const titleField = document.querySelector("#modal-title");
  const messageField = document.querySelector("#modal-message");
  const confirmButton = document.querySelector(".modal-confirm-btn");

  titleField.textContent = title;
  messageField.textContent = message;
  confirmButton.textContent = confirmLabel;
  confirmButton.classList.toggle("btn-danger", isDangerous);
  confirmButton.classList.toggle("btn-primary", !isDangerous);

  overlay.hidden = false;
  confirmButton.focus();
}

export function hideModal() {
  document.querySelector(".modal-overlay").hidden = true;
}

// Splits the tags input's comma-separated text into a clean array of tags,
// e.g. "Work, Planning" -> ["Work", "Planning"]. Trims extra spaces and
// drops empty entries (from things like a trailing comma).
export function parseTagsInput(tagsText) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
