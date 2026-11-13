import React, { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { LandingButton } from './LandingPrimitives';

export const landingLinks = (ar: boolean) => [
  { href: '#about', label: ar ? 'عن IRIS' : 'About IRIS' },
  { href: '#how', label: ar ? 'إزاي بيشتغل' : 'How it works' },
  { href: '#features', label: ar ? 'المميزات' : 'Features' },
  { href: '#experience', label: ar ? 'التعلّم باللعب' : 'Play' },
  { href: '#parents', label: ar ? 'للأهل' : 'For parents' },
  { href: '#faq', label: ar ? 'أسئلة شائعة' : 'FAQ' },
];

export function LanguageSwitch({ expanded = false }: { expanded?: boolean }) {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="lp-language" dir="ltr" role="group" aria-label={language === 'ar' ? 'لغة الموقع' : 'Site language'}>
      {(['en', 'ar'] as const).map(code => (
        <button
          key={code}
          type="button"
          lang={code}
          data-language={code}
          aria-pressed={language === code}
          onClick={() => setLanguage(code)}
        >
          {code === 'ar' ? 'عربي' : expanded ? 'English' : 'EN'}
        </button>
      ))}
    </div>
  );
}

export function LandingHeader({ onLogin, onStart, isAuthenticated }: {
  onLogin: () => void;
  onStart: () => void;
  isAuthenticated: boolean;
}) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [open, setOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = landingLinks(ar);

  useEffect(() => {
    const onScroll = () => setElevated(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const handleOutside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1200px)');
    const handleResize = () => { if (desktop.matches) setOpen(false); };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('pointerdown', handleOutside);
    desktop.addEventListener('change', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('pointerdown', handleOutside);
      desktop.removeEventListener('change', handleResize);
    };
  }, [open]);

  const start = () => { setOpen(false); onStart(); };
  const login = () => { setOpen(false); onLogin(); };

  return (
    <header className={`lp-header${elevated ? ' lp-header--elevated' : ''}`} ref={headerRef}>
      <div className="lp-container lp-header-grid">
        <a className="lp-brand" href="/" aria-label={ar ? 'IRIS — الصفحة الرئيسية' : 'IRIS — home'}>
          <img src="/images/iris-logo-tight.png" width={726} height={509} alt="IRIS" />
        </a>
        <nav className="lp-desktop-nav" aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'}>
          {links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>
        <div className="lp-header-actions">
          <div className="lp-header-language"><LanguageSwitch /></div>
          {!isAuthenticated && (
            <LandingButton compact variant="text" className="lp-header-login" onClick={login} data-testid="header-login">
              {ar ? 'دخول' : 'Log in'}
            </LandingButton>
          )}
          <LandingButton compact onClick={start} data-testid="header-start">
            {isAuthenticated ? (ar ? 'متابعة' : 'Continue') : ar ? 'ابدأ الآن' : 'Get started'}
          </LandingButton>
          <button
            type="button"
            className="lp-menu-toggle"
            ref={toggleRef}
            data-testid="menu-toggle"
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? (ar ? 'إغلاق القائمة' : 'Close menu') : (ar ? 'فتح القائمة' : 'Open menu')}
            onClick={() => setOpen(value => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <div id="landing-mobile-menu" className="lp-mobile-panel" hidden={!open}>
        <div className="lp-container lp-mobile-content">
          <nav aria-label={ar ? 'قائمة الهاتف' : 'Mobile navigation'}>
            {links.map(link => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
            ))}
          </nav>
          <div className="lp-mobile-bottom">
            <LanguageSwitch expanded />
            {!isAuthenticated && <LandingButton compact variant="secondary" onClick={login} data-testid="mobile-login">{ar ? 'عندي حساب' : 'Log in'}</LandingButton>}
          </div>
        </div>
      </div>
    </header>
  );
}
