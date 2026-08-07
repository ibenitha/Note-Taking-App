// ui/renderAuth.js
//
// Only responsibility: the login/signup/forgot-password/reset-password
// screens — which one is visible, resetting a form back to blank, and
// the password show/hide toggle. Every function here takes the <form>
// it applies to as a parameter instead of guessing which one is
// currently visible, so there is no hidden dependency on screen state.

import { EYE_ICON_PATHS, EYE_OFF_ICON_PATHS } from "./icons.js";
import { clearAllFieldErrors, showFormError } from "./feedback.js";

// Shows the one auth screen matching screenName ("login", "signup",
// "forgot-password", "reset-password") and hides the other three.
export function showAuthScreen(screenName) {
  document.querySelectorAll(".auth-screen").forEach((screen) => {
    screen.hidden = screen.dataset.authScreen !== screenName;
  });
}

// Resets a form back to a blank, error-free state — used when switching
// away from an auth screen so old input/errors don't linger if the user
// comes back to it later.
export function resetAuthForm(form) {
  form.reset();
  clearAllFieldErrors(form);
  showFormError(form, "");
}

// The toggle button always sits right after its input in the markup
// (see index.html's .password-field), so this needs no extra lookup.
export function togglePasswordVisibility(toggleButton) {
  const input = toggleButton.previousElementSibling;
  const isCurrentlyPassword = input.type === "password";

  input.type = isCurrentlyPassword ? "text" : "password";
  toggleButton.setAttribute("aria-label", isCurrentlyPassword ? "Hide password" : "Show password");
  toggleButton.querySelector("svg").innerHTML = isCurrentlyPassword ? EYE_OFF_ICON_PATHS : EYE_ICON_PATHS;
}
