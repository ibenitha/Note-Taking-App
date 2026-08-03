// noteManager.js
//
// This file owns the note data itself: what shape a note has, and the
// rules for creating one. It never touches the DOM (that is ui.js's job)
// and never calls localStorage directly (that is storage.js's job).

// Generates a short, unique-enough ID by combining the current time with
// a random string. Date.now() alone could repeat if two notes were
// created in the same millisecond, so the random part makes a collision
// extremely unlikely for a small app like this.
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

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

// Creates a new Note, adds it to the given notes array, and returns the
// new note. The caller is responsible for saving the updated array and
// re-rendering the UI.
export function createNote(notes, title, content, tags) {
  const note = new Note(title, content, tags);
  notes.push(note);
  return note;
}

// Removes the note with the given id from the notes array, if it exists.
export function deleteNote(notes, id) {
  const index = notes.findIndex((note) => note.id === id);
  if (index !== -1) {
    notes.splice(index, 1);
  }
}

// Sets a note's archived flag to true (archive) or false (restore).
export function updateArchivedStatus(notes, id, isArchived) {
  const note = notes.find((note) => note.id === id);
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
  const note = notes.find((note) => note.id === id);
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
