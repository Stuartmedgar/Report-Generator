// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GENERATION_CHAR_LIMIT = 24000;

const KNOWLEDGE_BASE = `You are an expert at analysing teacher-written school reports and building report templates.

PRINCIPLE 1: The teacher should be able to use the finished template to recreate the exact reports that were shared. Every sentence from every report should be findable as an option somewhere in the template.

PRINCIPLE 2: The teacher should be able to use the finished template to write a new set of reports that they would recognise as their own — same voice, same vocabulary, same sentence structure, same tone.

RULE 7: The teacher's actual sentences are the options. Copy them exactly but replace any student names with [Name] and any numeric scores with [Score] (removing any % sign — the teacher will add % themselves when writing). When generating a variety option, write it as if you are the teacher — same words, same short direct style, same level of formality. Never generate options that sound formal, corporate, or AI-written.

CRITICAL: Replace ALL student names with [Name]. Replace ALL numeric scores and percentages with [Score] — remove the % symbol entirely. Keep pronoun pattern consistent within each section.`;

const RATING_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to build a RATING/JUDGEMENT section from teacher-written report sentences.

The teacher has provided example sentences that vary by performance level. You must:
1. Read ALL the example sentences provided
2. Also scan the full reports provided for any additional sentences at this position
3. Group sentences by performance level under the appropriate heading
4. Replace ALL student names with [Name] and all scores with [Score] (no % symbol)
5. Generate additional variety options in the teacher's exact voice where needed
6. All options must use [Name] as the opener

FOR RATED-COMMENT (4-level scale):
Map sentences to: excellent, good, satisfactory, needsImprovement
Generate options for any level that has fewer than 3 sentences
Return 4 options per level

