// auth.js
//
// This file owns the rules for the simulated account/login system: what
// counts as a valid password, and whether a login attempt matches the
// stored account. Like noteManager.js, it never touches the DOM and never
// calls localStorage directly (storage.js's job).
//
// IMPORTANT: this app has no backend. There is nowhere secure to check a
// password, so "logging in" just means comparing plain text against
// whatever was typed in during Sign Up, both stored in localStorage. This
// is fine for demonstrating the UI flow the assignment/Figma asks for, but
// it is NOT real authentication and must never be treated as secure.

export const MINIMUM_PASSWORD_LENGTH = 8;

export function isPasswordValid(password) {
  return password.length >= MINIMUM_PASSWORD_LENGTH;
}

// Builds the account object Sign Up creates. A plain object (not a class)
// is enough here — an account has no behavior of its own, just data.
export function createAccount(email, password) {
  return { email, password };
}

export function isLoginValid(account, email, password) {
  if (!account) return false;
  return account.email === email && account.password === password;
}
