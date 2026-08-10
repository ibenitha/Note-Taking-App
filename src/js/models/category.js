// models/category.js
//
// Owns the category list itself: creating custom categories and looking
// them up by id. Notes only ever store a category's id (see
// noteManager.js's `category` field on Note) — this file is the single
// source of truth for what that id means, the same relationship
// noteManager.js has with tags, just as its own managed list instead of
// freeform per-note strings.

import { generateId } from "../utils/id.js";

export class Category {
  constructor(name) {
    this.id = generateId();
    this.name = name;
  }
}

// Creates a new category, adds it to the given list, and returns it —
// same shape as noteManager.js's createNote().
export function createCategory(categories, name) {
  const category = new Category(name);
  categories.push(category);
  return category;
}

export function findCategoryById(categories, id) {
  return categories.find((category) => category.id === id) || null;
}
