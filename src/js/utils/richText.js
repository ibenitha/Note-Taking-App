// utils/richText.js
//
// Only responsibility: plain-text-from-HTML conversion. Note content is
// stored as HTML now (see noteManager.js's Note.content), so search needs
// a way to match against what the user actually typed rather than raw
// markup like "<b>" or "<li>".

// A simple tag-stripper, not a full HTML parser — adequate for turning
// rich note content into a plain-text string to search against.
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ");
}
