/**
 * IRIS Child Home — the child's landing screen inside Child Mode (Phases 6/7/12/14).
 *
 * Shows: mascot welcome, today's adaptive goals (from the real engine, via
 * useIris()), an avatar picker, a star count, and a "Free Play" bridge into
 * the existing legacy activity screens. This screen makes no pedagogical
 * decision itself — "Start Adventure" only asks IrisFlow to go to whichever
 * step (assessment or activity) the engine state already implies.
 */
import React from 'react';
import { motion } from 'motion/react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { Card } from '../ui/card';
import { PlayfulBackground } from '../ui/PlayfulBackground';
import { IrisCompanion } from './ui/IrisCompanion';
import { Blob, DashedArc, Star } from './ui/brand/Decor';
import { ActivityTile, InfoTile, SectionTitle, DisplayTitle, Button, StarCount, TopBar, BarButton, type IconName, type BrandTone } from './ui/brand';
import { ChromeActions } from './ui/ChromeActions';
import { AvatarPicker } from './ui/AvatarPicker';
import './iris-home-landing.css';
import { AudioControl } from './ui/AudioControl';
import { NarrationCaption } from './ui/NarrationCaption';
import { useReducedMotion } from '../../hooks/useReducedMotion';

/**
 * The five Free Play activities.
 *
 * `icon` is a drawn brand mark, not an emoji: 🧠🎈👤📚🎨 rendered as five
 * different pieces of artwork depending on the child's operating system, and
 * none of the five belonged to the IRIS identity. `tone` is the activity's
 * colour, and it deliberately MATCHES the accent the activity's own screen
 * uses (see SCREEN_ACCENT in ChildShell) so the colour a child taps is the
 * colour they land in.
 */
const LEGACY_GAMES: Array<{ id: string; nameAr: string; nameEn: string; icon: IconName; tone: BrandTone }> = [
  { id: 'memory-game', nameAr: 'لعبة الذاكرة', nameEn: 'Memory Game', icon: 'memory', tone: 'green' },
  { id: 'balloon-pop', nameAr: 'فرقعة البالونات', nameEn: 'Balloon Pop', icon: 'balloon', tone: 'blue' },
  { id: 'shadow-match', nameAr: 'تطابق الظل', nameEn: 'Shadow Match', icon: 'shadow', tone: 'blue' },
  { id: 'stories', nameAr: 'القصص', nameEn: 'Stories', icon: 'book', tone: 'purple' },
  { id: 'drawing', nameAr: 'الرسم', nameEn: 'Drawing', icon: 'pencil', tone: 'green' },
];

