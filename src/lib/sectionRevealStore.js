// Single source of truth for section id -> bubble/reveal color, shared by
// SectionColorBubble (which drives the scroll logic) and each section's
// SectionReveal instance (which just needs its own index + color by id).
// Order matters only for readability here — matching is by full containment,
// not by DOM order priority.
// Every entry is a radial gradient (own color at center fading to white at
// the edge) rather than a flat color — SectionReveal's circle just applies
// whatever's given here as `background`, so this carries each section's own
// center glow along into the flood itself instead of painting flat color and
// needing the glow layered on separately afterwards. The same string is what
// the corner bubble ends up rendering too (see bubbleBackground() in
// SectionColorBubble.jsx), so both stay visually consistent with each other.
// start/marken are still just flat white — a "white center fading to white
// edge" gradient would be indistinguishable from a flat fill anyway.
export const SECTION_COLORS = [
  { id: "start", color: "#ffffff" },
  { id: "marken", color: "#ffffff" },
  { id: "ueber-uns", color: "radial-gradient(circle at center, #FAF7F2 0%, #ffffff 100%)" },
  { id: "sortiment", color: "radial-gradient(circle at center, #fcf0d4 0%, #ffffff 100%)" },
  // Terracotta instead of Facebook's own blue so the section still reads as
  // "attention-grabbing" without competing with the brand's warm
  // amber/charcoal palette everywhere else on the page. Edge is a lighter
  // tint of the same terracotta (not white) — keeps the glow feeling like
  // it belongs to this section's own color rather than fading to a neutral.
  { id: "social-media", color: "radial-gradient(circle at center, #e89e84 0%, #efbba9 100%)" },
  { id: "kontakt", color: "radial-gradient(circle at center, #ffe3a1 0%, #ffffff 100%)" },
  // No SectionReveal is mounted for the footer (see Footer.jsx) — the flood
  // circle only ever grows over a section that actually renders one, so the
  // footer itself is never colorized. This color is only ever picked up by
  // the small corner bubble, which still switches to it (the footer's real
  // background) once it's scrolled fully inside. Edge is a lighter gray
  // (not white) for the same reason as Social Media above — a tint of the
  // section's own dark color instead of a neutral white.
  { id: "footer", color: "radial-gradient(circle at center, #2b2b2b 0%, #6b6b6b 100%)" },
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
