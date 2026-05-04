// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

// ─── SHARED KNOWLEDGE BASE ────────────────────────────────────────────────────

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

═══════════════════════════════════════════════════════
SECTION TYPE DEFINITIONS
═══════════════════════════════════════════════════════

qualities — A box of clickable options. The teacher picks one option per section when writing a report. Use for any content that varies between students. This is the most commonly used type.

standard-comment — Fixed text that appears identically in every report. The teacher does not choose — it appears automatically. Use only for text that is truly copy-pasted across all reports with only the pupil name changed.

rated-comment — Four fixed performance levels: excellent, good, satisfactory, needsImprovement. Use only when the teacher clearly writes at these four distinct levels. Rare — qualities with performance-based headings is usually better.

assessment-comment — Use ONLY when a numeric score or percentage is given in the reports. Has five levels: excellent, good, satisfactory, needsImprovement, notCompleted. Every option except notCompleted must contain [Score]. If no numeric score appears in the reports, do not use this type — use qualities instead.

If the teacher writes the same sentence for every student with only the score changing and makes no performance judgement, put that exact sentence under every level except notCompleted. The score is the only differentiator. For notCompleted use the sentence from the reports if one exists, otherwise generate one in the teacher's voice. An alternative is to use personalised-comment, which allows the teacher to type the score directly.

If two assessment scores appear in one naturally flowing sentence, split them into two separate assessment-comment sections. Write each so that when combined they read as one natural sentence — the first ends without a full stop, the second begins with the connecting word (e.g. "and [Score] in..."). If the teacher gives a performance judgement after the scores, this judgement becomes a qualities section immediately after the assessment-comment sections, following all normal qualities rules — pronoun-led if that is the teacher's pattern at that position, headings derived from the actual sentences, teacher's voice throughout.

personalised-comment — A text field where the teacher types something unique to that individual student — a specific score, activity, instrument, role, or any other detail that varies per student and cannot be pre-written. Use when the teacher enters genuinely individual information rather than choosing from pre-written options. For assessment sentences where no performance judgement is made, this is a valid alternative to assessment-comment — the teacher simply types the score into the field.

next-steps — A box of improvement suggestions organised by topic. The teacher picks one topic per section. Each section represents one sentence position in the next steps paragraph.

new-line — A paragraph break between sections.

optional-additional-comment — A free text box at the end of the report. Always include one at the very end.

═══════════════════════════════════════════════════════
THE ELEVEN RULES
═══════════════════════════════════════════════════════

RULE 1: Read ALL reports before deciding anything. The pattern across all reports is the template — not one student's sentences. One report is not enough.

RULE 2: Teachers write in sentence positions, not sections. Each sentence in a report has a job. Work through the reports sentence by sentence. Build one comment box per sentence position. Where reports have clear headings like "Strengths" and "Areas for Development", treat sentences under each heading as separate sentence positions — do not mix positive and developmental sentences in the same section.

RULE 3: For each sentence position, ask one question — does this vary across students, and if so, how?
- No meaningful variation → standard-comment
- Varies by trait, topic, pathway group, or performance description → qualities
- Varies by a clear performance level → qualities with performance-based headings, or rated-comment only when the scale is genuinely obvious

RULE 4: The qualities section type is the most versatile and should be used for almost all varying content. Headings within a qualities section are groupings of similar sentences — they can be traits, topics, pathway groups, performance descriptions, or anything else that reflects how the teacher's sentences naturally group together.

RULE 5: standard-comment is rare. Only use it when a block of text is truly word-for-word identical across all reports, ignoring only name and pronoun differences — just as a teacher would copy and paste a paragraph changing only the pupil's name. If consecutive identical sentences form one natural paragraph, keep them as one standard-comment. If there is any meaningful variation in the content words across students, it is not a standard-comment.

RULE 6: Heading names should be short, neutral, and derived directly from what the sentences say — not editorial interpretations of why a student is in that group. "Works Well in a Team" not "Positive collaboration skills despite social distractions". The teacher picks the heading that fits — the heading name should make that choice obvious at a glance.

RULE 7: The teacher's actual sentences are the content. Read the sentences at each position across all reports. Group the ones that say the same thing in different words under the same heading. Never impose headings from outside — derive them from the sentences. Always generate at least 2 options per heading. The second option must be written in the teacher's own voice — same vocabulary, same sentence structure, same tone, same level of formality. The teacher should read every option and think "I wrote this." Never generate options that sound formal, corporate, or AI-written.

RULE 8: Detect and mirror the teacher's name/pronoun pattern at each sentence position. If sentence position 2 uses pronouns in the reports, all options in that section must start with the selected pronoun. If it uses [Name], all options start with [Name]. Never mix within a section. Avoid name overuse — consecutive sentences both using [Name] looks copy-pasted and unnatural.

RULE 9: Use assessment-comment only when a numeric score or percentage appears in the reports — this will be obvious because an actual number is given. Every comment at excellent, good, satisfactory, needsImprovement must include [Score]. notCompleted must not include [Score]. If the teacher describes assessment performance without giving a number, it is a qualities section with performance-based headings — not an assessment-comment.

