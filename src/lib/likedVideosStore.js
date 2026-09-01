// Single source of truth for which Facebook videos the visitor has "liked"
// (a local, visual-only toggle — see VideoActions in FacebookVideoCard.jsx)
// so the same video's like state stays in sync between the grid/coverflow
// card and its watch modal, instead of each keeping its own local state.
const liked = new Set();
const listeners = new Set();

export function isLiked(id) {
  return liked.has(id);
}

export function toggleLiked(id) {
  if (liked.has(id)) liked.delete(id);
  else liked.add(id);
  listeners.forEach((fn) => fn());
}

export function subscribeLiked(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
