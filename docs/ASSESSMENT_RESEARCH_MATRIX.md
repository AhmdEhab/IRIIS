# IRIS — Assessment Research Matrix

**Status:** research input for Phase 5. Nothing here has been implemented yet.
**Compiled:** September 2026
**Scope:** the evidence base behind a research-informed adaptive assessment for
Arabic-speaking children with intellectual and developmental disabilities.

---

## 0. How to read this document

### 0.1 What a row means

Every row records one finding from **one source that was actually retrieved and
read**. If a source could not be fetched, it is not in the table — it is in the
gap list at the end of its section. Nothing here was written from recall.

Each row carries a `LIMITATION` line. That line is not a formality. In this
literature the limitations are frequently large enough to change what the
finding licenses: sample sizes of 9, 10, 14 and 30 are common, most work is in
English on typically developing children, and Arabic special-education research
is close to absent.

### 0.2 Three tiers of claim

| Tier | Meaning | How IRIS may use it |
|---|---|---|
| **EVIDENCED** | Multiple sources, or one large/meta-analytic source, agree | May shape the skill ladder order and item design |
| **INDICATIVE** | One study, or a review, usually small or in another language | May shape a *starting hypothesis* that observation overrides quickly |
| **NO EVIDENCE FOUND** | Searched, nothing retrievable | Must be labelled `ENGINEERING_ASSUMPTION` in `spec.js` and surfaced to a specialist |

These map onto the vocabulary already in `src/iris/spec.js` (`VALIDATION.*`), so
the tiering is not a new concept — it is the existing one, extended.

### 0.3 What could not be reached

**PubMed Central blocked automated retrieval throughout.** Every direct PMC
article fetch hit a reCAPTCHA or bot check. Where a PMC-indexed study appears
below, it was read through a publisher site (Springer, Frontiers, SAGE,
Cambridge, PLOS), an institutional repository (ERIC, UCL Discovery, Cardiff
ORCA, university-hosted PDF), or NCBI Bookshelf — never from a PMC abstract
taken on trust. Three fetches did succeed on `pmc.ncbi.nlm.nih.gov` and are
marked as such.

Several important papers were unreachable behind publisher 403s and are listed
in the gaps rather than summarised. The most consequential of these is the
Burgoyne et al. (2012) randomised controlled trial of reading intervention in
Down syndrome — the strongest study in the field, and one whose sample size and
effect sizes this document therefore cannot state.

---

## 1. The governing principle, and why the research itself demands it

The brief for this phase says group differences "must NEVER become deterministic
rules". The literature does not merely permit that constraint — it argues for it.

Four retrieved sources contain explicit warnings against inferring an
individual's ability from a syndrome label:

- **Jarrold & Baddeley (2001)** document "a young woman with Down syndrome, who,
  in addition to being fluent in 3 languages, had a perfectly normal verbal
  short-term memory span" — a direct counterexample to the best-established
  group finding in the DS literature.
- **Nye, Fluck & Buckley (2001)** found the DS and typically developing groups
  differed sharply on rote count length (median highest count 3 vs 11) yet **did
  not differ statistically on cardinality understanding**. The group difference
  did not transfer across a closely related skill.
- **Chapman & Hesketh (2001)** state plainly that "degrees of delay vary widely".
- **Brock (2007)**, reviewing the whole Williams syndrome language literature,
  concludes there is "little evidence that syntax, morphology, phonology, or
  pragmatics are any better than predicted by nonverbal ability" — that is, the
  single most widely repeated claim about Williams syndrome does not survive
  careful comparison.

**Consequence for the design.** A syndrome-derived prior is not just ethically
awkward; it is *empirically weak*. The distributions overlap heavily, the
within-group ranges are enormous (Næss et al. report 2–38 words read correctly
among the DS children who read at all; the WS reading study reports standard
scores from 40 to 112), and the direction of the best-known claims is contested.
A prior this noisy cannot beat two minutes of actually watching the child.

That is the argument for the position taken in the design document: **research
shapes the ladder and the items, identically for every child; calibration finds
the child's rung. The diagnosis is not consulted for placement.**

---

## 2. Section A — General early literacy: what develops, in what order

### A1. Which early skills predict later reading

**SOURCE:** National Early Literacy Panel / NICHD, *Developing Early Literacy*
**URL:** https://www.nichd.nih.gov/sites/default/files/publications/pubs/documents/NELPReport09.pdf
**YEAR:** 2008 (NICHD publication 2010)
**POPULATION:** Meta-analysis, 234 studies for the predictor analyses; children birth–age 5; overwhelmingly English-speaking US samples
**KEY FINDING:** Six variables correlate medium-to-large with later literacy even controlling for IQ and SES: alphabet knowledge, phonological awareness, rapid automatic naming of letters/digits, RAN of objects/colours, writing/name-writing, and phonological memory. Concepts about print, oral language and visual processing correlated only moderately and did not consistently hold up multivariately. Oral language mattered more when measured with complex measures than with vocabulary alone.
**IRIS DESIGN IMPLICATION:** The calibration stage should sample **alphabet knowledge and phonological awareness first** — these are the highest-yield probes per minute of a child's attention. Vocabulary alone is a weaker signal than IRIS's current design assumes (`LANG.RECEP_VOCAB` is currently the primary entry task).
**LIMITATION:** Correlational, not causal. The researcher could not extract the per-predictor correlation coefficients — the accessible portion of the PDF was the executive summary, not the results tables, so **no r-value from NELP is quoted anywhere in IRIS**. English/US only; not validated for Arabic or for intellectual disability.
**TIER:** EVIDENCED (for the ranking of predictors); NOT transferable to Arabic without local check.

### A2. The order in which phonological awareness develops

**SOURCE:** Anthony, J.L. & Francis, D.J., "Development of Phonological Awareness," *Current Directions in Psychological Science* 14(5)
**URL:** https://homepage.villanova.edu/diego.fernandezduque/Teaching/CognitivePsychology/Lectures_and_Labs/s9Language/CurrDirPhonoAwareness.pdf
**YEAR:** 2005
**POPULATION:** Review of preschool and early-elementary studies, roughly ages 3–8
**KEY FINDING:** "Children can detect or manipulate syllables before they can detect or manipulate onsets and rimes, and they can detect or manipulate onsets and rimes before they can detect or manipulate individual phonemes." Blending precedes segmentation. Detecting similarity between words precedes manipulating sounds within a word.
**IRIS DESIGN IMPLICATION:** Fixes the internal ordering of the phonological rungs of the literacy ladder: **syllable → rhyme/onset-rime → phoneme**, and within a rung, **detect → blend → segment**. This is the ordering used in Levels 4–5 of the proposed ladder.
**LIMITATION:** A review, not a primary study; no item-level difficulty parameters; alphabetic-language research, predominantly English.
**TIER:** EVIDENCED, and separately replicated in Arabic — see B4.

### A3. Blending is easier than segmentation; letters make PA instruction work

**SOURCE:** Ehri, Nunes, Willows, Schuster, Yaghoub-Zadeh & Shanahan, "Phonemic Awareness Instruction Helps Children Learn to Read: Evidence From the National Reading Panel's Meta-Analysis," *Reading Research Quarterly* 36(3)
**URL:** https://www.academia.edu/11379786/Phonemic_awareness_instruction_helps_children_learn_to_read_Evidence_from_the_National_Reading_Panels_meta_analysis
**YEAR:** 2001
**POPULATION:** Meta-analysis, 52 studies, 96 treatment-control comparisons; kindergarten to early elementary, English
**KEY FINDING:** PA instruction produced d = 0.86 on PA outcomes, d = 0.53 on reading, d = 0.59 on spelling. **Segmentation training produced a larger effect (d = 0.87) than blending (d = 0.61).** PA instruction was more effective **when taught with letters than without**. Teaching one or two PA skills intensively (d = 1.16) beat teaching three or more at once (d = 0.70).
**IRIS DESIGN IMPLICATION:** Three concrete decisions. (1) Segmentation sits **above** blending on the ladder. (2) Phonological items should be presented **with the letter visible**, not as pure audio — which changes the existing `TPL-SOUND_MATCH` template. (3) A session should target **one or two** sub-skills, not sample broadly — this constrains the content blueprint's breadth per session.
**LIMITATION:** These are *instructional* effect sizes, not assessment-difficulty parameters. Read via an academia.edu mirror rather than the RRQ page; the underlying study is the peer-reviewed NRP meta-analysis. English only.
**TIER:** EVIDENCED.

### A4. Letter names and letter sounds are not a fixed sequence

**SOURCE:** Roberts, T.A., Vadasy, P.F. & Sanders, E.A., preschool alphabet-learning instructional-order study, *Early Childhood Research Quarterly*
**URL:** https://files.eric.ed.gov/fulltext/ED592345.pdf
**YEAR:** 2019 (ERIC-hosted version)
**POPULATION:** 94 preschool children, mean age 4.08 years; 35 dual-language learners, 59 native English speakers
**KEY FINDING:** "Letter sound learning was on a par with letter name learning" under combined instruction. **No main effect of instructional order.** Within phonological-awareness-linked instruction, teaching sounds *before* names produced greater letter-sound gains; the authors suggest teaching names first "may actually have interfered with" the harder sound learning.
**IRIS DESIGN IMPLICATION:** **Do not hard-code letter-name knowledge as a prerequisite for letter-sound knowledge.** The proposed ladder therefore places Level 2 (names) and Level 3 (sounds) as *parallel probes at the same tier*, not a strict gate — a departure from the naive ladder in the brief.
**LIMITATION:** ERIC preprint of the journal version; preschool only; mixed DLL/monolingual sample.
**TIER:** INDICATIVE (single study, but it directly contradicts the assumption it tests).

### A5. Combined name+sound teaching does not generalise

**SOURCE:** Piasta, S.B., Purpura, D.J. & Wagner, R.K., "Fostering alphabet knowledge development," *Reading and Writing*
**URL:** https://link.springer.com/article/10.1007/s11145-009-9174-x
**YEAR:** 2010
**POPULATION:** 58 preschool children, randomised to name+sound, sound-only, or a number-instruction control
**KEY FINDING:** Combined instruction beat sound-only for letter-sound acquisition, **but gains did not transfer** to phonological awareness, letter-word identification, or spelling.
**IRIS DESIGN IMPLICATION:** Letter knowledge, phonological awareness and word reading must be **measured separately**. Mastery of one may not be used to infer or skip the others — which rules out a single collapsed "literacy score".
**LIMITATION:** Small (n=58), short-term outcomes, preschool English speakers.
**TIER:** INDICATIVE.

### A6. Word reading develops in phases gated by alphabetic knowledge

