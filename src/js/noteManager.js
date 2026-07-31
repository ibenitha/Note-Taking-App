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
    this.tags = tags;
    this.archived = false;
    this.timestamp = new Date().toISOString();
    this.location = null;
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
  if (note) {
    note.archived = isArchived;
  }
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
