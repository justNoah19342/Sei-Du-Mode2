// Single source of truth for whether the visitor has consented to
// non-essential embeds (currently: the Facebook video iframe, which sets
// third-party cookies once it loads). Pub/sub so any number of components
// (the banner, the video embed) can react to a decision made anywhere,
// without prop-drilling through App — same pattern as sectionRevealStore.js.
const STORAGE_KEY = "sdm-cookie-consent";

// "accepted" | "declined" | null (no decision yet — banner should show).
function readStoredConsent() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled — treat every visit as undecided
    // rather than throwing, the banner will just reappear each time.
    return null;
  }
}

let consent = readStoredConsent();
const listeners = new Set();

export function getConsent() {
  return consent;
}

export function setConsent(value) {
  consent = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore — decision still applies for the rest of this page session via
    // the in-memory `consent` value above, just won't survive a reload.
  }
  listeners.forEach((fn) => fn(consent));
}

export function subscribeConsent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
