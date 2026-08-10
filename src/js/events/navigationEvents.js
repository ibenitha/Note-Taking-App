// events/navigationEvents.js
//
// Only responsibility: moving between views — All Notes, Archived Notes,
// a tag filter, search (desktop and mobile), and opening Settings. It
// changes *which* notes are visible and asks the shared core to
// re-render; it never edits note data itself (that's noteEvents.js).
//
// Returns { showAllNotes, showArchivedNotes } so noteEvents.js's "Note
// archived" / "Note restored" toasts can link back to the matching view
// without noteEvents.js needing to know how navigation is implemented.

import * as noteManager from "../models/noteManager.js";
import * as renderNotes from "../ui/renderNotes.js";
import * as renderTags from "../ui/renderTags.js";

const tagList = document.querySelector(".tag-list");
const searchForm = document.querySelector(".header-search");
const searchInput = document.querySelector("#search-input");
const searchClearButton = document.querySelector(".header-search .search-clear-btn");

const mobileSearchButton = document.querySelector(".mobile-search-btn");
const mobileSearchInput = document.querySelector("#mobile-search-input");
const mobileSearchClearButton = document.querySelector(".mobile-search-field .search-clear-btn");
const mobileSearchSubtitle = document.querySelector(".mobile-search-subtitle");
const mobileSearchResultsList = document.querySelector(".mobile-search-results");

const mobileTagsButton = document.querySelector(".mobile-tags-btn");
const mobileTagsList = document.querySelector(".mobile-tags-list");
const mobileTagBackButton = document.querySelector(".mobile-tag-back-btn");
const mobileTagDetailTitle = document.querySelector(".mobile-tag-detail-title strong");
const mobileTagDetailSubtitle = document.querySelector(".mobile-tag-detail-subtitle");
const mobileTagDetailList = document.querySelector(".mobile-tag-detail-list");

const homeNavButton = document.querySelector(".home-nav-btn");
const allNotesLink = document.querySelector(".all-notes-link");
const archivedNotesLinks = document.querySelectorAll(".archived-notes-link");
const settingsButton = document.querySelector(".settings-btn");
const settingsNavButton = document.querySelector(".settings-nav-btn");

// Set once by init() and used by every handler function below.
let core;
let state;

// Clears the search box itself (not just the searchQuery state) so the
// nav actions below always leave the app in a consistent state.
function clearSearch() {
  state.searchQuery = "";
  searchInput.value = "";
}

function showAllNotes() {
  core.discardUnsavedNewNote();
  clearSearch();
  state.showingArchived = false;
  state.activeTag = null;
  state.activeCategory = null;
  core.selectFirstVisibleNote();
  core.renderApp();
  core.showNotesView();
}

function showArchivedNotes() {
  core.discardUnsavedNewNote();
  clearSearch();
  state.showingArchived = true;
  state.activeTag = null;
  state.activeCategory = null;
  core.selectFirstVisibleNote();
  core.renderApp();
  core.showNotesView();
}

// A tag filter and a category filter are mutually exclusive views (see
// categoryEvents.js's showCategoryFilter, which likewise clears activeTag),
// so selecting a tag here always clears any active category.
function showTagFilter(tag) {
  core.discardUnsavedNewNote();
  clearSearch();
  state.showingArchived = false;
  state.activeTag = tag;
  state.activeCategory = null;
  core.selectFirstVisibleNote();
  core.renderApp();
  core.showNotesView();
}

function handleSearchInput() {
  core.discardUnsavedNewNote();
  state.searchQuery = searchInput.value.trim();
  searchClearButton.hidden = searchInput.value === "";
  core.selectFirstVisibleNote();
  core.renderApp();
}

// The clear ("x") button that appears once there's something typed. It's
// a real, focusable <button> (not the browser's own <input type="search">
// cancel icon, which can't reliably be reached with the keyboard) — see
// index.html and styles.css for the rest of that swap.
function handleSearchClear() {
  searchInput.value = "";
  handleSearchInput();
  searchInput.focus();
}

function showMobileSearch() {
  state.searchQuery = "";
  mobileSearchInput.value = "";
  mobileSearchClearButton.hidden = true;
  mobileSearchSubtitle.textContent = "";
  mobileSearchResultsList.innerHTML = "";
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "search";
  delete document.body.dataset.mobileSettingsView;
  renderNotes.setActiveNav("search");
  mobileSearchInput.focus();
}

// Mobile search page — renders live results into the mobile search results list.
function handleMobileSearchInput() {
  const query = mobileSearchInput.value.trim();
  state.searchQuery = query;
  mobileSearchClearButton.hidden = mobileSearchInput.value === "";
  mobileSearchResultsList.innerHTML = "";

  if (query === "") {
    mobileSearchSubtitle.textContent = "";
    return;
  }

  const results = noteManager.searchNotes(state.notes, query);
  mobileSearchSubtitle.textContent = results.length > 0
    ? `All notes matching "${query}" are displayed below.`
    : `No notes found for "${query}".`;

  if (results.length === 0) return;

  results.forEach((note) => {
    mobileSearchResultsList.appendChild(renderNotes.createNoteCard(note, state.selectedNoteId, state.categories));
  });
}

