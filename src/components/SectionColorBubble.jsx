import { useLayoutEffect, useRef, useState } from "react";
import Bubble from "./Bubble";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { SECTION_COLORS, markSectionSettled, publishSectionReveal } from "../lib/sectionRevealStore";
import styles from "./SectionColorBubble.module.css";

const BUBBLE_SIZE_DESKTOP = 140;
const BUBBLE_SIZE_MOBILE = 90;

// Footer has no SectionReveal mounted (see sectionRevealStore.js), so nothing
// ever calls markSectionSettled for it — left alone, the bubble would stay
// visible for the entire footer instead of briefly showing and then hiding
// like it does over every other section. Fake that same "settled" moment
// here after a delay matching SectionReveal's own grow transition (650ms,
// see SectionReveal.module.css) so the footer behaves consistently.
const FOOTER_SETTLE_DELAY = 650;

function readCssPx(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

// Turns a flat section color into the soft glossy-sphere look (lighter
// highlight fading to the base color) — a section whose own color is
// already a gradient (currently just Social Media's) is left as-is rather
// than trying to lighten a gradient string.
function lighten(hex, amount) {
  const num = parseInt(hex.replace("#", ""), 16);
  const mix = (channel) => Math.round(channel + (255 - channel) * amount);
  const r = mix((num >> 16) & 255);
  const g = mix((num >> 8) & 255);
  const b = mix(num & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function bubbleBackground(color) {
  if (color.includes("gradient(")) return color;
  return `radial-gradient(circle at 35% 30%, ${lighten(color, 0.55)} 0%, ${color} 100%)`;
}

function rectsOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// What counts as "an element" the bubble can visibly sit on top of — actual
// foreground content, not the plain section background it floats over most
// of the time.
const CONTENT_SELECTOR = 'h1, h2, h3, h4, p, a, button, img, video, [class*="card" i]';

export default function SectionColorBubble() {
  const wrapperRef = useRef(null);
  const [color, setColor] = useState(SECTION_COLORS[0].color);
  const isMobile = useMediaQuery("(max-width: 599px)");

  // Dimmed while the bubble's own on-screen rect actually overlaps a piece
  // of foreground content (heading, card, image, ...) — recomputed every
  // scroll/resize tick in update() below, not tied to the section-settle
  // timing used for the reveal-circle animation.
  const [isDimmed, setIsDimmed] = useState(false);
  // Fully hidden (not just dimmed) over the map specifically — its own
  // colors/markers need to read clearly, so a translucent bubble sitting on
  // top of it is worse than no bubble at all there.
  const [isOverMap, setIsOverMap] = useState(false);

  const activeIndexRef = useRef(0);
  const footerSettleTimeoutRef = useRef(null);
  // margin/headerOffset only ever change when the mobile breakpoint flips or
  // the page is resized (both already re-run measure() below) — reading them
  // via getComputedStyle on every single scroll event was pure waste and,
  // combined with the getBoundingClientRect reads right after, forced a
  // synchronous layout recalculation on every scroll tick (see rafId below).
  const metricsRef = useRef({ margin: 0, headerOffset: 0 });

  useLayoutEffect(() => {
    const measureStaticMetrics = () => {
      metricsRef.current = {
        margin: readCssPx(isMobile ? "--space-3" : "--space-5"),
        headerOffset: readCssPx("--announcement-height") + readCssPx("--mobile-header-height"),
      };
    };

    const update = () => {
      const bubbleEl = wrapperRef.current;
      if (!bubbleEl) return;

      // Vertical position tracks overall page scroll progress: at the top of
      // the page it sits at its usual top offset, at the bottom of the page
      // it sits the mirrored distance up from the viewport's bottom edge,
      // moving linearly with scrollY in between (so "middle of the page"
      // puts it roughly mid-viewport). Set before reading bubbleRect below
      // so the section-containment check further down uses the bubble's
      // actual on-screen position for this frame, not last frame's.
      const { margin, headerOffset } = metricsRef.current;
      const bubbleSize = isMobile ? BUBBLE_SIZE_MOBILE : BUBBLE_SIZE_DESKTOP;
      const topOffset = headerOffset + margin;
      const bottomOffset = margin;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      const travel = Math.max(0, window.innerHeight - bubbleSize - topOffset - bottomOffset);
      bubbleEl.style.top = `${topOffset + progress * travel}px`;

      const bubbleRect = bubbleEl.getBoundingClientRect();
      let touchingContent = false;

      const mapEl = document.querySelector("[data-map]");
      setIsOverMap(!!mapEl && rectsOverlap(bubbleRect, mapEl.getBoundingClientRect()));

      for (let i = 0; i < SECTION_COLORS.length; i += 1) {
        const { id, color: sectionColor } = SECTION_COLORS[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Only switch once the bubble sits fully inside the new section —
        // i.e. it's no longer overlapping the section before it, per the
        // "don't change until fully in the new section" requirement.
        if (rect.top <= bubbleRect.top && rect.bottom >= bubbleRect.bottom) {
          setColor((current) => (current === sectionColor ? current : sectionColor));

          // Only checked within the section the bubble is currently inside —
          // content from a section it's no longer over shouldn't count.
          for (const contentEl of el.querySelectorAll(CONTENT_SELECTOR)) {
            const contentRect = contentEl.getBoundingClientRect();
            if (contentRect.width === 0 || contentRect.height === 0) continue;
            if (rectsOverlap(bubbleRect, contentRect)) {
              touchingContent = true;
              break;
            }
          }

          // Drives SectionReveal's circular reveal — kept independent of the
          // color dedup above, since two adjacent sections can legitimately
          // share a color (e.g. "start"/"marken" are both white) while still
          // being distinct geometric sections that each need their own
          // reveal/un-reveal.
          if (i !== activeIndexRef.current) {
            publishSectionReveal({
              activeIndex: i,
              prevIndex: activeIndexRef.current,
              bubbleX: bubbleRect.left + bubbleRect.width / 2,
              bubbleY: bubbleRect.top + bubbleRect.height / 2,
            });
            activeIndexRef.current = i;

            if (footerSettleTimeoutRef.current) {
              clearTimeout(footerSettleTimeoutRef.current);
              footerSettleTimeoutRef.current = null;
            }
            if (id === "footer") {
              footerSettleTimeoutRef.current = setTimeout(() => {
                markSectionSettled(i);
                footerSettleTimeoutRef.current = null;
              }, FOOTER_SETTLE_DELAY);
            }
          }
          break;
        }
      }

      setIsDimmed(touchingContent);
    };

    // Scroll fires far more often than the browser can usefully repaint —
    // running the full measure-and-branch work synchronously inside the
    // event handler (as this used to) forces a layout recalculation on every
    // single event, which is what made scrolling feel janky on slower
    // Android devices. Coalescing to one rAF-scheduled run per frame keeps
    // the layout reads/writes batched with the browser's own render cycle
    // instead of fighting it.
    let rafId = null;
    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    const onResize = () => {
      measureStaticMetrics();
      onScrollOrResize();
    };

    measureStaticMetrics();
    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onResize);
      if (footerSettleTimeoutRef.current) clearTimeout(footerSettleTimeoutRef.current);
    };
  }, [isMobile]);

  return (
    <div ref={wrapperRef} className={styles.wrapper} data-dimmed={isDimmed} data-over-map={isOverMap}>
      <Bubble color={bubbleBackground(color)} size={isMobile ? 90 : 140} />
    </div>
  );
}