RULE 10: Next steps follow the same sentence-position logic. Each sentence in the next steps paragraph gets its own next-steps section. Focus areas within a section are different topics the teacher addresses at that position. Options within a focus area are different phrasings of the same topic — written in the teacher's voice. A teacher picks one focus area per section — together they form a coherent paragraph covering different topics. If the teacher always opens next steps with a fixed phrase like "Moving forward," preserve it in every option in that first section.

RULE 11: The opening sentence of a report must always refer to the student by name, never by pronoun. If the first section refers to the student, every option in that section must start with [Name]. A pronoun may never be used as the opener of the very first student-facing section. A standard-comment that does not refer to the student at all may appear first, but the moment a student is first referred to in the report it must be by [Name].`;

// ─── STRUCTURE DETECTION ─────────────────────────────────────────────────────

const STRUCTURE_DETECTION_PROMPT = `You are an expert at analysing teacher-written school reports.
Detect the structure and format the teacher uses and return it as JSON.

Return ONLY this JSON, no markdown, no backticks:
{
  "detectedStructure": [
    {"position":1,"type":"qualities","description":"Brief description","example":"First few words..."}
  ],
  "formatNotes": "Any notable formatting observations"
}
Section types: rated-comment, standard-comment, qualities, assessment-comment, next-steps, new-line, optional-additional-comment`;

// ─── MAPPING SYSTEM ───────────────────────────────────────────────────────────

const MAPPING_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to analyse the reports and produce a detailed STRUCTURE MAP — not a template yet.

For each sentence position in the reports, produce:
- The position number
- What this sentence does
- Whether it uses [Name] or pronoun at this position
- Whether it varies, and if so how
- The section type this should become
- The headings you would group the sentences under, with 2 example sentences per heading drawn from the actual reports

Return ONLY valid JSON, no markdown, no backticks:
{
  "reportStructure": "Brief description of overall report format",
  "sectionOrder": ["description of section 1", "description of section 2"],
  "positions": [
    {
      "position": 1,
      "job": "What this sentence does",
      "nameOrPronoun": "[Name] or pronoun",
      "variation": "fixed | varies by trait/topic | varies by performance level",
      "sectionType": "qualities",
      "headings": [
        {
          "name": "Short neutral heading name",
          "examples": ["Actual sentence from reports", "Another actual sentence"]
        }
      ]
    }
  ]
}`;

// ─── GENERATION SYSTEM ────────────────────────────────────────────────────────

const GENERATION_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate a complete report template in JSON format.

When given a structure map, use it faithfully — sections in the order specified, headings as specified, example sentences as starting options. Add variety options in the teacher's voice. Ensure at least 2 options per heading.

When generating without a map, apply all eleven rules directly.

For qualities sections: all options use [Name] OR all use the selected pronoun — never mix.
For next-steps sections: 3-4 options per focus area.
For assessment-comment sections: 4 options per level each containing [Score]. notCompleted: 2 options without [Score].
For standard-comment sections: the fixed content as identified.

