// noteManager.js
//
// This file owns the note data itself: what shape a note has, and the
// rules for creating one. It never touches the DOM (that is ui.js's job)
// and never calls localStorage directly (that is storage.js's job).

import { generateId } from "../utils/id.js";

export class Note {
  constructor(title, content, tags) {
    this.id = generateId();
    this.title = title;
    this.content = content;
    this.tags = [];
    tags.forEach((tag) => this.addTag(tag));
    this.archived = false;
    this.timestamp = new Date().toISOString();
    this.location = null;
    // A note belongs to at most one category, stored as that category's
    // id (see models/category.js) — null means "no category assigned".
    this.category = null;
  }

  // Adds a tag if it isn't already on this note, so the same tag can't
  // be added twice.
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  archive() {
    this.archived = true;
  }

  restore() {
    this.archived = false;
  }
}

// Rebuilds a real Note instance from a plain object — needed because
// storage.js's loadNotes() runs the saved JSON through JSON.parse, which
// has no concept of classes: it hands back a plain object with the right
// properties but none of Note.prototype's methods (addTag/archive/restore).
// Without this, editing or archiving any note that survived a page reload
// would throw ("note.addTag is not a function") the moment updateNote() or
// updateArchivedStatus() tried to call one of those methods.
export function reviveNote(plainNote) {
  const note = new Note(plainNote.title, plainNote.content, plainNote.tags);
  note.id = plainNote.id;
  note.timestamp = plainNote.timestamp;
  note.archived = plainNote.archived;
  note.location = plainNote.location;
  note.category = plainNote.category || null;
  return note;
}

// Creates a new Note, adds it to the given notes array, and returns the
// new note. The caller is responsible for saving the updated array and
// re-rendering the UI.
export function createNote(notes, title, content, tags) {
  const note = new Note(title, content, tags);
  notes.push(note);
  return note;
}

// Creates a blank Note for the "Create New Note" flow, WITHOUT adding it
// to any notes array. Until the user actually saves it, this note must not
// appear in the notes list or be persisted — the caller keeps it as an
// in-memory draft (main.js's state.draftNote) and only calls
// saveDraftNote() below once the user clicks Save.
export function createDraftNote() {
  return new Note("", "", []);
}

// Adds a draft note (from createDraftNote) to the notes array for the
// first time, applying the form's edits — used when a brand-new note is
// saved. Reuses updateNote() for the actual field assignment instead of
// duplicating it.
export function saveDraftNote(notes, draftNote, updates) {
  notes.push(draftNote);
  updateNote(notes, draftNote.id, updates);
}

// Removes the note with the given id from the notes array, if it exists.
export function deleteNote(notes, id) {
  const index = notes.findIndex((note) => note.id === id);
  if (index !== -1) {
    notes.splice(index, 1);
  }
}

// Finds a note in the given array by its unique id.
export function findNoteById(notes, id) {
  return notes.find((note) => note.id === id) || null;
}

// Sets a note's archived flag to true (archive) or false (restore).
export function updateArchivedStatus(notes, id, isArchived) {
  const note = findNoteById(notes, id);
  if (!note) return;
  if (isArchived) {
    note.archive();
  } else {
    note.restore();
  }
}

// Applies edits from the note detail form (title/content/tags) to an
// existing note and refreshes its timestamp. Tags go through addTag()
// one at a time (instead of a plain array replacement) so duplicates
// typed into the tags field can't sneak in twice.
export function updateNote(notes, id, updates) {
  const note = findNoteById(notes, id);
  if (!note) return;

  note.title = updates.title;
  note.content = updates.content;
  note.tags = [];
  updates.tags.forEach((tag) => note.addTag(tag));
  note.timestamp = new Date().toISOString();
}

// Returns notes whose title, content, or any tag contains the query text
// (case-insensitive). Searches every note regardless of archived status,
// since the assignment treats search as its own view, not a filter on
// top of "All Notes" / "Archived Notes".
export function searchNotes(notes, query) {
  const lowerCaseQuery = query.toLowerCase();

  return notes.filter((note) => {
    const titleMatches = note.title.toLowerCase().includes(lowerCaseQuery);
    const contentMatches = note.content.toLowerCase().includes(lowerCaseQuery);
    const tagMatches = note.tags.some((tag) => tag.toLowerCase().includes(lowerCaseQuery));
    return titleMatches || contentMatches || tagMatches;
  });
}

