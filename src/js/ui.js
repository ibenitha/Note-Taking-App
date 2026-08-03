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
// note titles/content can never be interpreted as HTML. Exported so the
// mobile search/tag-detail lists in main.js can build identical cards
// instead of maintaining their own copy of this markup.
export function createNoteCard(note, selectedNoteId) {
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

// Exported so main.js's mobile tags list can reuse the exact same icon
// instead of rebuilding it from the same path data a second time.
export function createTagIcon() {
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

// The archive/restore button shares one <svg> element for both states
// (like the password eye toggle), so only the inner path data swaps.
const ARCHIVE_ICON_PATHS =
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M21 7.78216V16.2169C21 19.165 18.9188 21 15.9736 21H8.02638C5.08119 21 3 19.165 3 16.2159V7.78216C3 4.83405 5.08119 3 8.02638 3H15.9736C18.9188 3 21 4.84281 21 7.78216Z" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M15 14L11.9982 17L9 14" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M11.998 17V10" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M20.9336 7H3.05859" />';
const RESTORE_ICON_PATHS =
  '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" stroke="none" d="M3.70812 7.40355C4.08964 7.24224 4.52968 7.42076 4.69099 7.80227L6.00735 10.9157L9.09972 9.60817C9.48124 9.44687 9.92128 9.62538 10.0826 10.0069C10.2439 10.3885 10.0654 10.8285 9.68386 10.9898L5.9007 12.5893C5.51918 12.7507 5.07914 12.5721 4.91783 12.1906L3.3094 8.38641C3.14809 8.0049 3.32661 7.56486 3.70812 7.40355Z" />' +
  '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" stroke="none" d="M12.9149 5.66386C9.46811 5.66386 6.66646 8.40957 6.57984 11.8239C6.56934 12.2379 6.22514 12.5651 5.81106 12.5546C5.39698 12.5441 5.06982 12.1999 5.08032 11.7858C5.18759 7.55782 8.65486 4.16386 12.9149 4.16386C17.2392 4.16386 20.7498 7.6745 20.7498 11.9987C20.7498 16.3316 17.2386 19.8336 12.9149 19.8336C10.2344 19.8336 7.87621 18.492 6.45811 16.4496C6.22187 16.1093 6.30619 15.642 6.64643 15.4058C6.98667 15.1695 7.454 15.2538 7.69024 15.5941C8.8411 17.2516 10.7484 18.3336 12.9149 18.3336C16.4113 18.3336 19.2498 15.502 19.2498 11.9987C19.2498 8.50293 16.4107 5.66386 12.9149 5.66386Z" />';

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
  const locationButtonIcon = document.querySelector(".location-btn-icon");
  const locationButtonLabel = document.querySelector(".location-btn-label");

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

  document.querySelectorAll(".archive-btn svg").forEach((svg) => {
    svg.innerHTML = note.archived ? RESTORE_ICON_PATHS : ARCHIVE_ICON_PATHS;
  });

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

const TOAST_DURATION_MS = 4000;
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
  toastTimeoutId = setTimeout(hideToast, TOAST_DURATION_MS);
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
const EYE_ICON_PATHS =
  '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" stroke="none" d="M12.0028 10.1147C10.6709 10.1147 9.59082 11.1509 9.59082 12.4302C9.59082 13.7087 10.671 14.7457 12.0028 14.7457C13.3346 14.7457 14.4148 13.7087 14.4148 12.4302C14.4148 11.1509 13.3348 10.1147 12.0028 10.1147ZM8.09082 12.4302C8.09082 10.3552 9.84276 8.67465 12.0028 8.67465C14.1629 8.67465 15.9148 10.3552 15.9148 12.4302C15.9148 14.504 14.163 16.1857 12.0028 16.1857C9.84261 16.1857 8.09082 14.504 8.09082 12.4302Z" />' +
  '<path fill-rule="evenodd" clip-rule="evenodd" fill="currentColor" stroke="none" d="M4.97553 7.19457C6.76993 5.73817 9.25074 4.70024 12.002 4.70024C14.7527 4.70024 17.2335 5.73736 19.028 7.19341C20.8031 8.63361 22.004 10.5697 22.004 12.4302C22.004 14.2906 20.8031 16.2267 19.028 17.6669C17.2335 19.123 14.7527 20.1601 12.002 20.1601C9.25074 20.1601 6.76993 19.1221 4.97553 17.6657C3.20075 16.2252 2 14.2892 2 12.4302C2 10.5711 3.20075 8.63505 4.97553 7.19457ZM5.94398 8.29423C4.37026 9.57151 3.5 11.1404 3.5 12.4302C3.5 13.7199 4.37026 15.2888 5.94398 16.5661C7.49808 17.8275 9.64327 18.7201 12.002 18.7201C14.3604 18.7201 16.5056 17.8281 18.0598 16.5671C19.6335 15.2902 20.504 13.7214 20.504 12.4302C20.504 11.139 19.6335 9.57007 18.0598 8.29322C16.5056 7.03223 14.3604 6.14024 12.002 6.14024C9.64327 6.14024 7.49808 7.03287 5.94398 8.29423Z" />';
const EYE_OFF_ICON_PATHS =
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M6.42 17.7297C4.19 16.2697 2.75 14.0697 2.75 12.1397C2.75 8.85972 6.89 4.83972 12 4.83972C14.09 4.83972 16.03 5.50972 17.59 6.54972" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M19.8502 8.61023C20.7412 9.74023 21.2602 10.9902 21.2602 12.1402C21.2602 15.4202 17.1102 19.4402 12.0002 19.4402C11.0902 19.4402 10.2012 19.3102 9.37012 19.0802" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M9.76584 14.3669C9.17084 13.7779 8.83784 12.9749 8.84084 12.1379C8.83684 10.3929 10.2488 8.97493 11.9948 8.97193C12.8348 8.96993 13.6408 9.30293 14.2348 9.89693" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M15.1093 12.6991C14.8753 13.9911 13.8643 15.0041 12.5723 15.2411" />' +
  '<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M19.8922 4.24988L4.11816 20.0239" />';

export function togglePasswordVisibility(toggleButton) {
  const input = toggleButton.previousElementSibling;
  const isCurrentlyPassword = input.type === "password";

  input.type = isCurrentlyPassword ? "text" : "password";
  toggleButton.setAttribute("aria-label", isCurrentlyPassword ? "Hide password" : "Show password");
  toggleButton.querySelector("svg").innerHTML = isCurrentlyPassword ? EYE_OFF_ICON_PATHS : EYE_ICON_PATHS;
}
