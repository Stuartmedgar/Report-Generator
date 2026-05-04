// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── SHARED PRINCIPLES ────────────────────────────────────────────────────────
// These rules govern both the mapping call and the generation call.

const PRINCIPLES = `You are an expert at analysing teacher-written school reports and building report templates.

RULE 1: Read ALL reports before deciding anything. The pattern across all reports is the template — not one student's sentences. One report is not enough.

RULE 2: Teachers write in sentence positions, not sections. Each sentence in a report has a job. Work through the reports sentence by sentence. Build one comment box per sentence position.

RULE 3: For each sentence position, ask one question — does this vary across students, and if so, how?
- No meaningful variation → standard-comment
- Varies by trait, topic, pathway group, or performance description → qualities
- Varies by a clear performance level (excellent/good/satisfactory/needsImprovement) → qualities with performance-based headings, or rated-comment only when the scale is genuinely obvious

RULE 4: The qualities section type is the most versatile and should be used for almost all varying content. Headings within a qualities section are groupings of similar sentences — they can be traits, topics, pathway groups, performance descriptions, or anything else that reflects how the teacher's sentences naturally group together.

RULE 5: standard-comment is rare. Only use it when text is truly word-for-word identical across all reports (ignoring name and pronoun differences). If there is any meaningful variation in the content words, it is not a standard-comment.

RULE 6: The teacher's actual sentences are the content. Read the sentences at each position across all reports. Group the ones that say the same thing in different words under the same heading. The heading name comes from what that group has in common. Never impose headings from outside — derive them from the sentences.

RULE 7: Always generate at least 2 options per heading, even if only one version appears in the reports. The second option should be written in the teacher's own voice and style — same vocabulary, same sentence structure, same tone. The teacher should read the template and think "I wrote this."

RULE 8: Detect and mirror the teacher's name/pronoun pattern at each sentence position. If sentence position 2 uses pronouns in the reports, all options in that section must start with the selected pronoun. If it uses [Name], all options start with [Name]. Never mix within a section.

RULE 9: Use assessment-comment only when a numeric score or percentage appears in the reports. Every comment at excellent/good/satisfactory/needsImprovement must include [Score]. notCompleted comments must not include [Score]. If the teacher describes assessment performance without giving a number, it is a qualities section with performance-based headings — not an assessment-comment.

RULE 10: Next steps follow the same sentence-position logic. Each sentence in the next steps paragraph gets its own next-steps section. Focus areas within a section are different topics the teacher addresses at that position. Options within a focus area are different phrasings of the same topic. A teacher picks one focus area per section — together they form a coherent paragraph on different topics. If the teacher always opens next steps with a fixed phrase (e.g. "Moving forward,"), preserve it in every option in that section.`;

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

// ─── MAPPING PROMPT ───────────────────────────────────────────────────────────
// Call 1: Haiku reads all reports and produces a detailed structure map with reasoning.

const MAPPING_SYSTEM = `${PRINCIPLES}

Your task is to analyse the reports and produce a detailed STRUCTURE MAP — not a template yet.

For each sentence position in the reports, produce:
- The position number
- What this sentence does (its job)
- Whether it uses [Name] or pronoun at this position
- Whether it varies, and if so how (fixed / varies by trait or topic / varies by performance level)
- The section type this should become
- The headings you would group the sentences under, with 2-3 example sentences per heading drawn from the actual reports

Return ONLY valid JSON, no markdown, no backticks:
{
  "reportStructure": "Brief description of overall report format",
  "sectionOrder": ["description of section 1", "description of section 2", ...],
  "positions": [
    {
      "position": 1,
      "job": "What this sentence does",
      "nameOrPronoun": "[Name] or pronoun",
      "variation": "fixed | varies by trait/topic | varies by performance level",
      "sectionType": "qualities",
      "headings": [
        {
          "name": "Heading name derived from the sentences",
          "examples": ["Actual sentence from reports", "Another actual sentence"]
        }
      ]
    }
  ]
}`;

// ─── GENERATION PROMPT ────────────────────────────────────────────────────────
// Call 2: Sonnet uses the structure map to generate the full template JSON.

