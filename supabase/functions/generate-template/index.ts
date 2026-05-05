// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

// ─── SHARED KNOWLEDGE BASE ────────────────────────────────────────────────────

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

RULE 7: The teacher's actual sentences are the options. Copy them exactly. When generating a variety option, write it as if you are the teacher — same words where possible, same short direct style, same level of formality. Never generate options that sound formal, corporate, or AI-written.`;

// ─── GROUPING SYSTEM ──────────────────────────────────────────────────────────

const GROUPING_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to analyse teacher-written reports and group sentences at a specific position into headings for a template.

The teacher has identified a sentence position in their reports and provided examples. You must:
1. Read ALL the reports provided
2. Find every sentence at that position across all reports
3. Group similar sentences together under short, clear heading names
4. Where the position reflects a performance judgement, heading names must make that judgement immediately obvious
5. Copy sentences exactly as written — do not paraphrase or improve them
6. Generate one additional variety option per heading in the teacher's exact voice and style

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "Short descriptive name for this section",
  "headings": [
    {
      "name": "Short clear heading name",
      "comments": ["Exact sentence from reports", "Another exact sentence", "Generated variety option in teacher's voice"]
    }
  ]
}`;

// ─── GENERATION SYSTEM ────────────────────────────────────────────────────────

const GENERATION_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate a complete report template in JSON format from a set of pre-built sections provided by the teacher.

The sections have already been built through a guided process. Your job is to:
1. Assemble them in the correct order
2. Ensure each section has the correct JSON structure
3. Add new-line sections between major sections
4. End with optional-additional-comment
5. Generate the template name from the subject and year group

For qualities sections: all options in one section use [Name] OR all use the selected pronoun — never mix.
For next-steps sections: options within a focus area are different phrasings of the same topic.
For assessment-comment: 4 options per level with [Score], notCompleted: 2 without [Score].

Return ONLY valid JSON, no markdown, no backticks.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Section Name","data":{"comments":{"Heading Name":["Option 1","Option 2","Option 3"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Section Name","data":{"content":"Content text"}},
  {"id":"s4","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["Option with [Score]","Option 2","Option 3","Option 4"],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["Option without score","Option 2"]}}},
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

  let mode, subject, yearGroup, reportText, pronounSet,
      examples, positionType, openerType, sectionName,
      builtSections, existingTemplate, isRefinement, refineText,
      standardCommentNames;

  try {
    const body = await req.json();
    mode = body.mode || "group";
    subject = body.subject || "";
    yearGroup = body.yearGroup || "";
    reportText = body.reportText || "";
    pronounSet = body.pronounSet || "they/their";
    examples = body.examples || [];
    positionType = body.positionType || "qualities";
    openerType = body.openerType || "name";
    sectionName = body.sectionName || "";
    builtSections = body.builtSections || [];
    existingTemplate = body.existingTemplate || null;
    isRefinement = body.isRefinement || false;
    refineText = body.refineText || "";
    standardCommentNames = body.standardCommentNames || [];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
  const pronounFull = ({
    "he/his": "HE/HIM/HIS/HIMSELF",
    "she/her": "SHE/HER/HERS/HERSELF",
    "they/their": "THEY/THEM/THEIR/THEMSELVES",
  } as Record<string, string>)[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: GROUP ──────────────────────────────────────────────────────────
  // Takes teacher's example sentences, reads all reports, groups sentences at that position
  if (mode === "group") {
    if (!reportText || examples.length === 0) {
      return new Response(JSON.stringify({ error: "reportText and examples are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openerInstruction = openerType === "pronoun"
      ? `All comments must start with the pronoun ${pronounCapital} — never with [Name].`
      : `All comments must start with [Name] — never with a pronoun. Use ${pronounFull} for possessives mid-sentence (e.g. "his work", "her effort", "their progress").`;

    const positionInstructions: Record<string, string> = {
      progress: `This is the PROGRESS sentence position. Find every sentence across ALL reports that describes how well the student is doing overall. Group them by performance level — the heading names must make the judgement immediately obvious (e.g. "Strong Progress", "Good Progress", "Some Progress", "Progress Limited by Attendance"). ${openerInstruction}`,
      qualities: `This is a QUALITIES sentence position. Find every sentence across ALL reports that describes the student's character, behaviour, attitude, effort, or working style at this position. Group similar sentences together — heading names should reflect the quality being described and make the judgement obvious where relevant (e.g. "Excellent Effort and Behaviour", "Works Well in a Team", "Can Lack Focus"). ${openerInstruction}`,
      "next-steps": `This is a NEXT STEPS sentence position. Find every improvement suggestion sentence across ALL reports at this position. Group sentences about the SAME topic together as a focus area. Different focus areas must cover DIFFERENT topics. ${openerInstruction} Preserve any fixed opening phrase (e.g. "Moving forward,") in every option.`,
      assessment: `This is an ASSESSMENT sentence position. Find every assessment-related sentence across ALL reports. Group by performance level with judgement-clear heading names. ${openerInstruction}`,
    };

    const instruction = positionInstructions[positionType] || positionInstructions.qualities;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: GROUPING_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}
Section name hint: ${sectionName || positionType}

The teacher has identified this sentence position and provided these examples:
${examples.map((e: string, i: number) => `Example ${i + 1}: ${e}`).join('\n')}

${instruction}

Now read ALL the reports below and find every sentence at this position:

REPORTS:
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Group all sentences you find into headings. Include the teacher's examples plus every other sentence you find at this position. Generate one variety option per heading in the teacher's exact voice and style.`,
          }],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to contact AI service" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const rawText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify(parsed), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "Could not group sentences. Please try again." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: "Grouping failed. Please try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ─── MODE: ASSEMBLE ───────────────────────────────────────────────────────
  // Takes all the built sections and assembles the final template
  if (mode === "assemble") {
    if (!builtSections || builtSections.length === 0) {
      return new Response(JSON.stringify({ error: "No sections to assemble" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assemblePrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}

The teacher has built these sections through a guided process. Assemble them into a complete template.

PRE-DEFINED STANDARD COMMENTS (reproduce exactly word-for-word, no changes):
${standardCommentNames.length > 0 ? standardCommentNames.join('\n') : 'None'}

BUILT SECTIONS (in the order the teacher created them):
${JSON.stringify(builtSections, null, 2)}

Assemble these into a complete template JSON:
- Put sections in the order provided
- Add new-line between each major section
- End with optional-additional-comment
- Template name should reflect subject and year group
- Do not change any content — assemble only`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{ role: "user", content: assemblePrompt }],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to contact AI service" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const rawText = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch {
        return new Response(JSON.stringify({ error: "Assembly failed. Please try again." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error("Assembled template has invalid structure");
      }

      return new Response(JSON.stringify(parsed), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Assembly failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  if (mode === "refine" && existingTemplate) {
    try {
      const refinePrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${refineText.substring(0, GENERATION_CHAR_LIMIT)}

Improve the existing template using the additional reports:
- Add new heading options to existing sections where new sentences appear — copy them exactly
- Add new sections if reports reveal sentence positions not yet captured
- Ensure all headings have at least 2 options — add variety in the teacher's exact voice
- Keep [Name] and [Score] placeholders
- Maintain same template name`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{ role: "user", content: refinePrompt }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const rawText = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch { return new Response(JSON.stringify({ error: "Refinement failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) throw new Error("Refined template has invalid structure");

      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Refinement failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});