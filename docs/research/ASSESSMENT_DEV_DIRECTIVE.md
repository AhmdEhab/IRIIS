# IRIS — Child Assessment Development & Parent Assessment Functional Improvement

Act as a Senior Educational Assessment Designer, Child Learning Specialist, UX Architect, and Full-Stack Engineer.

I want you to significantly improve and complete the assessment system in IRIS.

The current Child Assessment needs to be properly developed with meaningful, well-designed questions and interactive tasks. The Parent Assessment also needs functional and UX improvements.

**Your primary reference must be the research documents I previously provided, especially the IRIS research framework and assessment analysis files. Read the original documents carefully before making implementation decisions.**

This is an implementation task, not just an audit or a proposal. I expect you to develop the actual assessment experience and integrate it into the existing IRIS system.

# PART 1 — CHILD ASSESSMENT REDESIGN

## 1. Main Objective

Build a structured, child-friendly assessment that helps IRIS understand what the child can currently do across different learning and developmental skill areas.

I do NOT want a long collection of random questions.

I want every assessment section to have a clear purpose:

- What specific skill are we checking?
- What does the child need to do?
- What does the child's response tell us?
- What should IRIS understand from the result?
- How should this information influence the child's learning plan?

Each section must assess a specific skill or a closely related group of skills.

For example:
- Communication: Can the child communicate needs and understand simple instructions?
- Early literacy: Can the child recognize letters and connect them to sounds?
- Reading: Can the child recognize familiar words and understand simple written content?
- Mathematics: Can the child recognize quantities, compare amounts, and understand basic numerical relationships?

Do not combine unrelated skills into one question or one score.

## 2. Create Clear Assessment Domains

Review the research and the existing IRIS learning curriculum, then create a concise set of meaningful assessment domains.

Consider the following areas:

### A. Communication & Language
Understand the child's current communication abilities.

Explore:
- Understanding simple spoken instructions.
- Recognizing familiar words.
- Expressing needs and choices.
- Using spoken words, gestures, signs, or alternative communication.
- Understanding basic language in familiar contexts.

Do not assume that spoken language is the only valid way to communicate.

### B. Early Literacy & Letter Recognition
Check foundational pre-reading skills.

Explore:
- Recognizing letters.
- Matching identical letters.
- Identifying familiar letter shapes.
- Connecting letters with sounds when appropriate.
- Recognizing simple written words.

Only show tasks appropriate to the child's age, learning history, and demonstrated readiness.

### C. Reading & Comprehension
Check actual reading-related abilities.

Explore:
- Recognizing familiar written words.
- Matching words to pictures.
- Understanding simple sentences.
- Answering basic questions about short written content.

Distinguish letter recognition from word recognition and reading comprehension.

Do not assume a child can read simply because they recognize letters.

### D. Mathematics & Number Concepts
Assess mathematical understanding rather than memorization alone.

Explore:
- Recognizing numbers.
- Matching numbers to quantities.
- Counting objects.
- Comparing quantities.
- Understanding more and less.
- Simple addition or subtraction when appropriate.
- Manipulating visual quantities and objects.

Distinguish rote counting from actual understanding of quantities.

### E. Visual Recognition & Matching
Explore:
- Matching identical objects.
- Recognizing differences.
- Sorting objects by basic properties.
- Matching pictures and objects.
- Recognizing simple patterns.

### F. Memory & Attention
Use short, observable tasks to explore:
- Remembering recently presented objects.
- Following short sequences.
- Maintaining attention during a simple activity.
- Completing a task with appropriate support.

Do not claim to measure a clinical memory or attention condition. Record performance within the specific task and context.

### Important domain rules

These are proposed areas to investigate, not a requirement to force every child through every domain.

- Review the provided research and existing curriculum before finalizing the domains.
- Do not create unsupported domains just to increase assessment coverage.
- Do not use one domain's result as proof of ability or difficulty in another domain.
- Do not force reading or number tasks on children who have not had the opportunity to learn them.
- Keep functional daily-life assessment primarily in the Parent Assessment rather than pretending that a short digital activity can measure all adaptive skills.

## 3. Design Meaningful Questions and Interactive Tasks

Every domain must contain a small number of carefully selected tasks.

Avoid unnecessary repetition.

Each task must:
1. Have one clearly defined target skill.
2. Use simple, child-friendly instructions.
3. Be understandable without complicated explanations.
4. Allow appropriate visual, audio, or interaction-based responses.
5. Record the child's actual response.
6. Record whether help or accommodations were used.
7. Provide appropriate positive feedback without misleading the child about the assessment result.

Examples of task formats:

- Select the correct picture.
- Match two identical objects.
- Listen to a word and select its corresponding picture.
- Follow a simple spoken instruction.
- Match a letter with another identical letter.
- Connect a number with the correct quantity of objects.
- Arrange objects in a simple sequence.
- Identify a familiar word.
- Select an answer based on a short sentence.

