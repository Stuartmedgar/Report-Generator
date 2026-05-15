// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 60000;

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

CRITICAL — NAME REPLACEMENT: Every sentence you output must have ALL student names replaced with [Name]. Replace ALL numeric scores and percentages with [Score] — remove any % symbol. Keep pronoun pattern consistent within each section.`;

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
8. Every option in a section must use the same opener — all [Name] OR all pronoun, never mix
9. Do NOT generate variety options — only include sentences that actually appear in the reports
10. PRONOUN CONSISTENCY: Every single option must use pronouns consistently throughout the ENTIRE sentence — not just the opener. If using [Name] opener, check that no "he/his/him/himself" or "she/her/hers/herself" pronouns appear mid-sentence unless they are in a quote. If using pronoun opener, ensure ALL mid-sentence pronouns match the chosen pronoun set throughout.

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

5. Copy sentences EXACTLY as written — do not paraphrase, rewrite or combine them

6. Group sentences by tone or context using short clear heading names

7. ONLY extract sentences that actually appear in the reports — do NOT generate new ones

8. Deduplicate — if the same sentence (or near-identical sentence) appears more than once, include it only once

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
- "standard-comment" — text that is identical or near-identical across all reports. Every pupil gets exactly the same text.
- "assessment-comment" — sentences specifically about a formal assessment or test result, where the teacher writes DIFFERENT sentences depending on performance level (excellent, good, satisfactory, struggling). Use this ONLY when the language itself changes based on how well the pupil did.
- IMPORTANT: If the assessment section uses the SAME sentence structure for every pupil but with a variable score or grade typed in (e.g. "[Name] scored X% in the test"), classify it as "personalised-comment" NOT "assessment-comment". The variable score is the personal detail.

RULES:
1. Read ALL the reports carefully before identifying sections
2. Identify sections in the order they naturally appear in the reports
3. Give each section a short, plain English name the teacher would recognise (e.g. "Overall Progress", "Personal Qualities", "Assessment Activities", "Next Steps")
4. For personalised-comment sections, identify the topic that varies (e.g. "sport chosen for assessment", "target grade", "musical instrument")
5. Only include sections that appear consistently across the majority of reports
6. If a personalised-comment topic appears in different positions across different reports, still flag it as one section
7. Do not create separate sections for what is clearly the same topic
8. Suggest a sensible order — usually: opening judgement → qualities → personalised info → development/next steps

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

RULES FOR EACH SECTION TYPE:

For "rated-comment" sections:
- Find every sentence of this type across all reports
- Group by performance level into: excellent, good, satisfactory, needsImprovement
- Each level must have at least 2-3 options
- Copy sentences EXACTLY — do not paraphrase
- Replace ALL student names with [Name]

For "qualities" sections:
- Find every sentence of this type across all reports
- Group by the quality or topic described using short clear heading names
- CRITICAL: Create a SEPARATE heading for each genuinely distinct quality or topic — do not merge sentences about different things into the same heading. For example, sentences about teamwork, sentences about individual work style, sentences about classroom discussion, sentences about focus challenges, and sentences about effort and behaviour are all DIFFERENT topics and must each have their own heading
- Each heading should have 2-6 sentence options
- Copy sentences EXACTLY — do not paraphrase
- Replace ALL student names with [Name]

For "next-steps" sections:
- Find every next steps or improvement suggestion sentence
- Group by topic area using short clear heading names
- CRITICAL: Create a SEPARATE heading for each genuinely distinct topic — do not merge sentences about different things into the same heading just to reduce the number of headings. For example, sentences about writing quality, sentences about distraction/focus, sentences about participation in discussions, sentences about seeking support, and sentences about rushing work are all DIFFERENT topics and must each have their own heading
- Each heading should have 2-6 sentence options
- Copy sentences EXACTLY — do not paraphrase
- Replace ALL student names with [Name]
- CRITICAL: Preserve any fixed opening phrase exactly as it appears (e.g. if sentences start with "Moving forward," keep that phrase at the start of every option in that heading)

For "standard-comment" sections:
- Find the text that is identical or near-identical across all reports
- Return it as a single content string
- Replace ALL student names with [Name]

For "assessment-comment" sections:
- Find assessment-related sentences
- Group by performance level: excellent, good, satisfactory, needsImprovement, notCompleted
- Replace ALL student names with [Name] and scores/percentages with [Score]

For "personalised-comment" sections:
- Find sentences where one specific detail varies per pupil
- Replace the variable detail with [Info 1] (and [Info 2] if two distinct details in same sentence)
- Group by scenario or tone
- Mark these sections with needsRefinement: true
- Copy sentences EXACTLY — do not paraphrase

ALSO — CLOSING ENCOURAGEMENT:
Look for short closing encouragement sentences at the end of reports (e.g. "Keep up the good work!", "Keep working hard!"). If these appear consistently across reports, include them as a separate qualities section named "Closing Encouragement".

CRITICAL RULES:
- Extract ONLY sentences that actually appear in the reports — do NOT generate new ones
- Replace ALL student names with [Name]
- Keep pronoun consistency within each section
- Do not mix [Name]-led and pronoun-led sentences in the same section

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
          "Heading name": ["Sentence 1", "Sentence 2"],
          "Another heading": ["Sentence 1", "Sentence 2"]
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
          "Scenario heading": ["Sentence with [Info 1]", "Another sentence with [Info 1]"]
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
9. CRITICAL: Do NOT remove, restructure, reorder or replace ANY existing options
10. CRITICAL: Only ADD new options in the newOptions array — never touch existing ones
11. CRITICAL: Heading names must remain EXACTLY unchanged
12. If a heading already has many options, you may return an empty newOptions array for that heading

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

If [Name]-led: every comment starts with [Name]. Replace pronoun openers with [Name].
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let mode, subject, yearGroup, reportText, pronounSet, openerType,
      sectionName, builtSections, existingTemplate, refineText,
      sourceSection, scaleType, positionType, selectedText, existingHeadings,
      piInstruction;

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
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: IDENTIFY_SECTIONS_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}

Read ALL of these reports carefully and identify what sections a template built from them should contain. Return them in the order they naturally appear.

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
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: AUTO_BUILD_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounSet}

Build a complete template from these reports. The template should contain these sections in this order:
${sectionsList}

For each section, extract the actual sentences from the reports. Do NOT generate new sentences.
For personalised-comment sections, set needsRefinement: true.
Template name should be: ${subject}${yearGroup ? ' ' + yearGroup : ''} Report Template

FULL REPORTS:
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
      : `Rewrite every comment to start with [Name]. Replace pronoun openers with [Name]. Keep correct pronoun possessives mid-sentence.`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 4000,
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

    // ── PERSONALISED COMMENT extraction ──
    if (positionType === "personalised-comment") {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 6000,
            system: PERSONALISED_EXTRACT_SYSTEM,
            messages: [{
              role: "user",
              content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Section name: ${sectionName}

TEACHER'S HIGHLIGHTED SELECTION — these are the exact examples to match. Study them carefully. Only extract sentences from the full reports that follow the same pattern as these examples. If these examples contain one personal detail, only extract sentences with one personal detail. If these examples contain two distinct personal details, only extract sentences with two distinct personal details. Do not extract sentences about clearly different aspects of the topic.
${selectedText}

Replace personal details with [Info 1], [Info 2] etc. Replace all student names with [Name]. Group by tone or context. Deduplicate near-identical sentences.

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

    // ── Standard extract-only for all other section types ──
    const openerInstruction = openerType === "pronoun"
      ? `All options must start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence. Never use [Name] as a sentence opener in this section.`
      : `All options must start with [Name]. Replace ALL student names with [Name]. Use ${pronounFull} for possessives mid-sentence. Never use a pronoun as a sentence opener in this section.`;

    const positionInstructions: Record<string, string> = {
      progress: `PROGRESS sentence — usually the opening. Find every sentence describing overall progress or how the student is doing. Group by performance level with judgement-clear headings (e.g. "Strong Progress", "Good Progress", "Making Progress", "Struggling Despite Effort", "Needs More Effort"). ${openerInstruction}`,
      qualities: `QUALITIES sentences — character, behaviour, attitude, effort, working style. Find every sentence describing personal qualities. Group by the quality described — heading names must make any judgement clear. ${openerInstruction}`,
      development: `AREAS FOR DEVELOPMENT sentences. Find every developmental or improvement sentence. Group by TOPIC — different focus areas cover DIFFERENT topics. Ignore section headings and standard closing advice sentences. ${openerInstruction}`,
      "next-steps": `NEXT STEPS sentences. Find every improvement suggestion at this position. Group by topic. Preserve any fixed opening phrase (e.g. "Moving forward,"). ${openerInstruction}`,
      assessment: `ASSESSMENT sentences. Find every assessment-related sentence. Group by performance level with judgement-clear headings. Replace actual scores with [Score]. ${openerInstruction}`,
      "assessment-comment": `ASSESSMENT COMMENT sentences — teacher uses different sentences by performance level. Group into: excellent, good, satisfactory, needsImprovement. Replace names with [Name] and scores with [Score]. ${openerInstruction}`,
      rating: `RATING/JUDGEMENT sentences. Find every sentence at this position. ${scaleType === 'four-level' ? 'Map to: excellent, good, satisfactory, needsImprovement.' : 'Derive the teacher\'s own groupings from their language.'} ${openerInstruction}`,
    };

    const instruction = positionInstructions[positionType] || positionInstructions.qualities;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
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
          model: "claude-sonnet-4-20250514", max_tokens: 4000,
          system: VARIETY_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Section: ${sectionName}
Opener type: ${openerType === "pronoun" ? pronounCapital : "[Name]"}

Generate 1-2 additional options per heading that the teacher would recognise as their own.
Write in exactly the same voice, vocabulary, sentence length, and level of formality.

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
          model: "claude-sonnet-4-20250514", max_tokens: 16000,
          system: `${KNOWLEDGE_BASE}\n\nImprove an existing report template using additional reports. Return ONLY valid JSON. Replace ALL student names with [Name]. Replace ALL scores with [Score]. Keep same template name.`,
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

  return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});