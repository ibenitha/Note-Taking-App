// ui/feedback.js
//
// Only responsibility: transient feedback to the user — the title's
// validation message, generic form field errors, toasts, and the
// confirmation modal. Nothing here decides *whether* something is
// valid or *what* to do on confirm; callers pass that in.

// --- Title validation feedback -------------------------------------------
// Only the note title field is validated (it is the assignment's one
// required field), so these work with that specific field rather than
// taking it as a parameter every time.

export function showValidationError(message) {
  const titleField = document.querySelector('[data-field="title"]');
  const errorText = document.querySelector("#title-error");

  titleField.classList.add("has-error");
  errorText.textContent = message;
}

export function clearValidationError() {
  const titleField = document.querySelector('[data-field="title"]');
  const errorText = document.querySelector("#title-error");

  titleField.classList.remove("has-error");
  errorText.textContent = "";
}

// --- Generic form field feedback (used by the auth forms) ---------------

export function showFieldError(form, fieldName, message) {
  form.querySelector(`[data-error-for="${fieldName}"]`).textContent = message;
  form.querySelector(`[data-field="${fieldName}"]`).classList.add("has-error");
}

export function clearFieldError(form, fieldName) {
  form.querySelector(`[data-error-for="${fieldName}"]`).textContent = "";
  form.querySelector(`[data-field="${fieldName}"]`).classList.remove("has-error");
}

export function clearAllFieldErrors(form) {
  form.querySelectorAll(".field-error").forEach((errorText) => {
    errorText.textContent = "";
  });
  form.querySelectorAll(".auth-input").forEach((input) => {
    input.classList.remove("has-error");
  });
}

export function showFormError(form, message) {
  form.querySelector(".form-error").textContent = message;
}

// --- Toast --------------------------------------------------------------

const TOAST_DURATION_MS = 4000;
let toastTimeoutId = null;

// Shows a brief success message, then hides it again after a few seconds.
// Calling this again while a toast is already showing replaces it and
// restarts the timer instead of stacking messages.
//
// action is optional: { label, onClick } adds a clickable link (e.g.
// "Archived Notes" after archiving a note) alongside the message.
export function showToast(message, action) {
  const toast = document.querySelector(".toast");
  const messageField = toast.querySelector(".toast-message");
  const actionLink = toast.querySelector(".toast-action-link");

  messageField.textContent = message;

  if (action) {
    actionLink.textContent = action.label;
    actionLink.hidden = false;
    // Assigning .onclick (instead of addEventListener) means each call
    // replaces the previous handler instead of piling up a new listener
    // every time a toast is shown.
    actionLink.onclick = (event) => {
      event.preventDefault();
      hideToast();
      action.onClick();
    };
  } else {
    actionLink.hidden = true;
    actionLink.onclick = null;
  }

  toast.hidden = false;
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(hideToast, TOAST_DURATION_MS);
}

export function hideToast() {
  document.querySelector(".toast").hidden = true;
  clearTimeout(toastTimeoutId);
}

// --- Confirmation modal ---------------------------------------------------
// One modal element in the HTML is reused for every confirmation (delete,
// archive, ...) instead of building a separate modal per action. Callers
// pass in the text to show; main.js decides what happens if confirmed.

// icon is the inner markup (path elements) for the modal's small icon
// square, so each action (delete, archive, ...) can show its own icon
// while reusing the same modal element.
export function showModal({ title, message, confirmLabel, isDangerous, icon }) {
  const overlay = document.querySelector(".modal-overlay");
  const titleField = document.querySelector("#modal-title");
  const messageField = document.querySelector("#modal-message");
  const confirmButton = document.querySelector(".modal-confirm-btn");
  const iconSvg = document.querySelector(".modal-icon svg");

  titleField.textContent = title;
  messageField.textContent = message;
  confirmButton.textContent = confirmLabel;
  confirmButton.classList.toggle("btn-danger", isDangerous);
  confirmButton.classList.toggle("btn-primary", !isDangerous);
  iconSvg.innerHTML = icon;

  overlay.hidden = false;
  confirmButton.focus();
}

export function hideModal() {
  document.querySelector(".modal-overlay").hidden = true;
}
