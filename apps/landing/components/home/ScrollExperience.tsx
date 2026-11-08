'use client';

import { useEffect, useRef, useState } from 'react';

export interface StoryChapter {
  /** Section element id (set on the <section>). */
  id: string;
  /** Short label shown on the story rail. */
  label: string;
}

/** Elements that animate in as they scroll into view (inside chapter sections). */
const REVEAL_SELECTOR = [
  '[data-chapter] h2',
  '[data-chapter] h2 + p',
  '[data-chapter] .bento-card',
  '[data-chapter] [class*="grid-cols"] > *',
  '[data-chapter] table',
  '[data-reveal]',
].join(',');

/**
 * The landing page's scroll experience. No dependencies: IntersectionObserver + CSS.
 * - Content reveals: headings, copy and cards rise in, staggered, as they enter the viewport.
 * - Story rail (xl+): chapters connected by a line that fills blue → teal as you scroll; the
 *   current chapter lights up, and every node is a link.
 * - Progress bar under the header.
 * - Cursor spotlight on cards; product preview settles from a 3D tilt as you scroll into it.
 * All motion is disabled for `prefers-reduced-motion` (content is simply shown).
 */
export function ScrollExperience({ chapters }: { chapters: StoryChapter[] }) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(chapters[0]?.id);
  const ticking = useRef(false);

  // Reveal on scroll
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)).filter(
      (el) => !el.closest('[data-no-reveal]') && !el.parentElement?.closest('.bento-card'),
    );
    if (reduce || !('IntersectionObserver' in window)) return;

    // Stagger siblings that reveal together (e.g. a grid of cards).
    const siblingIndex = new Map<Element, number>();
    for (const el of nodes) {
      const parent = el.parentElement;
      const i = parent ? (siblingIndex.get(parent) ?? 0) : 0;
      if (parent) siblingIndex.set(parent, i + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(i, 6) * 70}ms`);
      el.setAttribute('data-revealed', 'false');
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.setAttribute('data-revealed', 'true');
            io.unobserve(el);
            // Hand transitions back to the element (e.g. card hover) once the entrance finishes.
            const delay = parseInt(el.style.getPropertyValue('--reveal-delay') || '0', 10);
            window.setTimeout(() => el.setAttribute('data-revealed', 'done'), 900 + delay);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Active chapter
  useEffect(() => {
    const sections = chapters
      .map((c) => document.getElementById(c.id))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [chapters]);

  // Scroll progress + preview tilt (one rAF per frame)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tilt = document.querySelector<HTMLElement>('[data-tilt]');
    const update = () => {
      ticking.current = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      if (tilt && !reduce) {
        const rect = tilt.getBoundingClientRect();
        // 0 when the preview's top is at the bottom of the viewport, 1 when it reaches 35% from the top
        const t = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight * 0.65)));
        tilt.style.setProperty('--tilt', String(1 - t));
      }
    };
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Cursor spotlight on cards
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest?.('.bento-card') as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => document.removeEventListener('pointermove', onMove);
  }, []);

  const activeIndex = Math.max(0, chapters.findIndex((c) => c.id === active));

  return (
    <>
      {/* Reading progress, just under the sticky header */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-16 z-40 h-0.5">
        <div
          className="h-full origin-left bg-[linear-gradient(90deg,var(--ino-blue-600),var(--ino-blue-300),var(--ino-teal-300))]"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {/* Story rail: chapters connected by a line that fills as you scroll */}
      <nav
        aria-label="Page sections"
        className="story-rail pointer-events-none fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 2xl:block"
      >
        <ol className="pointer-events-auto relative flex flex-col gap-5">
          <span aria-hidden="true" className="absolute top-2 bottom-2 left-[5px] w-px bg-border-strong" />
          <span
            aria-hidden="true"
            className="absolute top-2 left-[5px] w-px bg-[linear-gradient(180deg,var(--ino-blue-600),var(--ino-teal-300))] transition-[height] duration-300"
            style={{ height: `calc(${chapters.length > 1 ? activeIndex / (chapters.length - 1) : 0} * (100% - 1rem))` }}
          />
          {chapters.map((c, i) => {
            const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'next';
            return (
              <li key={c.id} className="relative">
                <a
                  href={`#${c.id}`}
                  aria-current={state === 'active' ? 'true' : undefined}
                  className="group flex items-center gap-3 rounded-sm text-xs font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <span
                    data-state={state}
                    className="story-node relative z-10 block size-[11px] rounded-full border-2 transition-all duration-300"
                  />
                  <span
                    className={`whitespace-nowrap transition-all duration-300 ${
                      state === 'active'
                        ? 'translate-x-0 text-foreground opacity-100'
                        : '-translate-x-1 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                    }`}
                  >
                    {c.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * Animated link between two sections: a line that draws in when it scrolls into view, with a
 * pulse travelling down it, a quiet "what's next" cue. Decorative.
 */
export function SectionConnector({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <div aria-hidden="true" data-reveal className="section-connector relative z-10 flex h-0 justify-center" data-tone={tone}>
      <span className="section-connector__line" />
      <span className="section-connector__node" />
    </div>
  );
}
