// Single source of truth for section id -> bubble/reveal color, shared by
// SectionColorBubble (which drives the scroll logic) and each section's
// SectionReveal instance (which just needs its own index + color by id).
// Order matters only for readability here — matching is by full containment,
// not by DOM order priority.
export const SECTION_COLORS = [
  { id: "start", color: "#ffffff" },
  { id: "marken", color: "#ffffff" },
  { id: "ueber-uns", color: "#FAF7F2" },
  { id: "sortiment", color: "#fcf0d4" },
  { id: "social-media", color: "#fce6b3" },
  { id: "kontakt", color: "#ffe3a1" },
  { id: "footer", color: "#ffe3a1" },
];

export function getSectionInfo(id) {
  const index = SECTION_COLORS.findIndex((s) => s.id === id);
  return { index, color: SECTION_COLORS[index]?.color };
}

// Tiny pub/sub so SectionColorBubble (which already owns the scroll listener
// and the bubble's DOM ref) can broadcast "the active section index changed"
// to any number of SectionReveal instances without prop-drilling through
// App -> Routes -> each section. No React Context needed since sections and
// the bubble are unrelated siblings in the tree.
// settledIndex tracks which section last finished growing its circle all the
// way — i.e. actually *is* its target color now, steady, not mid-transition.
// -1 (an impossible section index) as the initial value means "nothing has
// settled yet", so the bubble stays visible over Hero (index 0), which has no
// SectionReveal of its own and therefore never settles anything.
let state = { activeIndex: 0, prevIndex: 0, bubbleX: 0, bubbleY: 0, settledIndex: -1 };
const listeners = new Set();

export function getSectionRevealState() {
  return state;
}

export function publishSectionReveal(next) {
  state = { ...state, ...next };
  listeners.forEach((fn) => fn(state));
}

// Called by a SectionReveal once its own grow transition finishes — separate
// from publishSectionReveal so marking "settled" never clobbers the
// activeIndex/prevIndex/bubble coordinates from the last scroll-driven update.
export function markSectionSettled(index) {
  publishSectionReveal({ settledIndex: index });
}

export function subscribeSectionReveal(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