Use these as examples, not as a fixed list. Create the final tasks according to the research, curriculum, and actual implementation requirements.

## 4. Make the Assessment Adaptive

The assessment must not present every child with the same fixed sequence of tasks.

Implement adaptive assessment behavior:

- Begin with an appropriate starting task.
- Adjust the next task based on observed performance.
- Present simpler tasks when the child needs a more accessible entry point.
- Present more challenging tasks when the child demonstrates readiness.
- Avoid unnecessary repetition of skills already demonstrated.
- Use a limited number of follow-up tasks to clarify uncertain observations.
- Stop probing a skill when sufficient information has been collected.

Keep the assessment reasonably short.

**Target a focused assessment experience of approximately 8–15 minutes when appropriate, with the actual duration depending on the child's needs and responses.**

Do not sacrifice important assessment information just to meet a time target.

Allow the child to take breaks and resume when needed.

## 5. Assessment Response and Observation Model

Do not evaluate the child using correctness alone.

For every relevant observation, capture:

- Target skill.
- Task identifier.
- Response.
- Correctness or demonstrated performance.
- Response mode.
- Assistance or prompts used.
- Accommodation used.
- Whether the task was completed.
- Confidence in the observation.
- Whether the child had an opportunity to learn or practice the skill.

Use a distinction between:

- Demonstrated independently.
- Demonstrated with support.
- Not demonstrated during this task.
- Not enough information.
- Not previously exposed to the skill or not given the opportunity.
- Invalid or interrupted administration.

Do not treat lack of response as proof that the child cannot perform the skill.

Do not automatically interpret an incorrect answer as a stable inability.

Distinguish access difficulties, language comprehension, unfamiliarity with the task, fatigue, and the actual target skill whenever the available evidence permits.

## 6. Age, Readiness, and Accessibility

- Use age as a contextual factor, not as a rigid ability assumption.
- Do not use diagnosis or syndrome as a shortcut for estimating abilities.
- A child's actual observed performance must determine the assessment path.
- Use accessible instructions and predictable task layouts.
- Support audio instructions where appropriate.
- Allow sufficient response time.
- Avoid unnecessary time limits.
- Support different response modes where possible.
- Keep visual complexity controlled.
- Provide predictable progress indicators and breaks.

Condition-related information may inform accommodation suggestions only. It must never automatically determine the child's ability, starting level, or learning module order.

# PART 2 — PARENT ASSESSMENT FUNCTIONAL IMPROVEMENT

The Parent Assessment must become more useful, understandable, reliable, and easier to complete.

It should collect information that direct child activities cannot reliably capture.

## 1. Improve Question Organization

Organize the questions into clear, meaningful sections:

- Communication in daily life.
- Understanding and expressing needs.
- Daily independence and self-care.
- Movement and accessibility.
- Social interaction and relationships.
- Play and participation.
- Emotional and behavioral support needs.
- Health-related support needs when relevant.
- Learning opportunities and educational exposure.
- Interests, strengths, and preferred activities.
- Home environment, routines, and language context.

Do not turn the assessment into a long medical questionnaire.

Use simple Arabic parent-friendly language.

Avoid technical terminology and complicated clinical wording.

## 2. Improve Conditional Questions

Use intelligent follow-up questions instead of displaying every question to every parent.

Examples:

- If the parent indicates that the child communicates using gestures, ask how the child usually expresses requests.
- If the child needs help with daily activities, ask what kind of assistance is provided.
- If the parent reports movement difficulties, ask which specific activities are affected.
- If the parent reports difficulty with communication, clarify whether the difficulty is understanding, expressing, or both.
- If the parent reports that the child has not learned a particular skill yet, distinguish this from being unable to perform it.

Only show follow-up questions when they are relevant.

## 3. Improve Response Options and Accuracy

Avoid forcing parents to choose an answer that does not reflect reality.

Where appropriate, distinguish:

- Does independently.
- Does with some support.
- Does with substantial support.
- Does not currently demonstrate the activity.
- Has not had the opportunity to try or learn it.
- Not sure / insufficient information.

For support-needs questions, collect the relevant support type, frequency, and time when supported by the question and research framework.

Do not treat an unmet support need as equivalent to a need that is already adequately supported.

The assessment must focus on the child's actual daily experience, not assumptions based on diagnosis.

## 4. Improve the Parent Assessment User Experience

Implement:

- Clear section introductions.
- One question or a small related group of questions per screen.
- Visible progress.
- Estimated remaining time where possible.
- Previous and Next navigation.
- Ability to review and correct answers.
- Autosave after each answer.
- Reliable resume after refresh, logout, or interruption.
- Clear validation messages.
- Appropriate conditional questions.
- Clear completion confirmation.
- A useful summary of the information collected.

The parent must never lose previously submitted answers.

Make sure the saved state is consistent between the frontend and backend.

Do not rely exclusively on browser local storage for important assessment records.

## 5. Improve Parent Results and Data Quality

The resulting profile must be useful for personalization.

It should help IRIS understand:

