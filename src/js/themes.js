// themes.js
//
// Applies the color theme and font theme by setting attributes on <html>.
// styles.css has CSS variable overrides for [data-theme="dark"] and
// [data-font="serif"/"monospace"], so all this file has to do is set the
// right attribute — it never touches localStorage (storage.js's job) or
// decides which radio button should be checked (ui.js/main.js's job).

// "system" follows the OS/browser's prefers-color-scheme setting instead
// of a fixed choice, so it needs to check that media query.
export function applyTheme(themeName) {
  if (themeName === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = prefersDark ? "dark" : "light";
  } else {
    document.documentElement.dataset.theme = themeName;
  }
}

export function applyFont(fontName) {
  document.documentElement.dataset.font = fontName;
}
