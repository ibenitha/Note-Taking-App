// events/categoryEvents.js
//
// Only responsibility: the Categories sidebar section — creating a
// custom category, filtering the notes list by one, and assigning a
// category to whichever note is open in the editor. Mirrors how tags
// are split across navigationEvents.js (filtering) and noteEvents.js
// (per-note assignment), just kept in one file here since categories
// are their own small, self-contained feature rather than touching
// those existing files' concerns.

import * as storage from "../storage/storage.js";
import * as categoryModel from "../models/category.js";
import * as renderNotes from "../ui/renderNotes.js";

const categoryList = document.querySelector(".category-list");
const addCategoryBtn = document.querySelector(".add-category-btn");
const addCategoryForm = document.querySelector(".add-category-form");
const addCategoryInput = document.querySelector(".add-category-input");
const categorySelect = document.querySelector(".category-select");

const searchInput = document.querySelector("#search-input");
const mobileSearchInput = document.querySelector("#mobile-search-input");

// Set once by init() and used by every handler function below.
let core;
let state;

// Filtering by category is mutually exclusive with a tag filter or a
// search, the same way navigationEvents.js's showTagFilter() clears
// those before applying its own filter.
function showCategoryFilter(categoryId) {
  core.discardUnsavedNewNote();
  state.searchQuery = "";
  searchInput.value = "";
  mobileSearchInput.value = "";
  state.showingArchived = false;
  state.activeTag = null;
  state.activeCategory = categoryId;
  core.selectFirstVisibleNote();
  core.renderApp();
  core.showNotesView();
}

function handleCategoryListClick(event) {
  const link = event.target.closest(".category-link");
  if (!link) return;
  event.preventDefault();
  showCategoryFilter(link.dataset.categoryId);
}

function handleAddCategoryButtonClick() {
  addCategoryForm.hidden = false;
  addCategoryInput.value = "";
  addCategoryInput.focus();
}

function handleAddCategoryFormSubmit(event) {
  event.preventDefault();
  const name = addCategoryInput.value.trim();
  if (name === "") return;

  categoryModel.createCategory(state.categories, name);
  storage.saveCategories(state.categories);
  addCategoryForm.hidden = true;
  core.renderApp();
}

// Assigning a category takes effect immediately — like adding a
// location, it shouldn't require clicking "Save Note". Mutating the
// note object directly (instead of routing through updateNote()'s
// title/content/tags updates) also means it works for a brand-new,
// still-unsaved draft note that isn't in state.notes yet.
function handleCategorySelectChange() {
  const note = core.getSelectedNote();
  if (!note) return;

  note.category = categorySelect.value || null;
  if (state.notes.includes(note)) {
    storage.saveNotes(state.notes);
  }
  renderNotes.updateNoteCard(note, state.selectedNoteId, state.categories);
}

export function init(coreArg) {
  core = coreArg;
  state = core.state;

  categoryList.addEventListener("click", handleCategoryListClick);
  addCategoryBtn.addEventListener("click", handleAddCategoryButtonClick);
  addCategoryForm.addEventListener("submit", handleAddCategoryFormSubmit);
  categorySelect.addEventListener("change", handleCategorySelectChange);
}
