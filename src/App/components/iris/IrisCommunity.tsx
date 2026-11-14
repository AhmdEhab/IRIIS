import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import {
  listCommunityCategories, listCommunityPosts, listCommunityTips, isDemoDirectory,
  type CommunityCategory, type CommunityPost,
} from '../../data/directory';
import { BrandIcon, type BrandTone } from './ui/brand';
import { Star } from './ui/brand/Decor';
import { ChromeActions } from './ui/ChromeActions';
import { Blob, Sparkle } from '../landing/LandingDecor';
import { IrisBuddy } from './ui/IrisBuddy';
import '../landing-child.css';
import '../parent-community-landing.css';

/**
 * Parent Community — DEMO FEED.
 *
 * There is still no moderation, reporting, or identity infrastructure behind
 * this, and a parent community without moderation is not something to quietly
 * ship for families discussing their disabled children. So the feed below is
 * a demonstration of the shape, not an open space.
 *
 * HONESTY RULES APPLIED HERE (and enforced by qa-demo-data.mjs)
 *  - Authors are labels — "Demo Parent 1" — never plausible people.
 *  - No post claims a child gained, improved, or was helped by IRIS. The old
 *    CommunitySessionsScreen carried exactly that kind of testimonial, which
 *    reads to a worried parent as evidence the product works.
 *  - The specialist-style replies are illustrative general text, labelled as
 *    such in the markup, and contain no medical content.
 *  - Reaction counts are single digits: a layout example, not social proof.
 *
 * Real posts, when they exist, come from the authenticated /api/posts endpoint
 * via data/directory.ts — never from a file in the bundle.
 *
 * Re-skinned in the landing / parent-home design language (lc-* classes):
 * same cream polka-dot ground, glass header, white hero plate, pastel
 * bubbles. Copy, order, handlers and every honesty label are unchanged —
 * styling only.
 */
