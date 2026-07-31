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
  listItem.appendChild(card);
  return listItem;
}

// Renders the given notes into the notes list, replacing whatever was
// there before. Pass the id of the currently open note so its card can
// be highlighted.
export function renderAllNotes(notes, selectedNoteId) {
  const notesList = document.querySelector(".notes-list");
  notesList.innerHTML = "";

  if (notes.length === 0) {
    showEmptyNotesMessage(notesList);
    return;
  }

  notes.forEach((note) => {
    notesList.appendChild(createNoteCard(note, selectedNoteId));
  });
}

function showEmptyNotesMessage(container) {
  const message = document.createElement("li");
  message.className = "empty-state";
  message.textContent = "You don't have any notes yet. Start a new note to capture your thoughts and ideas.";
  container.appendChild(message);
}

// Fills in the detail form with one note's data. Passing null clears the
// form instead (used when there is no note to display, e.g. every note
// has been deleted).
export function renderNoteDetail(note) {
  const titleField = document.querySelector('[data-field="title"]');
  const tagsField = document.querySelector('[data-field="tags"]');
  const lastEditedField = document.querySelector('[data-field="last-edited"]');
  const contentField = document.querySelector('[data-field="content"]');

  if (note === null) {
    titleField.value = "";
    tagsField.value = "";
    lastEditedField.textContent = "Not yet saved";
    contentField.value = "";
    return;
  }

  titleField.value = note.title;
  tagsField.value = note.tags.join(", ");
  lastEditedField.textContent = formatDate(note.timestamp);
  contentField.value = note.content;
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
