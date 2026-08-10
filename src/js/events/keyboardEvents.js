// events/keyboardEvents.js
//
// Only responsibility: keyboard behaviour that isn't already free from
// using real <form>/<button> elements — Escape to close the modal or
// cancel editing, trapping Tab inside the open modal, and the bonus
// Arrow-key navigation through the notes list.

const modalOverlay = document.querySelector(".modal-overlay");
const modalConfirmButton = document.querySelector(".modal-confirm-btn");
const modalCancelButton = document.querySelector(".modal-cancel-btn");
const noteForm = document.querySelector(".note-detail-panel");
const notesList = document.querySelector(".notes-list");

// Escape closes the modal if one is open, otherwise cancels editing if
// focus is inside the note form — matching the assignment's keyboard
// requirement for both cases with a single listener.
function handleEscapeKey(event, core, cancelEditingSelectedNote) {
  if (event.key !== "Escape") return;

  if (!modalOverlay.hidden) {
    core.closeConfirmationModal();
    return;
  }

  if (noteForm.contains(document.activeElement)) {
    cancelEditingSelectedNote();
  }
}

// While the modal is open, Tab should only cycle between its two buttons
// instead of moving focus to whatever is behind it.
function trapTabInModal(event) {
  if (event.key !== "Tab") return;

  const focusableElements = [modalCancelButton, modalConfirmButton];
  const currentIndex = focusableElements.indexOf(document.activeElement);

  event.preventDefault();
  let nextIndex;
  if (event.shiftKey) {
    nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
  } else {
    nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
  }
  focusableElements[nextIndex].focus();
}

// Bonus: Up/Down arrow keys move between note cards, in addition to Tab.
function navigateNotesListWithArrows(event) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

  const cards = Array.from(notesList.querySelectorAll(".note-card"));
  const currentIndex = cards.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  event.preventDefault();
  const nextIndex = event.key === "ArrowDown" ? currentIndex + 1 : currentIndex - 1;
  const nextCard = cards[nextIndex];
  if (nextCard) {
    nextCard.focus();
  }
}

// core.closeConfirmationModal closes the modal; cancelEditingSelectedNote
// is noteEvents.js's action for leaving the note editor without saving —
// passed in here (rather than imported) so this file has no dependency
// on note data at all, only on "what Escape should trigger."
export function init(core, { cancelEditingSelectedNote }) {
  document.addEventListener("keydown", (event) => handleEscapeKey(event, core, cancelEditingSelectedNote));
  modalOverlay.addEventListener("keydown", trapTabInModal);
  notesList.addEventListener("keydown", navigateNotesListWithArrows);
}
