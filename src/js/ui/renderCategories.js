// ui/renderCategories.js
//
// Only responsibility: render the sidebar's category list and the note
// editor's category dropdown. Mirrors renderTags.js's structure — the
// category list is a set of clickable filter links — plus the select
// menu used to assign a category to the note currently open in the editor.

// Builds one category list item (an <a> link, same pattern as
// renderTags.js's tag links).
function createCategoryListItem(category, isActive) {
  const listItem = document.createElement("li");

  const link = document.createElement("a");
  link.href = "#";
  link.className = "category-link";
  link.dataset.categoryId = category.id;
  if (isActive) {
    link.classList.add("is-active");
    link.setAttribute("aria-current", "true");
  }

  const dot = document.createElement("span");
  dot.className = "category-dot";
  const label = document.createElement("span");
  label.textContent = category.name;

  link.append(dot, label);
  listItem.appendChild(link);
  return listItem;
}

// Renders the sidebar's category list, highlighting the category being
// filtered by (if any).
export function renderCategoryList(categories, activeCategoryId) {
  const categoryList = document.querySelector(".category-list");
  categoryList.innerHTML = "";

  if (categories.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";
    message.textContent = "Categories you create will show up here.";
    categoryList.appendChild(message);
    return;
  }

  categories.forEach((category) => {
    categoryList.appendChild(createCategoryListItem(category, category.id === activeCategoryId));
  });
}

// Fills the note editor's category <select> with "No Category" plus one
// option per category, and selects whichever one the given note has.
export function renderCategorySelect(categories, selectedCategoryId) {
  const select = document.querySelector(".category-select");
  select.innerHTML = "";

  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "No Category";
  select.appendChild(noneOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });

  select.value = selectedCategoryId || "";
}
