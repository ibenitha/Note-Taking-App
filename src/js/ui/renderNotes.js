// ui/renderNotes.js
//
// Only responsibility: render the notes list view — the note cards
// themselves, the empty state, the panel title, and which nav link is
// highlighted for that view. It never decides which notes belong in the
// list (noteManager.js's job) — it only draws whatever it's given.

import { formatDate } from "../utils/date.js";
import { formatLocation } from "../utils/location.js";

// Builds one <li><button class="note-card">...</button></li> element for
// the notes list, using document.createElement instead of innerHTML so
// note titles/content can never be interpreted as HTML. Exported so the
// mobile search/tag-detail lists can build identical cards instead of
// maintaining their own copy of this markup.
export function createNoteCard(note, selectedNoteId) {
  const listItem = document.createElement("li");

  const card = document.createElement("button");
  card.type = "button";
  card.className = "note-card";
  card.dataset.noteId = note.id;
  if (note.id === selectedNoteId) {
    card.classList.add("is-active");
    card.setAttribute("aria-current", "true");
  }
  if (note.archived) {
    card.classList.add("is-archived");
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

// Rebuilds and swaps in just one note's card, wherever it's currently
// rendered (the main list, a mobile search/tag-detail list, ...) — used
// for a small change (like toggling a location) that shouldn't trigger a
// full list rebuild. A no-op if that note isn't currently on screen (e.g.
// it's filtered out, or still an unsaved draft that was never rendered).
export function updateNoteCard(note, selectedNoteId) {
  const existingCard = document.querySelector(`.note-card[data-note-id="${note.id}"]`);
  if (!existingCard) return;
  existingCard.closest("li").replaceWith(createNoteCard(note, selectedNoteId));
}

function showEmptyNotesMessage(container, message) {
  const messageItem = document.createElement("li");
  messageItem.className = "empty-state";
  messageItem.textContent = message;
  container.appendChild(messageItem);
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

export function setPanelTitle(text) {
  document.querySelector(".panel-title").textContent = text;
}

// Shows the nav link(s) matching the given view ("all", "archived", ...)
// as active, and un-marks every other nav link. Both the sidebar and the
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
