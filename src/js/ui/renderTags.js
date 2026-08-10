// ui/renderTags.js
//
// Only responsibility: render the sidebar's tag list.

import { createTagIcon } from "./icons.js";

// Builds one tag list item (anchor link for desktop, button for mobile).
export function createTagListItem(tag, options = {}) {
  const { isButton = false, isActive = false } = options;
  const listItem = document.createElement("li");

  const element = document.createElement(isButton ? "button" : "a");
  if (!isButton) {
    element.href = "#";
  }
  element.className = isButton ? "mobile-tag-list-item" : "tag-link";
  element.dataset.tag = tag;
  if (isActive) {
    element.classList.add("is-active");
    element.setAttribute("aria-current", "true");
  }

  const label = document.createElement("span");
  label.textContent = tag;

  element.append(createTagIcon(), label);
  listItem.appendChild(element);
  return listItem;
}

// Renders the sidebar's tag list from whatever tags currently exist on
// the notes, highlighting the tag being filtered by (if any).
export function renderTagList(tags, activeTag) {
  const tagList = document.querySelector(".tag-list");
  tagList.innerHTML = "";

  if (tags.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";
    message.textContent = "Tags you add to notes will show up here.";
    tagList.appendChild(message);
    return;
  }

  tags.forEach((tag) => {
    tagList.appendChild(createTagListItem(tag, { isActive: tag === activeTag }));
  });
}

// Renders the mobile tags list page.
export function renderMobileTagList(container, tags) {
  container.innerHTML = "";

  if (tags.length === 0) {
    const message = document.createElement("li");
    message.className = "empty-state";
    message.textContent = "No tags yet. Add tags to your notes to see them here.";
    container.appendChild(message);
    return;
  }

  tags.forEach((tag) => {
    container.appendChild(createTagListItem(tag, { isButton: true }));
  });
}
