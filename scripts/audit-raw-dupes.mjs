import { PHASE5_BANK as B } from "../src/iris/content/phase5Bank.js";
const key = (it) => [it.prompt?.ar ?? "", it.stimulus ?? "", (it.options ?? []).join("|"), it.correct_index ?? "", it.strand].join("#");
const m = new Map();
for (const it of B) { const k = key(it); if (m.has(k) === false) m.set(k, []); m.get(k).push(it.item_id); }
const d = [...m.values()].filter((v) => v.length > 1);
console.log("RAW exact duplicate tasks:", d.length);
for (const v of d) console.log("  ", v.join(" + "));
console.log("LNM prompts sample:", B.filter((i) => i.strand === "LIT.LETTER_NAME").slice(0, 3).map((i) => i.prompt.ar).join(" / "));
console.log("DOT vs LNM prompt word check — DOT strand still فين حرف:", B.filter((i) => i.strand === "LIT.DOT" && /فين حرف/.test(i.prompt.ar || "")).length, "of", B.filter((i) => i.strand === "LIT.DOT").length);
const w = B.find((i) => i.strand === "LIT.LETTER_NAME" && /فين/.test(i.prompt.ar || ""));
console.log("letter-name item still using فين?:", w ? w.item_id : "none");
