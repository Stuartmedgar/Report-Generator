// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

// ─── SHARED KNOWLEDGE BASE ────────────────────────────────────────────────────

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

═══════════════════════════════════════════════════════
GUIDING PHILOSOPHY
═══════════════════════════════════════════════════════

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

These two principles govern every decision. If a sentence from the reports is missing from the template, that is an error. If a generated variety option sounds like it was written by AI rather than the teacher, that is an error.

═══════════════════════════════════════════════════════
SECTION TYPE DEFINITIONS
═══════════════════════════════════════════════════════

qualities — A box of clickable options. The teacher picks one option per section when writing a report. Use for any content that varies between students. This is the most commonly used type.

standard-comment — Fixed text that appears identically in every report. The teacher does not choose — it appears automatically. Use only for text that appears word-for-word identically in 80% or more of reports, ignoring only name and pronoun differences. If the teacher identified a standard-comment in the preprocessing step, it must appear exactly word-for-word with no additions or changes whatsoever.

rated-comment — Four fixed performance levels: excellent, good, satisfactory, needsImprovement. Use only when the teacher's sentences clearly and naturally map to all four of these levels. If in doubt, qualities with judgement-based headings is better.

assessment-comment — Use ONLY when a numeric score or percentage is given in the reports. Has five levels: excellent, good, satisfactory, needsImprovement, notCompleted. Every option except notCompleted must contain [Score]. If no numeric score appears in the reports, do not use this type — use qualities instead.

If the teacher writes the same sentence for every student with only the score changing and makes no performance judgement, put that exact sentence under every level except notCompleted. The score is the only differentiator. For notCompleted use the sentence from the reports if one exists, otherwise generate one in the teacher's voice. An alternative is to use personalised-comment, which allows the teacher to type the score directly.

If two assessment scores appear in one naturally flowing sentence, split them into two separate assessment-comment sections. Write each so that when combined they read as one natural sentence — the first ends without a full stop, the second begins with the connecting word (e.g. "and [Score] in..."). If the teacher gives a performance judgement after the scores, this judgement becomes a qualities section immediately after the assessment-comment sections, following all normal qualities rules.

personalised-comment — A text field where the teacher types something unique to that individual student — a specific score, activity, instrument, role, or any other detail that varies per student and cannot be pre-written.

next-steps — A box of improvement suggestions organised by topic. The teacher picks one topic per section. Each section represents one sentence position in the next steps paragraph.

new-line — A paragraph break between sections.

optional-additional-comment — A free text box at the end of the report. Always include one at the very end.

═══════════════════════════════════════════════════════
THE ELEVEN RULES
═══════════════════════════════════════════════════════

RULE 1: Read ALL reports before deciding anything. The pattern across all reports is the template — not one student's sentences. One report is not enough.

RULE 2: Teachers write in sentence positions, not sections. Each sentence in a report has a job. Work through the reports sentence by sentence. Build one comment box per sentence position. Where reports have clear headings like "Strengths" and "Areas for Development", treat sentences under each heading as separate sentence positions — do not mix sentences from different positions in the same box. Where the reports show a [Name]-led qualities sentence followed by a pronoun-led qualities sentence, these must be two separate sections — one [Name]-led, one pronoun-led.

RULE 3: For each sentence position, ask one question — does this vary across students, and if so, how?
- No meaningful variation → standard-comment (subject to the 80% rule in the definitions above)
- Varies by trait, topic, pathway group, or performance description → qualities
- Varies by a clear performance level on the same quality → qualities with performance-based headings derived from the teacher's own groupings. The heading names must clearly reflect the judgement being made so the teacher can instantly select the right level — "Excellent Effort and Behaviour", "Works Hard", "Effort Needs to Improve", "Lacks Focus and Motivation" rather than vague neutral headings. The judgement that the teacher has made about that student must be obvious from the heading name alone. Only use rated-comment when the teacher's sentences clearly and naturally map to all four levels: excellent, good, satisfactory, needsImprovement. If in doubt, qualities with judgement-based headings is better.

RULE 4: The qualities section type is the most versatile and should be used for almost all varying content. Headings within a qualities section are groupings of similar sentences. Every quality identified and reported on by the teacher must appear as a heading option in the template — nothing is dropped.

RULE 5: standard-comment is rare. Only use it when a block of text appears word-for-word identically in 80% or more of reports, ignoring only name and pronoun differences. If the teacher identified a standard-comment in preprocessing, reproduce it exactly word-for-word with no additions or changes. If consecutive identical sentences form one natural paragraph they can be one standard-comment. If there is meaningful variation it is not a standard-comment.

RULE 6: Heading names should be short and derived directly from what the sentences say. Where the sentences reflect a performance judgement, the heading name must make that judgement clear and immediately obvious to the teacher picking it.