- The child's strengths.
- Areas where additional support may be needed.
- Existing accommodations.
- Daily-life challenges.
- Learning opportunities.
- Preferred interests and activities.
- Family context.
- Confidence and limitations of the collected information.

Do not generate a single IQ-like score or a generalized severity level.

Use a descriptive profile with domain-specific observations and confidence.

When parent-reported information differs from direct child assessment, preserve and display the discrepancy instead of silently averaging the two sources.

# PART 3 — CONNECT BOTH ASSESSMENTS

This is extremely important.

The Parent Assessment and Child Assessment must work together without becoming the same assessment.

Use a two-track profile:

### Track 1: Child Learning Profile
Based on direct child assessment and observed learning performance.

### Track 2: Caregiver Functional & Support Profile
Based on parent-reported daily functioning, support needs, opportunities, interests, and environment.

Combine their relevant information to generate better learning priorities.

The flow should be:

Parent Assessment + Child Assessment
→ Child Profile
→ Learning Priorities
→ First Learning Plan
→ Adaptive Activities
→ Progress Observations
→ Updated Learning Priorities

The AI personalization system must use actual observations and confidence levels.

Do not allow diagnosis alone to determine what the child learns next.

Do not treat parent-reported information as direct proof of academic ability.

Do not treat a short digital assessment as a clinical diagnosis.

# PART 4 — RESEARCH AND VALIDITY REQUIREMENTS

The provided research documents must guide the implementation.

Important principles to preserve:

- A multidimensional profile, never a single score.
- Measure habitual functioning in context.
- Distinguish inability from lack of opportunity.
- Use caregiver information for daily-life functioning.
- Use direct child assessment for observable learning performance.
- Record accommodations and support used.
- Respect the child's language and educational exposure.
- Include strengths, interests, play, and participation.
- Use short repeated observations for instructional tuning.
- Never use the assessment to diagnose a medical or developmental condition.

All questions must be original IRIS-authored questions. Do not copy copyrighted assessment items or claim that IRIS is a validated clinical instrument.

The research pack does not establish psychometric validation for a self-administered digital Arabic questionnaire. Preserve this limitation in the product's internal documentation and do not claim clinical validity or proven educational outcomes.

# PART 5 — TECHNICAL IMPLEMENTATION

Inspect the existing assessment architecture before changing it.

Preserve and improve:

- Existing assessment APIs.
- Database persistence.
- Assessment versioning.
- Existing historical records.
- Draft saving and resuming.
- Child ownership and authorization.
- Scoring and profile generation.
- Parent and Child navigation.
- First Plan integration.
- Existing test infrastructure.

Do not overwrite old assessment records.

If the new assessment requires a new version, implement explicit versioning and backward-compatible handling.

Keep assessment questions and task definitions data-driven wherever appropriate so new tasks can be added without rewriting the entire assessment engine.

Keep scoring logic separate from UI rendering.

Validate all submitted answers on the backend.

Ensure one family's assessment data cannot be accessed by another family.

Do not introduce mock assessment results or fake completion states.

# PART 6 — TESTING AND ACCEPTANCE CRITERIA

Test the actual experience, not only the underlying code.

### Child Assessment
- Every domain has a clear target skill.
- Questions and tasks are meaningful and not unnecessarily repetitive.
- Adaptive task selection works correctly.
- Age and readiness rules work.
- Different response modes are handled.
- Assistance and accommodations are recorded.
- No opportunity is not treated as failure.
- Breaks and resuming work.
- Results accurately represent observed performance.

### Parent Assessment
- Conditional follow-ups work.
- Questions are understandable.
- Progress tracking works.
- Answers autosave.
- Refresh and interruption do not lose data.
- Previous answers can be edited.
- Completion and summary work.
- Backend records are correct.

### Integration
- Both assessment tracks remain distinct.
- The combined child profile is generated correctly.
- First Plan uses the appropriate information.
- Existing users and historical records remain compatible.
- Personalization does not depend on diagnosis alone.

Run the existing test suites and add tests for all newly implemented logic.

Do not claim successful testing unless the tests were actually executed.

# PART 7 — DELIVERABLES

After implementation, provide:

1. The final Child Assessment domains.
2. The actual questions and interactive tasks added.
3. The target skill measured by each section.
4. The adaptive assessment rules.
5. The final Parent Assessment structure.
6. The conditional follow-up logic.
7. The technical changes and database changes, if any.
8. How both assessment tracks connect to the child profile and First Plan.
9. Test results.
10. Remaining limitations and items requiring specialist review.

## FINAL INSTRUCTION

I do not want a superficial redesign or a collection of generic questions.

I want a genuinely useful, concise, child-friendly assessment system where every section has a clear educational purpose, every question provides meaningful information, and the collected data directly improves IRIS personalization.

Improve the actual Parent Assessment functionality as well, not just its appearance.

Use the research files as the foundation, preserve the existing working IRIS architecture, and implement the complete solution carefully.