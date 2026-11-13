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
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Safari < 14 only supports the deprecated addListener signature.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}