export function IrisChildHome({
  onStartAdventure,
  onLegacyGame,
  onGoParent,
}: {
  onStartAdventure: () => void;
  onLegacyGame?: (gameId: string) => void;
  onGoParent?: () => void;
}) {
  const { childName, assignments, GOAL_BY_ID, avatar, setAvatar, stars, profile } = useIris();
  const { language } = useLanguage() as any;
  const { playSound, say } = useAudio();
  const reduceMotion = useReducedMotion();
  const ar = language === 'ar';
  const [pickingAvatar, setPickingAvatar] = React.useState(false);

  const activeGoals = assignments.slice(0, 3);

  /**
   * Greet the child once when the home screen first appears. Browsers block
   * speech until the user has interacted with the page, and that is fine: the
   * greeting is an optional access aid, and the same words are already on
   * screen in the hero card, so nothing is lost when it stays silent.
   */
  const greetedRef = React.useRef(false);
  React.useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    say('welcome', ar ? 'ar' : 'en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-accent="yellow" className="iris-child iris-landing-home min-h-screen bg-ground-tint overflow-x-hidden relative flex flex-col">
      <PlayfulBackground />

      {/* The bespoke header this screen used to draw — an avatar button, a
          name pill, a star badge, an audio cluster and a parent-mode button,
          all hand-positioned with a physical pr-16 to dodge the old floating
          controls — is now the shared TopBar. At 390px the old row measured
          ~394px wide and two of its controls had to be hidden to fit. */}
      <TopBar
        ar={ar}
        title={
          <span className="inline-flex items-center gap-2">
            <button
              onClick={() => setPickingAvatar((v) => !v)}
              aria-expanded={pickingAvatar}
              aria-label={ar ? 'تغيير الشخصية' : 'Change avatar'}
              className="w-10 h-10 rounded-full bg-brand-purple-wash border-2 border-hairline flex items-center justify-center text-xl"
            >
              <span aria-hidden="true">{avatar}</span>
            </button>
            <span className="truncate">{childName || (ar ? 'بطلنا' : 'Hero')}</span>
          </span>
        }
        actions={
          <>
            <StarCount count={stars} />
            <AudioControl language={ar ? 'ar' : 'en'} />
            <ChromeActions showMute={false} />
            {onGoParent && (
              <BarButton icon="parent" label={ar ? 'وضع الوالدين' : 'Parent Mode'} onClick={onGoParent} />
            )}
          </>
        }
      />

      {pickingAvatar && (
        <div className="fixed top-16 inset-x-4 z-40 bg-surface rounded-brand-lg shadow-brand-lg border-4 border-hairline p-4">
          <AvatarPicker value={avatar} onChange={(a) => { setAvatar(a); playSound('tap'); setPickingAvatar(false); }} language={ar ? 'ar' : 'en'} />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-16 space-y-9 relative z-10">
        <motion.div
          initial={reduceMotion ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.35 }}
        >
          {/*
            The hero follows the brand artwork rather than the usual saturated
            gradient card: a warm-white surface with brand colour pooled in the
            corners as organic blobs, exactly the arrangement the logo and the
            avatar cards use. A purple-to-indigo gradient hero is both off
            palette and the most generic shape a product like this can take.
          */}
          <Card className="bg-surface text-ink p-6 md:p-12 rounded-brand-xl border-2 border-hairline shadow-brand-lg relative overflow-hidden">
            <Blob color="#FECA34" opacity={0.28} className="absolute -top-20 -start-16 w-56 h-56" />
            <Blob color="#F45B63" opacity={0.13} className="absolute -bottom-24 -end-16 w-52 h-52" />
            <Star color="#F45B63" className="absolute top-6 end-8 w-6 h-6 opacity-70" />
            <Star color="#49B87A" className="absolute bottom-8 start-10 w-4 h-4 opacity-60" />

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10">
              {/* The child has just arrived, so the companion greets rather
                  than idles — "أهلاً يا بطل!". */}
              <IrisCompanion moment="greeting" size="lg" />
              <div className="flex-1 text-center md:text-start space-y-4">
                <DisplayTitle arc>
                  {ar ? `أهلاً بك يا ${childName || 'بطل'}!` : `Welcome back, ${childName || 'friend'}!`}
                </DisplayTitle>
                <p className="t-body-lg text-ink-muted max-w-lg">
                  {profile
                    ? (ar ? 'اخترنا لك أنشطة رائعة اليوم. هيا نبدأ المغامرة!' : "We picked some great activities for you today. Let's begin!")
                    : (ar ? 'يلا نلعب شوية ونتعرّف على بعض!' : "Let's play a little and get to know each other!")}
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    icon="play"
                    onClick={() => {
                      // 'welcome' rather than 'celebration': starting is not an
                      // achievement, and the fanfare belongs to the level-up.
                      playSound('welcome');
                      say('navigation', ar ? 'ar' : 'en');
                      onStartAdventure();
                    }}
                  >
                    {ar ? 'ابدأ المغامرة' : 'Start Adventure'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Before the first activity there are no goals yet, which used to
            leave a large blank gap between the hero and Free Play. A child
            arriving for the first time should see what is about to happen, in
            pictures, rather than empty space. Three steps only — the whole
            journey at a glance, no reading required to get the gist. */}
        {activeGoals.length === 0 && (
          <div className="space-y-4">
            <SectionTitle eyebrow={ar ? 'الخطة' : 'The plan'} title={ar ? 'مغامرتنا' : 'Our adventure'} />
            {/* InfoTile, not ActivityTile. These three used to be cards that
                looked exactly like the tappable Free Play tiles below — same
                border, same shadow, same lift — so a child tapped one and
                nothing happened. They are visibly information now: flat, no
                shadow, no hover. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { icon: 'dice' as IconName, tone: 'blue' as BrandTone, ar: 'نلعب شوية', en: 'We play' },
                { icon: 'star' as IconName, tone: 'yellow' as BrandTone, ar: 'نجمع نجوم', en: 'We collect stars' },
                { icon: 'rocket' as IconName, tone: 'coral' as BrandTone, ar: 'نتعلّم حاجة جديدة', en: 'We learn something new' },
              ]).map((step, i) => (
                <InfoTile key={i} icon={step.icon} tone={step.tone} label={ar ? step.ar : step.en} className="ir-home-infotile" />
              ))}
            </div>
          </div>
        )}

        {activeGoals.length > 0 && (
          <div className="space-y-6">
            <SectionTitle eyebrow={ar ? 'النهارده' : 'Today'} title={ar ? 'أهدافنا اليوم' : "Today's Goals"} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeGoals.map((a: any, i: number) => {
                const goal = GOAL_BY_ID[a.goal_id];
                return (
                  <motion.div key={a.goal_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="bg-surface rounded-brand-lg p-6 border-2 border-hairline shadow-brand flex items-center gap-4 hover:border-hairline transition-colors">
                      <div className="w-16 h-16 bg-brand-blue-wash rounded-brand flex items-center justify-center text-3xl shrink-0">
                        {goal?.nameAr?.includes('كلمات') ? '📚' : goal?.nameAr?.includes('ذاكرة') ? '🧠' : '⭐'}
                      </div>
                      <div>
                        <h3 className="font-black text-ink-muted">{ar ? goal?.nameAr : goal?.nameEn}</h3>
                        <div className="text-brand-blue-ink font-bold text-sm bg-brand-blue-wash inline-block px-2 py-1 rounded-full mt-1">
                          {ar ? `مستوى ${a.level}` : `Level ${a.level}`}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {onLegacyGame && (
          <div className="space-y-6">
            <SectionTitle eyebrow={ar ? 'براحتك' : 'Your choice'} title={ar ? 'وقت اللعب!' : 'Free Play!'} />
            {/* ActivityTile — the component that existed for exactly this and
                had zero render sites, while this screen hand-built its own
                tiles two imports below it. */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {LEGACY_GAMES.map((game) => (
                <ActivityTile
                  key={game.id}
                  icon={game.icon}
                  tone={game.tone}
                  label={ar ? game.nameAr : game.nameEn}
                  onClick={() => { playSound('tap'); onLegacyGame(game.id); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Visual equivalent of anything spoken (doc 30 H15). */}
        <NarrationCaption language={ar ? 'ar' : 'en'} />
      </div>
    </div>
  );
}
