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

// Every localStorage write in this file goes through here, so quota
// errors (setItem throws once storage is full) are only handled once
// instead of once per save function.
function safeSetLocalStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Could not save "${key}" to local storage:`, error);
    alert("Your changes could not be saved. Local storage may be full.");
  }
}

// Every storage read in this file goes through here to avoid duplicated
// getItem + JSON.parse + error handling boilerplate.
function getStorageItemJSON(storageArea, key) {
  const item = storageArea.getItem(key);
  if (!item) {
    return null;
  }
  try {
    return JSON.parse(item);
  } catch (error) {
    console.error(`Could not parse JSON for key "${key}":`, error);
    return null;
  }
}

// Saves the full notes array as a JSON string. localStorage can only
// store strings, so objects and arrays must be converted with
// JSON.stringify before saving, and parsed back with JSON.parse when read.
export function saveNotes(notes) {
  safeSetLocalStorageItem(NOTES_KEY, JSON.stringify(notes));
}

// Returns the saved notes array, or null if nothing has been saved yet
// (for example, the very first time the app runs in a browser).
export function loadNotes() {
  return getStorageItemJSON(localStorage, NOTES_KEY);
}

export function savePreferences(preferences) {
  safeSetLocalStorageItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function loadPreferences() {
  return getStorageItemJSON(localStorage, PREFERENCES_KEY);
}

// Drafts use sessionStorage instead of localStorage because a draft should
// only survive a page reload, not stick around forever like a saved note.
export function saveDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft() {
  return getStorageItemJSON(sessionStorage, DRAFT_KEY);
}

export function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY);
}

// The account is the one simulated user this demo supports (there is no
// backend, so there is nowhere to store more than one real account).
export function saveAccount(account) {
  safeSetLocalStorageItem(ACCOUNT_KEY, JSON.stringify(account));
}

export function loadAccount() {
  return getStorageItemJSON(localStorage, ACCOUNT_KEY);
}

// The session is just "is someone logged in right now". It uses
// localStorage (not sessionStorage) so logging in stays in effect across
// a page reload, the same way a real "remember me" session would.
export function saveSession(session) {
  safeSetLocalStorageItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession() {
  return getStorageItemJSON(localStorage, SESSION_KEY);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

