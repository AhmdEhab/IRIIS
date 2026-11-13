import React from 'react';

export function LandingButton({
  children, onClick, variant = 'primary', compact = false, className = '', ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'inverse' | 'text';
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      {...props}
      onClick={onClick}
      className={`lp-button lp-button--${variant}${compact ? ' lp-button--compact' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function LandingSection({
  id, children, tone = 'surface', className = '',
}: {
  id: string;
  children: React.ReactNode;
  tone?: 'surface' | 'warm' | 'blue' | 'purple';
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`lp-section lp-section--${tone} ${className}`}>
      <div className="lp-container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  id, eyebrow, title, description, centered = false,
}: {
  id: string;
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`lp-heading${centered ? ' lp-heading--centered' : ''}`}>
      {eyebrow && <p className="lp-eyebrow">{eyebrow}</p>}
      <h2 id={`${id}-title`}>{title}</h2>
      {description && <p className="lp-lead">{description}</p>}
    </div>
  );
}
