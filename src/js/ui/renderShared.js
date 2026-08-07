// ui/renderShared.js
//
// Only responsibility: render a shared note's read-only view — no edit
// controls, no dependency on state.notes, just whatever payload
// utils/shareLink.js decoded out of the URL.

import { formatDate } from "../utils/date.js";

export function renderSharedNoteView(sharedNote) {
  document.querySelector(".shared-note-title").textContent = sharedNote.title;
  document.querySelector(".shared-note-date").textContent = formatDate(sharedNote.timestamp);

  const tagsContainer = document.querySelector(".shared-note-tags");
  tagsContainer.innerHTML = "";
  (sharedNote.tags || []).forEach((tag) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = tag;
    tagsContainer.appendChild(pill);
  });

  // Read-only rendering of the same rich-text HTML the editor produced —
  // safe here because it's shown, never re-edited or re-saved.
  document.querySelector(".shared-note-content").innerHTML = sharedNote.content;
}
