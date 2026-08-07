// events/shareEvents.js
//
// Only responsibility: the "Share Note" button — building a shareable
// link for whichever note is open in the editor and copying it to the
// clipboard. Rendering a *received* shared link (for a visitor who
// opens one) happens in main.js's bootstrap instead, via
// ui/renderShared.js — that runs before there's even a logged-in
// session, so it can't be wired here.

import { encodeShareLink } from "../utils/shareLink.js";
import * as feedback from "../ui/feedback.js";

const shareButtons = document.querySelectorAll(".share-btn");

let core;

async function copyShareLink() {
  const note = core.getSelectedNote();
  if (!note) return;

  const link = encodeShareLink(note);
  try {
    await navigator.clipboard.writeText(link);
    feedback.showToast("Link copied to clipboard!");
  } catch (error) {
    feedback.showToast("Could not copy the link — your browser may be blocking clipboard access.");
  }
}

export function init(coreArg) {
  core = coreArg;
  shareButtons.forEach((button) => {
    button.addEventListener("click", copyShareLink);
  });
}