// Returns only the notes that have the given tag.
export function filterByTag(notes, tag) {
  return notes.filter((note) => note.tags.includes(tag));
}

// Returns every tag used by any note, alphabetically sorted, with no
// duplicates. A Set automatically drops duplicates as tags are added to it.
export function getUniqueTags(notes) {
  const tagSet = new Set();
  notes.forEach((note) => {
    note.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

// Returns only the notes assigned to the given category id.
export function filterByCategory(notes, categoryId) {
  return notes.filter((note) => note.category === categoryId);
}

// --- Export / import -------------------------------------------------------
// Import works with plain JSON (the file the user picks), the same kind
// of plain object storage.js hands back from loadNotes() — so validating
// and merging that data lives here, next to the rest of the note-shape
// rules, instead of in the events/ file that only handles the file I/O.

// Checks that parsed JSON has the shape produced by exporting notes (an
// object with a "notes" array), and that every entry in it has at least
// the fields a note needs. Throws a descriptive error instead of
// returning false/true, so the caller can show the exact problem to the
// user rather than a generic "invalid file" message.
export function validateImportedNotes(data) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !Array.isArray(data.notes)) {
    throw new Error("This file doesn't look like a notes export.");
  }

  data.notes.forEach((note, index) => {
    if (!note || typeof note !== "object") {
      throw new Error(`Entry ${index + 1} in the file is not a valid note.`);
    }
    if (typeof note.title !== "string" || typeof note.content !== "string") {
      throw new Error(`Entry ${index + 1} in the file is missing a title or content.`);
    }
    if (note.tags !== undefined && !Array.isArray(note.tags)) {
      throw new Error(`Entry ${index + 1} in the file has invalid tags.`);
    }
  });

  return data.notes;
}

// Adds imported notes to the given array, skipping any that already
// exist — matched by id (re-importing the same export twice) or by an
// identical title+content pair (importing a note that was exported from
// a different session and would get a freshly generated id here).
// Reuses createNote() so an imported note goes through the same
// construction as a note created by hand, then restores whatever
// timestamp/archived/location the import brought with it.
export function mergeImportedNotes(notes, importedRawNotes) {
  let addedCount = 0;
  let duplicateCount = 0;

  importedRawNotes.forEach((rawNote) => {
    const isDuplicate = notes.some(
      (note) => note.id === rawNote.id || (note.title === rawNote.title && note.content === rawNote.content)
    );

    if (isDuplicate) {
      duplicateCount++;
      return;
    }

    const note = createNote(notes, rawNote.title, rawNote.content, rawNote.tags || []);
    if (typeof rawNote.timestamp === "string") note.timestamp = rawNote.timestamp;
    if (rawNote.archived === true) note.archive();
    if (rawNote.location) note.location = rawNote.location;
    if (rawNote.category) note.category = rawNote.category;
    addedCount++;
  });

  return { addedCount, duplicateCount };
}

// Sample notes used only the very first time the app runs, before the
// user has saved anything to localStorage. This lets the app demonstrate
// its features immediately instead of starting on an empty list.
export function getSampleNotes() {
  return [
    new Note(
      "React Performance Optimization",
      "Key performance optimization techniques:\n\n1. Code Splitting\n- Use React.lazy() for route-based splitting\n- Implement dynamic imports for heavy components\n\n2. Memoization\n- useMemo for expensive calculations\n- useCallback for function props\n- React.memo for component optimization\n\n3. Virtual List Implementation\n- Use react-window for long lists\n- Implement infinite scrolling\n\nTODO: Benchmark current application and identify bottlenecks",
      ["Dev", "React"]
    ),
    new Note(
      "Japan Travel Planning",
      "Places to visit:\n- Tokyo\n- Kyoto\n- Osaka\n\nBudget: $3000\nBest time to go: Spring (cherry blossoms)",
      ["Travel", "Personal"]
    ),
    new Note(
      "Favorite Pasta Recipes",
      "1. Carbonara\n2. Aglio e Olio\n3. Cacio e Pepe\n\nAlways use fresh pasta when possible.",
      ["Cooking", "Recipes"]
    ),
  ];
}
