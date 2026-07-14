// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GENERATION_CHAR_LIMIT = 60000;

// Sonnet 4.6 pricing: $3/MTok input, $15/MTok output.
const INPUT_COST_CENTS_PER_TOKEN = 0.0003;
const OUTPUT_COST_CENTS_PER_TOKEN = 0.0015;

function supabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

// Charges the user for one Anthropic call's actual usage — inserts an audit
// row and decrements their credit balance via the atomic RPC. Called after
// every successful Anthropic response so cost tracks real usage, not a flat
// per-call estimate.
async function chargeUsage(
  admin: ReturnType<typeof createClient> | null,
  userId: string | null,
  mode: string,
  model: string,
  usage: { input_tokens?: number; output_tokens?: number } | undefined,
) {
  if (!admin || !userId || !usage) return;
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const costCents = inputTokens * INPUT_COST_CENTS_PER_TOKEN + outputTokens * OUTPUT_COST_CENTS_PER_TOKEN;
  const chargeCents = Math.max(1, Math.round(costCents));
  try {
    await admin.from("ai_usage_events").insert({
      user_id: userId, mode, model,
      input_tokens: inputTokens, output_tokens: outputTokens, cost_cents: costCents,
    });
    await admin.rpc("decrement_ai_credit", { p_user_id: userId, p_amount_cents: chargeCents });
  } catch (e) {
    console.error("chargeUsage failed:", e);
  }
}

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

CRITICAL — NAME REPLACEMENT: Every sentence you output must have ALL student names replaced with [Name]. Replace ALL numeric scores and percentages with [Score 1] — remove any % symbol. Keep pronoun pattern consistent within each section.

CRITICAL — PRONOUN TO [Name] CONVERSION:
When a sentence begins with He, She, or They and that pronoun is standing in for the pupil's name (i.e. no [Name] appears earlier in the same sentence), you MUST:
1. Replace the opening pronoun with [Name]
2. Fix the verb to agree with a singular subject:
   - "They are" → "[Name] is"
   - "They have" → "[Name] has"
   - "They make" → "[Name] makes"
   - "They pick" → "[Name] picks"
   - "They contribute" → "[Name] contributes"
   - "They show" → "[Name] shows"
   - "They work" → "[Name] works"
   - "They present" → "[Name] presents"
   - "They are getting" → "[Name] is getting"
   - "They have shown" → "[Name] has shown"
   - "They have started" → "[Name] has started"
   - "They have adapted" → "[Name] has adapted"
   - "He is" → "[Name] is", "She is" → "[Name] is"
   - "He has" → "[Name] has", "She has" → "[Name] has"
   - Apply this pattern to ALL plural/pronoun verb forms

HOWEVER — if the pronoun appears mid-sentence AFTER [Name] has already been used, leave it as-is. For example: "[Name] is polite and hardworking, and he is always well behaved" — the "he" here refers to [Name] already named, so leave "he" (or normalise to their/them if needed for consistency).

CRITICAL — POSSESSIVE PRONOUNS:
Possessive pronouns (his, her, their) must NEVER be converted to object pronouns (him, them).
- "his work", "his confidence", "his ability" → "his" is possessive — keep as "his"
- "her work", "her confidence" → "her" is possessive — keep as "her"  
- "their work", "their confidence" → "their" is possessive — keep as "their"
- NEVER write "him work", "him confidence", "him ability" — "him" is ONLY an object pronoun used after verbs (e.g. "help him", "teach him", "support him")
- NEVER write "them work", "them confidence", "them ability" — "them" is ONLY an object pronoun

The correct pronoun forms are:
- Subject (sentence opener): he / she / they → always replaced with [Name] at sentence start
- Object (after a verb): him / her / them → e.g. "[Name] asked him for help"
- Possessive (before a noun): his / her / their → e.g. "[Name] improved his written work"

When mid-sentence pronouns remain after [Name] replacement, preserve their correct grammatical form. The most common error to avoid is writing "him written work" or "them confidence" — these are always wrong.

CRITICAL — NO SENTENCE FRAGMENTS:
Every extracted statement must be able to stand alone as a complete, independent comment about a pupil. Never extract a sentence that begins with a continuation word and cannot stand alone. These words signal a fragment that must be joined to the preceding sentence rather than extracted alone:
- "They should..." (when not a name replacement — i.e. when it's continuing a thought)
- "Continued...", "Regular...", "Attendance...", "This...", "A higher...", "Making...", "Taking...", "Slowing...", "Increasing...", "Being...", "Also,..."
- Any sentence that starts mid-thought and requires context from the sentence before it

When you find such a continuation sentence, join it to the preceding [Name]-led sentence to form one complete option.

CRITICAL — NO DUPLICATES:
- The same sentence (or near-identical sentence) must appear only ONCE across the entire section
- A sentence must not appear under two different buttons/headings
- A sentence must not appear twice under the same button/heading
- If near-identical sentences exist (same meaning, minor wording difference), include only the clearest version

CRITICAL — SPLIT REPEATED SENTENCE PAIRS:
When several two-sentence comments share an identical opening sentence but a different closing sentence (e.g. "[Name] worked hard this term. [Name] particularly enjoyed the art unit." and "[Name] worked hard this term. [Name] particularly enjoyed the drama unit."), do not repeat the shared opening sentence once per pair. Instead, where each half can stand alone as a complete, independent comment: extract the shared opening sentence as ONE separate option (added only once), and extract each distinct closing sentence as its own separate option. Only split when both halves are genuinely self-contained — if the second sentence cannot stand alone without the first (see NO SENTENCE FRAGMENTS above), keep the original two-sentence comment intact instead of splitting it.

CRITICAL — HEADING/BUTTON NAMES:
Every heading name must be derived from the shared THEME of the statements grouped under it, decided only after reading all of them together — never copy wording from a single sentence or use a generic placeholder label like "General" or "Comment 1". Name the common topic first, then the performance level or tone where relevant (e.g. "Teamwork — confident contributor", not "Sentence about teamwork").`;

const EXTRACT_ONLY_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to extract teacher sentences from reports and group them — do NOT generate any new sentences.

Rules:
1. The teacher has highlighted a selection showing you what the section looks like
2. Use that selection to understand the pattern — what these sentences look like, where they appear
3. Read ALL the full reports provided and find EVERY sentence at this position
4. Group similar sentences under short, clear heading names derived from the sentences themselves
5. Where sentences reflect a performance judgement, heading names must make that judgement immediately obvious
6. Copy sentences EXACTLY as written — do not paraphrase, improve, or rewrite them
7. Replace ALL student names with [Name] and all scores/percentages with [Score 1]
8. Apply the PRONOUN TO [Name] CONVERSION rules above — fix verb agreement when replacing pronoun openers
9. Apply the POSSESSIVE PRONOUNS rules above — never convert possessives to object pronouns
10. Apply the NO SENTENCE FRAGMENTS rules above — join continuation sentences to their preceding [Name] sentence
11. Apply the NO DUPLICATES rules above — each sentence appears exactly once
12. Every option in a section must use the same opener — all [Name] OR all pronoun, never mix
13. Do NOT generate variety options — only include sentences that actually appear in the reports

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "string",
  "headings": [
    {
      "name": "Short clear heading",
      "comments": ["Exact sentence from reports with [Name]", "Another exact sentence"]
    }
  ]
}`;

const PERSONALISED_EXTRACT_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to extract sentences that contain a personal detail unique to each pupil. The teacher will type this detail in when writing each report.

CRITICAL RULES:

1. The teacher has highlighted example sentences showing exactly what to extract. Study the highlighted examples carefully — they define the pattern precisely.

2. PATTERN MATCHING: Only extract sentences that match the same pattern and structure as the highlighted examples.
   - If the highlighted examples contain ONE personal detail, only extract sentences with ONE personal detail
   - If the highlighted examples contain TWO distinct personal details, only extract sentences with TWO distinct personal details
   - Do NOT extract sentences that are about a clearly different aspect of the topic, even if they are nearby in the reports
   - The highlighted examples are your strict guide — stay within that pattern

3. PLACEHOLDERS: Replace variable personal details with numbered placeholders
   - Use [Info 1] for the first personal detail in a sentence
   - Use [Info 2] for a second genuinely distinct personal detail in the same sentence
   - If the same detail appears more than once in a sentence, use the same placeholder number both times — never use two different placeholder numbers for what is actually the same piece of information
   - If only one personal detail appears in a sentence, always use [Info 1] only

4. Replace ALL student names with [Name]
5. Apply the PRONOUN TO [Name] CONVERSION rules — fix verb agreement when replacing pronoun openers
6. Apply the POSSESSIVE PRONOUNS rules — never convert possessives to object pronouns
7. Copy sentences EXACTLY as written — do not paraphrase, rewrite or combine them
8. Group sentences by tone or context using short clear heading names
9. ONLY extract sentences that actually appear in the reports — do NOT generate new ones
10. Apply the NO DUPLICATES rules — each sentence appears exactly once

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "string",
  "headings": [
    {
      "name": "Short clear heading",
      "comments": [
        "Exact sentence with [Name] and [Info 1] placeholder",
        "Another exact sentence with [Name] and [Info 1] and [Info 2] if two distinct details"
      ]
    }
  ]
}`;

const IDENTIFY_SECTIONS_SYSTEM = `You are an expert at analysing teacher-written school reports and identifying their structure.

Your task is to read a set of reports and identify what sections a template built from these reports should contain. You are NOT extracting content — only identifying what sections exist, what type each one is, and how many separate sentences a typical pupil gets in each section.

