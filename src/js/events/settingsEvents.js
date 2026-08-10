// events/settingsEvents.js
//
// Only responsibility: the Settings page — choosing and applying a color
// theme or font theme, and switching between Settings' own sub-sections
// (Color Theme / Font Theme / Change Password) on both desktop and
// mobile. It reuses authEvents.js's password-form wiring for the
// "Change Password" section instead of duplicating it, since Settings
// doesn't own password rules itself.

import * as storage from "../storage/storage.js";
import * as themes from "../themes/themes.js";
import * as feedback from "../ui/feedback.js";
import { wireChangePasswordForm } from "./authEvents.js";
import { wireDataPanel } from "./dataEvents.js";

// Matches the "@media (min-width: 1200px)" desktop breakpoint in styles.css.
// Narrow desktops and tablets use the single-panel Settings flow.
const DESKTOP_BREAKPOINT_PX = 1200;

const settingsNav = document.querySelector(".settings-nav");
const settingsSections = document.querySelectorAll(".settings-section");
const settingsNavItems = document.querySelectorAll(".settings-nav-item");
const colorThemeRadios = document.querySelectorAll('input[name="color-theme"]');
const fontThemeRadios = document.querySelectorAll('input[name="font-theme"]');
const applyThemeButton = document.querySelector(".apply-theme-btn");
const applyFontButton = document.querySelector(".apply-font-btn");
const mobileSettingsBackButton = document.querySelector(".mobile-settings-back-btn");
const mobileSettingsSubContent = document.querySelector(".mobile-settings-sub-content");

// Set once by init() — needed so the mobile-cloned "Data" panel can be
// wired to the same shared state/render function as the desktop one.
let core;

function getCheckedRadioValue(radios) {
  const checkedRadio = Array.from(radios).find((radio) => radio.checked);
  return checkedRadio ? checkedRadio.value : null;
}

function applySelectedTheme() {
  const theme = getCheckedRadioValue(colorThemeRadios);
  if (!theme) return;

  themes.applyTheme(theme);
  storage.savePreferences({ theme, font: getCheckedRadioValue(fontThemeRadios) });
  feedback.showToast("Settings updated successfully!");
}

function applySelectedFont() {
  const font = getCheckedRadioValue(fontThemeRadios);
  if (!font) return;

  themes.applyFont(font);
  storage.savePreferences({ theme: getCheckedRadioValue(colorThemeRadios), font });
  feedback.showToast("Settings updated successfully!");
}

// Re-checks a cloned radio group to match the currently-applied value, and
// re-wires its "change" listeners — clones lose both their checked state
// and their name-based grouping with the original (unwired) radios.
function syncClonedRadioGroup(radioName, currentValue) {
  mobileSettingsSubContent.querySelectorAll(`input[name="${radioName}"]`).forEach((radio) => {
    radio.checked = radio.value === currentValue;
    radio.addEventListener("change", () => {
      document.querySelectorAll(`input[name="${radioName}"]`).forEach((r) => {
        r.checked = r.value === radio.value;
      });
    });
  });
}

// Show a mobile settings sub-panel by cloning the matching fieldset into
// the mobile sub-panel container and re-wiring its controls — clones
// lose event listeners, so each control needs wiring again here.
function showMobileSettingsSubPanel(sectionKey) {
  const source = document.querySelector(`.settings-section[data-settings-panel="${sectionKey}"]`);
  if (!source) return;

  mobileSettingsSubContent.innerHTML = "";

  // Add a heading that mirrors the fieldset legend
  const title = document.createElement("h1");
  title.className = "panel-title";
  title.textContent = source.querySelector("legend").textContent;
  mobileSettingsSubContent.appendChild(title);

  // Clone the hint + options/form (everything after the legend)
  Array.from(source.children).forEach((child) => {
    if (child.tagName !== "LEGEND") {
      mobileSettingsSubContent.appendChild(child.cloneNode(true));
    }
  });

  syncClonedRadioGroup("color-theme", document.documentElement.dataset.theme || "light");
  syncClonedRadioGroup("font-theme", document.documentElement.dataset.font || "sans-serif");

  const applyCloneTheme = mobileSettingsSubContent.querySelector(".apply-theme-btn");
  if (applyCloneTheme) applyCloneTheme.addEventListener("click", applySelectedTheme);

  const applyCloneFont = mobileSettingsSubContent.querySelector(".apply-font-btn");
  if (applyCloneFont) applyCloneFont.addEventListener("click", applySelectedFont);

  const clonedPasswordForm = mobileSettingsSubContent.querySelector(".change-password-form");
  if (clonedPasswordForm) {
    wireChangePasswordForm(clonedPasswordForm);
  }

  if (sectionKey === "data") {
    wireDataPanel(mobileSettingsSubContent, core);
  }

  document.body.dataset.appView = "settings";
  document.body.dataset.mobileSettingsView = "sub";
}

export function init(coreArg) {
  core = coreArg;
  // Settings nav items — on mobile navigate to a sub-panel; on desktop
  // just switch which section is visible.
  settingsNav.addEventListener("click", (event) => {
    const clickedItem = event.target.closest(".settings-nav-item");
    if (!clickedItem) return;
    if (!clickedItem.dataset.settingsSection) return;

    const targetSection = clickedItem.dataset.settingsSection;
    const isMobile = window.innerWidth < DESKTOP_BREAKPOINT_PX;

    if (isMobile) {
      showMobileSettingsSubPanel(targetSection);
    } else {
      settingsNavItems.forEach((item) => {
        const isActive = item === clickedItem;
        item.classList.toggle("is-active", isActive);
        if (isActive) {
          item.setAttribute("aria-current", "page");
        } else {
          item.removeAttribute("aria-current");
        }
      });
      settingsSections.forEach((section) => {
        section.hidden = section.dataset.settingsPanel !== targetSection;
      });
    }
  });

  mobileSettingsBackButton.addEventListener("click", () => {
    delete document.body.dataset.mobileSettingsView;
    document.body.dataset.appView = "settings";
  });

  applyThemeButton.addEventListener("click", applySelectedTheme);
  applyFontButton.addEventListener("click", applySelectedFont);
}