FOR QUALITIES (teacher's own scale):
Derive the heading names from the teacher's own language and groupings
Each heading represents a distinct performance group the teacher uses
2-3 options per heading

Return ONLY valid JSON, no markdown:
{
  "type": "rated-comment" or "qualities",
  "sectionName": "string",
  "result": {
    For rated-comment: {"excellent": ["..."], "good": ["..."], "satisfactory": ["..."], "needsImprovement": ["..."], "notCompleted": ["[Name] has not completed this.", "[Name] was absent for this."]}
    For qualities: {"headings": [{"name": "heading name", "comments": ["option 1", "option 2"]}]}
  }
}`;

const QUALITIES_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to extract ALL quality sentences from a teacher's report text and group them into a template section.

The teacher has pasted selected quality sentences from their reports. You must:
1. Read the selected examples carefully to understand what quality sentences look like in these reports
2. Scan ALL the full reports provided for any additional quality sentences not in the selection
3. Group similar sentences under short, clear heading names
4. Heading names must make any judgement immediately obvious where relevant (e.g. "Excellent Effort and Behaviour", "Can Lack Focus")
5. Replace ALL student names with [Name]
6. Generate one additional variety option per heading in the teacher's exact voice
7. The specified opener ([Name] or pronoun) must be used consistently for ALL options

DO NOT include sentences about progress, assessment scores, or next steps — only character, behaviour, attitude, effort, working style sentences.

Return ONLY valid JSON, no markdown:
{
  "sectionName": "string",
  "headings": [
    {"name": "Short clear heading", "comments": ["option 1", "option 2", "option 3"]}
  ]
}`;

const DEVELOPMENT_SYSTEM = `${KNOWLEDGE_BASE}

Your task is to extract ALL areas for development or next steps sentences from a teacher's report text and group them by topic.

The teacher has pasted selected sentences. You must:
1. Read the selected examples to understand what development sentences look like in these reports
2. Scan ALL the full reports for additional sentences at this position
3. IGNORE any "Next Steps:" or "Areas for Development:" headings — these are section headers, not content
4. IGNORE any standard closing sentences like "Regular revision is advised..." — these are standard comments, not individual development points
5. Group sentences about the SAME topic under the same focus area heading
6. Different focus areas must cover DIFFERENT topics
7. Options within a focus area are different phrasings of the SAME topic
8. Replace ALL student names with [Name]
9. Preserve any fixed opening phrase the teacher always uses (e.g. "Moving forward,")
10. Generate variety options in the teacher's exact voice
11. The specified opener ([Name] or pronoun) must be used consistently for ALL options

Return ONLY valid JSON, no markdown:
{
  "sectionName": "string",
  "focusAreas": {
    "Topic Name": ["option 1", "option 2", "option 3"],
    "Another Topic": ["option 1", "option 2", "option 3"]
  }
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

  builtSections.forEach((section, index) => {
    if (index > 0 && section.type !== 'new-line') {
      sections.push({ id: makeId(), type: 'new-line', name: '', data: {} });
    }
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
      sections.push({ id: makeId(), type: 'personalised-comment', name: section.name || 'Assessment', data: { instruction: section.data?.instruction || 'Enter the score for this pupil', categories: section.data?.categories || {} } });
    } else if (section.type === 'optional-additional-comment') {
      sections.push({ id: makeId(), type: 'optional-additional-comment', name: section.name || 'Additional Comments', data: {} });
    }
  });

  const lastMeaningful = [...sections].reverse().find(s => s.type !== 'new-line');
  if (!lastMeaningful || lastMeaningful.type !== 'optional-additional-comment') {
    sections.push({ id: makeId(), type: 'new-line', name: '', data: {} });
    sections.push({ id: makeId(), type: 'optional-additional-comment', name: 'Additional Comments', data: {} });
  }
  return { templateName, sections };
}

function stripPercent(text: string): string {
  return text.replace(/\[Score\]%/g, '[Score]').replace(/(\d+)%/g, '[Score]').replace(/(\d+\/\d+)/g, '[Score]');
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return new Response(JSON.stringify({ error: "API key not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let mode, subject, yearGroup, reportText, pronounSet, examples, openerType,
      sectionName, builtSections, existingTemplate, refineText, sourceSection,
      scaleType, positionType, selectedText;

  try {
    const body = await req.json();
    mode = body.mode || "group";
    subject = body.subject || "";
    yearGroup = body.yearGroup || "";
    reportText = body.reportText || "";
    pronounSet = body.pronounSet || "they/their";
    examples = body.examples || [];
    openerType = body.openerType || "name";
    sectionName = body.sectionName || "";
    builtSections = body.builtSections || [];
    existingTemplate = body.existingTemplate || null;
    refineText = body.refineText || "";
    sourceSection = body.sourceSection || null;
    scaleType = body.scaleType || "own"; // "four-level" or "own"
    positionType = body.positionType || "qualities"; // "qualities", "development", "nextsteps", "rating"
    selectedText = body.selectedText || ""; // teacher's selected quality/development sentences
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
          system: `${KNOWLEDGE_BASE}\n\nRewrite a qualities section so every comment uses a consistent opener. If [Name]-led: every comment starts with [Name]. If pronoun-led: every comment starts with the selected pronoun. Keep everything else identical. Return ONLY valid JSON: {"sectionName":"string","headings":[{"name":"string","comments":["..."]}]}`,
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

  // ─── MODE: RATING ─────────────────────────────────────────────────────────
  if (mode === "rating") {
    const openerInstruction = `All options must start with [Name]. Replace ALL student names with [Name]. Replace ALL scores/percentages with [Score] (no % symbol).`;
    const scaleInstruction = scaleType === "four-level"
      ? `Use the 4-level rated-comment structure: excellent, good, satisfactory, needsImprovement. Map the teacher's sentences to these levels. Generate options for any level with fewer than 3 sentences. Return type: "rated-comment".`
      : `Derive headings from the teacher's own language and groupings. Each heading = a distinct performance group from the reports. Return type: "qualities".`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 4000,
          system: RATING_SYSTEM,
          messages: [{
            role: "user", content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\nSection name: ${sectionName}\n${openerInstruction}\n${scaleInstruction}\n\nTeacher's example sentences:\n${examples.map((e: string, i: number) => `${i + 1}: ${e}`).join('\n')}\n\nFULL REPORTS (scan for additional sentences at this position):\n${reportText.substring(0, GENERATION_CHAR_LIMIT)}`,
          }],
        }),
      });
      const data = await response.json();
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      // Strip % from all comments
      if (parsed.result?.excellent) { Object.keys(parsed.result).forEach(k => { parsed.result[k] = parsed.result[k].map(stripPercent); }); }
      if (parsed.result?.headings) { parsed.result.headings = parsed.result.headings.map((h: any) => ({ ...h, comments: h.comments.map(stripPercent) })); }
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Rating grouping failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: EXTRACT-QUALITIES ──────────────────────────────────────────────
  if (mode === "extract-qualities") {
    const openerInstruction = openerType === "pronoun"
      ? `All options must start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}. Use ${pronounFull} for possessives.`
      : `All options must start with [Name]. Replace ALL student names with [Name]. Use ${pronounFull} for possessives mid-sentence.`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 6000,
          system: QUALITIES_SYSTEM,
          messages: [{
            role: "user", content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\nSection name: ${sectionName}\n${openerInstruction}\n\nTEACHER'S SELECTED QUALITY SENTENCES (use these to understand the pattern):\n${selectedText}\n\nFULL REPORTS (scan ALL of these for additional quality sentences matching the pattern):\n${reportText.substring(0, GENERATION_CHAR_LIMIT)}\n\nExtract ALL quality/character sentences. Group them. Build the section.`,
          }],
        }),
      });
      const data = await response.json();
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      return new Response(JSON.stringify(JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Quality extraction failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  // ─── MODE: EXTRACT-DEVELOPMENT ────────────────────────────────────────────
  if (mode === "extract-development") {
    const openerInstruction = openerType === "pronoun"
      ? `All options must start with ${pronounCapital}. Replace [Name] openers with ${pronounCapital}.`
      : `All options must start with [Name]. Replace ALL student names with [Name].`;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 6000,
          system: DEVELOPMENT_SYSTEM,
          messages: [{
            role: "user", content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\nSection name: ${sectionName}\nPosition type: ${positionType}\n${openerInstruction}\n\nTEACHER'S SELECTED SENTENCES:\n${selectedText}\n\nFULL REPORTS:\n${reportText.substring(0, GENERATION_CHAR_LIMIT)}\n\nExtract and group sentences. Ignore section headings and standard closing advice.`,
          }],
        }),
      });
      const data = await response.json();
      const raw = data.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
      return new Response(JSON.stringify(JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim())), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ error: "Development extraction failed. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
          system: `${KNOWLEDGE_BASE}\n\nImprove an existing report template using additional reports. Return ONLY valid JSON with same structure as input. Replace ALL student names with [Name]. Replace ALL scores with [Score] — no % symbol. Keep same template name.`,
          messages: [{
            role: "user", content: `Subject: ${subject}\nYear Group: ${yearGroup || "Not specified"}\nPronoun set: ${pronounFull}\n\nEXISTING TEMPLATE:\n${JSON.stringify(existingTemplate, null, 2)}\n\nADDITIONAL REPORTS:\n${refineText.substring(0, GENERATION_CHAR_LIMIT)}\n\nAdd new options where new sentences appear. Add new sections if new positions are found.`,
          }],
        }),
      });
      const data = await response.json();
      const raw = data.content.filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const parsed = JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Refinement failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});