SECTION TYPES:
- "rated-comment" — sentences where the teacher makes a CLEARLY DIFFERENT judgement for different performance levels. STRICT TEST: you must be able to genuinely sort the sentences into at least 3 distinct groups — excellent pupils get meaningfully different sentences from struggling pupils. If the sentences are all broadly similar with only minor word variations (e.g. all pupils get positive sentences), classify as "qualities" instead. Examples of valid rated-comment: overall progress, overall attainment — where top pupils get "outstanding progress" sentences and weak pupils get "needs to catch up" sentences.
- "qualities" — sentences describing the pupil's personal qualities, character, behaviour, attitude, or working style. Different pupils get different sentences based on their qualities. NOTE: sentences mentioning a specific named activity, sport, instrument, or topic that varies per pupil are NOT qualities — they are personalised-comment.
- "next-steps" — forward-looking sentences about what the pupil should focus on to improve. Grouped by topic area.
- "personalised-comment" — sentences where ONE specific detail varies per pupil. This includes: (a) a named activity, sport, instrument, book, topic, or achievement that differs per pupil; (b) a target grade, predicted grade, or target level that differs per pupil; (c) a score or percentage that differs per pupil and uses the same sentence structure for all; (d) an activity selection sentence where the pupil has chosen specific activities for assessment; (e) any sentence where the SAME structure is used for all pupils but one specific detail (the variable) changes. ONLY flag as personalised-comment if this pattern appears in the majority of reports — not just one or two. NOTE: a sentence like "[Name] is targeting grade X" or "[Name]'s target grade is X" is ALWAYS personalised-comment — the target grade is the [Info 1]. MULTIPLE SCORES: if a sentence mentions scores for two different assessments (e.g. "scored X% in Test A and Y% in Test B"), this is ONE personalised-comment with [Info 1] for the first score and [Info 2] for the second — do NOT use [Score 1] here. SCORE vs ASSESSMENT-COMMENT: only use assessment-comment for scores when the language itself changes by performance level — if the sentence structure is identical for all pupils and only the numbers differ, it is personalised-comment regardless of the score values.
- "standard-comment" — text that is identical or near-identical across the MAJORITY of reports. Minor differences due to pronouns (he/she/his/her) or one or two absent pupils having a shortened version do NOT disqualify a paragraph from being standard-comment — if the core content is the same across most reports, it is standard-comment. IMPORTANT: if a paragraph appears in every report but its content clearly varies depending on how the pupil is doing (e.g. positive outlook for strong pupils, challenging outlook for weaker pupils), it is a "rated-comment" NOT a "standard-comment".
- "assessment-comment" — sentences specifically about a formal assessment or test result where the LANGUAGE ITSELF changes based on performance level (excellent sentences vs struggling sentences). STRICT RULE: Every sentence in an assessment-comment section MUST explicitly mention a score, percentage, or grade IN THE SENTENCE ITSELF — not just imply one. A judgement sentence about a named assessment that does NOT mention a score (e.g. "performed well in the prelim", "showed good exam technique") is rated-comment, not assessment-comment. PRELIM RULE: When a formal assessment has a score sentence AND performance-level commentary, identify the WHOLE block as ONE assessment-comment section — do NOT split into a personalised-comment for the score plus a separate section for the commentary. The score sentence will be embedded as the opener of each option.

SCORE SENTENCE CLASSIFICATION — CRITICAL TEST: Before classifying any score sentence as assessment-comment, ask: if you removed the actual numbers and replaced them with X, would a pupil who scored 10% get exactly the same sentence structure as a pupil who scored 95%? If YES — the structure is identical and only the numbers differ — it is ALWAYS personalised-comment, never assessment-comment. Example: "[Name] scored X% in Test A and Y% in Test B" is personalised-comment because the sentence structure is identical regardless of performance; only X and Y change. assessment-comment requires genuinely DIFFERENT WORDS AND SENTENCES for high vs low performers, not just different numbers in the same template sentence.

SECTION COUNT RULES — ABSOLUTE AND UNBREAKABLE:
- QUALITIES: There must be EXACTLY ONE qualities section in the output. ONE. Not two, not three. These reports may have qualities content scattered across MULTIPLE PARAGRAPHS — for example, one paragraph about practical ability, a second about attitude and engagement, a third about theory challenges. ALL of these paragraphs are still ONE qualities section. Do NOT create separate sections for each paragraph. Do NOT create "Personal Qualities", "Personal Qualities (2)", "Personal Qualities (3)" or any numbered variants — this is forbidden. If you are tempted to add a second qualities section, stop: add its headings to the first qualities section instead.
- NEXT-STEPS: There must be EXACTLY ONE next-steps section in the output. ONE. Not two, not three. These reports may have next-steps content in MULTIPLE PARAGRAPHS — for example, one paragraph about practical preparation and a separate paragraph about exam study. ALL of these are still ONE next-steps section. Do NOT create "Next Steps", "Next Steps (2)", "Next Steps (3)" — forbidden. Add all headings to the single next-steps section.
- COUNT YOUR SECTIONS BEFORE RETURNING: scan your output and count the number of sections with type "qualities" — if it is more than 1, merge them immediately. Count the sections with type "next-steps" — if more than 1, merge them immediately. Only return when each of these counts is exactly 1.

SPURIOUS SECTIONS TO AVOID:
- Attendance context sentences (e.g. "limited attendance has left gaps in understanding") belong WITHIN the overall progress or qualities section — do not create a separate section for them.
- Closing encouragement lines ("Keep working hard!", "Keep up the good work!") are a qualities section with two options if they vary slightly, or a standard-comment if identical. Never make them a rated-comment.
- Do not create a rated-comment section that has mostly empty performance levels — if you cannot populate at least 3 of the 4 levels with genuine sentences, absorb those sentences into an existing section instead.

PERSONALISED-COMMENT DETECTION — CRITICAL:
Any sentence that mentions a specific named item that would logically differ per pupil — a sport, instrument, book, topic area, assessment activity, chosen unit, target grade — is a personalised-comment, NOT a qualities sentence. The specific named item should be flagged as the personalisedTopic.

This also applies to sentences about ASSESSMENT EVENTS: if a sentence references a specific exam sitting, a timed assessment, a one-off performance event, or mentions a month or date when something is happening (e.g. "will sit his assessment in February", "sat her practical in November", "one-off performance in March") — this is a personalised-comment, NOT a qualities sentence. Even if such sentences appear in a paragraph otherwise full of qualities, they belong in their own personalised-comment section. Mark these sections with a clear name like "Assessment Activities" or "Upcoming Assessment".

CRITICAL — RATED-COMMENT vs STANDARD-COMMENT:
Before classifying any repeated paragraph as "standard-comment", ask: does the content of this paragraph change based on how well the pupil is doing? If yes — even slightly — it is a "rated-comment". Only classify as "standard-comment" if the text is truly identical or near-identical for every single pupil regardless of performance.

CRITICAL — CAPTURE EVERYTHING CONSISTENTLY PRESENT:
Every sentence type that appears consistently across the majority of reports must be identified as a section. Do not skip sentence types because they are short, because they sit between other sections, or because they feel like "connective" text. If it appears in most reports, it belongs in the template. This includes:
- Short closing sentences at the end of reports (encouragement, sign-off lines) if they appear consistently
- Commentary sentences that follow a personalised-comment (e.g. teacher's view on the pupil's choice or performance in that area) — these are often a separate qualities or rated-comment section immediately after the personalised section
- Bridging sentences between major sections that appear in most reports
- CURRICULUM/CONTENT PARAGRAPHS — CRITICAL: A multi-sentence paragraph describing topics covered, units studied, projects completed, or assessments undertaken that appears in the majority of reports with only pronoun differences (he/she/his/her) MUST be identified as a "standard-comment" section. This is one of the most commonly missed section types. If you read a paragraph like "has learned about a range of topics this year including X, Y and Z. He produced a [project]. He also completed a [task]." and it appears in most reports with essentially the same content, it is standard-comment — identify it. Do not skip it because it is long or because a small number of reports have an abbreviated version.