**SOURCE:** Ehri, L.C., "Learning to Read Words: Theory, Findings, and Issues," *Scientific Studies of Reading* 9(2)
**URL:** https://ala.asn.au/wp-content/uploads/2020/05/Ehri-Word-Learning.pdf
**YEAR:** 2005
**POPULATION:** Theoretical synthesis of English-language developmental studies
**KEY FINDING:** Four phases — pre-alphabetic (visual features only), partial alphabetic (some letters, often first/last, weak segmentation), full alphabetic (major grapheme-phoneme correspondences plus phonemic segmentation), consolidated alphabetic (rimes, syllables, morphemes chunked).
**IRIS DESIGN IMPLICATION:** Gives the gate between ladder Level 5 (early decoding) and Level 6 (early reading): **full grapheme-phoneme knowledge plus phonemic segmentation**, not word-reading accuracy alone.
**LIMITATION:** A synthesis, not a study with its own sample. Built on English orthography, which is irregular; phase boundaries may differ in Arabic, and the model was not developed on children with intellectual disability.
**TIER:** EVIDENCED as a model, INDICATIVE as applied to Arabic.

### A7. Decoding and language comprehension trade places with age

**SOURCE:** Hogan, T.P., Adlof, S.M. & Alonzo, C.N., "On the importance of listening comprehension," *International Journal of Speech-Language Pathology* 16(3)
**URL:** https://resources.finalsite.net/images/v1668629367/schenck/imtkltsol16dlchjx0k9/HoganAdlofAlonzo2014Ontheimportanceoflisteningcomp.pdf
**YEAR:** 2014
**POPULATION:** Longitudinal analysis drawing on 500+ children, grade 2 to grade 8/10
**KEY FINDING:** Word recognition's unique contribution to reading comprehension fell from **27% of variance in grade 2 to 2% in grade 8**; listening comprehension's rose from **9% to 36%**. Children with adequate decoding but poor listening comprehension grew from 3% to 9.6% of the sample.
**IRIS DESIGN IMPLICATION:** Listening comprehension must be its **own measured domain**, not a by-product of reading items — and it is the domain that matters most for the older children in IRIS's range. This is currently absent from the nine sub-measures.
**LIMITATION:** The 500+ figure and grade breakdown are synthesized within this review from a longitudinal dataset the researcher could not independently retrieve. English speakers. Not an intellectual-disability sample.
**TIER:** EVIDENCED (direction), INDICATIVE (exact figures).

### A8. The Simple View, and why decoding and comprehension are not independent

**SOURCE:** Catts, H.W., "The Simple View of Reading: Advancements and False Impressions," *Remedial and Special Education* 39(5)
**URL:** https://files.eric.ed.gov/fulltext/EJ1191985.pdf
**YEAR:** 2018
**POPULATION:** Theoretical review citing cross-linguistic evidence
**KEY FINDING:** Reading comprehension = decoding × language comprehension. Decoding dominates early, language comprehension by grade 3–4 in English and **later in more opaque orthographies**. Shared variance between the two accounts for as much or more of reading-comprehension variance as either uniquely (40–70%).
**IRIS DESIGN IMPLICATION:** Report decoding and listening comprehension as **two scores plus their interaction**, never one blended reading number; and expect the crossover to come *later* in Arabic than the English literature implies.
**LIMITATION:** A critique, not new data; the effect sizes it quotes are second-hand within it and were not independently verified.
**TIER:** EVIDENCED as a model.

### A9. Strong-evidence instructional sequence

**SOURCE:** What Works Clearinghouse / IES, *Foundational Skills to Support Reading for Understanding in Kindergarten Through 3rd Grade*, NCEE 2016-4008
**URL:** https://files.eric.ed.gov/fulltext/ED566956.pdf
**YEAR:** 2016
**POPULATION:** Practice guide over controlled K-3 US intervention studies (17 studies for the PA/phonics recommendation; 13 for decoding/word analysis)
**KEY FINDING:** Two recommendations rated **strong evidence** — develop phonemic awareness, and teach decoding and word analysis. Connected-text reading: **moderate**. Academic language/vocabulary: **minimal evidence**. Sequencing: sentences → words → syllables → onset-rime → phonemes. Decoding should begin once "students know a few consonants and vowels".
**IRIS DESIGN IMPLICATION:** The two strong-evidence strands get the most item-bank investment and the most adaptive resolution. **Decoding items unlock on partial letter-sound knowledge, not on full alphabet mastery** — this sets the Level 3 → Level 5 gate. Vocabulary items are explicitly marked lower-confidence for driving instructional decisions.
**LIMITATION:** US, K-3, English, instruction rather than assessment; not validated for Arabic or intellectual disability.
**TIER:** EVIDENCED (the strongest single source in this section for sequencing).

### A10. Early speech-sound maturity independently predicts later decoding

**SOURCE:** Durand, Loe, Yeatman & Feldman, "Effects of early language, speech, and cognition on later reading: a mediation analysis," *Frontiers in Psychology*
**URL:** https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00586/full
**YEAR:** 2013
**POPULATION:** 223 children tested at age 3 and again at 9–11; US, socioeconomically mixed
**KEY FINDING:** General cognitive ability was the strongest predictor (r = 0.45–0.57) and mediated much of the vocabulary effect — **but speech-sound maturity independently predicted decoding (p = 0.002) and oral reading fluency (p = 0.018)** after accounting for cognition, and receptive vocabulary retained an independent association with comprehension (p = 0.005).
**IRIS DESIGN IMPLICATION:** Not every early-language signal is a proxy for general ability; speech-sound and vocabulary tracks carry independent information and should not be collapsed.
**LIMITATION:** Single cohort, 6–8 year gap, US English, mediation results are model-dependent.
**TIER:** INDICATIVE.

### Section A gaps

- **NELP per-predictor correlation coefficients** — results tables not retrievable. No NELP r-value is used anywhere in IRIS.
- **Concepts-about-print as an independent predictor** — primary studies blocked (PMC reCAPTCHA, ScienceDirect robots.txt). NO USABLE SOURCE FOUND.
- **How PA should be *tested* (as opposed to taught)** — the directly relevant PMC article was unreachable. NO USABLE SOURCE FOUND.
- **Children with intellectual disability other than Down syndrome** — NO USABLE SOURCE FOUND.

---

## 3. Section B — Arabic: why an English test cannot be translated

This section is the reason Phase 5 cannot be built by porting an English
instrument. It is also the thinnest section relative to its importance.

### B1. Arabic letter knowledge carries an extra visual load

**SOURCE:** Ghandour, Trouche, Guillo & Valdois, "The influence of visual attention on letter recognition and reading acquisition in Arabic," *Frontiers in Psychology* 16
**URL:** https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1628051/full
**YEAR:** 2025
**POPULATION:** 101 Lebanese first-graders, mean age 6;11, four months into literacy instruction; bilingual Arabic/English private schools
**KEY FINDING:** Visual attention span did not predict reading fluency directly once letter knowledge was entered — it worked **through** letter knowledge. The authors argue Arabic's multiple allographs and dot-based distinctions impose an extra feature-integration load during letter recognition that transparent Indo-European scripts do not.
**IRIS DESIGN IMPLICATION:** "Knowing a letter" in Arabic is a **larger construct** than in English: it includes resolving the positional form and the dot pattern. Letter-knowledge items must therefore sample forms and dot-contrasts explicitly rather than testing a canonical isolated glyph.
**LIMITATION:** Lebanese, bilingual, private-school, typically developing. Cross-sectional. Not Egypt, not intellectual disability.
**TIER:** INDICATIVE.

### B2. Dot confusions are a real, trainable bottleneck

**SOURCE:** Ghandour, Trouche, Guillo & Valdois, "Spot the Dot: Improving Arabic Reading Accuracy through Visual Attention Span Training," Research Square preprint
**URL:** https://www.researchsquare.com/article/rs-9678865/v1
**YEAR:** 2026 (preprint — **not peer reviewed**)
**POPULATION:** 78 Moroccan second-graders, ~7–8 years, Darija speakers taught in vowelised MSA
**KEY FINDING:** Training on "presence, number, and position of dots" improved discrimination of ح/ج/خ and ب/ت/ث and produced a **+5.7 percentage-point** reading-accuracy advantage over controls (p = .002).
**IRIS DESIGN IMPLICATION:** Dot-only confusion pairs deserve their **own item category and their own error code** in the Arabic letter-knowledge task — not folded into generic "wrong letter".
**LIMITATION:** **Preprint, not peer reviewed.** Moroccan dialect (larger MSA distance than Egyptian). Quasi-experimental with intact classrooms.
**TIER:** INDICATIVE, flagged as preprint. Must be re-checked before it is cited to anyone outside the team.

### B3. Arabic letters are not psychometrically interchangeable

**SOURCE:** Tibi, Edwards, Schatschneider, Lombardino, Kirby & Salha, "IRT analyses of Arabic letter knowledge in Kindergarten," *Reading and Writing* 34(3)
**URL:** https://link.springer.com/article/10.1007/s11145-020-10086-6
**YEAR:** 2020
**POPULATION:** 142 native Arabic-speaking kindergarteners, mean age 67 months, Palestine
**KEY FINDING:** Letter-recognition items were **multidimensional**; allograph recognition and syllable reading were each unidimensional. A two-parameter IRT model fitted all three. A smaller high-utility subset of letters was sufficient for efficient measurement.
**IRIS DESIGN IMPLICATION:** Two things. (1) **Letter recognition and allograph recognition are distinct constructs** and must be scored separately. (2) A short adaptive letter probe is defensible — but the letter subset must eventually be chosen empirically, not by the team's intuition. Until then the subset is an `ENGINEERING_ASSUMPTION`.
**LIMITATION:** Palestinian kindergarten; the high-utility subset may not transfer to Egyptian curricula; typically developing children only.
**TIER:** EVIDENCED (that the constructs differ); the specific letter subset is NOT transferable.

### B4. The syllable→phoneme progression replicates in Arabic

**SOURCE:** Al-Sulaihim, N. & Marinis, T., "Literacy and Phonological Awareness in Arabic Speaking Children," *Arab Journal of Applied Linguistics* 2(1)
**URL:** https://files.eric.ed.gov/fulltext/EJ1207977.pdf
**YEAR:** 2017
**POPULATION:** 30 Kuwaiti first-graders, mean age 6;7, tested twice ~6 months apart
**KEY FINDING:** Syllable tasks easiest, rhyme/onset intermediate, phoneme isolation and deletion hardest but showing the largest gains after instruction began. **Letter knowledge at time 1 correlated r = .745 (p < .01) with later reading.**
**IRIS DESIGN IMPLICATION:** The ordering from A2 may be reused for Arabic as a starting hypothesis. Critically: **phoneme-level skill is instruction-dependent, not emergent** — so a low phoneme score in a child with little schooling is a schooling fact, not a child fact, and the parent summary must say so.
**LIMITATION:** n = 30, one Kuwaiti cohort, Gulf dialect not Egyptian, typically developing.
**TIER:** INDICATIVE.

### B5. Diglossia — phonemes absent from the child's dialect are harder

