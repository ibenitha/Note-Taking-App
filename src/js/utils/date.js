// utils/date.js
//
// Only responsibility: format dates for display.

// Turns an ISO date string (e.g. "2024-10-29T10:00:00.000Z") into the
// short display format used throughout the design, e.g. "29 Oct 2024".
export function formatDate(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
