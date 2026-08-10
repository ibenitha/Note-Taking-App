// utils/tags.js
//
// Only responsibility: parse raw tag input text.

// Splits the tags input's comma-separated text into a clean array of tags,
// e.g. "Work, Planning" -> ["Work", "Planning"]. Trims extra spaces and
// drops empty entries (from things like a trailing comma).
export function parseTags(tagsText) {
  return tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