Add new-line sections between major sections.
End with optional-additional-comment.
Return ONLY valid JSON, no markdown, no backticks.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Section Name","data":{"comments":{"Heading Name":["Option 1","Option 2","Option 3"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Section Name","data":{"content":"Content text"}},
  {"id":"s4","type":"assessment-comment","name":"Section Name","data":{"scoreType":"percentage","comments":{"excellent":["Option with [Score]","Option 2","Option 3","Option 4"],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["Option without score","Option 2"]}}},
  {"id":"s5","type":"next-steps","name":"Section Name","data":{"focusAreas":{"Topic Name":["Option 1","Option 2","Option 3"]}}},
  {"id":"s6","type":"rated-comment","name":"Section Name","data":{"comments":{"excellent":["..."],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."]}}},
  {"id":"s7","type":"personalised-comment","name":"Section Name","data":{"instruction":"What the teacher should type here","categories":{"Category":["Template sentence with [Personalised Information]"]}}},
  {"id":"s8","type":"optional-additional-comment","name":"Additional Comments","data":{}}
]}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let subject, yearGroup, reportText, additionalContext, existingTemplate, isRefinement,
      hasPlaceholders, standardCommentNames, choiceCommentNames, pronounSet,
      mode, detectedStructure, useDetectedStructure;

  try {
    const body = await req.json();
    subject = body.subject;
    yearGroup = body.yearGroup;
    reportText = body.reportText;
    additionalContext = body.additionalContext;
    existingTemplate = body.existingTemplate;
    isRefinement = body.isRefinement || false;
    hasPlaceholders = body.hasPlaceholders || false;
    standardCommentNames = body.standardCommentNames || [];
    choiceCommentNames = body.choiceCommentNames || [];
    pronounSet = body.pronounSet || "they/their";
    mode = body.mode || "generate";
    detectedStructure = body.detectedStructure || null;
    useDetectedStructure = body.useDetectedStructure !== false;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!reportText || !subject) {
    return new Response(JSON.stringify({ error: "reportText and subject are required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
  const pronounFull = ({
    "he/his": "HE/HIM/HIS/HIMSELF",
    "she/her": "SHE/HER/HERS/HERSELF",
    "they/their": "THEY/THEM/THEIR/THEMSELVES",
  } as Record<string, string>)[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: DETECT ─────────────────────────────────────────────────────────
  if (mode === "detect") {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          system: STRUCTURE_DETECTION_PROMPT,
          messages: [{ role: "user", content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\n\nReports:\n${reportText.substring(0, 8000)}` }],
        }),
      });
      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to detect structure" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const data = await response.json();
      const rawText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try {
        return new Response(JSON.stringify(JSON.parse(cleaned)), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Could not detect structure" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Structure detection failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  if (isRefinement && existingTemplate) {
    try {
      const refinePrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections all options start with ${pronounCapital}.
${additionalContext ? `Additional context: ${additionalContext}` : ""}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Improve the existing template using the additional reports and all eleven rules:
- Add new heading options to existing sections where new sentences appear
- Add new sections if reports reveal sentence positions not yet captured
- Ensure all headings have at least 2 options — add variety in the teacher's voice where needed
- Check any standard-comments for real variation — convert to qualities if needed
- Keep [Name] and [Score] placeholders
- Maintain same template name`;

      const refineResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{ role: "user", content: refinePrompt }],
        }),
      });

      if (!refineResponse.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const refineData = await refineResponse.json();
      const refineRaw = refineData.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const refineCleaned = refineRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(refineCleaned); }
      catch { return new Response(JSON.stringify({ error: "Refinement failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) throw new Error("Refined template has invalid structure");

      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Failed to refine template" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: GENERATE (two-call) ────────────────────────────────────────────

  const placeholderNote = hasPlaceholders
    ? `\nReport text contains placeholders where repeated sections were removed:
- {{STANDARD:Name}} → will become a standard-comment section
- {{CHOICE:Name}} → will become a qualities section
Pre-defined standard: ${standardCommentNames.join(", ")}
Pre-defined choice: ${choiceCommentNames.join(", ")}\n`
    : "";

  const structureNote = useDetectedStructure && detectedStructure
    ? `\nDetected structure — respect this section order:\n${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}\n`
    : "";

  // ── CALL 1: MAP ────────────────────────────────────────────────────────────
  let structureMap: any = null;
  try {
    const mapResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: MAPPING_SYSTEM,
        messages: [{
          role: "user",
          content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Read ALL reports. Apply all eleven rules. Produce the structure map.`,
        }],
      }),
    });

    if (mapResponse.ok) {
      const mapData = await mapResponse.json();
      const mapRaw = mapData.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const mapCleaned = mapRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      try { structureMap = JSON.parse(mapCleaned); }
      catch { console.log("Structure map parsing failed — proceeding without map"); }
    }
  } catch (err) {
    console.log("Structure mapping failed:", err);
  }

  // ── CALL 2: GENERATE ───────────────────────────────────────────────────────
  const generationPrompt = structureMap
    ? `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections all options start with ${pronounCapital}.
${additionalContext ? `Context: ${additionalContext}` : ""}

STRUCTURE MAP:
${JSON.stringify(structureMap, null, 2)}

ORIGINAL REPORTS (for reference when adding variety options):
${reportText.substring(0, 12000)}

Generate the complete template using the structure map.
Follow the map faithfully. Add variety options in the teacher's voice.
Ensure at least 2 options per heading.
Template name should reflect subject and year group.`
    : `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections all options start with ${pronounCapital}.
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Apply all eleven rules. Work sentence by sentence.
Build one section per sentence position.
Group the teacher's actual sentences under headings.
Add variety in the teacher's voice.
Ensure at least 2 options per heading.`;

  try {
    const genResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: GENERATION_SYSTEM,
        messages: [{ role: "user", content: generationPrompt }],
      }),
    });

    if (!genResponse.ok) {
      const errorBody = await genResponse.text();
      console.error("Generation error:", genResponse.status, errorBody);
      return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const genData = await genResponse.json();
    const genRaw = genData.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const genCleaned = genRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(genCleaned); }
    catch {
      return new Response(
        JSON.stringify({ error: "Template was too large to generate in one go. Try using fewer reports or splitting into two generations." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) throw new Error("Generated template has invalid structure");

    // Fix personalised-comment categories that are strings instead of arrays
    parsed.sections = parsed.sections.map((section: any) => {
      if (section.type === 'personalised-comment' && section.data?.categories) {
        const fixed: Record<string, string[]> = {};
        Object.entries(section.data.categories).forEach(([key, value]) => {
          fixed[key] = Array.isArray(value) ? value as string[] : [value as string];
        });
        return { ...section, data: { ...section.data, categories: fixed } };
      }
      return section;
    });

    return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Generation error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate template" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});