// Selecting a note from either mobile list works the same way as the
// desktop notes list: load it into the detail form and switch views. An
// unsaved draft is never rendered in these lists, so any note opened here
// is always a different, already-saved note — always safe to discard.
function openNoteFromMobileList(noteId) {
  core.selectNoteAndOpenDetail(noteId);
}

// Renders the mobile Tags list page.
function renderMobileTagsList() {
  const tags = noteManager.getUniqueTags(state.notes);
  renderTags.renderMobileTagList(mobileTagsList, tags);
}

// Shows the mobile tag detail panel for the given tag.
function showMobileTagDetail(tag) {
  state.activeTag = tag;
  state.activeCategory = null;
  state.showingArchived = false;
  const tagged = noteManager.filterByTag(state.notes.filter((n) => !n.archived), tag);
  mobileTagDetailTitle.textContent = tag;
  mobileTagDetailSubtitle.textContent = `All notes with the "${tag}" tag are shown here.`;
  mobileTagDetailList.innerHTML = "";
  tagged.forEach((note) => {
    mobileTagDetailList.appendChild(renderNotes.createNoteCard(note, state.selectedNoteId, state.categories));
  });
  renderNotes.setActiveNav("tags");
  document.body.dataset.mobileView = "tag-detail";
}

// --- Event listener callbacks (kept separate from init() so init() stays
// a short list of wiring, not a long block of listener bodies) -----------

function handleTagListClick(event) {
  const clickedLink = event.target.closest(".tag-link");
  if (!clickedLink) return;

  event.preventDefault();
  showTagFilter(clickedLink.dataset.tag);
}

function handleMobileSearchButtonClick(event) {
  event.preventDefault();
  showMobileSearch();
}

function handleMobileSearchClear() {
  mobileSearchInput.value = "";
  handleMobileSearchInput();
  mobileSearchInput.focus();
}

function handleMobileTagsButtonClick(event) {
  event.preventDefault();
  renderMobileTagsList();
  document.body.dataset.appView = "notes";
  document.body.dataset.mobileView = "tags";
  delete document.body.dataset.mobileSettingsView;
  renderNotes.setActiveNav("tags");
}

function handleMobileTagsListClick(event) {
  const btn = event.target.closest(".mobile-tag-list-item");
  if (!btn) return;
  showMobileTagDetail(btn.dataset.tag);
}

// Same event delegation pattern as the desktop notes list: one listener
// on each <ul> handles clicks on any note card it currently contains.
function handleMobileNoteCardClick(event) {
  const clickedCard = event.target.closest(".note-card");
  if (!clickedCard) return;
  openNoteFromMobileList(clickedCard.dataset.noteId);
}

function handleMobileTagBackButtonClick() {
  state.activeTag = null;
  renderMobileTagsList();
  document.body.dataset.mobileView = "tags";
  renderNotes.setActiveNav("tags");
}

function handleHomeNavClick(event) {
  event.preventDefault();
  showAllNotes();
}

function handleArchivedNotesLinkClick(event) {
  event.preventDefault();
  showArchivedNotes();
}

function handleSettingsNavButtonClick(event) {
  event.preventDefault(); // this is an <a href="#">, so stop the page jumping to the top
  core.showSettingsView();
}

export function init(coreArg) {
  core = coreArg;
  state = core.state;

  // Event delegation: one listener on the <ul> handles clicks on any tag
  // link, however many tags there are.
  tagList.addEventListener("click", handleTagListClick);

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault(); // search happens live as you type; Enter shouldn't reload the page
  });
  searchInput.addEventListener("input", handleSearchInput);
  searchClearButton.addEventListener("click", handleSearchClear);

  mobileSearchButton.addEventListener("click", handleMobileSearchButtonClick);
  mobileSearchInput.addEventListener("input", handleMobileSearchInput);
  mobileSearchClearButton.addEventListener("click", handleMobileSearchClear);

  mobileTagsButton.addEventListener("click", handleMobileTagsButtonClick);
  mobileTagsList.addEventListener("click", handleMobileTagsListClick);
  mobileTagBackButton.addEventListener("click", handleMobileTagBackButtonClick);

  mobileSearchResultsList.addEventListener("click", handleMobileNoteCardClick);
  mobileTagDetailList.addEventListener("click", handleMobileNoteCardClick);

  homeNavButton.addEventListener("click", handleHomeNavClick);
  allNotesLink.addEventListener("click", handleHomeNavClick);
  archivedNotesLinks.forEach((link) => {
    link.addEventListener("click", handleArchivedNotesLinkClick);
  });

  // Settings is a second top-level view. Switching between "notes" and
  // "settings" just changes an attribute on <body>; styles.css decides
  // what to show or hide based on that attribute.
  settingsButton.addEventListener("click", core.showSettingsView);
  settingsNavButton.addEventListener("click", handleSettingsNavButtonClick);

  return { showAllNotes, showArchivedNotes };
}
