// storage.js
//
// This is the only file in the app that talks to localStorage and
// sessionStorage directly. Every other file asks storage.js to save or
// load something instead of calling localStorage/sessionStorage itself.
// That way, if we ever needed to change how data is stored, only this
// file would need to change.

const NOTES_KEY = "notes";
const PREFERENCES_KEY = "preferences";
const DRAFT_KEY = "noteDraft";
const ACCOUNT_KEY = "account";
const SESSION_KEY = "session";

// Saves the full notes array as a JSON string. localStorage can only
// store strings, so objects and arrays must be converted with
// JSON.stringify before saving, and parsed back with JSON.parse when read.
export function saveNotes(notes) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    // setItem throws if storage is full (its quota has been exceeded).
    console.error("Could not save notes:", error);
    alert("Your changes could not be saved. Local storage may be full.");
  }
}

// Returns the saved notes array, or null if nothing has been saved yet
// (for example, the very first time the app runs in a browser).
export function loadNotes() {
  const savedNotes = localStorage.getItem(NOTES_KEY);
  if (!savedNotes) {
    return null;
  }
  return JSON.parse(savedNotes);
}

export function savePreferences(preferences) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function loadPreferences() {
  const savedPreferences = localStorage.getItem(PREFERENCES_KEY);
  if (!savedPreferences) {
    return null;
  }
  return JSON.parse(savedPreferences);
}

// Drafts use sessionStorage instead of localStorage because a draft should
// only survive a page reload, not stick around forever like a saved note.
export function saveDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  const savedDraft = sessionStorage.getItem(DRAFT_KEY);
  if (!savedDraft) {
    return null;
  }
  return JSON.parse(savedDraft);
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

// The account is the one simulated user this demo supports (there is no
// backend, so there is nowhere to store more than one real account).
export function saveAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function loadAccount() {
  const savedAccount = localStorage.getItem(ACCOUNT_KEY);
  if (!savedAccount) {
    return null;
  }
  return JSON.parse(savedAccount);
}

// The session is just "is someone logged in right now". It uses
// localStorage (not sessionStorage) so logging in stays in effect across
// a page reload, the same way a real "remember me" session would.
export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession() {
  const savedSession = localStorage.getItem(SESSION_KEY);
  if (!savedSession) {
    return null;
  }
  return JSON.parse(savedSession);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
