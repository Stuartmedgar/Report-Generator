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

PRONOUN CONSISTENCY: If the section is pronoun-led, every option must start with the pronoun. If [Name]-led, every option must start with [Name].

Return ONLY valid JSON, no markdown, no backticks:
{
  "sectionName": "Short descriptive name for this section",
  "headings": [
    {
      "name": "Short clear heading name",
      "comments": ["Sentence with [Name]", "Another sentence", "Generated variety option"]
    }
  ]
}`;

const REWRITE_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to rewrite a qualities section so that every comment uses a consistent opener.

Rules:
- If rewriting as [Name]-led: every comment must start with [Name]. Replace pronoun openers with [Name].
- If rewriting as pronoun-led: every comment must start with the selected pronoun. Replace [Name] openers with the pronoun.
- Keep the rest of each sentence exactly the same.
- Replace any student names mid-sentence with [Name].
- Keep possessives consistent.
- Do not change heading names.

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── MECHANICAL ASSEMBLY ──────────────────────────────────────────────────────
// Converts builtSections directly to template JSON without any AI involvement

function mechanicalAssemble(params: {
  subject: string;
  yearGroup: string;
  builtSections: any[];
}): { templateName: string; sections: any[] } {
  const { subject, yearGroup, builtSections } = params;

  const templateName = [subject, yearGroup].filter(Boolean).join(' ') + ' Report Template';

  const sections: any[] = [];
  let idCounter = 0;
  const makeId = () => `s${++idCounter}_${Date.now()}`;

  builtSections.forEach((section, index) => {
    // Add new-line before each section except the first
    if (index > 0 && section.type !== 'new-line') {
      sections.push({ id: makeId(), type: 'new-line', name: '', data: {} });
    }

    if (section.type === 'standard-comment') {
      sections.push({
        id: makeId(),
        type: 'standard-comment',
        name: section.name || 'Standard Comment',
        data: { content: section.data?.content || section.data?.comment || '' },
      });
    } else if (section.type === 'qualities') {
      sections.push({
        id: makeId(),
        type: 'qualities',
        name: section.name || 'Qualities',
        data: { comments: section.data?.comments || {} },
      });
    } else if (section.type === 'next-steps') {
      sections.push({
        id: makeId(),
        type: 'next-steps',
        name: section.name || 'Next Steps',
        data: { focusAreas: section.data?.focusAreas || {} },
      });
    } else if (section.type === 'assessment-comment') {
      sections.push({
        id: makeId(),
        type: 'assessment-comment',
        name: section.name || 'Assessment',
        data: {
          scoreType: section.data?.scoreType || 'percentage',
          comments: section.data?.comments || {},
        },
      });
    } else if (section.type === 'personalised-comment') {
      sections.push({
        id: makeId(),
        type: 'personalised-comment',
        name: section.name || 'Assessment',
        data: {
          instruction: section.data?.instruction || 'Enter the score for this pupil',
          categories: section.data?.categories || {},
        },
      });
    } else if (section.type === 'new-line') {
      // Skip — we add new-lines automatically between sections
    } else if (section.type === 'optional-additional-comment') {
      sections.push({
        id: makeId(),
        type: 'optional-additional-comment',
        name: section.name || 'Additional Comments',
        data: {},
      });
    }
  });

  // Always end with optional-additional-comment if not already present
  const lastMeaningful = [...sections].reverse().find(s => s.type !== 'new-line');
  if (!lastMeaningful || lastMeaningful.type !== 'optional-additional-comment') {
    if (sections.length > 0) {
      sections.push({ id: makeId(), type: 'new-line', name: '', data: {} });
    }
    sections.push({ id: makeId(), type: 'optional-additional-comment', name: 'Additional Comments', data: {} });
  }

  return { templateName, sections };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let mode, subject, yearGroup, reportText, pronounSet,
      examples, positionType, openerType, sectionName,
      builtSections, existingTemplate, refineText, sourceSection;

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

  // ─── MODE: ASSEMBLE (mechanical — no AI) ─────────────────────────────────
  if (mode === "assemble") {
    if (!builtSections || builtSections.length === 0) {
      return new Response(JSON.stringify({ error: "No sections to assemble" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
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
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          system: REWRITE_SYSTEM,
          messages: [{
            role: "user",
            content: `Selected pronoun set: ${pronounFull}\n${openerInstruction}\n\nSECTION TO REWRITE:\n${JSON.stringify(sourceSection, null, 2)}\n\nRewrite every comment with the correct opener. Keep sentence structure identical otherwise.`,
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
      ? `All comments must start with ${pronounCapital} — never with [Name]. Replace student names with [Name] first, then rewrite openers to use ${pronounCapital}. Use ${pronounFull} for possessives.`
      : `All comments must start with [Name] — never with a student name or pronoun. Replace ALL student names with [Name]. Use ${pronounFull} for possessives mid-sentence.`;

    const positionInstructions: Record<string, string> = {
      progress: `PROGRESS sentence — usually the opening. Find every sentence describing overall progress. Group by performance level with judgement-clear headings. ${openerInstruction}`,
      qualities: `QUALITIES sentence. Find every sentence describing character, behaviour, attitude, effort, or working style. Group by quality with judgement-clear headings where relevant. ${openerInstruction}`,
      development: `AREAS FOR DEVELOPMENT / NEXT STEPS sentences. Find every developmental or improvement sentence at this position. Group by topic — different focus areas must cover DIFFERENT topics. Options within a focus area are different phrasings of the SAME topic. ${openerInstruction}`,
      "next-steps": `NEXT STEPS sentence. Find every improvement suggestion at this position. Group by topic — different focus areas cover DIFFERENT topics. Preserve any fixed opening phrase (e.g. "Moving forward,"). ${openerInstruction}`,
      assessment: `ASSESSMENT description (no numeric score). Find every assessment description. Group by performance level with judgement-clear headings. ${openerInstruction}`,
      "assessment-comment": `ASSESSMENT COMMENT — teacher uses different sentences by performance level. Find every assessment sentence. Group into performance levels. Replace names with [Name] and actual scores with [Score]. ${openerInstruction}`,
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

REPORTS (find ALL sentences at this position, replace student names with [Name] and scores with [Score]):
${reportText.substring(0, GENERATION_CHAR_LIMIT)}

Group all sentences found. Generate one variety option per heading in the teacher's exact voice. Replace ALL student names with [Name] and all scores with [Score].`,
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

  // ─── MODE: REFINEMENT ─────────────────────────────────────────────────────
  if (mode === "refine" && existingTemplate) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          system: `${KNOWLEDGE_BASE}

Generate a complete report template in JSON format. Return ONLY valid JSON.

JSON structure:
{"templateName":"string","sections":[
  {"id":"s1","type":"qualities","name":"Name","data":{"comments":{"Heading":["Option 1","Option 2"]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"standard-comment","name":"Name","data":{"content":"text"}},
  {"id":"s4","type":"assessment-comment","name":"Name","data":{"scoreType":"percentage","comments":{"excellent":["..."],"good":["..."],"satisfactory":["..."],"needsImprovement":["..."],"notCompleted":["..."]}}},
  {"id":"s5","type":"next-steps","name":"Name","data":{"focusAreas":{"Topic":["Option 1","Option 2","Option 3"]}}},
  {"id":"s6","type":"personalised-comment","name":"Name","data":{"instruction":"Enter score","categories":{"Score":["[Name] scored [Score]"]}}},
  {"id":"s7","type":"optional-additional-comment","name":"Additional Comments","data":{}}
]}`,
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