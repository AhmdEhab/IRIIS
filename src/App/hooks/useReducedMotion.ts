import { useEffect, useState } from 'react';

/**
 * Tracks the OS-level `prefers-reduced-motion` setting, live.
 *
 * Two reasons this matters here:
 *  - Standard accessibility practice (WCAG 2.3.3 / vestibular safety).
 *  - The project's evidence review notes sensory-processing differences and
 *    the value of being able to reduce animation as an ACCESS control
 *    (research_deliverables/05 §5, doc 30 H15). Note the framing: this is an
 *    access accommodation driven by the user's own system preference — it is
 *    never selected by diagnosis, and no claim is made that reduced motion
 *    improves learning.
 *
 * Components should use this to shorten or drop non-essential animation, not
 * to remove content or feedback.
 */
export function useReducedMotion(): boolean {
  const mqMatches = () =>
    typeof window !== 'undefined' && !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const calmMode = () =>
    typeof document !== 'undefined' && document.documentElement.dataset.motion === 'low';
  const [reduced, setReduced] = useState(() => mqMatches() || calmMode());
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches || calmMode());
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches || calmMode());
    // The app-level calm setting (parent lock or observed performance) also
    // flows through this hook, so every consumer adapts live.
    window.addEventListener('iris-motion', sync);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      window.removeEventListener('iris-motion', sync);
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  return reduced;
}