**SOURCE:** Saiegh-Haddad, E., "Linguistic distance and initial reading acquisition: The case of Arabic diglossia," *Applied Psycholinguistics*
**URL:** https://www.academia.edu/24046604/Linguistic_distance_and_initial_reading_acquisition_The_case_of_Arabic_diglossia
**YEAR:** 2003
**POPULATION:** 65 children (23 kindergarten, 42 grade 1), Northern Palestinian dialect
**KEY FINDING:** Phonemes that exist **only in Standard Arabic** and not in the child's spoken dialect are significantly harder to isolate (F = 17.76, p < .001). The effect is present *before* formal MSA instruction and predicts early decoding difficulty.
**IRIS DESIGN IMPLICATION:** **The single most important Arabic-specific design rule.** Every phonological item must be tagged with whether its target phoneme exists in Egyptian Arabic. Failure on an MSA-only phoneme is a *dialect-distance* observation, not a phonological weakness, and must never be scored as the latter. Without this tag IRIS would systematically over-identify difficulty in dialect-speaking children — which is the exact failure mode this product exists to avoid.
**LIMITATION:** Northern Palestinian dialect. **The equivalent Egyptian phoneme-distance data does not exist in retrievable form** (see B6).
**TIER:** EVIDENCED as a phenomenon; the Egyptian parameters are a GAP.

### B6. Diglossia distance is not one number, and Egypt's is unknown

**SOURCE:** Bergstrand Othman, "Arabic diglossia: advocating for a non-deficit model in comparative analysis of reading and language acquisition," *Frontiers in Education*
**URL:** https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2025.1518728/full
**YEAR:** 2025
**POPULATION:** Review of prior child studies, predominantly Palestinian-Israeli
**KEY FINDING:** The diglossia literature is heavily concentrated on one population. MSA-dialect distance **varies by region** — /q/ is MSA-only relative to Palestinian dialect but native to Syrian, Iraqi and North African dialects. The gap "lessens, and in some cases disappears, by late elementary school". The author argues reading proficiency tracks SES and educational investment more than diglossia itself, and urges treating diglossia as a normal linguistic feature rather than a deficit.
**IRIS DESIGN IMPLICATION:** IRIS **may not import Palestinian dialect-distance parameters**. The Egyptian phoneme/lexical inventory relative to MSA has to be built locally — by an Egyptian speech-language specialist, not by this team and not by a language model. Until it exists, the tag from B5 is populated by an explicitly marked provisional list.
**LIMITATION:** A review/position piece; supplies no Egyptian figures.
**TIER:** EVIDENCED as a caution.

### B7. Diglossia effects on fluency persist for years

**SOURCE:** Schiff, R. & Saiegh-Haddad, E., "Development and Relationships Between Phonological Awareness, Morphological Awareness and Word Reading in Spoken and Standard Arabic," *Frontiers in Psychology* 9
**URL:** https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.00356/full
**YEAR:** 2018
**POPULATION:** 100 Palestinian-dialect speakers, ages 7–15, grades 2/4/6/8/10, northern Israel
**KEY FINDING:** PA gaps between spoken and standard Arabic narrowed by grades 8–10, but **morphological-awareness gaps persisted through high school** and word-reading gaps in Standard Arabic persisted across every grade studied. Gaps appeared in **both** vowelled and unvowelled conditions — so this is not merely an orthographic-transparency artifact.
**IRIS DESIGN IMPLICATION:** Do not model the diglossia gap as something that closes once decoding is taught. Track dialect and standard performance separately where the item allows it.
**LIMITATION:** Palestinian-Israeli; Egyptian distance differs.
**TIER:** INDICATIVE.

### B8. What an Arabic literacy battery needs structurally

**SOURCE:** Hassanein et al., "Developing a Test of Early Arabic Literacy Skills" (TEALS), *Reading Psychology* 42(3)
**URL:** https://www.tandfonline.com/doi/abs/10.1080/02702711.2021.1888349
**YEAR:** 2021
**POPULATION:** Instrument-development framework paper for grades 1–3; no single empirical sample
**KEY FINDING:** States there were "currently no standardized measures of Arabic reading available", and that **only about 21% of words are identical between spoken Arabic and MSA**. Proposes four subscales: phonological processing, orthographic knowledge, morphological awareness, and word reading (vowelised and unvowelised separately).
**IRIS DESIGN IMPLICATION:** Arabic needs a **four-domain** literacy structure, not the two or three domains typical of English batteries — in particular **morphological awareness is a first-class domain in Arabic**, because of root-and-pattern morphology. This adds a domain the current IRIS design does not have.
**LIMITATION:** A framework proposal — **no validation data, no item statistics, no norms**, and no evidence it has been normed on Egyptian children or on children with intellectual disability.
**TIER:** INDICATIVE (structure); NOT an instrument IRIS can adopt.

### B9. Egyptian error patterns are vowel- and segment-dominated, not visual

**SOURCE:** ElFiky, Rifaie, Hassan & Hassan, "Screening for Reading Errors Among Egyptian Dyslexic Children," *Ain Shams Medical Journal*
**URL:** https://www.academia.edu/129984000/Screening_for_Reading_Errors_Among_Egyptian_Dyslexic_Children
**YEAR:** 2021
**POPULATION:** 40 Egyptian children, 8–10 years, below the 25th percentile on a modified Arabic dyslexia screening test
**KEY FINDING:** Error frequencies — deletion 90%, addition 70%, regularisation 53%, **short-vowel/diacritic errors 48%**, substitution 48%, transposition 40%, visual letter-shape errors only 5%, morphological 5%.
**IRIS DESIGN IMPLICATION:** This is the only Egyptian error-pattern data retrieved. It suggests the Arabic error taxonomy should weight **diacritic handling and segmental add/delete/transpose errors** above visual letter confusion — which partially tensions with B2's emphasis on dot confusion (different population, different task).
**LIMITATION:** n = 40, all pre-screened as below the 25th percentile, **no comparison group**, sourced via an Academia.edu repository copy; journal indexing not confirmed. Dyslexia, not intellectual disability.
**TIER:** INDICATIVE, weak. Flagged as the weakest source cited in this document.

### B10. The Egypt EGRA — the closest thing to a precedent

**SOURCE:** RTI International / USAID Egypt, *Egypt Grade 3 Early Grade Reading Assessment (EGRA), 2nd National Assessment Final Report*
**URL:** https://ierc-publicfiles.s3.amazonaws.com/public/resources/FR_Egypt%20EGRA2014_Task27_FINALReport_ENGLISH_30Sep2014_ForDEC-11Dec2014.pdf
**YEAR:** 2014
**POPULATION:** 1,923 grade-3 students, 196 schools, 25 of 27 Egyptian governorates
**KEY FINDING:** A full national Arabic/MSA adaptation, with four decisions IRIS should copy: (1) all stimulus text fully diacritised, with an explicit scoring policy for children who add diacritics not printed; (2) the letter-sound subtask **deliberately mixed isolated, initial, medial and final forms**; (3) nonwords built to Arabic morphophonological rules rather than English templates; (4) **instructions given in Egyptian colloquial, all reading content in MSA**. Listening comprehension in MSA was weak, and the report notes vernacular fluency "does not prepare students for the linguistic demands of MSA taught in schools". Oral reading fluency was flat at ~21 correct words/minute.
**IRIS DESIGN IMPLICATION:** Direct precedent for the language split the brief already asks for — **Egyptian Arabic for instructions and companion speech, MSA for literacy content** — from a national assessment on Egyptian children. Also settles the letter-form sampling question: mix all four positional forms.
**LIMITATION:** Programme-evaluation report, not peer reviewed. National means, not individual thresholds. Typically developing grade-3 children; not designed for special education.
**TIER:** EVIDENCED as precedent for adaptation decisions.

### B11. Arabic phonological awareness in Egyptian children with borderline intellectual functioning

**SOURCE:** Hesham, Afsah & Baz, "Exploring phonological awareness skills in Arabic-speaking children with borderline intellectual functioning and poor reading," *The Egyptian Journal of Otolaryngology*
**URL:** https://link.springer.com/article/10.1186/s43163-024-00605-5
**YEAR:** 2024
**POPULATION:** 98 Egyptian children, 6.5–11.5 years: 50 typically developing, 24 with dyslexia (IQ > 85), 24 with borderline intellectual functioning (IQ 70–85) and poor reading
**KEY FINDING:** The BIF group showed markedly reduced phonological awareness relative to both other groups, **especially at 6.5–8 years**; by 8–11.5 the BIF and dyslexia groups converged, both well below typical. The team built a **modified Arabic PA test using visual aids and adjusted scoring**, with 5th-percentile cut-offs per age band.
**IRIS DESIGN IMPLICATION:** The **only** Egyptian source retrieved on Arabic PA in a cognitively atypical population. Two implications: PA items for this population need **pictorial support rather than pure oral presentation**, and they need **low-floor items** because standard PA tasks bottom out for younger and lower-functioning children — which is precisely the floor problem the current IRIS `FLOOR_AT_STEP_1` flag detects but does not solve.
**LIMITATION:** Small clinical convenience sample (n = 24 per clinical group), single Egyptian centre, cross-sectional. **Borderline intellectual functioning is not intellectual disability** and is not Down syndrome.
**TIER:** INDICATIVE — and the closest thing to on-population evidence in the entire document.

### B12. Arabic morphology in Down syndrome — the dual number

**SOURCE:** Mashaqba, Abu Sa'aleek, Huneety & Al-Shboul, "Grammatical number inflection in Arabic-speaking children and young adults with Down syndrome," *South African Journal of Communication Disorders* 67(1)
**URL:** https://sajcd.org.za/index.php/sajcd/article/view/702/1391
**YEAR:** 2020
**POPULATION:** 60 Jordanian Arabic speakers with Down syndrome, ages 7.1–27.3
**KEY FINDING:** Singular forms largely intact (83.3% correct); **plural 27%, dual 10.3%**. Accuracy rose with age but overall resembled typically developing three-year-olds. 16% of dual/plural items were not recognised at all — a comprehension failure, not just a production error.
**IRIS DESIGN IMPLICATION:** Arabic's **dual number has no English equivalent** and is a specific, persistent weak point that does not resolve with age. If IRIS ever adds a morphological-awareness domain (B8), dual-number items must be scored separately rather than pooled with plurals.
**LIMITATION:** Jordanian, not Egyptian. **Spoken morphology, not literacy** — relevance to reading assessment is indirect.
**TIER:** INDICATIVE.

### Section B gaps — read this before promising Arabic coverage

