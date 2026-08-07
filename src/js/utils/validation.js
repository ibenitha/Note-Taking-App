// utils/validation.js
//
// Only responsibility: reusable, DOM-free validation checks (plain string
// in, boolean out). Reading form fields and showing error messages is the
// job of the events/ and ui/ modules that call these.

export function isRequired(value) {
  return value.trim().length > 0;
}

// A simple, readable check: something, then "@", then something, then a
// "." then something — not full RFC 5322 compliance, just enough to catch
// obvious typos like a missing "@" or a missing dot before the domain.
// The browser's native checkValidity() for type="email" turned out to be
// too permissive for this (it accepts "email@examplecom", no dot needed).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
}
