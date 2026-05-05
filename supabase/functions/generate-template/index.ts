// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

RULE 7: The teacher's actual sentences are the options. Copy them exactly but replace any student names with [Name]. When generating a variety option, write it as if you are the teacher — same words where possible, same short direct style, same level of formality. Never generate options that sound formal, corporate, or AI-written.

CRITICAL — NAME REPLACEMENT:
Every sentence you output must have ALL student names replaced with [Name].
Student names are proper nouns that appear at the start of sentences or mid-sentence referring to the pupil.
The pronoun pattern must be consistent within each section — if a section is [Name]-led, every option starts with [Name]. If pronoun-led, every option starts with the selected pronoun.`;

const GROUPING_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to analyse teacher-written reports and group sentences at a specific position into headings for a template.

The teacher has identified a sentence position and provided examples. You must:
1. Read ALL the reports provided
2. Find every sentence at that position across all reports
3. Group similar sentences together under short, clear heading names
4. Where the position reflects a performance judgement, heading names must make that judgement immediately obvious
5. Copy sentences exactly as written BUT replace ALL student names with [Name]
6. Generate one additional variety option per heading in the teacher's exact voice and style — also using [Name]
7. Ensure every option in a section uses the same opener — all [Name] OR all pronoun — never mix

PRONOUN CONSISTENCY: If the section is pronoun-led, rewrite any [Name]-starting sentences to start with the pronoun instead. Every option in a pronoun-led section must start with the pronoun.

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "Short descriptive name for this section",
  "headings": [
    {
      "name": "Short clear heading name",
      "comments": ["Sentence with [Name] replacing student name", "Another sentence with [Name]", "Generated variety option"]
    }
  ]
}`;

const GENERATION_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to generate a complete report template in JSON format from pre-built sections.

Assemble the sections in the correct order with new-line between major sections.
End with optional-additional-comment.
Generate the template name from subject and year group.
Do not change any content — assemble only.
Ensure ALL student names are replaced with [Name] in every comment.

Return ONLY valid JSON, no markdown, no backticks.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Section Name","data":{"comments":{"Heading Name":["Option 1","Option 2"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Section Name","data":{"content":"Content with [Name]"}},
  {"id":"s4","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] scored [Score]...","Option 2","Option 3","Option 4"],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["[Name] has not completed...","Option 2"]}}},
  {"id":"s5","type":"next-steps","name":"Section Name","data":{"focusAreas":{"Topic":["Option 1","Option 2","Option 3"]}}},
  {"id":"s6","type":"personalised-comment","name":"Section Name","data":{"instruction":"Enter the pupil's score","categories":{"Assessment Score":["[Name] scored [Score] in the assessment.","[Name] achieved [Score] in the assessment."]}}},
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
      builtSections, existingTemplate, isRefinement, refineText,
      standardCommentNames, assessmentType, assessmentCount, assessmentSentenceType;

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
    assessmentType = body.assessmentType || "assessment-comment"; // "personalised-comment" or "assessment-comment"
    assessmentCount = body.assessmentCount || "one"; // "one" or "multiple"
    assessmentSentenceType = body.assessmentSentenceType || "separate"; // "one-sentence" or "separate"
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);
  const pronounFull = ({
    "he/his": "HE/HIM/HIS/HIMSELF",
    "she/her": "SHE/HER/HERS/HERSELF",
    "they/their": "THEY/THEM/THEIR/THEMSELVES",
  } as Record<string, string>)[pronounSet] || "THEY/THEM/THEIR/THEMSELVES";

  // ─── MODE: GROUP ──────────────────────────────────────────────────────────
  if (mode === "group") {
    if (!reportText || examples.length === 0) return new Response(JSON.stringify({ error: "reportText and examples are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const openerInstruction = openerType === "pronoun"
      ? `All comments must start with the pronoun ${pronounCapital} — never with [Name]. Replace any student names with [Name] first, then rewrite the opener to use ${pronounCapital}.`
      : `All comments must start with [Name] — never with a student name or pronoun. Replace ALL student names with [Name]. Use ${pronounFull} for possessives mid-sentence.`;

    const positionInstructions: Record<string, string> = {
      progress: `This is the PROGRESS sentence position — usually the opening sentence. Find every sentence that describes overall progress or how the student is doing. Group by performance level with judgement-clear headings (e.g. "Strong Progress", "Good Progress", "Some Progress", "Progress Limited by Attendance", "Non-Attendance"). ${openerInstruction}`,
      qualities: `This is a QUALITIES sentence position. Find every sentence describing character, behaviour, attitude, effort, or working style at this position. Group by the quality described — make judgements clear in heading names where relevant (e.g. "Excellent Effort and Behaviour", "Works Well in a Team", "Can Lack Focus"). ${openerInstruction}`,
      "next-steps": `This is a NEXT STEPS sentence position. Find every improvement suggestion at this position. Group sentences about the SAME topic as a focus area. Different focus areas must cover DIFFERENT topics. Preserve any fixed opening phrase (e.g. "Moving forward,"). ${openerInstruction}`,
      assessment: `This is an ASSESSMENT description position (no numeric score). Find every assessment description sentence. Group by performance level with judgement-clear headings. ${openerInstruction}`,
      "personalised-comment": `This is a PERSONALISED COMMENT position — the teacher uses the same sentence structure for every pupil with only the score changing. Find every version of this sentence. Group similar versions together. Replace student names with [Name] and keep [Score] where the score appears. ${openerInstruction}`,
      "assessment-comment": `This is an ASSESSMENT COMMENT position — the teacher uses different sentences depending on how well the pupil did. Find every assessment sentence. Group by performance level (excellent, good, satisfactory, needsImprovement). Replace student names with [Name] and keep [Score] where scores appear. ${openerInstruction}`,
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

Group all sentences found. Generate one variety option per heading in the teacher's exact voice. All student names must be replaced with [Name] in every option.`,
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

    const assemblePrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Selected pronoun set: ${pronounFull}

Assemble these sections into a complete template. Add new-line between major sections. End with optional-additional-comment. Replace any remaining student names with [Name].

SECTIONS:
${JSON.stringify(builtSections, null, 2)}`;

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

Improve the template using the additional reports. Replace ALL student names with [Name]. Add new options where new sentences appear. Add new sections if new positions are found. Keep same template name.`,
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