- **Egyptian Arabic-to-MSA phoneme and lexical distance in children: NO USABLE SOURCE FOUND.** All developmental diglossia data retrieved is Palestinian or Kuwaiti. This is the largest single gap in the whole document, because B5 makes the tag essential and B6 forbids importing another dialect's parameters.
- **Down syndrome or intellectual disability and Arabic *reading*: NO USABLE SOURCE FOUND anywhere.** The two Arabic DS studies retrieved (Jordanian, Emirati) are about spoken morphology and phonology. The one Egyptian atypical-population study (B11) covers borderline intellectual functioning and phonological awareness, not decoding.
- **A validated Arabic early-numeracy instrument (EGMA-Arabic) normed for Egypt: NO USABLE SOURCE FOUND.**
- **Letter-name vs letter-sound as dissociable predictors in Egyptian curricula: NO USABLE SOURCE FOUND.** The IRT letter study is Palestinian.
- Aboras et al. and the PubMed-indexed "Construction of an Arabic reading test for assessment of dyslexic children" were blocked by CAPTCHA/rate-limiting and are **not** summarised anywhere.
- "Differential effects of consonant and vowel diacritics in Arabic" (ScienceDirect) blocked by robots.txt; its content is unconfirmed.

---

## 4. Section C — Early numeracy

### C1. Cardinality does not require a long counting sequence

**SOURCE:** "Predicting Age of Becoming a Cardinal Principle Knower"
**URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC10237038/ *(PMC fetch succeeded)*
**YEAR:** 2023
**POPULATION:** Preschoolers followed longitudinally, subset-knowers through cardinal-principle-knowers
**KEY FINDING:** Age of becoming a cardinal-principle knower was predicted by enumeration accuracy, discrete-quantity discrimination, verbal count-list knowledge, numeral recognition, executive function and FSIQ. Children who became CP-knowers early could typically enumerate only **up to about three or four items** — enumeration to 3–4 is "critical for learning cardinality, but with diminishing returns for enumeration of larger collections".
**IRIS DESIGN IMPLICATION:** **Do not gate cardinality assessment behind rote counting length.** A child who counts to 3 may be probed for cardinality. This directly contradicts the naive numeracy ladder in the brief, where counting (L1) precedes number sense (L3) — the proposed ladder therefore separates *rote sequence length* from *cardinality understanding* as two independently measured strands at the same tier.
**LIMITATION:** Retrieved via an AI-assisted fetch of the PMC page; exact sample size and age brackets not independently re-verified.
**TIER:** EVIDENCED, and reinforced by C2 and E-DS (Nye et al.).

### C2. Cardinality is a distinct conceptual leap and a strong predictor

**SOURCE:** Geary, vanMarle, Chu, Rouder, Hoard & Nugent, "Early Conceptual Understanding of Cardinality Predicts Superior School-Entry Number-System Knowledge," *Psychological Science*
**URL:** https://journals.sagepub.com/doi/10.1177/0956797617729817
**YEAR:** 2018
**POPULATION:** 141 children (69 boys), preschool entry to first grade
**KEY FINDING:** The age at which children grasped that number words denote specific cardinal quantities strongly predicted first-grade number-system knowledge, **controlling for IQ, executive function and parental education** — and predicted maths more consistently than reading.
**IRIS DESIGN IMPLICATION:** Cardinality is the highest-value single numeracy probe. It belongs in the **calibration stage**, not deep in the ladder.
**LIMITATION:** Typically developing US sample.
**TIER:** EVIDENCED.

### C3. Cardinality coincides with a jump in approximate number acuity

**SOURCE:** "Acquisition of the Cardinal Principle Coincides with Improvement in Approximate Number System Acuity in Preschoolers," *PLOS ONE*
**URL:** https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0153072
**YEAR:** 2016
**POPULATION:** 42 preschoolers completing, ages 36–60 months (mean 50), mostly middle-class Connecticut
**KEY FINDING:** ANS acuity gains were associated most strongly with the subset-knower → cardinal-principle-knower transition. Cardinality was typically mastered around ages 3–4, roughly **2–3 years after** children first learned to recite count words.
**IRIS DESIGN IMPLICATION:** Confirms cardinality as a **milestone checkpoint**, not a smooth accumulation — so the ladder should treat it as a gate, and a child can sit at "recites numbers, no cardinality" for years without that being an anomaly.
**LIMITATION:** n = 42, narrow demographic, one US state.
**TIER:** INDICATIVE.

### C4. Advanced counting beats basic counting as a predictor

**SOURCE:** "Which Preschool Mathematics Competencies Are Most Predictive of Fifth Grade Achievement?", *Early Childhood Research Quarterly*
**URL:** https://pubmed.ncbi.nlm.nih.gov/27057084/
**YEAR:** 2016
**POPULATION:** Primarily low-income and minority preschoolers followed to fifth grade
**KEY FINDING:** Early numeracy was the strongest predictor of later maths; **advanced counting** (cardinality, counting forward/backward from a given number) was more predictive than **basic counting** (verbal counting, one-to-one correspondence).
**IRIS DESIGN IMPLICATION:** Once basic counting is established, adaptive item selection should move to flexible/backward counting rather than re-probing basic counting.
**LIMITATION:** **Abstract only** — full text paywalled. Sample size and effect sizes unavailable.
**TIER:** INDICATIVE (abstract-level only, explicitly flagged).

### C5. Number-line estimation and visuospatial working memory predict growth

**SOURCE:** "Cognitive Predictors of Achievement Growth in Mathematics: A Five Year Longitudinal Study"
**URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC3210883/ *(PMC fetch succeeded)*
**YEAR:** 2011
**POPULATION:** 177 children with complete data, kindergarten (mean ~74 months) to grade 5
**KEY FINDING:** Number-line estimation accuracy and addition decomposition-strategy use were the most robust maths-specific predictors of long-term growth. **Visuospatial working memory** was the strongest domain-general predictor — 1 SD advantage predicted a 0.49-point yearly gain in Numerical Operations. The number-line advantage grew from a non-significant 0.14 points in grade 1 to a significant 0.79 by grade 5.
**IRIS DESIGN IMPLICATION:** Number-line/magnitude comparison is a good **long-horizon** predictor and deserves a place even though it is not an immediate instructional target. IRIS already measures `MEM.VISUAL_STM`, which is adjacent to the strongest domain-general predictor here.
**LIMITATION:** Typically developing general population; no intellectual-disability data.
**TIER:** EVIDENCED.

### C6. Patterning is its own construct and adds predictive value

**SOURCE:** Zippert & Clayback, "Finding patterns in objects and numbers: Repeating patterning in pre-K predicts kindergarten mathematics knowledge"
**URL:** https://cdn.vanderbilt.edu/vu-sub/wp-content/uploads/sites/280/2023/07/19032253/ZippertClaybackBRJ.pdf
**YEAR:** Vanderbilt-hosted manuscript (year not stated on the document)
**POPULATION:** 66 children, ages 4–5 (M = 4.54), US metropolitan preschool
**KEY FINDING:** After controlling for age, fluid reasoning, working memory and spatial skills, repeating-pattern skill still explained unique variance: general maths knowledge +22% (β = .61), numeracy +17% (β = .54), verbal calculation +11% (β = .43), magnitude comparison +17% (β = .54), all p < .01. Patterning correlated only moderately with fluid reasoning (r = .53).
**IRIS DESIGN IMPLICATION:** Patterning should be a **measured numeracy domain in its own right**, not folded into general cognition. IRIS already has `VSP.PATTERN` but treats it as visuospatial rather than numeracy-predictive — this finding argues for reporting it against numeracy too.
**LIMITATION:** Cross-sectional, n = 66, correlational; year of publication not confirmed from the document itself.
**TIER:** INDICATIVE.

### C7. Early number sense predicts, and low performance persists

**SOURCE:** "Early Numerical Competencies and Students with Mathematics Difficulty" (review)
**URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC3756513/ *(PMC fetch succeeded)*
**YEAR:** 2012
**POPULATION:** Review of early numerical competency and maths difficulty literature
**KEY FINDING:** Citing Jordan et al. (2007): kindergarten-fall number sense accounted for **66% of variance** in end-of-first-grade calculation and problem solving. Citing Locuniak & Jordan (2008): kindergarteners below the 25th percentile on early numeracy had a **>50% chance** of still being below it in second grade. Development of counting principles, quantity discrimination, symbol recognition and arithmetic is interconnected and hierarchical **but not strictly linear**, with individual variation in timeline.
**IRIS DESIGN IMPLICATION:** Justifies investing in a short high-yield numeracy screen. The "hierarchical but not strictly linear" phrase is the licence for the ladder to allow **out-of-order mastery** rather than forcing sequential progression.
**LIMITATION:** A secondary review — the 66% and 25th-percentile figures are **as reported by the review**, not verified against Jordan et al. (2007) or Locuniak & Jordan (2008), neither of which could be fetched. Do not quote these figures externally without checking the primaries.
**TIER:** INDICATIVE (figures are second-hand and flagged).

### C8. The subitizing range

**SOURCE:** Clements, D.H., "Subitizing: What Is It? Why Teach It?", *Teaching Children Mathematics*
**URL:** https://www.academia.edu/17682803/Subitizing_What_is_it_Why_teach_it
**YEAR:** 1999
**POPULATION:** Synthesis of developmental research, ages ~2 through early elementary
**KEY FINDING:** Perceptual subitizing is demonstrable from about age 2 for very small sets. Clements cites Potter & Levy (1968) that 2–4-year-olds show no accuracy difference across arrangements of **four or fewer** items, and Dawson (1953) that first-graders' subitizing limit for scrambled arrangements is **about four or five**.
**IRIS DESIGN IMPLICATION:** Sets a defensible design number: **subitizing items use 1–4 items**; above 4 the task becomes counting and must be scored as counting. This is the boundary between numeracy ladder Level 0 and Level 1.
**LIMITATION:** A 1999 synthesis, not new data. The cited primaries (1953, 1968, 1978) were **not independently retrieved** — the numbers are second-hand through Clements.
**TIER:** INDICATIVE. Good enough to set an item-design boundary; not good enough to quote as an empirical finding.

### Section C gaps

- **No meta-analysis ranking all early-numeracy sub-skills against one another in a single predictive model: NO USABLE SOURCE FOUND.** The ladder ordering is therefore assembled from separate studies, which is weaker than it looks.
- **Order-irrelevance as a distinct predictor: NO USABLE SOURCE FOUND.**
- **Where money and time skills sit developmentally relative to core number skills: NO USABLE SOURCE FOUND.** Only teaching-method evidence exists (F7). The "functional maths" rung of the numeracy ladder is therefore an `ENGINEERING_ASSUMPTION` in its placement.

---

## 5. Section D — Down syndrome (starting hypotheses only)

**Every row in this section is a group tendency. None of it may place an individual child.** See section 1.

### D1. Most children with DS in a national cohort were not decoding by grade 3

