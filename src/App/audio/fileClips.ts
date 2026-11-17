// Recorded narration for the ladder assessment's spoken words,
// sentences and instructions. Generated once with Manus TTS (voice:
// Egyptian Arabic tutor ar-eg-tutor-11, warm and slow) and shipped with
// the app, so IRIS is never silent on a machine without an Arabic voice.
// Keys are the exact audio_ar strings from src/iris/content/phase5Bank.js.
import { GENERATED_CLIPS } from './fileClips.generated';

const CLIPS: Record<string, string> = {
  "ألف": '/audio/tts/src01.mp3',
  "باء": '/audio/tts/src02.mp3',
  "تاء": '/audio/tts/src03.mp3',
  "ثاء": '/audio/tts/src04.mp3',
  "جيم": '/audio/tts/src05.mp3',
  "حاء": '/audio/tts/src06.mp3',
  "خاء": '/audio/tts/src07.mp3',
  "دال": '/audio/tts/src08.mp3',
  "ذال": '/audio/tts/src09.mp3',
  "راء": '/audio/tts/src10.mp3',
  "زاي": '/audio/tts/src11.mp3',
  "سين": '/audio/tts/src12.mp3',
  "بَاب": '/audio/tts/src13.mp3',
  "بَيْت": '/audio/tts/src14.mp3',
  "قَلَم": '/audio/tts/src15.mp3',
  "كِتَاب": '/audio/tts/src16.mp3',
  "شَمْس": '/audio/tts/src17.mp3',
  "قَمَر": '/audio/tts/src18.mp3',
  "سَمَك": '/audio/tts/src19.mp3',
  "قِطَّة": '/audio/tts/src20.mp3',
  "نَار": '/audio/tts/src21.mp3',
  "الوَلَد يَشْرَبُ اللَّبَن.": '/audio/tts/src22.mp3',
  "القِطَّة فَوْقَ الكُرْسِيّ.": '/audio/tts/src23.mp3',
  "البِنْت تَقْرَأُ كِتَابًا.": '/audio/tts/src24.mp3',
  "الشَّمْس فِي السَّمَاء.": '/audio/tts/src25.mp3',
  "المس الكورة وبعدين الكتاب": '/audio/tts/src26.mp3',
  "المس القطة وبعدين البيت": '/audio/tts/src27.mp3',
  "المس الشمس وبعدين السمكة": '/audio/tts/src28.mp3',
  "سَامِي راح المدرسة ونسي كتابه في البيت.": '/audio/tts/src29.mp3',
  "مَنَى لعبت في الجنينة وبعدين شربت مية.": '/audio/tts/src30.mp3',
  "القطة نامت تحت الشجرة عشان الشمس حامية.": '/audio/tts/src31.mp3',
  "هاتلي ٢": '/audio/tts/src32.mp3',
  "هاتلي ٣": '/audio/tts/src33.mp3',
  "هاتلي ٤": '/audio/tts/src34.mp3',
  "هاتلي ٥": '/audio/tts/src35.mp3',
  "١": '/audio/tts/src36.mp3',
  "٢": '/audio/tts/src37.mp3',
  "٣": '/audio/tts/src38.mp3',
  "٤": '/audio/tts/src39.mp3',
  "٥": '/audio/tts/src40.mp3',
  "٦": '/audio/tts/src41.mp3',
  "٧": '/audio/tts/src42.mp3',
};

// P70: the full-app narration set (298 phrases) merges in; the original
// 42 word/sentence clips above win on any collision (they were tuned first).
for (const [k, v] of Object.entries(GENERATED_CLIPS)) if (!(k in CLIPS)) CLIPS[k] = v;

export function fileClipFor(text: string): string | null {
  return CLIPS[text] ?? null;
}
