// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

RULE 7: The teacher's actual sentences are the options. Copy them exactly but replace any student names with [Name] and any scores/percentages with [Score]. When generating a variety option, write it as if you are the teacher — same words where possible, same short direct style. Never generate options that sound formal, corporate, or AI-written.

CRITICAL — NAME REPLACEMENT: Every sentence you output must have ALL student names replaced with [Name]. The pronoun pattern must be consistent within each section.`;

const GROUPING_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to analyse teacher-written reports and group sentences at a specific position into headings for a template.

The teacher has identified a sentence position and provided examples. You must:
1. Read ALL the reports provided
2. Find every sentence at that position across all reports
3. Group similar sentences together under short, clear heading names
4. Where the position reflects a performance judgement, heading names must make that judgement immediately obvious
5. Copy sentences exactly as written BUT replace ALL student names with [Name] and any scores/percentages with [Score]
6. Generate one additional variety option per heading in the teacher's exact voice — also using [Name]
7. Ensure every option in a section uses the same opener — all [Name] OR all pronoun — never mix

PRONOUN CONSISTENCY: If the section is pronoun-led, every option must start with the pronoun. Rewrite any [Name]-starting sentences to start with the pronoun. If the section is [Name]-led, every option must start with [Name].

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "Short descriptive name for this section",
  "headings": [
    {
      "name": "Short clear heading name",
      "comments": ["Sentence with [Name]", "Another sentence with [Name]", "Generated variety option"]
    }
  ]
}`;

const REWRITE_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to rewrite a qualities section so that every comment uses a consistent opener — either all starting with [Name] or all starting with the selected pronoun.

