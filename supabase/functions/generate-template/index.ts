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

Your task is to extract sentences that contain a personal detail unique to each pupil — like a sport, target grade, activity, or personal goal. This detail varies per pupil and is typed in by the teacher when writing each report.

Rules:
1. The teacher has highlighted a selection showing you what these sentences look like
2. Read ALL the full reports and find EVERY sentence of this type
3. Replace the variable personal detail with [personalised information] — e.g. "football" becomes [personalised information]
4. Replace ALL student names with [Name]
5. Group sentences by tone or context using short clear headings
6. Copy sentences EXACTLY as written otherwise — do not paraphrase or rewrite
7. Do NOT generate variety options — only include sentences that actually appear in the reports

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "string",
  "headings": [
    {
      "name": "Short clear heading",
      "comments": ["Exact sentence with [Name] and [personalised information]", "Another exact sentence"]
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

    // ── PERSONALISED COMMENT extraction — uses its own system prompt ──
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

TEACHER'S HIGHLIGHTED SELECTION (shows what these sentences look like):
${selectedText}

Read ALL the reports below and extract every sentence of this type. Replace the specific personal detail (sport, grade, activity, goal etc.) with [personalised information]. Replace all student names with [Name]. Group by tone or context.

FULL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

IMPORTANT: Extract ONLY sentences that actually appear in the reports. Do NOT generate new sentences.`,
            }],
          }),
        });

        if (!response.ok) return new Response(JSON.stringify({ error: "API call failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const data = await response.json();
        const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());

        // Return in personalised-comment format with categories
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