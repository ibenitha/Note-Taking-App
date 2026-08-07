// utils/location.js
//
// Only responsibility: format geolocation coordinates for display.

// Rounds coordinates to 4 decimal places (about 11m of precision, plenty
// for "where was I when I wrote this") and joins them into one string.
export function formatLocation(location) {
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
}
