// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 60000;

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

CRITICAL — NAME REPLACEMENT: Every sentence you output must have ALL student names replaced with [Name]. Replace ALL numeric scores and percentages with [Score] — remove any % symbol. Keep pronoun pattern consistent within each section.

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
- If near-identical sentences exist (same meaning, minor wording difference), include only the clearest version`;

const EXTRACT_ONLY_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to extract teacher sentences from reports and group them — do NOT generate any new sentences.

Rules:
1. The teacher has highlighted a selection showing you what the section looks like
2. Use that selection to understand the pattern — what these sentences look like, where they appear
3. Read ALL the full reports provided and find EVERY sentence at this position
4. Group similar sentences under short, clear heading names derived from the sentences themselves
5. Where sentences reflect a performance judgement, heading names must make that judgement immediately obvious
6. Copy sentences EXACTLY as written — do not paraphrase, improve, or rewrite them
7. Replace ALL student names with [Name] and all scores/percentages with [Score]
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
- "rated-comment" — sentences where the teacher makes a judgement about how well the pupil is doing. Different pupils get different sentences based on their performance level (excellent, good, satisfactory, needs improvement). Examples: overall progress, effort, attainment, classroom application, quality of written work.
- "qualities" — sentences describing the pupil's personal qualities, character, behaviour, attitude, or working style. Different pupils get different sentences based on their qualities.
- "next-steps" — forward-looking sentences about what the pupil should focus on to improve. Grouped by topic area.
- "personalised-comment" — sentences where the SAME topic appears across the majority of reports, but ONE specific detail varies per pupil. The detail could be a sport, a musical instrument, a book, a target grade, a topic area, or any other pupil-specific information. ONLY flag as personalised-comment if this pattern appears in the majority of reports — not just one or two.
- "standard-comment" — text that is identical or near-identical across ALL reports. Every pupil gets exactly the same text. IMPORTANT: if a paragraph appears in every report but its content clearly varies depending on how the pupil is doing (e.g. positive outlook for strong pupils, challenging outlook for weaker pupils), it is a "rated-comment" NOT a "standard-comment".
- "assessment-comment" — sentences specifically about a formal assessment or test result, where the teacher writes DIFFERENT sentences depending on performance level (excellent, good, satisfactory, struggling). Use this ONLY when the language itself changes based on how well the pupil did.
- IMPORTANT: If the assessment section uses the SAME sentence structure for every pupil but with a variable score or grade typed in (e.g. "[Name] scored X% in the test"), classify it as "personalised-comment" NOT "assessment-comment". The variable score is the personal detail.

CRITICAL — RATED-COMMENT vs STANDARD-COMMENT:
Before classifying any repeated paragraph as "standard-comment", ask: does the content of this paragraph change based on how well the pupil is doing? If yes — even slightly — it is a "rated-comment". Only classify as "standard-comment" if the text is truly identical or near-identical for every single pupil regardless of performance.

CRITICAL — CAPTURE EVERYTHING CONSISTENTLY PRESENT:
Every sentence type that appears consistently across the majority of reports must be identified as a section. Do not skip sentence types because they are short, because they sit between other sections, or because they feel like "connective" text. If it appears in most reports, it belongs in the template. This includes:
- Short closing sentences at the end of reports (encouragement, sign-off lines) if they appear consistently
- Commentary sentences that follow a personalised-comment (e.g. teacher's view on the pupil's choice or performance in that area) — these are often a separate qualities or rated-comment section immediately after the personalised section
- Bridging sentences between major sections that appear in most reports

RULES:
1. Read ALL the reports carefully before identifying sections
2. Identify sections in the order they naturally appear in the reports
3. Give each section a short, plain English name the teacher would recognise (e.g. "Overall Progress", "Personal Qualities", "Assessment Activities", "Next Steps")
4. For personalised-comment sections, identify the topic that varies (e.g. "sport chosen for assessment", "target grade", "musical instrument")
5. Only include sections that appear consistently across the majority of reports
6. If a personalised-comment topic appears in different positions across different reports, still flag it as one section
7. Do not create separate sections for what is clearly the same topic
8. Suggest a sensible order — usually: opening judgement → qualities → personalised info → development/next steps
9. When a personalised-comment section is present, check whether commentary sentences about that personalised topic also appear consistently nearby (e.g. teacher endorsing the pupil's choice, predicting their performance, noting a concern). If so, flag these as a separate section immediately after the personalised-comment section.

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

GROUPING RULE: Comments should be grouped so that a teacher can select the right button for a particular type of pupil without reading every option. If a heading contains comments that clearly apply to two different types of pupil (e.g. some for confident high performers, some for pupils who struggle with confidence), split into two headings with judgment-signalling names. If comments are minor variations of the same sentiment and could apply to the same type of pupil, keep them together under one heading.

RULES FOR EACH SECTION TYPE:

SECTION BOUNDARY RULE — CRITICAL:
Each section type has a strict definition. A sentence belongs to exactly ONE section. When unsure, ask: what is the PRIMARY purpose of this sentence? Assign it to that section only.

For "rated-comment" sections:
- ONLY extract sentences whose PRIMARY purpose is an overall performance judgement — how well the pupil is doing overall, their level of progress, their attainment
- Also include bridging/evaluative sentences that appear consistently and comment on the pupil's result or potential (e.g. "is more capable than the result shows", "performed well with many aspects of the exam") — group these under the appropriate performance level
- DO NOT INCLUDE: character/attitude/effort sentences (qualities); specific test result sentences (assessment-comment); forward-looking improvement sentences (next-steps)
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
- Read each pupil's complete qualities sentences carefully before extracting anything
- Identify where one qualities POINT ends and another begins — a new point starts when a sentence names the pupil or clearly introduces a new topic
- Keep sentences belonging to the same point together as ONE complete option
- Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO SENTENCE FRAGMENTS — join continuation sentences to their preceding [Name] sentence
- CRITICAL: Create a SEPARATE heading for each genuinely distinct quality or topic, with a name that signals both the topic AND the performance level or tone
- Each heading should have 2-6 complete options
- Apply NO DUPLICATES — the same sentence must not appear under two different headings or twice under the same heading
- Merge near-duplicate headings that cover the same ground into one heading
- A heading with only one statement should be merged into a related heading rather than left isolated
- NO CROSS-BUTTON DUPLICATES: Each statement appears under exactly one heading
- STATEMENT CAP: If a heading would contain more than 6 statements, check whether they naturally fall into two genuinely distinct sub-groups with different performance signals. If a clear distinction exists, split into two headings. If all statements apply to the same type of pupil with minor wording differences, keep as one heading but include only the 5 most distinct versions
- FINAL CHECK: Remove any sentence that already appears in the rated-comment section

For "next-steps" sections:
- ONLY extract sentences whose PRIMARY purpose is forward-looking — what the pupil should do, focus on, or improve going forward
- DO NOT INCLUDE: current quality/character sentences (qualities); current overall progress sentences (rated-comment); past assessment result sentences (assessment-comment)
- Read each pupil's complete next steps paragraph carefully before extracting anything
- Identify where one next steps POINT ends and another begins
- Keep all sentences belonging to the same point together as ONE complete option
- Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO SENTENCE FRAGMENTS — never extract a sentence beginning with "Continued", "Regular", "They should", "Attendance", "This", "A higher", "Making", "Taking", "Slowing", "Increasing" as a standalone option. Join it to the preceding [Name] sentence instead
- CRITICAL: Create a SEPARATE heading for each genuinely distinct topic, with a name that signals the specific development area and its urgency or tone
- Apply NO DUPLICATES — each sentence appears exactly once
- NO CROSS-AREA DUPLICATES: Each statement appears under exactly one focus area
- STATEMENT CAP: If a focus area would contain more than 6 statements, check whether they fall into two genuinely distinct sub-topics. If yes, split. If all are saying essentially the same thing, keep only the 5 most distinct versions
- FINAL CHECK: Remove any sentence that already appears in the qualities or rated-comment sections

For "standard-comment" sections:
- ONLY extract text that is identical or near-identical across ALL reports — every pupil gets exactly this text
- DO NOT INCLUDE: sentences that vary by pupil
- Return it as a single content string
- Replace ALL student names with [Name]

For "assessment-comment" sections:
- ONLY extract sentences whose PRIMARY purpose is to comment on a specific named formal assessment, test, or exam result
- DO NOT INCLUDE: general progress sentences (rated-comment); character/quality sentences (qualities); next steps sentences (next-steps)
- Group by performance level: excellent, good, satisfactory, needsImprovement, notCompleted
- Replace ALL student names with [Name] and scores/percentages with [Score]
- Apply PRONOUN TO [Name] CONVERSION — fix verb agreement
- Apply POSSESSIVE PRONOUNS rule — never convert possessives to object pronouns
- Apply NO DUPLICATES
- FINAL CHECK: Remove any sentence that also appears in the rated-comment section — assessment sentences must specifically reference a named test or exam, not general progress

For "personalised-comment" sections:
- ONLY extract sentences where one specific personal detail varies per pupil (sport, instrument, target grade etc)
- Replace the variable detail with [Info 1] (and [Info 2] if two distinct details in same sentence)
- ALSO capture commentary sentences that consistently appear alongside the personalised sentence — sentences where the teacher endorses the pupil's choice, predicts their performance, or notes a concern about it. These commentary sentences may themselves contain the variable detail and should also use [Info 1] / [Info 2] placeholders, OR they may be generic enough to stand alone as separate options
- Group by scenario or tone (e.g. "Teacher endorses choice", "Teacher notes concern", "Performance prediction")
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
7. Keep [Name] and [Score] placeholders — never substitute real names
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

function stripPercent(text: string): string {
  return text
    .replace(/\[Score\]%/g, '[Score]')
    .replace(/\b(\d{1,3})%/g, '[Score]')
    .replace(/\b(\d{1,2}\/\d{1,2})\b/g, (match, p1) => {
      const parts = p1.split('/');
      const a = parseInt(parts[0]), b = parseInt(parts[1]);
      if (b - a <= 2 && a >= 1 && b <= 6) return match;
      return '[Score]';
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
      piInstruction, reportStructure: string;

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
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 6000,
            system: PERSONALISED_EXTRACT_SYSTEM,
            messages: [{
              role: "user",
              content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Section name: ${sectionName}

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
        const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

        return new Response(JSON.stringify({
          sectionName: parsed.sectionName || sectionName,
          headings: parsed.headings || [],
          isPersonalisedComment: true,
          instruction: piInstruction,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } catch {
        return new Response(JSON.stringify({ error: "Personalised comment extraction failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const openerInstruction = openerType === "pronoun"
      ? `All options must start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence. Never use [Name] as a sentence opener in this section.`
      : `All options must start with [Name]. Apply PRONOUN TO [Name] CONVERSION — when a sentence begins with He, She, or They standing in for the pupil's name, replace with [Name] and fix verb agreement (they are → [Name] is, they have → [Name] has, they make → [Name] makes, they pick → [Name] picks, they contribute → [Name] contributes, they show → [Name] shows, they work → [Name] works, etc). Apply POSSESSIVE PRONOUNS rule — never write "him work", "him confidence", "them progress" etc. Never use a pronoun as a sentence opener in this section.`;

    const positionInstructions: Record<string, string> = {
      progress: `PROGRESS sentence — usually the opening. Find every sentence describing overall progress or how the student is doing. ONLY include sentences whose PRIMARY purpose is an overall performance judgement. DO NOT INCLUDE character/attitude/effort sentences or specific test result sentences. Group by performance level with judgement-clear headings (e.g. "Strong Progress", "Good Progress", "Making Progress", "Struggling Despite Effort", "Needs More Effort"). Apply NO SENTENCE FRAGMENTS and NO DUPLICATES. ${openerInstruction}`,

      qualities: `QUALITIES sentences — character, behaviour, attitude, effort, working style. Find every sentence describing personal qualities.

CRITICAL — SENTENCE GROUPING:
Before extracting, read each pupil's qualities sentences as a complete block. Identify where one qualities POINT ends and another begins — a new point starts when a sentence names the pupil ([Name]) or clearly introduces a new topic. Keep all sentences belonging to the same point together as ONE complete option string.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes throughout.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — a sentence starting with "Also,", "This", "Continued", "Regular", "Being", or any continuation word must be joined to the preceding [Name] sentence, never extracted alone.

Apply NO DUPLICATES — the same sentence must not appear under two different headings.

HEADING NAMES must signal both the topic AND the performance level or tone. Use names like "Strong work ethic — confident and capable", "Works hard but lacks confidence", "Enthusiastic — strong contributor", "Enthusiastic but inconsistent". Never use neutral topic names alone.

Merge near-duplicate headings that cover the same ground into one heading. A heading with only one statement should be merged into a related heading rather than left isolated.

Group complete options by the quality or topic described. ${openerInstruction}`,

      development: `AREAS FOR DEVELOPMENT sentences. Find every developmental or improvement sentence.

CRITICAL — SENTENCE GROUPING:
Before extracting, read each pupil's development section as a complete block. Identify where one development POINT ends and another begins. Keep all sentences belonging to the same point together as ONE complete option string.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — sentences starting with "Also,", "This", "Continued", "Regular", "Being", "A higher", "Making", "Taking", "Slowing" must be joined to the preceding [Name] sentence.

Apply NO DUPLICATES.

Group complete options by TOPIC. ${openerInstruction}`,

      "next-steps": `NEXT STEPS sentences. Find every improvement suggestion at this position.

CRITICAL — SENTENCE GROUPING:
Before extracting, read each pupil's next steps section as a complete block. Identify where one next steps POINT ends and another begins. Keep all sentences belonging to the same point together as ONE complete option string.

Every option MUST start with [Name] — apply PRONOUN TO [Name] CONVERSION with verb agreement fixes.
Apply POSSESSIVE PRONOUNS rule — never write "him work", "them confidence" etc.

Apply NO SENTENCE FRAGMENTS — sentences starting with "Also,", "This will", "Continued", "Regular", "Being", "A higher", "Making better", "Taking", "Slowing", "Increasing", "Attendance" must NEVER appear as standalone options. Join to the preceding [Name] sentence.

Apply NO DUPLICATES.

Preserve any fixed opening phrase exactly (e.g. "Moving forward," must stay at the start of every option in its heading).
Group complete options by topic. ${openerInstruction}`,

      assessment: `ASSESSMENT sentences — ONLY extract sentences specifically about a named formal test or exam result. DO NOT INCLUDE general progress sentences or character sentences. Group by performance level with judgement-clear headings. Replace actual scores with [Score]. Apply NO DUPLICATES. ${openerInstruction}`,
      "assessment-comment": `ASSESSMENT COMMENT sentences — ONLY extract sentences specifically about a named formal test or exam result where the teacher uses different sentences by performance level. DO NOT INCLUDE general progress or quality sentences. Group into: excellent, good, satisfactory, needsImprovement. Replace names with [Name] and scores with [Score]. Apply PRONOUN TO [Name] CONVERSION with verb agreement fixes. Apply POSSESSIVE PRONOUNS rule. Apply NO DUPLICATES. ${openerInstruction}`,
      rating: `RATING/JUDGEMENT sentences. Find every sentence at this position. ${scaleType === 'four-level' ? 'Map to: excellent, good, satisfactory, needsImprovement.' : 'Derive the teacher\'s own groupings from their language.'} Apply NO DUPLICATES. ${openerInstruction}`,
    };

    const instruction = positionInstructions[positionType] || positionInstructions.qualities;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 6000,
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

      if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      return new Response(JSON.stringify(JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch {
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
          system: `${KNOWLEDGE_BASE}\n\nImprove an existing report template using additional reports. Return ONLY valid JSON. Replace ALL student names with [Name]. Replace ALL scores with [Score]. Keep same template name. Apply PRONOUN TO [Name] CONVERSION throughout — fix verb agreement. Apply POSSESSIVE PRONOUNS rule — never write "him work" or "them confidence". Apply NO SENTENCE FRAGMENTS. Apply NO DUPLICATES.`,
          messages: [{
            role: "user",
            content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\n\nEXISTING TEMPLATE:\n${JSON.stringify(existingTemplate, null, 2)}\n\nADDITIONAL REPORTS:\n${refineText.substring(0, GENERATION_CHAR_LIMIT)}\n\nAdd new options where new sentences appear. Add new sections if new positions are found. Keep same template name.`,
          }],
        }),
      });
      const data = await response.json();
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
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
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
      const restructuredText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("").trim();
      return new Response(JSON.stringify({ restructuredText }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Restructure failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});