const GENERATION_SYSTEM = `${PRINCIPLES}

Your task is to generate a complete report template in JSON format based on a structure map provided to you.

The structure map tells you exactly what each section should contain and how sentences from the reports group together. Use it faithfully — do not invent new sections or change the order.

For each position in the map:
- Build the section using the section type specified
- Use the headings specified in the map
- Use the example sentences from the map as your starting options
- Add variety options in the teacher's voice (same vocabulary, sentence structure, tone)
- Ensure at least 2 options per heading
- For qualities sections: all options use [Name] OR all use the selected pronoun — as specified in the map
- For next-steps sections: 3-4 options per focus area
- For assessment-comment sections: 4 options per level, each containing [Score]. notCompleted: 2 options without [Score]
- For standard-comment sections: the content as identified, plus one similar alternative

Add new-line sections between major sections.
End with optional-additional-comment.
Return ONLY valid JSON, no markdown, no backticks.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Section Name","data":{"comments":{"Heading Name":["Option 1","Option 2"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Section Name","data":{"content":"Content text"}},
  {"id":"s4","type":"assessment-comment","name":"Section Name","data":{"scoreType":"percentage","comments":{"excellent":["Option with [Score]","Option 2 with [Score]","Option 3","Option 4"],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["Option without score","Option 2"]}}},
  {"id":"s5","type":"next-steps","name":"Section Name","data":{"focusAreas":{"Topic Name":["Option 1","Option 2","Option 3"]}}},
  {"id":"s6","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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
  const pronounFull = {
    "he/his": "HE/HIM/HIS/HIMSELF",
    "she/her": "SHE/HER/HERS/HERSELF",
    "they/their": "THEY/THEM/THEIR/THEMSELVES",
  }[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: DETECT STRUCTURE ──────────────────────────────────────────────
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

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to detect structure" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const rawText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        return new Response(JSON.stringify(JSON.parse(cleaned)), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Could not detect structure" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Structure detection failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ─── MODE: GENERATE (two-call approach) ──────────────────────────────────
  if (!isRefinement) {

    const placeholderNote = hasPlaceholders
      ? `\nThe report text contains placeholders where repeated sections were removed:
- {{STANDARD:Name}} → will become a standard-comment section
- {{CHOICE:Name}} → will become a qualities section with pre-defined options
Pre-defined standard comment names: ${standardCommentNames.join(", ")}
Pre-defined choice comment names: ${choiceCommentNames.join(", ")}\n`
      : "";

    const structureNote = useDetectedStructure && detectedStructure
      ? `\nThe teacher's reports follow this detected structure — respect this order:\n${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}\n`
      : "";

    // ── CALL 1: MAP THE STRUCTURE ──────────────────────────────────────────
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
Selected pronoun set: ${pronounFull} — use this pronoun for all pronoun-led sentence positions.
${additionalContext ? `Additional context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS TO ANALYSE:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Read ALL reports carefully. Then produce the structure map.`
          }],
        }),
      });

      if (mapResponse.ok) {
        const mapData = await mapResponse.json();
        const mapRaw = mapData.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
        const mapCleaned = mapRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        try {
          structureMap = JSON.parse(mapCleaned);
        } catch {
          console.log("Structure map parsing failed — proceeding without map");
        }
      }
    } catch (err) {
      console.log("Structure mapping failed — proceeding without map:", err);
    }

    // ── CALL 2: GENERATE THE TEMPLATE ────────────────────────────────────
    const generationUserPrompt = structureMap
      ? `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections, all options start with ${pronounCapital}.
${additionalContext ? `Additional context: ${additionalContext}` : ""}

STRUCTURE MAP (produced by analysing all reports):
${JSON.stringify(structureMap, null, 2)}

ORIGINAL REPORTS (for reference when adding variety options):
${reportText.substring(0, 12000)}

Generate the complete template using the structure map above.
Follow the map faithfully — sections in the order specified, headings as specified, example sentences as the starting options.
Add variety options in the teacher's voice. Ensure at least 2 options per heading.
Template name should reflect subject and year group.`
      : `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections, all options start with ${pronounCapital}.
${additionalContext ? `Additional context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Apply all 10 rules. Work sentence by sentence. Build one section per sentence position.
Group the teacher's actual sentences under headings. Add variety in the teacher's voice.
Ensure at least 2 options per heading.`;

    try {
      const genResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{ role: "user", content: generationUserPrompt }],
        }),
      });

      if (!genResponse.ok) {
        const errorBody = await genResponse.text();
        console.error("Generation API error:", genResponse.status, errorBody);
        return new Response(JSON.stringify({ error: "Failed to contact AI service" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const genData = await genResponse.json();
      const genRaw = genData.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const genCleaned = genRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(genCleaned);
      } catch {
        return new Response(
          JSON.stringify({ error: "Template was too large to generate in one go. Try using fewer reports or splitting into two generations." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error("Generated template has invalid structure");
      }

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

      return new Response(JSON.stringify(parsed), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      console.error("Generation error:", err);
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate template" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  try {
    const refinePrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}. In pronoun-led sections, all options start with ${pronounCapital}.
${additionalContext ? `Additional context: ${additionalContext}` : ""}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Improve the existing template using the additional reports and the 10 rules:
- Add new heading options within existing sections where new sentences appear
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

    if (!refineResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to contact AI service" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refineData = await refineResponse.json();
    const refineRaw = refineData.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const refineCleaned = refineRaw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(refineCleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Refinement failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Refined template has invalid structure");
    }

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Refinement error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to refine template" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

const GENERATION_CHAR_LIMIT = 24000;