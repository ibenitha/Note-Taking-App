// utils/shareLink.js
//
// Only responsibility: turning a note into a shareable link and back.
// There's no backend to register a share id against, so the link has to
// be "unique" and self-contained on its own — the note's data travels
// inside the URL itself (base64, in a query param), which is also what
// makes it actually work when opened on a different device or browser,
// not just the one that created it.

const SHARE_PARAM = "share";

// Builds an absolute, shareable URL for the given note. Encoding a note's
// own id/title/content/tags/timestamp makes every link's payload
// different — the "unique" part of "unique shareable links" comes for
// free from the note's own content, without needing a server-side
// registry of share ids.
export function encodeShareLink(note) {
  const payload = {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.tags,
    timestamp: note.timestamp,
  };

  const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));

  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_PARAM, encoded);
  return url.toString();
}

// Reads a share payload back out of a URL's query string (e.g.
// window.location.search). Returns null if there is no share param, or
// if it doesn't decode to valid note data — callers treat both the same
// way: "this isn't a shared-note link."
export function decodeShareLink(search) {
  const params = new URLSearchParams(search);
  const encoded = params.get(SHARE_PARAM);
  if (!encoded) return null;

  try {
    const payload = JSON.parse(decodeURIComponent(atob(encoded)));
    if (typeof payload.title !== "string" || typeof payload.content !== "string") {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}