**SOURCE:** Næss, Nygaard, Smith et al., "Occurrence of Reading Skills in a National Age Cohort of Norwegian Children with Down Syndrome," *Brain Sciences*
**URL:** https://orca.cardiff.ac.uk/id/eprint/141601/1/Smith.%20Occurrence%20of%20reading%20skills.pub.pdf
**YEAR:** 2021
**POPULATION:** National Norwegian cohort, n = 43, age 6 at baseline, no comorbid autism, followed to third grade
**KEY FINDING:** **18.6% had measurable word decoding by third grade** (11.6% by second). At baseline none decoded formally, though **81.4% recognised some words informally**. Early readers had better vocabulary (OR = 8.04) and letter knowledge (OR = 2.77) than non-readers even controlling for nonverbal mental ability.
**INDIVIDUAL VARIABILITY:** Among those who did decode, scores ranged **2–38 words**. 81.4% of the cohort did not fit the "expected reading trajectory" at all.
**IRIS DESIGN IMPLICATION:** IRIS needs a **sensitive pre-decoding pathway** — informal word recognition and letter knowledge — because for most children in this population that is where the measurable signal is, and a decoding-first assessment would return floor-level nulls. This is a **ladder design implication, applied to every child**, not a DS-conditioned branch.
**LIMITATION:** n = 43; Norwegian, with limited DS-specific reading materials available in that language, a context-specific confound; no data on what instruction each child received.
**TIER:** INDICATIVE.

### D2. Phonological awareness matters for DS readers

**SOURCE:** Lemons & Fuchs, "Phonological awareness of children with Down syndrome," *Research in Developmental Disabilities* (via NCBI Bookshelf DARE record)
**URL:** https://www.ncbi.nlm.nih.gov/books/NBK79979/
**YEAR:** 2010
**POPULATION:** Review of 20 studies of children with DS learning to read
**KEY FINDING:** "Children with DS rely on PA skills in learning to read," and phonics-based instruction "may be beneficial for at least some of these children" — countering earlier assumptions that PA was irrelevant for this population.
**INDIVIDUAL VARIABILITY:** The phrase "at least some" is the review's own hedge and signals substantial variability.
**IRIS DESIGN IMPLICATION:** Do not drop phonological strands for this population. Keep adaptive branching rather than a fixed hierarchy.
**LIMITATION:** A DARE abstract of a review — **effect sizes could not be verified**.
**TIER:** INDICATIVE.

### D3. Letter-sound knowledge and alliteration correlate with word reading; rhyme may not precede phonemes

**SOURCE:** Kennedy, E. & Flynn, M., "Early phonological awareness and reading skills in children with Down syndrome," *Down Syndrome Research and Practice* 8(3)
**URL:** https://www.down-syndrome.org/en-gb/library/research-practice/08/3/early-phonological-awareness-reading-skills-down-syndrome/
**YEAR:** 2003
**POPULATION:** 9 children with DS, ages 5;5–8;10
**KEY FINDING:** Alliteration detection r = .887, letter-sound knowledge r = .853, letter naming r = .663 with word reading. **Only 1 of 9 showed rhyme awareness even though several had more advanced phoneme-level skills** — the typical rhyme-before-phoneme sequence did not hold.
**INDIVIDUAL VARIABILITY:** Word reading 0–31 words correct (mean 13.3) in nine children.
**IRIS DESIGN IMPLICATION:** **Do not gate phoneme-level items behind rhyme.** Probe them independently. Combined with A2 (rhyme normally precedes phonemes) this means the ladder must allow **out-of-order rungs** rather than strict sequencing — the same conclusion C7 reaches for numeracy.
**LIMITATION:** **n = 9**, no control group, decoding only, high chance levels, rhyme task flagged by the authors as underpowered.
**TIER:** INDICATIVE, very weak on its own; useful because it converges with C7 and D-general on non-linearity.

### D4. Phoneme blending can be trained, with wide individual response

**SOURCE:** Burgoyne, Duff, Snowling, Buckley & Hulme, "Training phoneme blending skills in children with Down syndrome," *Child Language Teaching and Therapy*
**URL:** https://journals.sagepub.com/doi/10.1177/0265659012474674
**YEAR:** 2013
**POPULATION:** 10 children with DS (8 boys), ages 6;11–10;6; case series, each child their own historical control
**KEY FINDING:** Significantly larger gains during intervention than during the control phase for phoneme blending with pictures (t(9) = 3.42, p < .01), without pictures (t(9) = 3.54, p < .01) and single-word reading (t(9) = 4.20, p < .01). **Transfer to nonword reading and spelling was not significant.**
**INDIVIDUAL VARIABILITY:** Word-reading gains ranged **0 to 8 words**. The one child with no progress had the lowest baseline word reading and vocabulary.
**IRIS DESIGN IMPLICATION:** Blending with picture support is a defensible activity design; **do not assume transfer** to untaught skills — each must be taught and measured.
**LIMITATION:** Authors state the case-series design "does not adequately control for threats to internal validity such as maturation"; n = 10.
**TIER:** INDICATIVE.

### D5. Structured teaching beats ordinary teaching (RCT — details unavailable)

**SOURCE:** Burgoyne, Duff, Clarke, Buckley, Snowling & Hulme, "Efficacy of a reading and language intervention for children with Down syndrome: a randomized controlled trial," *Journal of Child Psychology and Psychiatry* 53
**URL:** https://www.down-syndrome.org/en-us/research/projects/reading-language-intervention/references/
**YEAR:** 2012
**POPULATION:** **Not retrievable.** The full text was behind a Wiley 403 and a rate-limited mirror.
**KEY FINDING:** The reference page confirms an RCT comparing structured reading-and-language intervention with ordinary classroom teaching, and states the intervention "improved rates of progress compared to ordinary teaching".
**IRIS DESIGN IMPLICATION:** Default to structured, explicit sequences rather than incidental exposure.
**LIMITATION:** **This is the most important study in the field and this document cannot state its sample size, ages, dosage or effect sizes.** Only the summary sentence on the project's own reference page was read. It should be obtained properly before Phase 5 ships.
**TIER:** INDICATIVE, incomplete. Flagged for follow-up.

### D6. Verbal short-term memory — the best-known group finding, with a documented exception

**SOURCE:** Jarrold, C. & Baddeley, A., "Short-term memory in Down syndrome: Applying the working memory model," *Down Syndrome Research and Practice* 7(1)
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/07/1/short-term-memory-down-syndrome-applying-working-memory-model/
**YEAR:** 2001
**POPULATION:** Review including Kay-Raining Bird & Chapman (1994), n = 47 with DS vs TD matched on intellectual functioning
**KEY FINDING:** Impaired verbal/digit span (often **2–4 items**) alongside relatively preserved visuospatial (Corsi) span. Changing presentation modality or response mode does not remove the verbal deficit.
**INDIVIDUAL VARIABILITY:** Reports "a young woman with Down syndrome, who, in addition to being fluent in 3 languages, had a perfectly normal verbal short-term memory span".
**IRIS DESIGN IMPLICATION:** **Measure it, never assume it.** IRIS already does exactly this (`MEM.VERBAL_STM` is a measured sub-measure, not a diagnosis-derived constant) — this row is evidence that the existing architecture is right, not a reason to change it.
**LIMITATION:** Narrative synthesis; authors state the STM-to-vocabulary relationship is unresolved.
**TIER:** EVIDENCED (group tendency) with an EVIDENCED counterexample.

### D7. Visual over verbal channels, and implicit learning

