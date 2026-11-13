import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

/**
 * LandingDecor — the playful layer of the IRIS landing page.
 *
 * Everything here is decorative: shapes carry `aria-hidden`, and every motion
 * path is gated on prefers-reduced-motion. Floating is done with CSS
 * keyframes (`lp-float`) rather than JS loops so idle motion costs no script
 * time, while scroll reveals use Framer Motion `whileInView` with `once`.
 */

export function Reveal({
  children, delay = 0, y = 26, className = '', as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'li' | 'section';
}) {
  const reduce = useReducedMotion();
  if (reduce) return <Tag className={className}>{children}</Tag>;
  const Comp = Tag === 'li' ? motion.li : Tag === 'section' ? motion.section : motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-64px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Soft organic blob used behind hero and CTA compositions. */
export function Blob({
  className = '', fill = 'var(--brand-yellow-wash)', ...rest
}: { className?: string; fill?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={`lp-blob ${className}`} viewBox="0 0 220 200" aria-hidden="true" focusable="false" {...rest}>
      <path
        d="M104 12c34-9 71 6 88 35 16 29 8 66-14 90-23 25-59 36-92 28-32-8-58-33-66-64C9 69 25 34 55 20c15-7 33-4 49-8Z"
        fill={fill}
      />
    </svg>
  );
}

/** Scalloped wave used as a section transition. */
export function WaveDivider({
  className = '', fill = 'var(--surface)', flip = false,
}: { className?: string; fill?: string; flip?: boolean }) {
  return (
    <svg
      className={`lp-wave ${className}`}
      viewBox="0 0 1440 84" preserveAspectRatio="none" aria-hidden="true" focusable="false"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
    >
      <path d="M0 44c120 26 240 40 360 34 120-6 240-30 360-40 120-10 240-4 360 16 120 20 240 52 360 62v-76H0Z" fill={fill} />
    </svg>
  );
}

/** Four-point sparkle star for sprinkled delight. */
export function Sparkle({ className = '', fill = 'var(--brand-yellow)', ...rest }: { className?: string; fill?: string } & React.SVGProps<SVGSVGElement>) {
  return (
    <svg className={`lp-sparkle ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
      <path d="M12 2c1.1 5.2 3.7 7.8 8.9 8.9-5.2 1.1-7.8 3.7-8.9 8.9-1.1-5.2-3.7-7.8-8.9-8.9C8.3 9.8 10.9 7.2 12 2Z" fill={fill} />
    </svg>
  );
}

/** Dotted arc connecting the How-it-works steps on desktop. */
export function JourneyArc() {
  const reduce = useReducedMotion();
  return (
    <svg className="lp-journey-arc" viewBox="0 0 900 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <motion.path
        d="M18 66C180 12 360 12 450 44c90 32 270 32 432-22"
        fill="none"
        stroke="var(--brand-blue)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="3 14"
        opacity="0.5"
        initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1, opacity: 0.5 }}
        viewport={{ once: true, margin: '-64px' }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {[40, 250, 460, 670, 868].map((x, i) => (
        <circle key={x} cx={x} cy={i === 0 ? 58 : i === 1 ? 22 : i === 2 ? 42 : i === 3 ? 50 : 30} r="7" fill={['var(--brand-yellow)', 'var(--brand-coral)', 'var(--brand-blue)', 'var(--brand-green)', 'var(--brand-purple)'][i]} />
      ))}
    </svg>
  );
}
