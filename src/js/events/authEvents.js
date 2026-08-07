// =====================================================
// Authentication Event Handlers
// -----------------------------------------------------
// This module controls every authentication-related user
// interaction in the application:
//
// - Login
// - Sign Up
// - Forgot Password
// - Reset Password
// - Change Password
// - Logout
//
// It only handles user events and validation. The actual
// account/session data is stored through storage.js, while
// authentication rules (like password validation) come
// from auth.js.
//
// NOTE:
// This project has no backend. Authentication is simulated
// by storing one account in localStorage and comparing the
// entered credentials against it.
// =====================================================

// Import helper modules responsible for storage,
// authentication rules, UI updates, validation,
// and user feedback.
import * as storage from "../storage/storage.js";
import * as auth from "../models/auth.js";
import * as renderAuth from "../ui/renderAuth.js";
import * as feedback from "../ui/feedback.js";
import { isRequired, isValidEmail } from "../utils/validation.js";

// Cache all DOM elements once so they can be reused
// throughout the file instead of querying the DOM
// repeatedly.
const loginForm = document.querySelector('[data-auth-form="login"]');
const signupForm = document.querySelector('[data-auth-form="signup"]');
const forgotPasswordForm = document.querySelector('[data-auth-form="forgot-password"]');
const resetPasswordForm = document.querySelector('[data-auth-form="reset-password"]');
const continueToResetWrapper = document.querySelector(".switch-to-reset-wrapper");

const switchToSignupLinks = document.querySelectorAll(".switch-to-signup");
const switchToLoginLinks = document.querySelectorAll(".switch-to-login");
const switchToResetLinks = document.querySelectorAll(".switch-to-reset");
const forgotPasswordLink = document.querySelector(".forgot-password-link");
const passwordToggleButtons = document.querySelectorAll(".password-toggle-btn");
const googleButtons = document.querySelectorAll(".google-btn");
const logoutButton = document.querySelector(".logout-btn");
const changePasswordForm = document.querySelector(".change-password-form");

// Reusable validation message so the minimum password
// length stays consistent throughout the application.
const PASSWORD_MIN_LENGTH_ERROR = `Password must be at least ${auth.MINIMUM_PASSWORD_LENGTH} characters.`;

// helper function that gets the value of any input field in a form. Instead of writing querySelector multiple times, I reuse this function
//For fields like email, I use trim to remove any accidental spaces before validation
function getFieldValue(form, fieldName, trim = false) {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  if (!field) return "";
  return trim ? field.value.trim() : field.value;
}

// Clears any previous validation errors from the form
// before checking the user's input again.
function resetFormErrors(form) {
  feedback.clearAllFieldErrors(form);
  feedback.showFormError(form, "");
}

// creates the user's session after a successful login or signup. 
// It saves the user's email in session storage and changes the page state to loggedIn so the application knows someone is authenticated
function setUserSession(email) {
  storage.saveSession({ email });
  document.body.dataset.session = "loggedIn";
}

// Shared email validation used by multiple auth forms.
// Checks that the email is provided and has a valid format.
function isEmailFieldValid(form) {
  const email = getFieldValue(form, "email", true);

  if (!isRequired(email)) {
    feedback.showFieldError(form, "email", "Email is required.");
    return false;
  }
  if (!isValidEmail(email)) {
    feedback.showFieldError(form, "email", "Please enter a valid email address.");
    return false;
  }

  feedback.clearFieldError(form, "email");
  return true;
}

// Handles the Login form submission.
// Validates the input, checks the stored account,
// creates a session if successful, and displays feedback.
function handleLoginSubmit(event) {
  event.preventDefault();
  resetFormErrors(loginForm);

  const email = getFieldValue(loginForm, "email", true);
  const password = getFieldValue(loginForm, "password");

  let isValid = isEmailFieldValid(loginForm);
  if (!password) {
    feedback.showFieldError(loginForm, "password", "Password is required.");
    isValid = false;
  }
  if (!isValid) return;

  const account = storage.loadAccount();
  if (!auth.isLoginValid(account, email, password)) {
    feedback.showFormError(loginForm, "Invalid email or password.");
    return;
  }

  setUserSession(email);
  renderAuth.resetAuthForm(loginForm);
  feedback.showToast("Welcome back!");
}
// Handles the Sign Up form submission.
// It validates the user's input, creates a new account,
// logs the user in, and shows a success message.
function handleSignupSubmit(event) {
  event.preventDefault();
  resetFormErrors(signupForm);

  const email = getFieldValue(signupForm, "email", true);
  const password = getFieldValue(signupForm, "password");

  let isValid = isEmailFieldValid(signupForm);
  if (!auth.isPasswordValid(password)) {
    feedback.showFieldError(signupForm, "password", PASSWORD_MIN_LENGTH_ERROR);
    isValid = false;
  }
  if (!isValid) return;

  // This demo supports exactly one account, so signing up again simply
  // replaces whatever account existed before.
  storage.saveAccount(auth.createAccount(email, password));
  setUserSession(email);
  renderAuth.resetAuthForm(signupForm);
  feedback.showToast("Account created!");
}

function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  resetFormErrors(forgotPasswordForm);

  if (!isEmailFieldValid(forgotPasswordForm)) return;

  const email = getFieldValue(forgotPasswordForm, "email", true);
  const account = storage.loadAccount();
  if (!account || account.email !== email) {
    feedback.showFormError(forgotPasswordForm, "No account found with that email.");
    return;
  }

  // There's no real email to send, so this reveals a link that simulates
  // clicking the one that would have arrived in a real inbox.
  continueToResetWrapper.hidden = false;
}

