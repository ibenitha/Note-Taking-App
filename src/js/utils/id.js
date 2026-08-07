// utils/id.js
//
// Only responsibility: generate unique note IDs.

// Combines the current time with a random string. Date.now() alone could
// repeat if two notes were created in the same millisecond, so the random
// part makes a collision extremely unlikely for a small app like this.
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