Rules:
- If rewriting as [Name]-led: every comment must start with [Name]. Replace pronoun openers with [Name].
- If rewriting as pronoun-led: every comment must start with the selected pronoun. Replace [Name] openers with the pronoun.
- Keep the rest of each sentence exactly the same — same words, same structure, same meaning.
- Replace any student names mid-sentence with [Name].
- Keep possessives consistent — use the correct pronoun for mid-sentence possessives.
- Do not change heading names.
- Return the same structure with rewritten comments.

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "string",
  "headings": [
    {
      "name": "heading name unchanged",
      "comments": ["Rewritten comment 1", "Rewritten comment 2"]
    }
  ]
}`;

const GENERATION_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate a complete report template in JSON format from pre-built sections.

Assemble the sections in the correct order with new-line between major sections.
End with optional-additional-comment.
Generate the template name from subject and year group.
Do not change any content — assemble only.
Ensure ALL student names are replaced with [Name] and all scores with [Score] in every comment.

Return ONLY valid JSON, no markdown, no backticks.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Section Name","data":{"comments":{"Heading Name":["Option 1","Option 2"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Section Name","data":{"content":"Content with [Name]"}},
  {"id":"s4","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] scored [Score]...","Option 2","Option 3","Option 4"],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["[Name] has not completed...","Option 2"]}}},
  {"id":"s5","type":"next-steps","name":"Section Name","data":{"focusAreas":{"Topic":["Option 1","Option 2","Option 3"]}}},
  {"id":"s6","type":"personalised-comment","name":"Section Name","data":{"instruction":"Enter the pupil's score for this assessment","categories":{"Assessment Score":["[Name] scored [Score] in the assessment.","[Name] achieved [Score] in the assessment."]}}},
  {"id":"s7","type":"optional-additional-comment","name":"Additional Comments","data":{}}
]}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let mode, subject, yearGroup, reportText, pronounSet,
      examples, positionType, openerType, sectionName,
      builtSections, existingTemplate, refineText,
      sourceSection;

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
    refineText = body.refineText || "";
    sourceSection = body.sourceSection || null;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
  const pronounFull = ({
    "he/his": "HE/HIM/HIS/HIMSELF",
    "she/her": "SHE/HER/HERS/HERSELF",
    "they/their": "THEY/THEM/THEIR/THEMSELVES",
  } as Record<string, string>)[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: REWRITE ────────────────────────────────────────────────────────
  // Rewrites a qualities section with consistent pronoun/name opener
  if (mode === "rewrite") {
    if (!sourceSection) return new Response(JSON.stringify({ error: "sourceSection is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const openerInstruction = openerType === "pronoun"
      ? `Rewrite every comment to start with ${pronounCapital}. Replace any [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence (his/her/their work etc).`
      : `Rewrite every comment to start with [Name]. Replace any pronoun openers (${pronounCapital}, ${pronounCapital.toLowerCase()}) with [Name]. Keep correct pronoun possessives mid-sentence.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: REWRITE_SYSTEM,
          messages: [{
            role: "user",
            content: `Selected pronoun set: ${pronounFull}
${openerInstruction}

SECTION TO REWRITE:
${JSON.stringify(sourceSection, null, 2)}

Rewrite every comment with the correct opener. Keep sentence structure identical otherwise.`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Rewrite failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const rawText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        return new Response(JSON.stringify(JSON.parse(cleaned)), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Rewrite parsing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Rewrite failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: GROUP ──────────────────────────────────────────────────────────
  if (mode === "group") {
    if (!reportText || examples.length === 0) return new Response(JSON.stringify({ error: "reportText and examples are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const openerInstruction = openerType === "pronoun"
      ? `All comments must start with the pronoun ${pronounCapital} — never with [Name]. Replace any student names with [Name] first, then rewrite the opener to use ${pronounCapital}. Use ${pronounFull} for possessives mid-sentence.`
      : `All comments must start with [Name] — never with a student name or pronoun. Replace ALL student names with [Name]. Use ${pronounFull} for possessives mid-sentence.`;

    const positionInstructions: Record<string, string> = {
      progress: `PROGRESS sentence position — usually the opening sentence. Find every sentence describing overall progress. Group by performance level with judgement-clear headings (e.g. "Strong Progress", "Good Progress", "Some Progress", "Progress Limited by Attendance", "Non-Attendance"). ${openerInstruction}`,
      qualities: `QUALITIES sentence position. Find every sentence describing character, behaviour, attitude, effort, or working style. Group by quality with judgement-clear headings where relevant. ${openerInstruction}`,
      "next-steps": `NEXT STEPS sentence position. Find every improvement suggestion at this position. Group by topic — different focus areas must cover DIFFERENT topics. Preserve any fixed opening phrase (e.g. "Moving forward,"). ${openerInstruction}`,
      assessment: `ASSESSMENT description position (no numeric score). Find every assessment description. Group by performance level. ${openerInstruction}`,
      "assessment-comment": `ASSESSMENT COMMENT position — teacher uses different sentences by performance level. Find every assessment sentence. Group into: excellent, good, satisfactory, needsImprovement. Replace names with [Name] and actual scores with [Score]. ${openerInstruction}`,
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
Section: ${sectionName || positionType}

Teacher's example sentences (replace any student names with [Name]):
${examples.map((e: string, i: number) => `Example ${i + 1}: ${e}`).join('\n')}

${instruction}

REPORTS (find ALL sentences at this position, replace student names with [Name]):
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Group all sentences found. Generate one variety option per heading in the teacher's exact voice. Replace ALL student names with [Name] and all scores with [Score] in every option.`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const rawText = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        return new Response(JSON.stringify(JSON.parse(cleaned)), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ error: "Could not group sentences. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    } catch {
      return new Response(JSON.stringify({ error: "Grouping failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: ASSEMBLE ───────────────────────────────────────────────────────
  if (mode === "assemble") {
    if (!builtSections || builtSections.length === 0) return new Response(JSON.stringify({ error: "No sections to assemble" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}

Assemble these sections into a complete template. Add new-line between major sections. End with optional-additional-comment. Replace any remaining student names with [Name] and scores with [Score].

SECTIONS:
${JSON.stringify(builtSections, null, 2)}`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const rawText = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch { return new Response(JSON.stringify({ error: "Assembly failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      if (!parsed.templateName || !parsed.sections) throw new Error("Invalid template structure");
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Assembly failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  if (mode === "refine" && existingTemplate) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: GENERATION_SYSTEM,
          messages: [{
            role: "user",
            content: `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${refineText.substring(0, GENERATION_CHAR_LIMIT)}

Improve the template using the additional reports. Replace ALL student names with [Name] and scores with [Score]. Add new options where new sentences appear. Add new sections if new positions are found. Keep same template name.`,
          }],
        }),
      });

      if (!response.ok) return new Response(JSON.stringify({ error: "Failed to contact AI service" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const data = await response.json();
      const rawText = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let parsed;
      try { parsed = JSON.parse(cleaned); }
      catch { return new Response(JSON.stringify({ error: "Refinement failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Refinement failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});