// Handles resetting the password.
// Validates the new password, updates the stored account,
// then sends the user back to the Login screen.
function handleResetPasswordSubmit(event) {
  event.preventDefault();
  resetFormErrors(resetPasswordForm);

  const password = getFieldValue(resetPasswordForm, "password");
  const confirmPassword = getFieldValue(resetPasswordForm, "confirm-password");

  let isValid = true;
  if (!auth.isPasswordValid(password)) {
    feedback.showFieldError(resetPasswordForm, "password", PASSWORD_MIN_LENGTH_ERROR);
    isValid = false;
  }
  if (confirmPassword !== password) {
    feedback.showFieldError(resetPasswordForm, "confirm-password", "Passwords do not match.");
    isValid = false;
  }
  if (!isValid) return;

  const account = storage.loadAccount();
  account.password = password;
  storage.saveAccount(account);

  renderAuth.resetAuthForm(resetPasswordForm);
  continueToResetWrapper.hidden = true;
  renderAuth.showAuthScreen("login");
  feedback.showToast("Password reset! Please log in.");
}

// Shared password-change logic.
// Accepts any change-password form (desktop or mobile)
// so both versions reuse the same validation and update
// process.
function submitChangePasswordForm(form) {
  resetFormErrors(form);

  const oldPassword = getFieldValue(form, "old-password");
  const newPassword = getFieldValue(form, "new-password");
  const confirmPassword = getFieldValue(form, "confirm-new-password");
  const account = storage.loadAccount();

  let isValid = true;
  if (!account || account.password !== oldPassword) {
    feedback.showFieldError(form, "old-password", "Old password is incorrect.");
    isValid = false;
  }
  if (!auth.isPasswordValid(newPassword)) {
    feedback.showFieldError(form, "new-password", PASSWORD_MIN_LENGTH_ERROR);
    isValid = false;
  }
  if (confirmPassword !== newPassword) {
    feedback.showFieldError(form, "confirm-new-password", "Passwords do not match.");
    isValid = false;
  }
  if (!isValid) return;

  account.password = newPassword;
  storage.saveAccount(account);
  renderAuth.resetAuthForm(form);
  feedback.showToast("Password changed successfully!");
}
// Keeps track of how many change-password forms have been set up.
// This helps give each form a unique ID, especially when the mobile
// version is created by cloning the desktop form.
let changePasswordFormInstanceCount = 0;

// Sets up everything the Change Password form needs to work:
// unique IDs, accessibility attributes, password visibility buttons,
// and the form submission event.
export function wireChangePasswordForm(form) {

  changePasswordFormInstanceCount += 1;
  const instanceId = changePasswordFormInstanceCount;

  form.querySelectorAll("[data-field]").forEach((input) => {
    const uniqueId = `change-password-${instanceId}-${input.dataset.field}`;

    const label = form.querySelector(`label[for="${input.id}"]`);
    input.id = uniqueId;
    if (label) {
      label.setAttribute("for", uniqueId);
    }

    // Connect each input to its hint and error message so
    // screen readers can announce them correctly.
    const errorEl = form.querySelector(`[data-error-for="${input.dataset.field}"]`);
    if (!errorEl) return;

    errorEl.id = `${uniqueId}-error`;
    const describedBy = [errorEl.id];

    const hintEl = errorEl.previousElementSibling;
    if (hintEl && hintEl.classList.contains("field-hint")) {
      hintEl.id = `${uniqueId}-hint`;
      describedBy.unshift(hintEl.id);
    }

    input.setAttribute("aria-describedby", describedBy.join(" "));
  });

  form.querySelectorAll(".password-toggle-btn").forEach((button) => {
    button.addEventListener("click", () => renderAuth.togglePasswordVisibility(button));
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitChangePasswordForm(form);
  });
}

function handleLogout(core) {
  storage.clearSession();
  document.body.dataset.session = "loggedOut";
  renderAuth.showAuthScreen("login");
  core.showNotesView();
}

// Sets up all the event listeners needed for the authentication features, including form submissions, email validation, navigation between authentication screens, password visibility, Google sign-in placeholder, logout, and the Change Password form.
// After init() runs, all the authentication features are ready to respond to user actions
export function init(core) {
  // Handle submissions for each authentication form.
  loginForm.addEventListener("submit", handleLoginSubmit);
  signupForm.addEventListener("submit", handleSignupSubmit);
  forgotPasswordForm.addEventListener("submit", handleForgotPasswordSubmit);
  resetPasswordForm.addEventListener("submit", handleResetPasswordSubmit);

  // Validate each form's email field as soon as it's blurred, not just on
  // submit — the same pattern already used for the note title field.
  [loginForm, signupForm, forgotPasswordForm].forEach((form) => {
    form.querySelector('[data-field="email"]').addEventListener("blur", () => isEmailFieldValid(form));
  });

  // Switch from the login screen to the sign-up screen.
  switchToSignupLinks.forEach((link) => {
    link.addEventListener("click", () => renderAuth.showAuthScreen("signup"));
  });

  switchToLoginLinks.forEach((link) => {
    link.addEventListener("click", () => renderAuth.showAuthScreen("login"));
  });

  switchToResetLinks.forEach((link) => {
    link.addEventListener("click", () => renderAuth.showAuthScreen("reset-password"));
  });

  forgotPasswordLink.addEventListener("click", () => renderAuth.showAuthScreen("forgot-password"));

  passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => renderAuth.togglePasswordVisibility(button));
  });

  googleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      feedback.showToast("Google sign-in isn't available in this demo.");
    });
  });
  // Handle user logout.
  logoutButton.addEventListener("click", () => handleLogout(core));
  // Set up the Change Password form.
  wireChangePasswordForm(changePasswordForm);
}