export function IrisCommunity({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const reduceMotion = useReducedMotion();

  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [tips, setTips] = useState<Awaited<ReturnType<typeof listCommunityTips>>>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([listCommunityCategories(), listCommunityPosts(), listCommunityTips()]).then(
      ([c, p, t]) => {
        if (!alive) return;
        setCategories(c); setPosts(p); setTips(t);
      }
    );
    return () => { alive = false; };
  }, []);

  const shown = useMemo(
    () => (active ? posts.filter((p) => p.category_id === active) : posts),
    [posts, active]
  );

  const KIND_LABEL: Record<string, { ar: string; en: string; tone: BrandTone }> = {
    QUESTION: { ar: 'سؤال', en: 'Question', tone: 'blue' },
    SHARE: { ar: 'مشاركة', en: 'Shared', tone: 'purple' },
    TIP: { ar: 'نصيحة', en: 'Tip', tone: 'green' },
  };

  return (
    <div className="lc-root pc-scope" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      <header className="lc-header">
        <div className="lc-header-inner">
          <button type="button" className="lc-pill lc-pill--blue" onClick={onBack}>
            <Home aria-hidden="true" />
            <span>{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
          </button>
          <div className="lc-header-side">
            <ChromeActions />
            <span className="lc-name-chip">{ar ? 'مجتمع الأهالي' : 'Parent Community'}</span>
          </div>
        </div>
      </header>

      <main className="lc-main">
        {/* Hero plate — the honest "not open yet" notice lives right here,
            inside the conditional demo branch, exactly as before. */}
        <motion.section
          className="lc-hero"
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="lc-hero-dots" aria-hidden="true" />
          <div className="lc-hero-grid">
            <div className="lc-hero-copy">
              <span className="lc-parent-eyebrow">{ar ? 'وضع الوالدين' : 'Parent Mode'}</span>
              <h1 className="lc-hero-title">
                {ar ? (
                  <>مجتمع <span className="lc-hero-mark">الأهالي</span></>
                ) : (
                  <><span className="lc-hero-mark">Parent</span> Community</>
                )}
              </h1>
              {isDemoDirectory() && (
                <div className="pc-demo-note">
                  <span className="pc-demo-emoji" aria-hidden="true">⚠️</span>
                  <div>
                    <h2 className="pc-demo-title">
                      {ar ? 'المشاركات دي كلها تجريبية' : 'Every post here is a demo'}
                    </h2>
                    <p className="pc-demo-text">
                      {ar
                        ? 'مفيش ولا مشاركة حقيقية ولا ولي أمر حقيقي هنا. المحتوى مكتوب عشان يوضّح شكل المساحة لما تفتح. المجتمع لسه مقفول لأن مفيش نظام إشراف، ومفيش أي بيانات بتتجمع دلوقتي.'
                        : 'Not one of these is a real post or a real parent. The content is written to show the shape of the space once it opens. The community is still closed because there is no moderation in place yet, and no data is collected here at this stage.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="lc-hero-mascot">
              <IrisBuddy mood="happy" />
            </div>
          </div>
        </motion.section>

        {/* Categories */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--coral lc-bubble--head" aria-hidden="true">
              <BrandIcon name="family" className="w-7 h-7" tone="transparent" />
            </span>
            <div>
              <span className="pc-eyebrow pc-eyebrow--coral">{ar ? 'المواضيع' : 'Topics'}</span>
              <h2 className="lc-section-title">{ar ? 'الأقسام' : 'Categories'}</h2>
            </div>
          </div>
          <div className="pc-chips">
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-pressed={active === null}
              className={`pc-chip${active === null ? ' pc-chip--active' : ''}`}
            >
              {ar ? 'الكل' : 'All'}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                aria-pressed={active === c.id}
                title={ar ? c.blurb_ar : c.blurb_en}
                className={`pc-chip${active === c.id ? ' pc-chip--active' : ''}`}
              >
                <span aria-hidden="true">{c.icon}</span> {ar ? c.name_ar : c.name_en}
              </button>
            ))}
          </div>
        </section>

        {/* Tips strip */}
        {tips.length > 0 && (
          <div className="pc-plate pc-tips">
            <h3 className="pc-tips-title">{ar ? 'أفكار سريعة' : 'Quick ideas'}</h3>
            <ul className="pc-list">
              {tips.map((t) => (
                <li key={t.id} className="pc-li">
                  <Star className="w-3.5 h-3.5 mt-1 shrink-0" />
                  <span>{ar ? t.ar : t.en}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Feed */}
        <section className="lc-section">
          <div className="lc-section-head">
            <span className="lc-bubble lc-bubble--blue lc-bubble--head" aria-hidden="true">
              <BrandIcon name="chat" className="w-7 h-7" tone="transparent" />
            </span>
            <div>
              <span className="pc-eyebrow pc-eyebrow--blue">{ar ? 'النقاشات' : 'Threads'}</span>
              <h2 className="lc-section-title">{ar ? 'مشاركات توضيحية' : 'Example threads'}</h2>
            </div>
          </div>

          <div className="pc-stack">
            {shown.map((p, i) => {
              const kind = KIND_LABEL[p.kind];
              const author = ar ? p.author_ar : p.author_en;
              return (
                <motion.article
                  key={p.id}
                  className="pc-plate pc-thread"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: i * 0.045 }}
                >
                  <span
                    className={`lc-bubble pc-avatar lc-bubble--${kind.tone}`}
                    aria-hidden="true"
                  >
                    {author.trim().charAt(0)}
                  </span>

                  <div>
                    <div className="pc-row-head">
                      <div>
                        <h3 className="pc-title">{ar ? p.title_ar : p.title_en}</h3>
                        <p className="pc-author">{author}</p>
                      </div>
                      <div className="pc-badge-row">
                        <span className={`lc-card-chip pc-tag pc-tag--${kind.tone}`}>
                          {ar ? kind.ar : kind.en}
                        </span>
                        {/* The space is closed until moderation exists — said on
                            every thread, not only in the banner. */}
                        <span className="lc-card-chip lc-card-chip--soon">
                          {ar ? 'مقفولة' : 'Closed'}
                        </span>
                      </div>
                    </div>

                    <p className="pc-text">{ar ? p.body_ar : p.body_en}</p>

                    <div className="pc-meta">
                      {/* dir=ltr so numerals never render reversed under RTL bidi. */}
                      <span dir="ltr" className="pc-count">💛 {p.reactions}</span>
                      <span dir="ltr" className="pc-count">
                        💬 {p.comments.length}
                      </span>
                    </div>

                    {p.comments.length > 0 && (
                      <ul className="pc-comments">
                        {p.comments.map((c) => (
                          <li
                            key={c.id}
                            className={`pc-comment${c.from_specialist ? ' pc-comment--spec' : ''}`}
                          >
                            <p className="pc-comment-author">
                              {ar ? c.author_ar : c.author_en}
                              {c.from_specialist && (
                                <span className="pc-comment-note">
                                  {ar ? '· نص توضيحي، مش رد من مختص حقيقي' : '· illustrative text, not a reply from a real specialist'}
                                </span>
                              )}
                            </p>
                            <p className="pc-text">{ar ? c.body_ar : c.body_en}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <p className="lc-disclaimer">
          {ar
            ? 'لو حابة تعرفي لما المساحة دي تفتح، كلّمي فريق IRIS. مفيش أي بيانات بتتجمع هنا في المرحلة دي.'
            : 'If you would like to know when this opens, speak to the IRIS team. No data is collected here at this stage.'}
        </p>
      </main>
    </div>
  );
}