**SOURCE:** Jarrold, Nadel & Vicari, "Memory and neuropsychology in Down syndrome," *Down Syndrome Research and Practice*
**URL:** https://www.down-syndrome.org/en-gb/library/research-practice/online/2008/memory-neuropsychology-down-syndrome/
**YEAR:** 2008
**POPULATION:** Narrative review across childhood and adulthood
**KEY FINDING:** Verbal STM particularly poor relative to visuospatial STM, not explained by hearing or speech-production problems. Visual-**object** long-term memory is impaired even though visual-spatial STM is relatively preserved. Implicit memory appears less affected.
**IRIS DESIGN IMPLICATION:** Supports **multimodal item presentation as a default for all children** (already IRIS's approach) rather than a DS-specific branch.
**LIMITATION:** A review that explicitly does not address individual variability — so it **cannot** justify claims about any specific child.
**TIER:** INDICATIVE.

### D8. Receptive and expressive language follow different trajectories

**SOURCE:** Chapman, R. & Hesketh, L., "Language, cognition, and short-term memory in individuals with Down syndrome," *Down Syndrome Research and Practice* 7(1)
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/07/1/language-cognition-short-term-memory-individuals-down-syndrome/
**YEAR:** 2001
**POPULATION:** Longitudinal synthesis over roughly six years
**KEY FINDING:** Comprehension keeps pace with nonverbal cognitive development through childhood while expressive language lags, the gap widening in adolescence. Auditory STM related to *current* performance but not to *rate of change*; **visuospatial STM predicted rate of change in syntax comprehension over six years**.
**INDIVIDUAL VARIABILITY:** Explicitly states "wide individual differences" and that "degrees of delay vary widely".
**IRIS DESIGN IMPLICATION:** Track receptive and expressive as separate trajectories. Note that IRIS currently measures **receptive only** — expressive production is out of MVP scope, and the parent summary must not imply otherwise.
**LIMITATION:** Synthesis; mechanisms unclear per the source.
**TIER:** INDICATIVE.

### D9. Supported vs unsupported expressive performance differ

**SOURCE:** Chapman, R., "Language learning in Down syndrome: The speech and language profile compared to adolescents with cognitive impairment of unknown origin," *Down Syndrome Research and Practice* 10(2)
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/10/2/language-learning-down-syndrome-speech-language-profile-compared-adolescents-cognitive-impairment-unknown-origin/
**YEAR:** 2006
**POPULATION:** 20 adolescents with DS (12–21) vs 16 with cognitive impairment of unknown origin, matched on chronological age and nonverbal visual cognition
**KEY FINDING:** Shorter mean length of utterance in non-previewed narratives (6.19 vs 7.85 morphemes) — **but "the expressive language deficit disappears when a preview opportunity and picture support is given."** Receptive language was significantly poorer than the comparison group.
**IRIS DESIGN IMPLICATION:** **Distinguish supported from unsupported performance in reporting.** A single number hides the thing a parent most needs to know: what the child can do *with* a scaffold. This maps onto the existing `independence` term in the DPS formula, and argues for surfacing it separately in the parent summary rather than blending it into one score.
**LIMITATION:** Comparison group heterogeneous and smaller than intended; DS sample not filtered for comorbidities.
**TIER:** INDICATIVE.

### D10. Numeracy — counting length differs, cardinality may not

**SOURCE:** Nye, J., Fluck, M. & Buckley, S., "Counting and cardinal understanding in children with Down syndrome and typically developing children," *Down Syndrome Research and Practice* 7(2)
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/07/2/counting-cardinal-understanding-down-syndrome-typically-developing/
**YEAR:** 2001
**POPULATION:** 23 children with DS (CA 3.5–7, MA 2.5–4) vs 20 TD (CA 2–4, MA 2.5–4), matched on nonverbal ability
**KEY FINDING:** Median highest count **3 (DS) vs 11 (TD)** — a large group difference. **But on the "give-x" cardinality task roughly one third of each group showed cardinal understanding, with no significant group difference.** Both groups benefited similarly from adult scaffolding.
**INDIVIDUAL VARIABILITY:** DS count-sequence range 0–19, with "some children performing comparably to typically developing peers".
**IRIS DESIGN IMPLICATION:** The clearest single argument in this document against a syndrome prior: **the group difference on one skill did not carry across to a closely related skill.** A prior derived from counting would have mis-set cardinality for a third of the DS group. Also supports scaffolded ("zone of proximal development") probing over unsupported-only measurement.
**LIMITATION:** Cross-sectional, small, possible floor effects on cardinality.
**TIER:** EVIDENCED as a caution against inference.

### D11. Arithmetic lags reading; visual number representations

**SOURCE:** Brigstocke, S., Hulme, C. & Nye, J., "Number and arithmetic skills in children with Down syndrome," *Down Syndrome Research and Practice*
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/online/2008/number-arithmetic-skills-down-syndrome/
**YEAR:** 2008
**POPULATION:** Narrative review
**KEY FINDING:** Arithmetic attainment lags reading by roughly two years on age-equivalent scores. In the cited samples only ~18% could count beyond 20 and about half could solve basic addition. Counting findings are **mixed across studies**. Numerical distance/magnitude effects appeared typical.
**INDIVIDUAL VARIABILITY:** "Wide individual differences" across all cited samples, with response depending substantially on the teaching received.
**IRIS DESIGN IMPLICATION:** **Do not use a child's reading level to predict their number level** — they dissociate. Two independent ladders, not one.
**LIMITATION:** Authors state pre-verbal number-sense findings are "inconclusive due to small sample sizes".
**TIER:** INDICATIVE.

### D12. Errorless learning retains but does not transfer

**SOURCE:** Duffy, L. & Wishart, J., "The stability and transferability of errorless learning in children with Down syndrome," *Down Syndrome Research and Practice* 2(2)
**URL:** https://www.down-syndrome.org/en-us/library/research-practice/02/2/stability-transferability-errorless-learning-down-syndrome/
**YEAR:** 1994
**POPULATION:** Study 1: 16 children with learning disabilities (8 DS), ages 6–17. Study 2: 7–8 children with DS, mean age 10.3
**KEY FINDING:** 7 of 8 retained errorlessly-learned discriminations after six weeks, needing fewer trials than the non-DS comparison group — but **"little evidence of transfer of learning to a second discrimination task"**.
**INDIVIDUAL VARIABILITY:** "Considerable variation existed within groups."
**IRIS DESIGN IMPLICATION:** Errorless formats support acquisition of *specific items*; the content model must not assume a mastered item generalises to its siblings. Practically: mastery is per-rung, evidenced on **new** items, never on the taught ones.
**LIMITATION:** The authors themselves caution errorless procedures "may reinforce superficial task strategies". n = 7–16, 1994.
**TIER:** INDICATIVE.

### Section D gaps

- **Burgoyne et al. (2012) RCT full text: NOT OBTAINED.** See D5.
- **A controlled head-to-head comparison of sight-word vs phonics instruction in DS: NO USABLE SOURCE FOUND.** The evidence is indirect.
- **Session length, frequency or dosage as an explicit variable: NO USABLE SOURCE FOUND.** None of the retrieved sources reported or tested it. Any session-length number IRIS uses is an engineering choice.
- **Retrieval practice / testing effect in DS: NO USABLE SOURCE FOUND** (bot-blocking and paywalls on every candidate).
- **A systematic review of phonics for intellectual disability broadly: NOT OBTAINED** (ScienceDirect 403).

---

## 6. Section E — Williams syndrome (starting hypotheses only)

### E1. The "language is a relative strength" claim does not survive scrutiny

**SOURCE:** Brock, J., "Language abilities in Williams syndrome: A critical review," *Development and Psychopathology*
**URL:** https://www.cambridge.org/core/journals/development-and-psychopathology/article/abs/language-abilities-in-williams-syndrome-a-critical-review/560F1905DCA1846157609E9FBC0C4BFD
**YEAR:** 2007
**POPULATION:** Critical review and re-analysis of the WS language literature
**KEY FINDING:** "Little evidence that syntax, morphology, phonology, or pragmatics are any better than predicted by nonverbal ability" — the partial exception being receptive vocabulary. Spatial-language deficits track nonverbal spatial deficits rather than being spared. The "intact language module" story is characterised as an **artifact of chronological-age-based comparisons**.
**IRIS DESIGN IMPLICATION:** **The most widely repeated fact about Williams syndrome is the one most likely to mis-set a prior.** If IRIS had implemented `if syndrome == WILLIAMS: languageLevel = high` — the exact thing the brief forbids — it would have been implementing a contested claim. This row is the strongest single justification for the diagnosis-blind placement position.
**LIMITATION:** A narrative review; depends on the matching designs of the studies it critiques.
**TIER:** EVIDENCED as a caution.

### E2. Instruction method outweighs IQ for reading outcome

**SOURCE:** "Concurrent predictors of word reading and reading comprehension for 9-year-olds with Williams syndrome," *Reading and Writing*
**URL:** https://link.springer.com/article/10.1007/s11145-021-10163-4
**YEAR:** 2021
**POPULATION:** 70 nine-year-olds with WS (mean 9.32, SD 0.27)
**KEY FINDING:** Reading instruction type was the strongest predictor of word reading — children taught with **systematic phonics scored ~16.71 points higher** on a Basic Reading Composite, an effect **independent of IQ**. For comprehension, single-word reading plus listening comprehension together accounted for **79% of variance**, consistent with the Simple View developed on typically developing children.
**INDIVIDUAL VARIABILITY:** Standard scores ranged **40 to 112** — from nonreader to above age-typical. The mechanism was not syndrome-unique.
**IRIS DESIGN IMPLICATION:** Two things. (1) **What the child was taught predicts more than their diagnosis** — so IRIS should record instructional history as parent-supplied context rather than inferring capability from a label. (2) The Simple View applies here too: report decoding and listening comprehension separately (A8).
**LIMITATION:** Cross-sectional, single age cohort; instruction method coded retrospectively from records and interviews, not assigned.
**TIER:** EVIDENCED.

### E3. Same score, different process

**SOURCE:** Laing et al., "Learning to Read in Williams Syndrome: Looking Beneath the Surface of Atypical Reading Development," *Journal of Child Psychology and Psychiatry*
**URL:** https://www.cambridge.org/core/journals/journal-of-child-psychology-and-psychiatry-and-allied-disciplines/article/abs/learning-to-read-in-williams-syndrome-looking-beneath-the-surface-of-atypical-reading-development/AFA42C367950BA93B8865F7FDDBD5473
**YEAR:** 2001
**POPULATION:** Children/adults with WS vs reading-age-matched TD children (n not available from the abstract)
**KEY FINDING:** Reading level depends on phonological skills, but development is "compromised by weak semantics". In artificial word learning the WS group learned more slowly and was **less sensitive to phonetic cues** than reading-age-matched controls, despite similar attainment on some measures.
**IRIS DESIGN IMPLICATION:** Matching on outcome is not matching on process. **IRIS should probe *how* a child reaches an answer** — via phonological or whole-word routes — not only whether they reach it. This argues for keeping distinct template variants (sound-led vs picture-led) as *diagnostic of strategy*, which IRIS's modality-pair mechanism already supports.
**LIMITATION:** Abstract-level fetch only; sample size and ages unavailable. Reading-age matching changes what is licensed.
**TIER:** INDICATIVE.

### E4. Fluent-sounding speech can mask a lower level

**SOURCE:** Zimmerer, Stojanovik et al., "Overuse of familiar phrases by individuals with Williams syndrome masks differences in language processing," *Journal of Child Language*
**URL:** https://www.cambridge.org/core/journals/journal-of-child-language/article/overuse-of-familiar-phrases-by-individuals-with-williams-syndrome-masks-differences-in-language-processing/AFBA86154393BD740269D2E1005D955B
**YEAR:** 2024
**POPULATION:** 12 children with WS (mean 9.05) vs 15 chronological-age-matched and 14 language-age-matched controls
**KEY FINDING:** Stronger lexical collocations (more formulaic phrases) than either control group, alongside **fewer complex sentences, shorter utterances and more function words**. Language "may appear more typical than it is because familiar, holistically processed expressions mask grammatical and other difficulties."
**IRIS DESIGN IMPLICATION:** Probe **generative** language, not recognition of familiar chunks. Fluency is not comprehension. For IRIS this reinforces measuring receptive comprehension with novel items rather than familiar scripts.
**LIMITATION:** n = 12; single narrative-elicitation task.
**TIER:** INDICATIVE.

### E5. Vocabulary predicts grammar better than nonverbal ability does

**SOURCE:** Purser, Stojanovik, Jarrold, Farran, Thomas & Van Herwegen, "Developmental trajectories of grammatical comprehension in individuals with Williams syndrome"
**URL:** https://journals.sagepub.com/doi/10.1177/01427237251326625
**YEAR:** 2025
**POPULATION:** 58 individuals with WS, ages 5–21, pooled cross-sectional legacy data; **only 13 completed all three measures**
**KEY FINDING:** Grammatical comprehension increases with chronological age. **Receptive vocabulary — not matrix reasoning — significantly predicted grammar.** No meaningful difference between spatial and non-spatial constructions, arguing against a syndrome-specific spatial-grammar deficit and for general developmental delay.
**IRIS DESIGN IMPLICATION:** Where a prior is wanted, a **measured** value (this child's vocabulary) beats a **label**. That is the shape of the personalization model proposed in the design document: priors come from what has been observed, not from the diagnosis field.
**LIMITATION:** Pooled legacy data with inconsistent batteries; the strongest claims rest on n = 13.
**TIER:** INDICATIVE.

### E6. Verbal STM weakness may be an articulation-rate artifact

**SOURCE:** Jarrold, Baddeley, Hewes & Phillips, "Speech timing and verbal short-term memory: Evidence for contrasting deficits in Down syndrome and Williams syndrome," *Journal of Memory and Language*
**URL:** https://memory.psych.missouri.edu/assets/doc/articles/2004/jarrold-et-al-jml-2004.pdf
**YEAR:** 2004
**POPULATION:** 14 with DS (9–18), 16 with WS (6–28), 30 TD matched on **receptive-vocabulary mental age**
**KEY FINDING:** The WS serial-recall deficit **became non-significant once articulation/speech rate was controlled**. The DS deficit did not — speech timing explained only ~7% of variance there. Same surface score, different mechanism.
**IRIS DESIGN IMPLICATION:** A low verbal-memory score can mean slow output rather than small capacity. IRIS should not present `MEM.VERBAL_STM` to parents as a capacity statement, and **untimed variants** are a legitimate accommodation that does not remove the construct.
**LIMITATION:** Small samples; authors flag caution on null results. Mental-age matching, so this speaks to mechanism contrasts, not to same-age comparison.
**TIER:** INDICATIVE.

### E7. Mathematics is delayed roughly in line with mental age

**SOURCE:** Van Herwegen et al., "Mathematical development in Williams syndrome: A systematic review"
**URL:** https://discovery.ucl.ac.uk/id/eprint/10093944/1/Van%20Herwegen_Mathematical%20abilities%20in%20WS%20systematic%20review_finalsubmitted.pdf
**YEAR:** 2020
**POPULATION:** Systematic review of 27 studies (22 publications); mean sample 19.82, median 14; only 5 studies with n > 30; 24 of 27 from UK/USA
**KEY FINDING:** Small-set subitizing (1–3) intact though slower; large-magnitude estimation impaired and **not improving with age**. Counting names learned adequately but cardinality delayed and atypical, depending **more on verbal than visuospatial ability** — an atypical pattern. Overall, "all mathematical abilities, except for simple counting and subitizing, were reported to be impaired but **in line with overall mental-age abilities**".
**INDIVIDUAL VARIABILITY:** Substantial, but "very few of the studies have explored this individual variability in further detail".
**IRIS DESIGN IMPLICATION:** Maths in WS is not a syndrome-specific extra weakness beyond general developmental level — another argument that a syndrome prior adds little over a measured level. The review's methodological findings also matter: items were often author-generated and comparison groups poorly matched, so **published WS maths norms should not be trusted as IRIS calibration data**.
**LIMITATION:** The authors themselves conclude the field lacks the evidence base needed "to inform interventions or educational practice" — only 3 longitudinal studies and **1 intervention study in the entire literature**.
**TIER:** EVIDENCED (that the evidence base is inadequate).

### E8. Attention problems are modal, not exceptional

**SOURCE:** Mervis & Klein-Tasman, "Cognitive and behavioral characteristics of children with Williams syndrome: Implications for intervention approaches"
**URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC2922953/ *(PMC fetch succeeded)*
**YEAR:** 2010
**POPULATION:** Review synthesising paediatric WS cognitive-behavioural studies
**KEY FINDING:** Concrete vocabulary largely in the normal range, contrasted with a "clear weakness" in **relational/conceptual vocabulary** (spatial, temporal, quantitative terms). Visuospatial construction the most consistent weakness. **67% of children studied had significantly elevated Attention Problems scores.** Verbal inhibition stronger than spatial.
**INDIVIDUAL VARIABILITY:** "WS is not uniformly associated with a single profile"; IQ ranges from severe intellectual disability to average. Recommends individualised intervention rather than a syndrome template.
**IRIS DESIGN IMPLICATION:** Two direct consequences. (1) **Relational and quantitative vocabulary must be assessed separately from concrete vocabulary** — and relational vocabulary is exactly the vocabulary maths instructions are written in, so a maths item that fails may be failing on its wording. IRIS's numeracy items must therefore be **language-light by design, for every child**. (2) Attention is not a footnote in this population; IRIS already measures it, which is right.
**LIMITATION:** A review; the 67% figure is drawn from underlying studies not independently verified.
**TIER:** INDICATIVE.

### E9. Auditory sensitivity is real, variable, and declines with age

**SOURCE:** "Sensory Processing in Williams Syndrome: a Narrative Review," *Review Journal of Autism and Developmental Disorders*
**URL:** https://link.springer.com/article/10.1007/s40489-019-00174-x
**YEAR:** 2019
**POPULATION:** Narrative review of 14 hyperacusis studies plus 4 broader sensory studies
**KEY FINDING:** Reported hyperacusis prevalence ranged from **4.7% to 100%** across studies, reflecting inconsistent definitions; most reported over 80%. Onset in infancy, **severity generally declining** through childhood. 81.6–90.1% of children showed atypical sensory processing overall, not only auditory.
**IRIS DESIGN IMPLICATION:** Supports the existing `MUTED_BACKGROUND_AUDIO` accommodation default for WS — **and this is the legitimate channel for syndrome information**: an access support, parent-visible and parent-overridable, that never touches scoring. The wide prevalence range argues for screening individually rather than assuming.
**LIMITATION:** The review flags severe methodological problems: no reliability/validity data for WS-specific sensory measures, mostly parent report, comparison groups rare.
**TIER:** INDICATIVE — sufficient for an accommodation default, not for anything else.

### E10. Attention shifting interacts with auditory arousal

**SOURCE:** "Challenges with shifting, regardless of disengagement: attention mechanisms and eye movements in Williams syndrome," *Journal of Neurodevelopmental Disorders*
**URL:** https://link.springer.com/article/10.1186/s11689-025-09639-z
**YEAR:** 2025
**POPULATION:** 45 with WS (9–58), 36 with other genetic intellectual disabilities (6–59), 31 TD (9–60), 32 TD infants
**KEY FINDING:** Contrary to the prior WS-specific "disengagement deficit" theory, the pattern was **general slowness and reduced frequency of gaze shifts**, not tied specifically to disengagement. Higher pupil dilation from auditory cues predicted failure to shift attention **within the WS group specifically**.
**IRIS DESIGN IMPLICATION:** Attention-demanding items presented **with concurrent sound cues** may disadvantage some children independently of the skill being measured. Since IRIS narrates items with ElevenLabs audio, timed attention tasks should not fire simultaneous alerting sounds.
**LIMITATION:** Wide age range pooled (9–58) may mask developmental change; comparison group heterogeneous.
**TIER:** INDICATIVE.

### E11. Comorbidity rates are high enough to be the default expectation

**SOURCE:** NCBI GeneReviews, "Williams Syndrome"
**URL:** https://www.ncbi.nlm.nih.gov/books/NBK1249/
**YEAR:** Periodically updated; edition date not captured
**POPULATION:** Clinical/genetic reference synthesis
**KEY FINDING:** Describes the classic asymmetric profile **but qualifies it**: speech is initially delayed and only "later becomes a relative strength". ADHD ~65%, anxiety disorders ~57%, executive-function deficits ~70%. Discomfort at sound levels ~20 dB lower than controls, ~90% with increased sound sensitivity. States IQ is stable on average but "the range of achievement is wide", and that reading outcome depends more on instructional method than IQ alone.
**IRIS DESIGN IMPLICATION:** Converges with E2 — **instruction beats label**. The comorbidity rates argue that IRIS's engagement and data-quality flags are load-bearing for this population, not edge cases.
**LIMITATION:** A clinical synthesis quoting underlying studies not independently verified; treat percentages as approximate.
**TIER:** INDICATIVE.

### Section E gaps

- **Implicit / procedural / pattern learning in WS: NO USABLE SOURCE FOUND.** Several relevant titles identified; PMC, ResearchGate and Semantic Scholar all blocked. **Do not assume a pattern-learning strength or deficit for WS anywhere in IRIS.**
- **A dedicated visuospatial-construction review: NOT OBTAINED** (403s and bot-detection on every attempt). The visuospatial-weakness claim is supported here only at review level.
- **Farran & Brock's methodological paper on vocabulary as a relative strength: NOT OBTAINED** (403 on every attempt).
- **WS numeracy intervention research: essentially nonexistent** — the systematic review found one intervention study in the field.
- **Non-UK/US evidence: none.** 24 of 27 studies in the maths review were UK/USA.

---

## 7. Section F — Adaptive assessment methodology

### F1. What a CAT actually requires

**SOURCE:** International Association for Computerized Adaptive Testing, "Introduction to CAT"
**URL:** https://iacat.org/introduction-to-cat/
**YEAR:** Undated organisational reference
**KEY FINDING:** Four components — a starting rule (fixed or informed by prior information); item selection by **maximum information** at the current ability estimate; re-estimation of ability after each item; and a stopping rule that is either **classification-based** (stop when confident about which side of a cut-point) or **precision-based** (stop at a target standard error).
**IRIS DESIGN IMPLICATION:** IRIS's adaptive stage should make each of these four an explicit, named decision rather than an emergent property of the code. **Critically: a true CAT needs a calibrated item bank.** IRIS has roughly 50 uncalibrated items. Therefore IRIS must build a **rule-based adaptive assessment, not a CAT**, and must not describe itself as using item response theory.
**LIMITATION:** Organisational overview, not peer reviewed. Did not directly address small-bank limitations.
**TIER:** EVIDENCED as a specification.

### F2. Basal and ceiling rules are conventions, not findings

**SOURCE:** "Basal and Ceiling Rules," Springer reference-work chapter
**URL:** https://www.academia.edu/75446425/Basal_and_Ceiling_Rules
**YEAR:** Reference-work chapter, year not confirmed
**KEY FINDING:** Typical basal rules use a set number of consecutive correct items (e.g. three); ceiling rules a set number of consecutive incorrect (e.g. three misses, or four misses in five items). **The chapter states explicitly that "many test companies do not publish details regarding the development of their basal and ceiling rules."** A secondary description of the Woodcock-Johnson IV puts most subtests at 6 consecutive correct / 6 incorrect, with two subtests at 5/5.
**IRIS DESIGN IMPLICATION:** **This is important and slightly deflating.** IRIS's existing `DISCONTINUE_AFTER_CONSECUTIVE_WRONG: 2` is already tagged `ENGINEERING_ASSUMPTION` in `spec.js` — and that tag is *correct*, because no published number is empirically derived. Published tests use 3, 5 and 6. **IRIS's 2 is at the aggressive end**, which shortens the test but raises the risk of stopping a child who would have recovered. This is a parameter to flag for specialist review, not to silently keep.
**LIMITATION:** Read via secondary summaries rather than the primary reference text; the WJ-IV specifics came from a study-notes site, not the examiner's manual.
**TIER:** EVIDENCED that the convention has no published empirical basis.

### F3. Concrete stopping-rule numbers from a real adaptive instrument family

**SOURCE:** HealthMeasures / PROMIS, "Stopping Rules for Computerized Adaptive Tests"
**URL:** https://www.healthmeasures.net/resource-center/measurement-science/computer-adaptive-tests-cats/stopping-rules
**YEAR:** Undated NIH-funded programme documentation
**POPULATION:** PROMIS Pediatric (8–17), Parent Proxy (5–17), Early Childhood Parent-Report (1–5)
**KEY FINDING:** Stopping combines a minimum item count, a maximum item count, and a standard-error threshold. **Adult measures use SE 0.3 theta; paediatric and parent-proxy measures relax to 0.4.** Standard paediatric CATs use a **5-item minimum**; Early Childhood CATs a **4-item minimum and 8-item maximum**; others up to a 20-item maximum.
**IRIS DESIGN IMPLICATION:** The transferable idea is not the numbers but the **policy**: for young children, PROMIS **relaxes the precision target rather than lengthening the test**. IRIS should do the same — accept lower confidence and say so, rather than keeping a tired child going. The 4–5 minimum / 8–20 maximum range is a defensible anchor for items per domain probe.
**LIMITATION:** These are **health patient-reported-outcome measures, not ability tests**, and not specific to intellectual disability. The underlying calibration studies were not retrieved.
**TIER:** INDICATIVE — a good policy model, not a numeric transfer.

### F4. A shorter precision-triggered stop is not automatically better

**SOURCE:** "The impact of computerized adaptive test termination rules on accuracy across different ability estimation methods," *EJMSTE*
**URL:** https://www.ejmste.com/download/the-impact-of-computerized-adaptive-test-termination-rules-on-accuracy-across-different-ability-15897.pdf
**YEAR:** 2025
**POPULATION:** Item bank n = 2,612; CAT evaluation n = 403; grade 6–7 students, Irbid Governorate, Jordan; mathematics
**KEY FINDING:** A **fixed 25-item** rule with maximum-likelihood estimation gave *more* accurate ability estimates than an SE-based variable-length rule (SE < 0.25). The SE-based rule only won when paired with Bayesian (MAP) estimation.
**IRIS DESIGN IMPLICATION:** The stopping rule cannot be tuned independently of the scoring method. Since IRIS's scoring is a weighted composite rather than a latent-trait estimate, **IRIS cannot borrow SE-based stopping at all** — it must use a rule-based stop (consecutive-response and coverage rules) and be honest that this is coarser.
**LIMITATION:** Typically developing middle-schoolers, one country, single study.
**TIER:** INDICATIVE.

### F5. Curriculum-based measurement — probes are short

**SOURCE:** "Curriculum-Based Measurement in Mathematics," ERIC
**URL:** https://files.eric.ed.gov/fulltext/ED521574.pdf
**YEAR:** Not stated on the document
**POPULATION:** K–elementary, including early-numeracy probes (quantity discrimination, missing number, number identification)
**KEY FINDING:** Each measure is administered for **one to eight minutes**, two minutes being most common for elementary students. Early-numeracy probes show "moderate to strong predictive validity". Monitoring frequency is tiered: benchmark students 3×/year, below-benchmark at least monthly, intensive-support students **1–3× per week**.
**IRIS DESIGN IMPLICATION:** The best available anchor for probe length: **2 minutes per domain probe** is normal practice, not a compromise. It supports IRIS's 10–20 minute total as a sum of short probes rather than one long test. The tiered monitoring frequency also maps onto IRIS's reassessment triggers.
**LIMITATION:** General elementary population, not intellectual disability. Publication year and validity coefficients unconfirmed.
**TIER:** INDICATIVE, and the most directly usable number in this section.

### F6. There is no evidence-based maximum session length

**SOURCE:** "How much testing can a kid take? Feasibility of collecting pediatric patient experience ratings of neuropsychological and psychological assessment"
**URL:** https://pmc.ncbi.nlm.nih.gov/articles/PMC8651804/ *(PMC fetch succeeded)*
**YEAR:** Not independently confirmed beyond the PMC listing
**POPULATION:** 197 clinically-referred paediatric patients, ages 5.86–19.02; appointment-length sub-sample n = 80
**KEY FINDING:** Appointments averaged **6.4–6.5 hours** (range 2.45–8.35). Only 39% of children reported feeling tired afterwards, and there was **no significant association between appointment length and reported fatigue** on most measures.
**IRIS DESIGN IMPLICATION:** **Deflating but important.** IRIS's 10–20 minute target is a good design choice for engagement and for parents — but it is **not** derivable from fatigue evidence, because that evidence does not exist in usable form. The target must be labelled an engineering decision, not a research-backed one. Anyone who claims otherwise in a pitch would be overstating.
**LIMITATION:** Single-site quality-improvement project, no validated fatigue measure, n = 80 for the duration analysis; the authors themselves say it "requires further investigation". General paediatric neuropsychology referrals, not intellectual disability, not a numeracy-testing context.
**TIER:** EVIDENCED that the number is unavailable.

### F7. Graduated prompting is standard practice but not WWC-validated

**SOURCE:** What Works Clearinghouse, *Intervention Report — System of Least Prompts*
**URL:** https://ies.ed.gov/ncee/wwc/Docs/InterventionReports/wwc_slp_010918.pdf
**YEAR:** 2018
**POPULATION:** Students with intellectual disability, ages 6–20
**KEY FINDING:** WWC was **"unable to draw any conclusions"** about the effectiveness of the System of Least Prompts. Seven single-case studies met standards with reservations (19 participants total) but WWC requires at least 5 studies from 3+ research teams with 20+ combined cases per outcome domain — not met in any domain.
**IRIS DESIGN IMPLICATION:** IRIS's hint/scaffold mechanism (one hint per item, `independence` in the DPS) is a **reasonable but not rigorously validated** design choice for this population, and must be labelled as such. This is a null-certainty verdict, not a negative finding.
**LIMITATION:** The verdict reflects insufficient aggregate evidence, not demonstrated ineffectiveness; underlying studies showed promise.
**TIER:** EVIDENCED that certainty is absent.

### F8. What maths instruction for moderate/severe ID actually looks like

**SOURCE:** "Effective Mathematics Instruction for Students With Moderate/Severe Intellectual Disability," ERIC EJ1233351
**URL:** https://files.eric.ed.gov/fulltext/EJ1233351.pdf
**YEAR:** 2019
**POPULATION:** Systematic review of 24 studies (2005–2017)
**KEY FINDING:** 75% addressed numbers and operations **including functional money and time skills**. All used systematic/graduated methods: least-to-most prompting 54%, total task chaining 75%, time delay 33%, model-lead-test 29%. 46% used concrete manipulatives or graphic organisers; **67% explicitly taught for generalisation** across materials and settings.
**IRIS DESIGN IMPLICATION:** Functional maths (money, time) is not a late add-on in this population's actual curriculum — it is central. That justifies including it in the numeracy ladder, though C-gaps mean its *position* in the ladder remains an engineering assumption. The 67% teaching-for-generalisation figure converges with D12: **generalisation must be designed in, not assumed.**
**LIMITATION:** Reviews **teaching** studies, not assessment. Extrapolating from "what teaching works" to "how prompting should work in assessment" is an inferential leap and is flagged as one. No pooled effect size.
**TIER:** INDICATIVE.

### Section F gaps

- **CAT validated for early numeracy in children with IDD: NO USABLE SOURCE FOUND.** Every CAT source is general methodology, health outcomes, or typically developing school-age.
- **An empirically derived consecutive-item count for basal/ceiling: NO USABLE SOURCE FOUND** — F2 confirms the number is a publisher convention.
- **An evidence-based maximum session length for this population: NO USABLE SOURCE FOUND** — F6 undermines rather than supplies one.
- **A pooled effect size for dynamic assessment / graduated prompting in intellectual disability: NO USABLE SOURCE FOUND** — F7 is the rigorous synthesis and it declines to conclude.
- Eding et al. (2025) Delphi study on dynamic testing in moderate-to-severe ID (DOI 10.1111/1471-3802.12706) returned 403/429 on every attempt. **Its findings are unverified and are not used.**

---

## 8. Section G — Decisions with no research support

These are the parameters Phase 5 will need that **no retrieved source supplies**.
Each must be tagged `ENGINEERING_ASSUMPTION` in `spec.js`, kept in one place, and
put in front of a specialist. Listing them here is the point: an unmarked guess
in an assessment engine is indistinguishable from a finding.

| Parameter | Why it is needed | Evidence status |
|---|---|---|
| Consecutive-error count that ends a probe | Every adaptive stop rule needs one | **F2: no published test derives it empirically.** IRIS's current value of 2 is more aggressive than the 3/5/6 used by published tests |
| Total session length target (10–20 min) | The brief specifies it | **F6: no usable fatigue evidence exists.** Defensible as a design and engagement choice only |
| Items per domain probe | Needed to budget the session | F3 gives 4–5 min / 8–20 max from a *health* instrument family; transfer is an assumption |
| Confidence-band thresholds (High/Medium/Low) | The brief requires confidence labels | No source. IRIS's existing `computeConfidence` thresholds are already tagged as assumptions |
| DPS weights 0.5 / 0.3 / 0.2 | Existing scoring | Already tagged `ENGINEERING_ASSUMPTION` in `spec.js`. Nothing found to validate or replace them |
| Level-band cut-points (34/54/74) | Existing level mapping | Already tagged. No source |
| ±8 discrepancy for strength/support classification | Existing profile logic | Already tagged. No source |
| Which Arabic letters to probe | Needed for a short letter task | **B3 says the subset should be chosen by IRT, on Arabic data.** IRIS has none, so any subset is an assumption |
| Which phonemes are MSA-only for **Egyptian** children | **B5 makes this essential** | **No Egyptian data exists in retrievable form (B6).** Requires an Egyptian speech-language specialist. Must not be generated by a language model |
| Position of functional maths (money, time) in the ladder | Needed to order the ladder | **No developmental sequencing evidence found (C-gaps).** F8 confirms only that it is taught, not when |
| Prompt/hint design and its effect on scoring | Existing `independence` term | **F7: WWC could not conclude.** Reasonable, unvalidated |

---

## 9. Section H — What this evidence base does and does not license

**It licenses:**
- A skill ladder whose *ordering* is research-informed for phonological awareness (A2, A3, B4), word-reading phases (A6), and the decoding/comprehension shift with age (A7, A8).
- Assessing letter knowledge and phonological awareness first, as the highest-yield probes (A1).
- Treating Arabic letter knowledge as a larger construct than English letter knowledge, sampling all four positional forms (B1, B3, B10).
- Tagging phonological items by dialect distance (B5) — with the tag's *contents* flagged as unvalidated until an Egyptian specialist supplies them (B6).
- Egyptian Arabic for instructions, MSA for literacy content (B10).
- Cardinality as an early, high-value probe not gated behind rote counting (C1, C2, D10).
- Two independent ladders for literacy and numeracy, because they dissociate (D11).
- Short probes of about two minutes each (F5).
- Multimodal, picture-supported, language-light items **for every child** (B11, D7, E8).
- Accommodation defaults conditioned on diagnosis — the existing, permitted channel (E9).

**It does not license:**
- Any statement about what a child can do based on their diagnosis (section 1; D6, D10, E1).
- A syndrome-derived starting level (E1 shows the best-known such claim is contested; D10 shows a group difference failing to transfer one skill sideways).
- Calling anything in IRIS validated, normed, or standardised. **There is no Arabic norming sample for any of this**, and B8 records that no standardised Arabic reading measure existed as of 2021.
- Item response theory language, ability estimates, or standard errors — IRIS has no calibrated bank (F1).
- Claiming the 10–20 minute session length is evidence-based (F6).
- Any claim about pattern learning in Williams syndrome (E gaps).
- Any claim about Arabic reading in Down syndrome — **no such evidence was found to exist** (B gaps).

---

## 10. Provenance

Compiled from four parallel literature searches (general early literacy; Down
syndrome; Williams syndrome; Arabic literacy) plus one covering early numeracy
and adaptive-assessment methodology. Each search was instructed to report only
sources it retrieved and read, to give real URLs, and to state
"NO USABLE SOURCE FOUND" rather than fill a gap. Those gap statements are
reproduced here rather than quietly dropped, because in a document like this the
absences are as load-bearing as the findings.

**Nothing in this document has been reviewed by a specialist in intellectual
disability, in Arabic literacy, or in educational assessment. It is a research
brief for engineering decisions, not a clinical or educational authority.**