RULE 7: The teacher's actual sentences from the reports are the options. Copy them exactly — do not paraphrase, do not improve them, do not make them more formal or more elaborate. Every sentence that appears in the reports must appear as an option somewhere in the template. When generating a second variety option, write it as if you are the teacher writing another version of the same sentence — same words where possible, same short direct style, same level of formality. If the teacher writes short plain sentences, the variety options must also be short and plain. Read the teacher's sentences carefully and match their exact register before generating anything.

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

Work through the reports sentence by sentence. For each distinct sentence position, identify:
- The position number
- What this sentence does
- Whether it uses [Name] or pronoun — this determines whether the section is [Name]-led or pronoun-led
- Whether it varies, and if so how (fixed / varies by trait or topic / varies by performance level)
- The section type
- The headings, with the teacher's actual sentences listed exactly under each heading

CRITICAL RULES FOR MAPPING:
- Each sentence position gets its own section — do not combine multiple sentence positions into one
- If a [Name]-led sentence is followed by a pronoun-led sentence, these are TWO separate positions requiring TWO separate sections
- Where sentences reflect a performance judgement, the heading name must make that judgement immediately obvious
- Every sentence from every report must appear somewhere in the map
- List sentences exactly as written — do not paraphrase

Return ONLY valid JSON, no markdown, no backticks:
{
  "reportStructure": "Brief description of overall report format",
  "positions": [
    {
      "position": 1,
      "job": "What this sentence does",
      "nameOrPronoun": "[Name] or pronoun",
      "variation": "fixed | varies by trait/topic | varies by performance level",
      "sectionType": "qualities",
      "headings": [
        {
          "name": "Judgement-clear heading name",
          "examples": ["Exact sentence from reports", "Another exact sentence"]
        }
      ]
    }
  ]
}`;

// ─── GENERATION SYSTEM ────────────────────────────────────────────────────────

const GENERATION_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate a complete report template in JSON format.

When given a structure map, use it faithfully — sections in the order specified, headings as specified, example sentences as the starting options. Add variety options in the teacher's voice following Rule 7. Ensure at least 2 options per heading.

When generating without a map, apply all eleven rules directly.

For qualities sections: all options use [Name] OR all use the selected pronoun — never mix.
For next-steps sections: 3-4 options per focus area.
For assessment-comment sections: 4 options per level each containing [Score]. notCompleted: 2 options without [Score].
For standard-comment sections: reproduce exactly as identified — no additions, no changes.

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

Improve the existing template using the additional reports and all eleven rules.
Remember the two guiding principles — every sentence from the reports must appear as an option, and all options must sound like the teacher wrote them.
- Add new heading options to existing sections where new sentences appear — copy them exactly
- Add new sections if reports reveal sentence positions not yet captured
- Ensure all headings have at least 2 options — add variety in the teacher's exact voice
- Check any standard-comments — do they appear in 80%+ of reports? If not convert to qualities
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

  // ─── MODE: GENERATE (two-call, both Sonnet) ───────────────────────────────

  const placeholderNote = hasPlaceholders
    ? `\nReport text contains placeholders where repeated sections were removed:
- {{STANDARD:Name}} → will become a standard-comment section reproduced exactly word-for-word
- {{CHOICE:Name}} → will become a qualities section
Pre-defined standard: ${standardCommentNames.join(", ")}
Pre-defined choice: ${choiceCommentNames.join(", ")}\n`
    : "";

  const structureNote = useDetectedStructure && detectedStructure
    ? `\nDetected structure — respect this section order:\n${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}\n`
    : "";

  // ── CALL 1: MAP (Sonnet) ───────────────────────────────────────────────────
  let structureMap: any = null;
  try {
    const mapResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
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

Read ALL reports carefully. Work sentence by sentence.
Identify every distinct sentence position.
Keep [Name]-led and pronoun-led positions as separate sections.
List the teacher's actual sentences exactly as written.
Produce the structure map.`,
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

  // ── CALL 2: GENERATE (Sonnet) ─────────────────────────────────────────────
  const generationPrompt = structureMap
    ? `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections all options start with ${pronounCapital}.
${additionalContext ? `Context: ${additionalContext}` : ""}

STRUCTURE MAP:
${JSON.stringify(structureMap, null, 2)}

ORIGINAL REPORTS (use to verify every sentence is captured and to match the teacher's voice exactly):
${reportText.substring(0, 12000)}

Generate the complete template using the structure map.
Follow the two guiding principles — every sentence from the reports must appear as an option, all options must sound like the teacher wrote them.
Follow the map faithfully. Add variety options in the teacher's exact voice following Rule 7.
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

Apply all eleven rules and both guiding principles.
Work sentence by sentence. Keep [Name]-led and pronoun-led positions as separate sections.
Copy the teacher's actual sentences exactly as options.
Add variety in the teacher's exact voice.
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