RULES:
1. Read ALL the reports carefully before identifying sections
2. Identify sections in the order they naturally appear in the reports
3. Give each section a short, plain English name the teacher would recognise (e.g. "Overall Progress", "Personal Qualities", "Assessment Activities", "Next Steps")
4. For personalised-comment sections, identify the topic that varies (e.g. "sport chosen for assessment", "target grade", "musical instrument")
5. Only include sections that appear consistently across the majority of reports
6. If a personalised-comment topic appears in different positions across different reports, still flag it as one section
7. Do not create separate sections for what is clearly the same topic
8. Suggest a sensible order — usually: opening judgement → qualities → personalised info → development/next steps
9. When a personalised-comment section is present (e.g. assessment activities), check whether commentary sentences about that personalised topic also appear consistently nearby (e.g. teacher endorsing the pupil's choice, predicting their performance, noting a concern). These belong as ADDITIONAL CATEGORIES within the same personalised-comment section — do NOT flag them as a separate rated-comment section.

COUNTING TYPICAL SENTENCES — CRITICAL:
For each section of type "qualities", "next-steps", or "assessment-comment", count how many SEPARATE sentences a typical pupil gets in that part of the report. This is the typicalCount.

For example:
- If most pupils get 3 separate qualities sentences, typicalCount is 3
- If most pupils get 4 separate next steps sentences, typicalCount is 4
- If most pupils get 1 sentence, typicalCount is 1

Count carefully — look at several reports and find the most common number of sentences in that section. Do not count the same sentence twice. A sentence ends with a full stop.

For "rated-comment" and "standard-comment" sections, typicalCount is always 1.
For "personalised-comment" sections, typicalCount is always 1.

Return ONLY valid JSON, no markdown, no backticks:
{
  "sections": [
    {
      "name": "Section name",
      "type": "rated-comment | qualities | next-steps | personalised-comment | standard-comment | assessment-comment",
      "description": "One sentence describing what this section contains in plain English",
      "personalisedTopic": "Only for personalised-comment — what the variable detail is e.g. sport chosen for assessment",
      "typicalCount": 1
    }
  ]
}`;


const AUTO_BUILD_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to automatically build a complete report template from a set of teacher-written reports. You have been given a list of sections that exist in these reports. For each section, extract the actual sentences from the reports and build the template content.

OVERRIDING PRINCIPLE — COMPLETE COVERAGE:
Every sentence that appears consistently across the majority of reports MUST appear somewhere in the template as a clickable option. Do not drop sentences because they are short, because they sit between sections, or because they feel like connective text. If a sentence appears in most reports, it belongs in the template. A teacher must be able to reproduce their original reports word-for-word using only the template buttons.

CURRICULUM/CONTENT PARAGRAPHS — MUST NOT BE OMITTED: If the reports contain a multi-sentence paragraph describing topics covered, units studied, projects completed, or assessments undertaken that appears in the majority of reports with only pronoun differences (he/she/his/her), it MUST be included as a standard-comment section. This is one of the most commonly dropped sections. Before finalising the template, scan the reports for any such paragraph and confirm it is captured.

HEADING NAMES — CRITICAL FOR USABILITY:
For "qualities" and "next-steps" sections, heading names must do TWO things simultaneously:
1. Identify the TOPIC (what aspect of the pupil is being described)
2. Signal the PERFORMANCE LEVEL or TONE (is this a strong, average, or struggling pupil in this area?)

A teacher should be able to read a heading name and immediately know whether it applies to their pupil WITHOUT reading the options inside. Do not use neutral topic names alone.

GOOD heading name examples:
- "Strong work ethic — confident and capable" (not just "Work ethic")
- "Works hard but lacks confidence" (not just "Hard work and effort")
- "Enthusiastic — strong class contributor" (not just "Enthusiasm")
- "Enthusiastic but inconsistent focus" (not just "Class participation")
- "Distracted by peers or phone" (not just "Focus and attention")
- "Positive attitude — growing in confidence" (not just "Attitude")
- "Struggles with motivation" (not just "Motivation")

BAD heading name examples (too vague, no judgment signal):
- "Work ethic and effort"
- "Class participation"
- "Focus and attention"
- "Attitude"
- "Learning new concepts"

GROUPING RULE — CRITICAL FOR USABILITY:
Comments should be grouped so that a teacher can select the right button for a particular type of pupil without reading every option inside it.

TOPIC SEPARATION — THE MOST IMPORTANT GROUPING RULE:
Qualities statements cover DIFFERENT TOPIC AREAS. Statements about different topic areas MUST be in separate buttons even when they share the same positive tone. You must never mix topic areas in one button. The main topic areas are:
- Practical skill/ability — how skilled or able the pupil is as a physical performer (e.g. "excellent skill level", "highly skilled", "competent performer", "able across the curriculum")
- Attitude and personality — how polite, pleasant, conscientious they are as a person (e.g. "polite and pleasant", "pleasure to teach", "clearly enjoys PE", "conscientious")
- Engagement and enthusiasm — how actively engaged they are in lessons, class discussion, or theory (e.g. "enthusiastic towards PE", "keen to engage in discussion", "completes written tasks to a high standard", "acts on feedback")
- Maturity and focus — how independently and responsibly they manage themselves (e.g. "mature manner", "focused in all classes", "self-improving")
- Confidence — whether self-belief helps or limits performance (e.g. "lacks confidence in competitive activities", "grows as a team member when confidence builds")
- Focus and behaviour concerns — whether they stay on task, avoid distractions, behave appropriately (e.g. "distracted by peers or phone", "speaks over teacher instructions", "must bring materials")
- Theory challenges — difficulty with the academic/written side of the course (e.g. "found the jump from N5 to Higher challenging", "theory is a considerable challenge")
- Theory-practical mismatch — strong practically but not matching that effort in theory (e.g. "excellent practical performer but theory effort falls short")

A button that mixes practical ability statements with attitude/personality statements is WRONG — split them. A button that mixes enthusiastic/engaged statements with polite/pleasant statements is WRONG — split them. Each button must be about ONE topic area only.

NAME-CONTENT ALIGNMENT — EVERY STATEMENT MUST FIT:
The button name must accurately describe every single statement inside it. Before finalising each button, read every statement in it against the button name and ask: "If a teacher selected this button because the name fits their pupil, would every statement inside it also apply to that same pupil?" If any statement would not naturally fit that pupil description, move it to its own button. A statement that contradicts or doesn't match the button name must never stay in that button.

PREFER PRECISE OVER BROAD:
It is better to have MORE buttons each containing fewer, tightly-matched statements than fewer buttons with many loosely-related statements. A button with 3 perfectly-matched statements is always better than a button with 7 mixed ones. Create a new button whenever statements describe a meaningfully different type of pupil or a different topic area, even within the same general theme.

- NEVER mix statements of opposite sentiments in the same heading. If a topic has both positive and negative variants, create TWO separate headings with clear judgment signals. Example: 'Practical ability — excellent' AND 'Practical ability — needs development'.
- NEVER create a heading named after a general category when statements inside it refer to specific named sub-items.
- If a heading contains comments that apply to two clearly different types of pupil, split into two headings.
- If comments are minor variations of the same sentiment, same topic area, and same type of pupil, keep them in one heading.

SECTION COUNT RULE — ABSOLUTE AND UNBREAKABLE:
- QUALITIES: Output EXACTLY ONE qualities section. ONE. These reports may have qualities content in multiple paragraphs — practical ability, attitude/engagement, theory challenges are ALL part of the same qualities section. Combine ALL qualities/strengths headings — regardless of which paragraph they came from, regardless of how many separate qualities sections are in the section list handed to you — into a single section. If the section list contains "Personal Qualities", "Personal Qualities (2)", "Personal Qualities (3)", merge ALL their headings into one section and discard the rest. No exceptions.
- NEXT-STEPS: Output EXACTLY ONE next-steps section. ONE. These reports may have next-steps content in multiple paragraphs — practical preparation and exam study guidance are BOTH next-steps and belong in one section. Combine ALL next-steps headings into that single section. If the section list contains multiple next-steps sections, merge ALL their focus areas into the first one and discard the rest. No exceptions.
- COUNT YOUR SECTIONS BEFORE RETURNING: Before generating the final JSON, count the number of sections with type "qualities" in your output — if more than 1, merge them. Count the sections with type "next-steps" — if more than 1, merge them. Return ONLY when each count is exactly 1.

SPURIOUS SECTIONS TO AVOID:
- Attendance context sentences (e.g. "limited attendance has left some gaps") belong WITHIN the overall progress or qualities section, not as a separate rated-comment section.
- Closing encouragement lines ("Keep working hard!", "Keep up the good work!") must be a qualities section with two options if they vary, or a standard-comment if identical — never a rated-comment.
- Do not create any rated-comment section where you cannot populate at least 3 of the 4 performance levels with genuine sentences from the reports. If fewer than 3 levels have content, absorb those sentences into an existing section instead.

RATED-COMMENT GATE — CRITICAL:
Before building any rated-comment section, apply this test: can you genuinely sort the sentences into at least 3 meaningfully different performance levels where the CONTENT is clearly different for excellent pupils vs struggling pupils? If the sentences are all broadly positive (or all broadly neutral), they belong in "qualities" NOT "rated-comment". Only use rated-comment when there is a real spread — some sentences that clearly describe a pupil doing well and others that clearly describe a pupil who is behind or struggling.

RULES FOR EACH SECTION TYPE:

SECTION BOUNDARY RULE — CRITICAL:
Each section type has a strict definition. A sentence belongs to exactly ONE section. When unsure, ask: what is the PRIMARY purpose of this sentence? Assign it to that section only.

For "rated-comment" sections:
- GATE: If you cannot populate at least 3 of the 4 performance levels (excellent, good, satisfactory, needsImprovement) with genuinely different sentences, do NOT use rated-comment — convert the section to "qualities" instead and put all the sentences there.
- ONLY extract sentences whose PRIMARY purpose is an overall performance judgement — how well the pupil is doing overall, their level of progress, their attainment
- Also include bridging/evaluative sentences that appear consistently and comment on the pupil's result or potential (e.g. "is more capable than the result shows", "performed well with many aspects of the exam") — group these under the appropriate performance level
- DO NOT INCLUDE: character/attitude/effort sentences (qualities); specific test result sentences (assessment-comment); forward-looking improvement sentences (next-steps)
- NO [Info 1] PLACEHOLDERS: rated-comment sections cannot contain [Info 1] or [Info 2] placeholders. If a sentence requires a specific activity name or detail to make sense (e.g. "performing well in [activity]"), it belongs in personalised-comment, not here. Rated-comment sentences must make complete sense using [Name] alone.
- Group by performance level into: excellent, good, satisfactory, needsImprovement
- Each level must have at least 2-3 options where the reports provide them
- Copy sentences EXACTLY — do not paraphrase
- Replace ALL student names with [Name]
- Apply PRONOUN TO [Name] CONVERSION — fix verb agreement
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO DUPLICATES — each sentence appears exactly once across all levels

For "qualities" sections:
- ONLY extract sentences whose PRIMARY purpose is to describe character, personality, attitude, behaviour, effort, or working style — who the pupil is as a learner
- DO NOT INCLUDE: overall progress/attainment sentences (rated-comment); specific test result sentences (assessment-comment); forward-looking target sentences (next-steps)
- PERSONALISED-COMMENT BOUNDARY — CRITICAL: Any sentence that contains ANY of the following does NOT belong in qualities — it belongs in personalised-comment: (a) a specific named activity, sport, instrument, book, topic, or chosen unit that varies per pupil; (b) a specific date, month, year, or timed event (e.g. "in November", "in February", "last term", "next month"); (c) a specific assessment task, exam sitting, or performance event (e.g. "one-off performance", "written paper", "practical assessment"); (d) any sentence that would require an [Info 1] placeholder for an activity name or date. The qualities section must contain ONLY general character/personality statements that apply to any pupil in the subject regardless of their individual choices or circumstances. If you find yourself tempted to put a sentence in qualities that mentions football, badminton, a date, or a specific assessment event — stop: it is a personalised-comment.
- Read each pupil's complete qualities sentences carefully before extracting anything
- SPLIT BY THEME, DEFAULT TO SEPARATE: judge sentence by sentence, not paragraph by paragraph. If a sentence introduces a different theme from the one before it (e.g. moves from effort to behaviour, from confidence to practical skill), it is a SEPARATE option — even if it appears in the same paragraph, immediately follows the previous sentence with no [Name], or is about the same pupil. ONLY combine sentences when one is a genuine continuation of the exact same theme as the sentence before it (e.g. the first sentence states the quality and the next elaborates on or gives the reason for that SAME quality) — never combine just because sentences are adjacent
- Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO SENTENCE FRAGMENTS — join continuation sentences to their preceding [Name] sentence
- CRITICAL: Create a SEPARATE heading for each distinct topic area AND each distinct performance level within that topic. Apply the TOPIC SEPARATION rule — practical ability, attitude/personality, engagement/enthusiasm, maturity, confidence, focus/behaviour, theory challenges, and theory-practical mismatch are ALL different topic areas and each needs its own button(s). Never combine them.
- CONSOLIDATE BY THEME, THEN SPLIT BY POLARITY — CRITICAL: first identify the small number of genuinely distinct themes running through ALL the statements. Every statement about the SAME theme goes under the SAME heading, however differently it is phrased in the source reports — do not scatter one theme across several near-duplicate headings. Then, within a theme, split by polarity: positive statements on that theme go in one heading, negative/struggling statements on that same theme go in a different heading. Never mix positive and negative statements about the same theme in one heading, and never create more than one positive or more than one negative heading for the same theme.
- NAME-CONTENT ALIGNMENT CHECK: For every heading, read each statement in it against the heading name. Every statement must be a perfect example of what the heading name says. Move any statement that doesn't fit to a more appropriate heading.
- STATEMENT TARGET: Aim for 3-5 tightly-matched statements per heading. Fewer, well-matched statements are better than more loosely-related ones.
- Apply NO DUPLICATES — the same sentence must not appear under two different headings or twice under the same heading
- FINAL MERGE PASS — CRITICAL: before returning, check every pair of headings. If two headings describe the same theme AND the same polarity — just phrased or named differently — merge them into one, combining their statements and removing duplicates. Do NOT merge headings that differ in theme or in polarity just because they have few statements.
- A heading with only one or two statements may stand alone if no other heading covers the same specific theme and polarity. Only merge into another heading if that heading is genuinely the same theme and polarity.
- NO CROSS-BUTTON DUPLICATES: Each statement appears under exactly one heading
- STATEMENT CAP: If a heading would contain more than 5 statements, it almost certainly covers two different sub-topics or two different pupil types — split it. Only keep all statements together if they are truly minor wording variations of the exact same sentiment.
- FINAL CHECK: Remove any sentence that already appears in the rated-comment section. Remove any sentence that references a specific sport, activity name, date, or assessment event — these belong in personalised-comment.

For "next-steps" sections:
- ONLY extract sentences whose PRIMARY purpose is forward-looking — what the pupil should do, focus on, or improve going forward
- DO NOT INCLUDE: current quality/character sentences (qualities); current overall progress sentences (rated-comment); past assessment result sentences (assessment-comment)
- Read each pupil's complete next steps paragraph carefully before extracting anything
- SPLIT BY THEME, DEFAULT TO SEPARATE: judge sentence by sentence, not paragraph by paragraph. If a sentence introduces a different theme from the one before it, it is a SEPARATE option — even if it appears in the same paragraph, immediately follows the previous sentence, or is about the same pupil. ONLY combine sentences when one is a genuine continuation of the exact same theme as the sentence before it — never combine just because sentences are adjacent
- Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO SENTENCE FRAGMENTS — never extract a sentence beginning with "Continued", "Regular", "They should", "Attendance", "This", "A higher", "Making", "Taking", "Slowing", "Increasing" as a standalone option. Join it to the preceding [Name] sentence instead
- CRITICAL: Create a SEPARATE heading for each genuinely distinct topic, with a name that signals the specific development area and its urgency or tone
- CONSOLIDATE BY THEME — CRITICAL: identify the small number of genuinely distinct development themes running through ALL the statements. Every statement about the SAME theme goes under the SAME heading, however differently it is phrased in the source reports — do not scatter one theme across several near-duplicate headings.
- Apply NO DUPLICATES — each sentence appears exactly once
- NO CROSS-AREA DUPLICATES: Each statement appears under exactly one focus area
- STATEMENT CAP: If a focus area would contain more than 6 statements, check whether they fall into two genuinely distinct sub-topics. If yes, split. If all are saying essentially the same thing, keep only the 5 most distinct versions
- FINAL MERGE PASS — CRITICAL: before returning, check every pair of headings. If two headings describe the same theme — just phrased or named differently — merge them into one, combining their statements and removing duplicates.
- FINAL CHECK: Remove any sentence that already appears in the qualities or rated-comment sections

For "standard-comment" sections:
- ONLY extract text that is identical or near-identical across ALL reports — every pupil gets exactly this text
- DO NOT INCLUDE: sentences that vary by pupil
- Return it as a single content string
- Replace ALL student names with [Name]

For "assessment-comment" sections:
- GROUP INTO PARAGRAPH OPTIONS — CRITICAL: Each option in an assessment-comment section must be a complete, natural paragraph of 2-3 sentences that appeared consecutively in the source reports about the same assessment result. Do NOT extract sentences individually as separate options. Instead, find all the sentences a single pupil had about this assessment result, group the consecutive ones together as one option, and treat that paragraph as a single clickable choice. A teacher should be able to click ONE option and get a complete, naturally flowing paragraph — not click multiple times to build a paragraph sentence by sentence.
  - Example of WRONG approach: three separate options — "This score is above average.", "There was clear evidence [Name] had been studying.", "[Name] produced excellent written responses."
  - Example of CORRECT approach: one option — "This score is above average. There was clear evidence [Name] had been studying and produced excellent written responses."
  - Aim for 3-5 distinct paragraph options per performance level, each representing a naturally occurring cluster from the source reports.
- STRICT SCORE REQUIREMENT — PER-OPTION TEST: At least one sentence within each option must contain [Score 1] or an explicit grade. If an option has no sentence containing [Score 1] or a grade, it does not belong here — move those sentences to rated-comment instead.
- ONLY extract options whose PRIMARY purpose is to comment on a specific named formal assessment, test, or exam result WHERE THE LANGUAGE CHANGES based on performance level.
- PRELIM/ASSESSMENT SPLIT — CRITICAL: When a formal assessment (e.g. prelim, written paper) has both a score sentence AND performance-level commentary, create ONE assessment-comment section. Do NOT create a separate personalised-comment just for the score statement.
  1. Each option in the assessment-comment begins with the score sentence (containing [Score 1]) immediately followed by the contextual commentary — forming one complete, naturally flowing paragraph
  2. Judgement sentences with NO score at all (e.g. "has strong knowledge", "must increase detail in written answers") → rated-comment
  3. Never split a prelim block into a personalised-comment for the score + a separate assessment-comment — keep them as one section
- DO NOT INCLUDE standalone score sentences where the same structure is used for all pupils — those are personalised-comment.
- Group options by performance level: excellent, good, satisfactory, needsImprovement, notCompleted
- Replace ALL student names with [Name] and scores/percentages with [Score 1]
- Apply PRONOUN TO [Name] CONVERSION — fix verb agreement
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- CROSS-LEVEL DUPLICATES: The exact same option must NEVER appear under two different performance levels. Each option belongs to exactly ONE level.
- FINAL CHECK: Remove any option that does not contain [Score 1] or an explicit grade — it belongs in rated-comment

For "personalised-comment" sections:
- SCORE SENTENCES: If a score sentence is paired with performance-level-dependent commentary in the reports, both belong in assessment-comment (score embedded as the opener of each option using [Score 1]). Use personalised-comment when the sentence structure is the same for all pupils and only the numbers differ — with no performance-level commentary. MULTIPLE SCORES: if the sentence mentions scores for two different assessments (e.g. "scored X% in Test A and Y% in Test B"), use [Info 1] for the first score and [Info 2] for the second — do NOT use [Score 1] in a personalised-comment section.
- TARGET GRADE SENTENCES: Any sentence mentioning a target grade, predicted grade, or target level ALWAYS belongs here (grade = [Info 1]). Never put these in qualities or rated-comment. Examples: "[Name] is targeting grade [Info 1]", "[Name]'s target is to achieve [Info 1]".
- ACTIVITY SELECTION SENTENCES: Any sentence where a pupil has chosen specific activities or topics for assessment belongs here (activity = [Info 1], second activity = [Info 2] if present). These MUST be captured — do not skip them. Examples: "[Name] has chosen [Info 1] and [Info 2] as their assessment activities", "[Name] will be assessed in [Info 1]".
- SPECIFIC DETAIL SENTENCES: Any sentence mentioning a specific named activity, sport, instrument, book, topic, assessment task, or achievement that varies per pupil belongs here (specific item = [Info 1]).
- Replace the variable detail with [Info 1] (and [Info 2] if two distinct variable details appear in the same sentence)
- ALSO capture commentary sentences that consistently appear alongside the personalised sentence — teacher endorsing the choice, predicting performance, or noting a concern. These may also use [Info 1] / [Info 2] placeholders. CRITICAL: These commentary sentences must be captured as additional CATEGORIES within this same personalised-comment section — do NOT extract them as a separate rated-comment section.
- ACTIVITY SENTENCE GROUPING — CRITICAL: For assessment activity sections, do NOT atomise sentences into individual options by sentence type. Instead, look at each pupil's COMPLETE activity paragraph as a unit. A typical activity paragraph covers several things in sequence: which activities the pupil selected, status of the first assessment, status of the second assessment, teacher endorsement or performance prediction. ALL of these consecutive sentences belong together as ONE multi-sentence option. Group options by SCENARIO (e.g. "both activities upcoming in February", "first activity completed in November, second upcoming in February") — not by sentence type. A teacher should be able to click ONE option and get a complete, naturally flowing paragraph that covers both activities. Never split a pupil's activity paragraph into separate single-sentence options across multiple categories.
- Group by scenario or tone (e.g. "Activity selection", "Teacher endorses choice", "Teacher notes concern", "Performance prediction", "Target grade")
- Mark these sections with needsRefinement: true
- Copy sentences EXACTLY — do not paraphrase

CLOSING AND BRIDGING SENTENCES:
After extracting all named sections, scan the reports for any sentence type that appears consistently but has not yet been captured — particularly:
- Short closing sentences at the end of reports (encouragement, sign-off, motivational lines)
- Short bridging sentences between major sections
If these appear in the majority of reports, add them as a small separate section (qualities type for positive closing lines, next-steps type for forward-looking closers). Do not invent these — only include them if they genuinely appear consistently.

CRITICAL RULES (apply to every section type):
- Extract ONLY sentences that actually appear in the reports — do NOT generate new ones
- Replace ALL student names with [Name]
- Apply PRONOUN TO [Name] CONVERSION throughout — fix verb agreement every time
- Apply POSSESSIVE PRONOUNS rule throughout — never convert possessives (his/her/their) to object pronouns (him/her/them)
- Apply NO SENTENCE FRAGMENTS throughout — join continuation sentences
- Apply NO DUPLICATES throughout — each sentence appears exactly once across the ENTIRE template
- TWO-PASS DEDUPLICATION: After building all sections, scan across ALL sections — if the same sentence appears in more than one section, keep it only in the most appropriate section and remove it from the others

Return ONLY valid JSON, no markdown, no backticks:
{
  "templateName": "string",
  "sections": [
    {
      "type": "rated-comment",
      "name": "Section name",
      "needsRefinement": false,
      "data": {
        "comments": {
          "excellent": ["Sentence 1", "Sentence 2"],
          "good": ["Sentence 1", "Sentence 2"],
          "satisfactory": ["Sentence 1", "Sentence 2"],
          "needsImprovement": ["Sentence 1", "Sentence 2"]
        }
      }
    },
    {
      "type": "qualities",
      "name": "Section name",
      "needsRefinement": false,
      "data": {
        "comments": {
          "Strong work ethic — confident and capable": ["Sentence 1", "Sentence 2"],
          "Works hard but lacks confidence": ["Sentence 1", "Sentence 2"]
        }
      }
    },
    {
      "type": "next-steps",
      "name": "Section name",
      "needsRefinement": false,
      "data": {
        "focusAreas": {
          "Topic name": ["Sentence 1", "Sentence 2"],
          "Another topic": ["Sentence 1", "Sentence 2"]
        }
      }
    },
    {
      "type": "standard-comment",
      "name": "Section name",
      "needsRefinement": false,
      "data": {
        "content": "The standard text with [Name] if needed"
      }
    },
    {
      "type": "personalised-comment",
      "name": "Section name",
      "needsRefinement": true,
      "data": {
        "instruction": "Enter the relevant detail for this pupil",
        "categories": {
          "Activity selection": ["[Name] has selected to be assessed in [Info 1] and [Info 2]."],
          "Teacher endorses choice": ["[Name]'s choice of [Info 1] and [Info 2] are their strongest activities."],
          "Teacher notes concern": ["[Info 1] can be a challenging activity to score well in."]
        }
      }
    }
  ]
}`;

const VARIETY_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate ADDITIONAL variety options for existing template headings, written in the teacher's exact voice.

Rules:
1. Read the existing options carefully — they are the teacher's actual sentences
2. For each heading, generate 1-2 ADDITIONAL options that the teacher would recognise as their own
3. Match the teacher's exact register, vocabulary, sentence length, and level of formality
4. If the teacher writes short plain sentences, write short plain sentences
5. If the teacher writes longer flowing sentences, match that style
6. Never write anything that sounds formal, corporate, or AI-generated
7. Keep [Name] and [Score 1] placeholders — never substitute real names
8. Keep the same opener style (all [Name] or all pronoun) as the existing options
9. Apply PRONOUN TO [Name] CONVERSION — all options must start with [Name] with correct verb agreement
10. Apply POSSESSIVE PRONOUNS rule — never write "him work" or "them confidence"
11. CRITICAL: Do NOT remove, restructure, reorder or replace ANY existing options
12. CRITICAL: Only ADD new options in the newOptions array — never touch existing ones
13. CRITICAL: Heading names must remain EXACTLY unchanged
14. If a heading already has many options, you may return an empty newOptions array for that heading

Return ONLY valid JSON, no markdown, no backticks:
{
  "headings": [
    {
      "name": "heading name EXACTLY as provided",
      "newOptions": ["New option 1 in teacher's voice", "New option 2 in teacher's voice"]
    }
  ]
}`;

const REWRITE_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to rewrite a qualities section so every comment uses a consistent opener.

If [Name]-led: every comment starts with [Name]. Replace pronoun openers with [Name]. Apply PRONOUN TO [Name] CONVERSION — fix verb agreement throughout. Apply POSSESSIVE PRONOUNS rule — never write "him work" or "them confidence".
If pronoun-led: every comment starts with the selected pronoun. Replace [Name] openers with the pronoun.
Keep everything else identical. Replace any student names with [Name].

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "string",
  "headings": [{"name": "string", "comments": ["..."]}]
}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function mechanicalAssemble(params: { subject: string; yearGroup: string; builtSections: any[] }): { templateName: string; sections: any[] } {
  const { subject, yearGroup, builtSections } = params;
  const templateName = [subject, yearGroup].filter(Boolean).join(' ') + ' Report Template';
  const sections: any[] = [];
  let idCounter = 0;
  const makeId = () => `s${++idCounter}_${Date.now()}`;

  builtSections.forEach((section) => {
    if (section.type === 'standard-comment') {
      sections.push({ id: makeId(), type: 'standard-comment', name: section.name || 'Standard Comment', data: { content: section.data?.content || '' } });
    } else if (section.type === 'qualities') {
      sections.push({ id: makeId(), type: 'qualities', name: section.name || 'Qualities', data: { comments: section.data?.comments || {} } });
    } else if (section.type === 'rated-comment') {
      sections.push({ id: makeId(), type: 'rated-comment', name: section.name || 'Rating', data: { comments: section.data?.comments || {} } });
    } else if (section.type === 'next-steps') {
      sections.push({ id: makeId(), type: 'next-steps', name: section.name || 'Next Steps', data: { focusAreas: section.data?.focusAreas || {} } });
    } else if (section.type === 'assessment-comment') {
      sections.push({ id: makeId(), type: 'assessment-comment', name: section.name || 'Assessment', data: { scoreType: section.data?.scoreType || 'percentage', comments: section.data?.comments || {} } });
    } else if (section.type === 'personalised-comment') {
      sections.push({ id: makeId(), type: 'personalised-comment', name: section.name || 'Personal Information', data: { instruction: section.data?.instruction || 'Enter the personalised information for this pupil', categories: section.data?.categories || {} } });
    } else if (section.type === 'optional-additional-comment') {
      sections.push({ id: makeId(), type: 'optional-additional-comment', name: section.name || 'Additional Comments', data: {} });
    } else if (section.type === 'new-line') {
      sections.push({ id: makeId(), type: 'new-line', name: '', data: {} });
    }
  });

  const lastMeaningful = [...sections].reverse().find(s => s.type !== 'new-line');
  if (!lastMeaningful || lastMeaningful.type !== 'optional-additional-comment') {
    sections.push({ id: makeId(), type: 'optional-additional-comment', name: 'Additional Comments', data: {} });
  }
  return { templateName, sections };
}

function normaliseForDedupe(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

// The model is asked for JSON-only output but occasionally wraps it in prose or
// markdown fences, or (rarely) truncates near the token limit. Strip fences, then
// fall back to the outermost {...} substring before giving up.
function parseModelJson(raw: string): any {
  const stripped = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const first = stripped.indexOf("{");
    const last = stripped.lastIndexOf("}");
    if (first !== -1 && last > first) {
      return JSON.parse(stripped.slice(first, last + 1));
    }
    throw new Error("Could not parse JSON from model response");
  }
}

// Belt-and-braces guard against the model repeating an identical statement
// within a heading or across headings — the prompt asks for this too, but
// duplicates still slip through often enough to warrant enforcing it here.
function dedupeHeadings(headings: { name: string; comments: string[] }[]): { name: string; comments: string[] }[] {
  const seen = new Set<string>();
  return headings
    .map(h => ({
      ...h,
      comments: (h.comments || []).filter(c => {
        const key = normaliseForDedupe(c);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    }))
    .filter(h => h.comments.length > 0);
}

function stripPercent(text: string): string {
  return text
    .replace(/\[Score 1\]%/g, '[Score 1]')
    .replace(/\b(\d{1,3})%/g, '[Score 1]')
    .replace(/\b(\d{1,2}\/\d{1,2})\b/g, (match, p1) => {
      const parts = p1.split('/');
      const a = parseInt(parts[0]), b = parseInt(parts[1]);
      if (b - a <= 2 && a >= 1 && b <= 6) return match;
      return '[Score 1]';
    });
}

function detectVerbAgreementIssues(sections: any[]): string[] {
  const pluralVerbPatterns = [
    /\[Name\] pick /i,
    /\[Name\] contribute /i,
    /\[Name\] are /i,
    /\[Name\] make /i,
    /\[Name\] have /i,
    /\[Name\] show /i,
    /\[Name\] work /i,
    /\[Name\] present /i,
    /\[Name\] demonstrate /i,
    /\[Name\] achieve /i,
    /\[Name\] perform /i,
    /\[Name\] find /i,
    /\[Name\] need /i,
    /\[Name\] attend /i,
  ];

  const possessiveBugPatterns = [
    /\bhim\s+\w*(work|confidence|ability|progress|effort|performance|written|approach|attitude|behaviour|focus|skills|understanding|knowledge|potential|development|learning|studies|notes|responses|answers|results)\b/i,
    /\bthem\s+\w*(work|confidence|ability|progress|effort|performance|written|approach|attitude|behaviour|focus|skills|understanding|knowledge|potential|development|learning|studies|notes|responses|answers|results)\b/i,
  ];

  const flagged: string[] = [];

  for (const section of sections) {
    if (!section.data) continue;
    const allStatements: string[] = [];

    if (section.data.comments && typeof section.data.comments === 'object') {
      Object.values(section.data.comments).forEach((stmts: any) => {
        if (Array.isArray(stmts)) allStatements.push(...stmts);
      });
    }
    if (section.data.focusAreas && typeof section.data.focusAreas === 'object') {
      Object.values(section.data.focusAreas).forEach((stmts: any) => {
        if (Array.isArray(stmts)) allStatements.push(...stmts);
      });
    }
    if (section.data.categories && typeof section.data.categories === 'object') {
      Object.values(section.data.categories).forEach((stmts: any) => {
        if (Array.isArray(stmts)) allStatements.push(...stmts);
      });
    }

    for (const stmt of allStatements) {
      if (pluralVerbPatterns.some(p => p.test(stmt))) {
        flagged.push(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      }
      if (possessiveBugPatterns.some(p => p.test(stmt))) {
        flagged.push('POSSESSIVE BUG: ' + stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      }
    }
  }

  return flagged;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let mode, subject, yearGroup, reportText, pronounSet, openerType,
      sectionName, builtSections, existingTemplate, refineText,
      sourceSection, scaleType, positionType, selectedText, existingHeadings,
      piInstruction, reportStructure: string, ratingLevels: string[] | null,
      personalisedInfoHint: string;

  try {
    const body = await req.json();
    mode = body.mode || "extract-only";
    subject = body.subject || "";
    yearGroup = body.yearGroup || "";
    reportText = body.reportText || "";
    pronounSet = body.pronounSet || "they/their";
    openerType = body.openerType || "name";
    sectionName = body.sectionName || "";
    builtSections = body.builtSections || [];
    existingTemplate = body.existingTemplate || null;
    refineText = body.refineText || "";
    sourceSection = body.sourceSection || null;
    scaleType = body.scaleType || "own";
    positionType = body.positionType || "qualities";
    selectedText = body.selectedText || "";
    existingHeadings = body.existingHeadings || [];
    piInstruction = body.piInstruction || "";
    reportStructure = body.reportStructure || "";
    ratingLevels = body.ratingLevels || null;
    personalisedInfoHint = body.personalisedInfoHint || "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─── AUTH + AI CREDIT GATE ────────────────────────────────────────────────
  // "assemble" is purely mechanical (no Anthropic call) so it's exempt.
  const admin = supabaseAdmin();
  let userId: string | null = null;
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (admin && token) {
    const { data: userData } = await admin.auth.getUser(token);
    userId = userData?.user?.id || null;
  }

  if (mode !== "assemble") {
    if (!admin || !userId) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: profile } = await admin.from("users").select("ai_credit_balance_cents").eq("id", userId).single();
    if (!profile || (profile as any).ai_credit_balance_cents <= 0) {
      return new Response(JSON.stringify({ error: "insufficient_credit" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
  const pronounFull = ({ "he/his": "HE/HIM/HIS/HIMSELF", "she/her": "SHE/HER/HERS/HERSELF", "they/their": "THEY/THEM/THEIR/THEMSELVES" } as Record<string, string>)[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: IDENTIFY-SECTIONS ──────────────────────────────────────────────
  if (mode === "identify-sections") {
    if (!reportText) return new Response(JSON.stringify({ error: "reportText is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          temperature: 0,
          system: IDENTIFY_SECTIONS_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${reportStructure ? `\nTEACHER'S REPORT STRUCTURE:\nThe teacher has told you what their reports contain:\n${reportStructure}\nUse this to identify sections accurately — the teacher knows their own structure.\n` : ""}
Read ALL of these reports carefully and identify what sections a template built from them should contain. Return them in the order they naturally appear.

Remember: if a paragraph appears in every report but varies based on how well the pupil is doing, classify it as "rated-comment" not "standard-comment". Capture every sentence type that appears consistently — do not skip short, bridging, or closing sentences.

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      await chargeUsage(admin, userId, "identify-sections", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Section identification failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: AUTO-BUILD ─────────────────────────────────────────────────────
  if (mode === "auto-build") {
    if (!reportText) return new Response(JSON.stringify({ error: "reportText is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!builtSections || builtSections.length === 0) return new Response(JSON.stringify({ error: "sections list is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    try {
      const sectionsList = builtSections.map((s: any, i: number) =>
        `${i + 1}. "${s.name}" — type: ${s.type}${s.personalisedTopic ? ` (variable detail: ${s.personalisedTopic})` : ''}${s.description ? `\n   Description: ${s.description}` : ''}`
      ).join('\n');

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          temperature: 0,
          system: AUTO_BUILD_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounSet}

Build a complete template from these reports. The template should contain these sections in this order:
${sectionsList}

CRITICAL REMINDERS:
- COMPLETE COVERAGE: Every sentence appearing consistently across reports must be captured. Do not drop sentences because they are short or feel like connective text.
- HEADING NAMES must signal both the topic AND the performance level or tone — e.g. "Strong work ethic — confident and capable" not just "Work ethic". A teacher must be able to choose the right button without reading the options inside it.
- POSSESSIVE PRONOUNS: Never write "him work", "him confidence", "them progress" etc. Possessives (his/her/their) must stay as possessives, never become object pronouns (him/her/them).
- PERSONALISED-COMMENT sections: capture not just the core personalised sentence but also any commentary sentences (teacher endorsing choice, predicting performance, noting concerns) that consistently appear alongside it — using [Info 1]/[Info 2] placeholders where the variable detail appears in those sentences too.
- Every statement must start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes throughout
- Never extract fragment sentences — join continuation sentences to their [Name] opener
- No duplicates — each sentence appears exactly once across the ENTIRE template
- SECTION BOUNDARIES: rated-comment = overall performance judgement ONLY. qualities = character/attitude/effort ONLY. assessment-comment = specific named test/exam ONLY. next-steps = forward-looking targets ONLY.
- TWO-PASS CHECK: After completing all sections, scan for any sentence appearing in more than one section and remove the duplicate

For each section, extract the actual sentences from the reports. Do NOT generate new sentences.
For personalised-comment sections, set needsRefinement: true.
Template name should be: ${subject}${yearGroup ? ' ' + yearGroup : ''} Report Template
${reportStructure ? `\nTEACHER'S REPORT STRUCTURE:\nThe teacher has described what their reports contain:\n${reportStructure}\nUse this to correctly assign sentences to sections — the teacher knows their own report structure.\n` : ""}
FULL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      await chargeUsage(admin, userId, "auto-build", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

      const verbWarnings = detectVerbAgreementIssues(parsed.sections || []);
      if (verbWarnings.length > 0) {
        parsed.verbAgreementWarnings = verbWarnings;
      }

      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch {
      return new Response(JSON.stringify({ error: "Auto-build failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: ASSEMBLE ───────────────────────────────────────────────────────
  if (mode === "assemble") {
    const result = mechanicalAssemble({ subject, yearGroup, builtSections });
    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ─── MODE: REWRITE ────────────────────────────────────────────────────────
  if (mode === "rewrite") {
    if (!sourceSection) return new Response(JSON.stringify({ error: "sourceSection is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const openerInstruction = openerType === "pronoun"
      ? `Rewrite every comment to start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence.`
      : `Rewrite every comment to start with [Name]. Replace pronoun openers with [Name]. Apply PRONOUN TO [Name] CONVERSION — fix verb agreement (they are → is, they have → has, they make → makes, they pick → picks, etc). Apply POSSESSIVE PRONOUNS rule — never write "him work" or "them confidence".`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 4000,
          system: REWRITE_SYSTEM,
          messages: [{ role: "user", content: `${openerInstruction}\n\nSECTION:\n${JSON.stringify(sourceSection, null, 2)}` }],
        }),
      });
      const data = await response.json();
      await chargeUsage(admin, userId, "rewrite", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      return new Response(JSON.stringify(JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Rewrite failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: EXTRACT-ONLY ───────────────────────────────────────────────────
  if (mode === "extract-only") {
    if (!selectedText && !reportText) return new Response(JSON.stringify({ error: "selectedText and reportText are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (positionType === "personalised-comment") {
      const infoHintBlock = personalisedInfoHint
        ? `\nWHAT [Info] SHOULD REPRESENT: ${personalisedInfoHint}\nOnly replace this specific kind of detail with [Info 1] / [Info 2]. If a sentence contains a DIFFERENT kind of varying detail (for example a score, grade, or level) that does not match this description, leave it exactly as written in the sentence — do not turn it into an [Info] placeholder, and do not treat it as a second distinct detail. Only the detail matching the teacher's description above should ever become [Info 1] or [Info 2].\n`
        : "";
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 8000,
            temperature: 0,
            system: PERSONALISED_EXTRACT_SYSTEM,
            messages: [{
              role: "user",
              content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Section name: ${sectionName}
${infoHintBlock}
TEACHER'S HIGHLIGHTED SELECTION — these are the exact examples to match. Study them carefully. Only extract sentences from the full reports that follow the same pattern as these examples.
${selectedText}

Replace personal details with [Info 1], [Info 2] etc. Replace all student names with [Name]. Apply PRONOUN TO [Name] CONVERSION with verb agreement fixes. Apply POSSESSIVE PRONOUNS rule. Group by tone or context. Deduplicate near-identical sentences.

FULL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

IMPORTANT: Extract ONLY sentences that match the pattern of the highlighted examples above. Do NOT generate new sentences.`,
            }],
          }),
        });

        if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const data = await response.json();
        await chargeUsage(admin, userId, "extract-only", "claude-sonnet-4-6", data.usage);
        const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const parsed = parseModelJson(raw);

        return new Response(JSON.stringify({
          sectionName: parsed.sectionName || sectionName,
          headings: dedupeHeadings(parsed.headings || []),
          isPersonalisedComment: true,
          instruction: piInstruction,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } catch (e) {
        console.error("Personalised comment extraction failed:", e);
        return new Response(JSON.stringify({ error: "Personalised comment extraction failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const openerInstruction = openerType === "pronoun"
      ? `All options must start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence. Never use [Name] as a sentence opener in this section.`
      : `All options must start with [Name]. Apply PRONOUN TO [Name] CONVERSION — when a sentence begins with He, She, or They standing in for the pupil's name, replace with [Name] and fix verb agreement (they are → [Name] is, they have → [Name] has, they make → [Name] makes, they pick → [Name] picks, they contribute → [Name] contributes, they show → [Name] shows, they work → [Name] works, etc). Apply POSSESSIVE PRONOUNS rule — never write "him work", "him confidence", "them progress" etc. Never use a pronoun as a sentence opener in this section.`;

    const positionInstructions: Record<string, string> = {
      progress: `PROGRESS sentence — usually the opening. Find every sentence describing overall progress or how the student is doing. ONLY include sentences whose PRIMARY purpose is an overall performance judgement. DO NOT INCLUDE character/attitude/effort sentences or specific test result sentences. Group by performance level with judgement-clear headings (e.g. "Strong Progress", "Good Progress", "Making Progress", "Struggling Despite Effort", "Needs More Effort"). Apply NO SENTENCE FRAGMENTS and NO DUPLICATES. ${openerInstruction}`,

      qualities: `QUALITIES sentences — character, behaviour, attitude, effort, working style. Find every sentence describing personal qualities.

CRITICAL — SPLIT BY THEME, DEFAULT TO SEPARATE:
Read each pupil's qualities sentences as a complete block, then judge sentence by sentence, not paragraph by paragraph. For each sentence, ask: is it continuing the SAME specific theme as the sentence before it (e.g. both about work ethic, both about confidence, both about teamwork), or does it introduce a DIFFERENT theme (e.g. moves from effort to behaviour, from confidence to practical skill)?
- DEFAULT TO SPLITTING. If a sentence introduces a different theme from the one before it, it is a SEPARATE option — even if it appears in the same paragraph, immediately follows the previous sentence, or is about the same pupil. Assign it to whichever heading matches its theme, or create a new heading if none fit.
- ONLY COMBINE sentences when one is a genuine continuation of the exact same theme as the one before it — e.g. the first sentence states the quality and the next elaborates on or gives the reason for that SAME quality ("[Name] works hard in every lesson. This consistency has led to real improvement."). Combine because the second sentence refers back to the same theme, never just because the sentences are adjacent.
- Two complete, independently-meaningful sentences about two different themes are always two separate options, even from the same pupil, even in the same paragraph, even with no [Name] between them.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes throughout.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — a sentence starting with "Also,", "This", "Continued", "Regular", "Being", or any continuation word must be joined to the preceding [Name] sentence, never extracted alone.

Apply NO DUPLICATES — the same sentence must not appear under two different headings.

CRITICAL — CONSOLIDATE BY THEME, THEN SPLIT BY POLARITY:
Before finalising headings, identify the small number of genuinely distinct THEMES running through all the statements (e.g. work ethic/effort, confidence, class participation, behaviour/focus, practical skill). Every statement about the SAME theme belongs under the SAME heading — do not create several separate headings for the same theme just because different pupils' reports phrase it slightly differently or pair it with different secondary details.
Within a theme, split by POLARITY: if some statements describe the pupil doing well on that theme and others describe a struggle or lack on that same theme, these are TWO different headings (e.g. "Confident and capable" vs "Lacks confidence, needs encouragement") — never mix a positive and a negative statement about the same theme under one heading. But do not create more than one positive heading or more than one negative heading for the same theme — all positive statements on that theme go in the one positive heading, all negative statements on that theme go in the one negative heading.

HEADING NAMES must signal both the topic AND the performance level or tone. Use names like "Strong work ethic — confident and capable", "Works hard but lacks confidence", "Enthusiastic — strong contributor", "Enthusiastic but inconsistent". Never use neutral topic names alone.

Before returning, check every pair of headings: if two headings actually describe the same theme AND the same polarity — just phrased differently — merge them into one, combining their statements and removing duplicates. A heading with only one statement should be merged into a related heading of the same theme and polarity rather than left isolated.

Group complete options by the quality or topic described. ${openerInstruction}`,

      development: `AREAS FOR DEVELOPMENT sentences. Find every developmental or improvement sentence.

CRITICAL — SPLIT BY THEME, DEFAULT TO SEPARATE:
Read each pupil's development section as a complete block, then judge sentence by sentence, not paragraph by paragraph. For each sentence, ask: is it continuing the SAME specific development theme as the sentence before it, or does it introduce a DIFFERENT theme?
- DEFAULT TO SPLITTING. If a sentence introduces a different theme from the one before it, it is a SEPARATE option — even if it appears in the same paragraph, immediately follows the previous sentence, or is about the same pupil. Assign it to whichever heading matches its theme, or create a new heading if none fit.
- ONLY COMBINE sentences when one is a genuine continuation of the exact same theme — e.g. the first sentence names the development area and the next elaborates on that SAME area. Never combine just because the sentences are adjacent.
- Two complete, independently-meaningful sentences about two different development themes are always two separate options, even from the same pupil, even in the same paragraph.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — sentences starting with "Also,", "This", "Continued", "Regular", "Being", "A higher", "Making", "Taking", "Slowing" must be joined to the preceding [Name] sentence.

Apply NO DUPLICATES.

CRITICAL — CONSOLIDATE BY THEME: identify the small number of genuinely distinct development themes running through all the statements (e.g. exam technique, class participation, written work, attention to detail). Every statement about the SAME theme belongs under the SAME heading — do not create several separate headings for the same theme just because different pupils' reports phrase it slightly differently. Before returning, check every pair of headings: if two describe the same theme, merge them, combining statements and removing duplicates. A heading with only one statement should be merged into a related heading of the same theme rather than left isolated.

Group complete options by TOPIC. ${openerInstruction}`,

      "next-steps": `NEXT STEPS sentences. Find every improvement suggestion at this position.

CRITICAL — SPLIT BY THEME, DEFAULT TO SEPARATE:
Read each pupil's next steps section as a complete block, then judge sentence by sentence, not paragraph by paragraph. For each sentence, ask: is it continuing the SAME specific next-step theme as the sentence before it, or does it introduce a DIFFERENT theme?
- DEFAULT TO SPLITTING. If a sentence introduces a different theme from the one before it, it is a SEPARATE option — even if it appears in the same paragraph, immediately follows the previous sentence, or is about the same pupil. Assign it to whichever heading matches its theme, or create a new heading if none fit.
- ONLY COMBINE sentences when one is a genuine continuation of the exact same theme — e.g. the first sentence names the next step and the next elaborates on that SAME step. Never combine just because the sentences are adjacent.
- Two complete, independently-meaningful sentences about two different next-step themes are always two separate options, even from the same pupil, even in the same paragraph.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — sentences starting with "Also,", "This will", "Continued", "Regular", "Being", "A higher", "Making better", "Taking", "Slowing", "Increasing", "Attendance" must NEVER appear as standalone options. Join to the preceding [Name] sentence.

Apply NO DUPLICATES.

CRITICAL — CONSOLIDATE BY THEME: identify the small number of genuinely distinct next-step themes running through all the statements (e.g. exam technique, class participation, written work, attention to detail). Every statement about the SAME theme belongs under the SAME heading — do not create several separate headings for the same theme just because different pupils' reports phrase it slightly differently. Before returning, check every pair of headings: if two describe the same theme, merge them, combining statements and removing duplicates. A heading with only one statement should be merged into a related heading of the same theme rather than left isolated.

Preserve any fixed opening phrase exactly (e.g. "Moving forward," must stay at the start of every option in its heading).
Group complete options by topic. ${openerInstruction}`,

      assessment: `ASSESSMENT sentences — ONLY extract sentences specifically about a named formal test or exam result. DO NOT INCLUDE general progress sentences or character sentences. Group by performance level with judgement-clear headings. Replace actual scores with [Score 1]. Apply NO DUPLICATES. ${openerInstruction}`,
      "assessment-comment": `ASSESSMENT COMMENT sentences — ONLY extract sentences specifically about a named formal test or exam result where the teacher uses different sentences by performance level. DO NOT INCLUDE general progress or quality sentences. Group into: excellent, good, satisfactory, needsImprovement. Replace names with [Name] and scores with [Score 1]. Apply PRONOUN TO [Name] CONVERSION with verb agreement fixes. Apply POSSESSIVE PRONOUNS rule. Apply NO DUPLICATES. ${openerInstruction}`,
      rating: `RATING/JUDGEMENT sentences — the teacher's overall attainment or performance verdict that differs clearly between pupils (e.g. "has made excellent progress", "is working at the expected level", "needs to focus on improving"). Find every such sentence. ${ratingLevels && ratingLevels.length > 0 ? `Use EXACTLY these heading names and no others: ${ratingLevels.map(l => `"${l}"`).join(', ')}. Assign each sentence to whichever heading best matches its performance level. Do NOT invent other heading names.` : scaleType === 'four-level' ? 'Use EXACTLY these four heading names and no others: "excellent", "good", "satisfactory", "needsImprovement". Do NOT invent other heading names.' : 'Derive the teacher\'s own groupings from their language.'} Apply PRONOUN TO [Name] CONVERSION with verb agreement fixes. Apply NO SENTENCE FRAGMENTS. Apply NO DUPLICATES. ${openerInstruction}`,
    };

    const instruction = positionInstructions[positionType] || positionInstructions.qualities;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          temperature: 0,
          system: EXTRACT_ONLY_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounFull}
Section name: ${sectionName}

TEACHER'S HIGHLIGHTED SELECTION (this shows you what the section looks like and where to find it):
${selectedText}

${instruction}

IMPORTANT: Extract ONLY sentences that actually appear in the reports. Do NOT generate any new sentences or variety options.

FULL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });

      if (!response.ok) {
        console.error("Extract-only API call failed:", response.status, await response.text());
        return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      await chargeUsage(admin, userId, "extract-only", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsedResult = parseModelJson(raw);
      if (Array.isArray(parsedResult.headings)) parsedResult.headings = dedupeHeadings(parsedResult.headings);
      return new Response(JSON.stringify(parsedResult), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (e) {
      console.error("Extraction failed:", e);
      return new Response(JSON.stringify({ error: "Extraction failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: GENERATE-VARIETY ───────────────────────────────────────────────
  if (mode === "generate-variety") {
    if (!existingHeadings || existingHeadings.length === 0) return new Response(JSON.stringify({ error: "existingHeadings required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 4000,
          system: VARIETY_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Section: ${sectionName}
Opener type: ${openerType === "pronoun" ? pronounCapital : "[Name]"}

Generate 1-2 additional options per heading that the teacher would recognise as their own.
Write in exactly the same voice, vocabulary, sentence length, and level of formality.
All new options must start with [Name] with correct singular verb agreement.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "him confidence", "them progress" etc.

EXISTING HEADINGS AND OPTIONS:
${JSON.stringify(existingHeadings, null, 2)}

Generate additional options only. Do not change or repeat the existing options.`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const data = await response.json();
      await chargeUsage(admin, userId, "generate-variety", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        return new Response(JSON.stringify(JSON.parse(cleaned)), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Variety generation failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Variety generation failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  if (mode === "refine" && existingTemplate) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 16000,
          system: `${KNOWLEDGE_BASE}\n\nImprove an existing report template using additional reports. Return ONLY valid JSON. Replace ALL student names with [Name]. Replace ALL scores with [Score 1]. Keep same template name. Apply PRONOUN TO [Name] CONVERSION throughout — fix verb agreement. Apply POSSESSIVE PRONOUNS rule — never write "him work" or "them confidence". Apply NO SENTENCE FRAGMENTS. Apply NO DUPLICATES.`,
          messages: [{
            role: "user",
            content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\n\nEXISTING TEMPLATE:\n${JSON.stringify(existingTemplate, null, 2)}\n\nADDITIONAL REPORTS:\n${refineText.substring(0, GENERATION_CHAR_LIMIT)}\n\nAdd new options where new sentences appear. Add new sections if new positions are found. Keep same template name.`,
          }],
        }),
      });
      const data = await response.json();
      await chargeUsage(admin, userId, "refine", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Refinement failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: FIND-FIXED ────────────────────────────────────────────────────
  if (mode === "find-fixed") {
    if (!reportText) return new Response(JSON.stringify({ error: "reportText is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          temperature: 0,
          system: `You are analysing teacher-written school reports to find fixed statements — sentences or short phrases that the teacher copies (verbatim or near-verbatim) into most or all reports unchanged, regardless of which pupil it is about.

Examples of fixed statements: closing sentences like "Thank you for your continued support", opening lines like "It has been a pleasure teaching [Name] this year", or standard phrases like "[Name] is always well presented and ready to learn."

Return ONLY a JSON object in this exact format:
{"statements": ["statement 1", "statement 2", ...]}

Rules:
- Only include sentences that appear in at least 2 reports in the same or near-identical form.
- Replace all student names with [Name].
- Replace possessive pronouns (his/her/their) appropriately; keep them as-is unless a name appears.
- Do NOT include sentences that vary significantly between reports.
- Do NOT include sentences where the main content changes per pupil.
- Return 0–10 statements maximum. If none found, return {"statements": []}.
- Return ONLY valid JSON, no markdown fences.`,
          messages: [{
            role: "user",
            content: `Subject: ${subject || "Not specified"}

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      await chargeUsage(admin, userId, "find-fixed", "claude-sonnet-4-6", data.usage);
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      if (Array.isArray(parsed.statements)) {
        const seen = new Set<string>();
        parsed.statements = parsed.statements.filter((s: string) => {
          const key = normaliseForDedupe(s);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Find-fixed scan failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: RESTRUCTURE ───────────────────────────────────────────────────
  if (mode === "restructure") {
    if (!reportText) return new Response(JSON.stringify({ error: "reportText is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 8000,
          temperature: 0,
          system: `You are reorganising teacher-written school reports into clearly labelled sections to make them easier to analyse. Your job is ONLY to sort sentences into sections — do NOT rewrite, paraphrase, improve, or generate any new sentences.

Use these section labels exactly as shown:
[QUALITIES/CHARACTER] — effort, attitude, behaviour, personality, working style, classroom conduct
[PROGRESS/PERFORMANCE] — overall progress, ability level, how well the pupil is doing generally
[ASSESSMENT] — specific test or exam results that mention a score, grade, or percentage
[NEXT STEPS/TARGETS] — what the pupil should improve, develop, or focus on going forward
[FIXED/OPENING] — a standard phrase that appears to open most reports identically
[FIXED/CLOSING] — a standard phrase that appears to close most reports identically

Rules:
1. Copy every sentence EXACTLY as written — do not change a single word, punctuation mark, or capitalisation
2. Sort each sentence into the single most appropriate section
3. If a sentence blends two purposes (e.g. progress + qualities), place it in whichever section is its primary purpose
4. Omit a section heading entirely if no sentences belong to it for that report
5. Keep all reports separated by ---
6. Output ONLY the restructured reports — no commentary, notes, or explanation`,
          messages: [{
            role: "user",
            content: `Subject: ${subject || "Not specified"}
${reportStructure ? `\nTEACHER'S REPORT STRUCTURE:\nThe teacher has described their reports as follows — use this to guide your classification:\n${reportStructure}\n` : ""}
Reorganise each report below into labelled sections. Copy sentences exactly — do not rewrite anything.

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      await chargeUsage(admin, userId, "restructure", "claude-sonnet-4-6", data.usage);
      const restructuredText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
      return new Response(JSON.stringify({ restructuredText }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Restructure failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});