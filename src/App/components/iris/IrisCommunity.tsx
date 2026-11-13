import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  listCommunityCategories, listCommunityPosts, listCommunityTips, isDemoDirectory,
  type CommunityCategory, type CommunityPost,
} from '../../data/directory';
import { Surface, SectionHeader, Pill, type BrandTone } from './ui/brand';
import { Blob, DashedArc, Star } from './ui/brand/Decor';
import { ScreenFrame, TopBar, DisplayTitle } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';

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
 */
export function IrisCommunity({ onBack }: { onBack: () => void }) {
  const { language } = useLanguage();
  const ar = language === 'ar';

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
    <ScreenFrame accent="coral" width="lg" tone="ground" topBar={
      <TopBar ar={ar} onBack={onBack} backLabel={ar ? 'وضع الوالدين' : 'Parent Mode'}
        title={ar ? 'مجتمع الأهالي' : 'Parent Community'} actions={<ChromeActions />} />
    }>
      <div className="space-y-6">
        {/* back moved into TopBar #0 */}

        <DisplayTitle size="title" arc>
          {ar ? 'مجتمع الأهالي' : 'Parent Community'}
        </DisplayTitle>

        {isDemoDirectory() && (
          <Surface elevation="raised" className="p-5 border-brand-yellow">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">⚠️</span>
              <div>
                <h2 className="font-black text-ink mb-1">
                  {ar ? 'المشاركات دي كلها تجريبية' : 'Every post here is a demo'}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {ar
                    ? 'مفيش ولا مشاركة حقيقية ولا ولي أمر حقيقي هنا. المحتوى مكتوب عشان يوضّح شكل المساحة لما تفتح. المجتمع لسه مقفول لأن مفيش نظام إشراف، ومفيش أي بيانات بتتجمع دلوقتي.'
                    : 'Not one of these is a real post or a real parent. The content is written to show the shape of the space once it opens. The community is still closed because there is no moderation in place yet, and no data is collected here at this stage.'}
                </p>
              </div>
            </div>
          </Surface>
        )}

        {/* Categories */}
        <SectionHeader
          tone="coral"
          eyebrow={ar ? 'المواضيع' : 'Topics'}
          title={ar ? 'الأقسام' : 'Categories'}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-pressed={active === null}
            className={`rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors ${
              active === null
                ? 'bg-brand-blue-ink text-white border-brand-blue'
                : 'bg-surface text-ink-muted border-hairline'
            }`}
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
              className={`rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors ${
                active === c.id
                  ? 'bg-brand-blue-ink text-white border-brand-blue'
                  : 'bg-surface text-ink-muted border-hairline'
              }`}
            >
              <span aria-hidden="true">{c.icon}</span> {ar ? c.name_ar : c.name_en}
            </button>
          ))}
        </div>

        {/* Tips strip */}
        {tips.length > 0 && (
          <Surface elevation="flat" tone="yellow" className="p-4">
            <h3 className="text-xs font-black uppercase tracking-wide text-brand-yellow-ink mb-2">
              {ar ? 'أفكار سريعة' : 'Quick ideas'}
            </h3>
            <ul className="space-y-1.5">
              {tips.map((t) => (
                <li key={t.id} className="flex items-start gap-2 text-sm text-ink">
                  <Star className="w-3.5 h-3.5 mt-1 shrink-0" />
                  <span>{ar ? t.ar : t.en}</span>
                </li>
              ))}
            </ul>
          </Surface>
        )}

        {/* Feed */}
        <SectionHeader
          tone="blue"
          eyebrow={ar ? 'النقاشات' : 'Threads'}
          title={ar ? 'مشاركات توضيحية' : 'Example threads'}
        />

        <div className="space-y-4">
          {shown.map((p) => {
            const kind = KIND_LABEL[p.kind];
            return (
              <Surface key={p.id} elevation="raised" className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-black text-ink">{ar ? p.title_ar : p.title_en}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">{ar ? p.author_ar : p.author_en}</p>
                  </div>
                  <Pill tone={kind.tone}>{ar ? kind.ar : kind.en}</Pill>
                </div>

                <p className="text-sm text-ink-muted leading-relaxed">{ar ? p.body_ar : p.body_en}</p>

                <div className="flex items-center gap-4 text-xs text-ink-muted">
                  {/* dir=ltr so numerals never render reversed under RTL bidi. */}
                  <span dir="ltr" className="tabular-nums">💛 {p.reactions}</span>
                  <span dir="ltr" className="tabular-nums">
                    💬 {p.comments.length}
                  </span>
                </div>

                {p.comments.length > 0 && (
                  <ul className="space-y-2 border-t border-hairline-soft pt-3">
                    {p.comments.map((c) => (
                      <li
                        key={c.id}
                        className={`rounded-brand-sm p-3 ${
                          c.from_specialist ? 'bg-brand-green-wash' : 'bg-surface-sunk'
                        }`}
                      >
                        <p className="text-xs font-bold text-ink mb-1">
                          {ar ? c.author_ar : c.author_en}
                          {c.from_specialist && (
                            <span className="ms-2 font-normal text-brand-green-ink">
                              {ar ? '· نص توضيحي، مش رد من مختص حقيقي' : '· illustrative text, not a reply from a real specialist'}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-ink-muted leading-relaxed">{ar ? c.body_ar : c.body_en}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Surface>
            );
          })}
        </div>

        <p className="t-small text-ink-muted leading-relaxed font-medium">
          {ar
            ? 'لو حابة تعرفي لما المساحة دي تفتح، كلّمي فريق IRIS. مفيش أي بيانات بتتجمع هنا في المرحلة دي.'
            : 'If you would like to know when this opens, speak to the IRIS team. No data is collected here at this stage.'}
        </p>
      </div>
    </ScreenFrame>
  );
}
