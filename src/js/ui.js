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
const TAG_ICON_PATHS = [
  "M3.01582 5.96647C3.01874 4.5547 4.08608 3.28888 5.47158 3.0505C5.75568 3.00088 9.08808 3.00769 10.4668 3.00866C11.8309 3.00964 12.9936 3.50001 13.9568 4.4613C16.002 6.50257 18.0452 8.5458 20.0855 10.591C21.2929 11.8004 21.3095 13.6568 20.1069 14.8701C18.3721 16.6214 16.6285 18.364 14.8782 20.0988C13.6659 21.3004 11.8095 21.2848 10.5991 20.0774C8.53544 18.0195 6.47178 15.9617 4.41688 13.8951C3.62197 13.0954 3.15301 12.1292 3.0489 10.9996C2.96522 10.0967 3.01387 6.73998 3.01582 5.96647Z",
  "M9.90712 8.31531C9.90322 9.18514 9.17642 9.90027 8.29784 9.89832C7.42509 9.89638 6.69828 9.1686 6.70315 8.30169C6.70899 7.39683 7.42509 6.69144 8.33578 6.69533C9.19977 6.69825 9.91101 7.43089 9.90712 8.31531Z",
];

function createTagIcon() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.8");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");

  for (const pathData of TAG_ICON_PATHS) {
    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("clip-rule", "evenodd");
    path.setAttribute("d", pathData);
    svg.append(path);
  }

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

// Shows a brief success message, then hides it again after a few seconds.
// Calling this again while a toast is already showing replaces it and
// restarts the timer instead of stacking messages.
//
// action is optional: { label, onClick } adds a clickable link (e.g.
// "Archived Notes" after archiving a note) alongside the message.
export function showToast(message, action) {
  const toast = document.querySelector(".toast");
  const messageField = toast.querySelector(".toast-message");
  const actionLink = toast.querySelector(".toast-action-link");

  messageField.textContent = message;

  if (action) {
    actionLink.textContent = action.label;
    actionLink.hidden = false;
    // Assigning .onclick (instead of addEventListener) means each call
    // replaces the previous handler instead of piling up a new listener
    // every time a toast is shown.
    actionLink.onclick = (event) => {
      event.preventDefault();
      hideToast();
      action.onClick();
    };
  } else {
    actionLink.hidden = true;
    actionLink.onclick = null;
  }

  toast.hidden = false;
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(hideToast, 4000);
}

export function hideToast() {
  document.querySelector(".toast").hidden = true;
  clearTimeout(toastTimeoutId);
}

// --- Confirmation modal ----------------------------------------------------
// One modal element in the HTML is reused for every confirmation (delete,
// archive, ...) instead of building a separate modal per action. Callers
// pass in the text to show; main.js decides what happens if confirmed.

// icon is the inner markup (path elements) for the modal's small icon
// square, so each action (delete, archive, ...) can show its own icon
// while reusing the same modal element.
export function showModal({ title, message, confirmLabel, isDangerous, icon }) {
  const overlay = document.querySelector(".modal-overlay");
  const titleField = document.querySelector("#modal-title");
  const messageField = document.querySelector("#modal-message");
  const confirmButton = document.querySelector(".modal-confirm-btn");
  const iconSvg = document.querySelector(".modal-icon svg");

  titleField.textContent = title;
  messageField.textContent = message;
  confirmButton.textContent = confirmLabel;
  confirmButton.classList.toggle("btn-danger", isDangerous);
  confirmButton.classList.toggle("btn-primary", !isDangerous);
  iconSvg.innerHTML = icon;

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

// --- Auth screens ------------------------------------------------------
// Every function here takes the <form> it applies to as a parameter
// instead of guessing which one is currently visible, so there is no
// hidden dependency on screen state.

// Shows the one auth screen matching screenName ("login", "signup",
// "forgot-password", "reset-password") and hides the other three.
export function showAuthScreen(screenName) {
  document.querySelectorAll(".auth-screen").forEach((screen) => {
    screen.hidden = screen.dataset.authScreen !== screenName;
  });
}

export function showFieldError(form, fieldName, message) {
  form.querySelector(`[data-error-for="${fieldName}"]`).textContent = message;
  form.querySelector(`[data-field="${fieldName}"]`).classList.add("has-error");
}

export function clearFieldError(form, fieldName) {
  form.querySelector(`[data-error-for="${fieldName}"]`).textContent = "";
  form.querySelector(`[data-field="${fieldName}"]`).classList.remove("has-error");
}

export function clearAllFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((errorText) => {
    errorText.textContent = "";
  });
  form.querySelectorAll(".auth-input").forEach((input) => {
    input.classList.remove("has-error");
  });
}

export function showFormError(form, message) {
  form.querySelector(".form-error").textContent = message;
}

// Resets a form back to a blank, error-free state — used when switching
// away from an auth screen so old input/errors don't linger if the user
// comes back to it later.
export function resetAuthForm(form) {
  form.reset();
  clearAllFieldErrors(form);
  showFormError(form, "");
}

// The toggle button always sits right after its input in the markup
// (see index.html's .password-field), so this needs no extra lookup.
// The two icon states share one <svg> element; only the inner path data
// swaps, so the button's size/attributes never need to change.
const EYE_ICON_PATHS = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />';
const EYE_OFF_ICON_PATHS =
  '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94" />' +
  '<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />' +
  '<path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />' +
  '<path d="M1 1l22 22" />';

export function togglePasswordVisibility(toggleButton) {
  const input = toggleButton.previousElementSibling;
  const isCurrentlyPassword = input.type === "password";

  input.type = isCurrentlyPassword ? "text" : "password";
  toggleButton.setAttribute("aria-label", isCurrentlyPassword ? "Hide password" : "Show password");
  toggleButton.querySelector("svg").innerHTML = isCurrentlyPassword ? EYE_OFF_ICON_PATHS : EYE_ICON_PATHS;
}
