// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRUCTURE_DETECTION_PROMPT = `You are an expert at analysing teacher-written school reports.
Detect the structure and format the teacher uses and return it as JSON.

Analyse the reports and identify the ORDER of sections as they appear.

Return ONLY this JSON, no markdown, no backticks:
{
  "detectedStructure": [
    {
      "position": 1,
      "type": "rated-comment",
      "description": "Brief description of what this section contains",
      "example": "First few words of a typical example..."
    }
  ],
  "formatNotes": "Any notable formatting observations"
}

Section types: rated-comment, standard-comment, qualities, assessment-comment, next-steps, new-line, optional-additional-comment
Description: 5-10 words. Example: first 8-10 words only.`;

const GENERATION_PROMPT = `You are an expert at analysing teacher-written school reports and building report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
CRITICAL — READ ALL REPORTS BEFORE DOING ANYTHING
═══════════════════════════════════════════════════════
The first report you read is NOT the template. ONE report is not enough.
The PATTERN across ALL reports is what you are looking for.

Before building any section, read every single report and ask:
- What sentences appear in EVERY report? (→ standard-comment or repeated structure)
- What sentences appear in every report but VARY by student performance? (→ rated-comment)
- What sentences appear in every report but describe DIFFERENT qualities or traits? (→ qualities)
- What sentences appear in every report but address DIFFERENT next steps topics? (→ next-steps)
- What sentences appear in only SOME reports? (→ probably a qualities or next-steps option)

Only after reading ALL reports should you start building sections.

═══════════════════════════════════════════════════════
YOUR APPROACH — SENTENCE BY SENTENCE
═══════════════════════════════════════════════════════
Work through the reports sentence by sentence, exactly as a skilled human editor would.

For each sentence POSITION across the reports, ask:
- What is this sentence doing across ALL reports?
- Does it vary by performance level, by trait/topic, or not at all?
- Does the teacher use [Name] or a pronoun at this position?

Build ONE comment box per sentence position.
The section type is your OUTPUT FORMAT — read the pattern first, then choose the right type.

═══════════════════════════════════════════════════════
LANGUAGE — EXTRACT AND PRESERVE
═══════════════════════════════════════════════════════
Use the teacher's ACTUAL sentences from the reports. The teacher should recognise their own voice.
- Keep complete natural sentences whole — do not break them apart
- Preserve subject-specific language exactly
- Correct only genuine grammar errors, not style
- Add 1-2 variety options per heading in the same voice as the teacher where needed

NAME AND PRONOUN PATTERN:
Detect how the teacher uses names and pronouns across sentence positions.
Mirror this exactly — do not use [Name] where the teacher used a pronoun and vice versa.
Use the selected pronoun set consistently.
Avoid name overuse — consecutive sentences using [Name] looks unnatural and copy-pasted.

═══════════════════════════════════════════════════════
NEAR-IDENTICAL PARAGRAPHS
═══════════════════════════════════════════════════════
If a paragraph appears across most reports with only name/pronoun differences → standard-comment.
Mentally strip names and pronouns. If 80%+ of content words match across reports → standard-comment.
Use [Name] where the student name appears.

═══════════════════════════════════════════════════════
SECTION TYPE RULES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Identical in every report (name/pronoun variation ignored).
→ type: "standard-comment", data.content: string using [Name]

RATED COMMENT
Same sentence position, varies clearly by student PERFORMANCE LEVEL across reports.
Use when the opening or any sentence clearly reflects how well the student is doing.
Group sentences from reports by performance level. Add 1-2 variety options per level.
→ type: "rated-comment"
→ data.comments: keys excellent, good, satisfactory, needsImprovement — 4 comments each

QUALITIES — ONE SECTION PER SENTENCE POSITION
For sentences describing character traits, attitudes, qualities.
Each qualities SECTION = one sentence position in the report.
Headings = different TOPICS or TRAITS for that sentence position.
Each heading has 2-3 options — grouped similar sentences, plus variety options in teacher's voice.
ALL comments in one section use [Name] OR all use the pronoun — mirror the teacher's pattern.
The teacher picks ONE heading per section — together they form a natural flowing paragraph.
→ type: "qualities"
→ data.comments: each key is a trait/topic, value is array of 2-3 comments

ASSESSMENT COMMENT
For sentences mentioning scores/percentages — one SEPARATE section per distinct assessment.
If the teacher writes the SAME sentence for every student with only the score changing → use standard-comment with [Score] instead.
Only use full assessment-comment when sentences differ meaningfully based on performance.
→ type: "assessment-comment", data.scoreType: "percentage" or "outOf"
→ data.comments: 4 per level with [Score], notCompleted: 2 without [Score]

NEXT STEPS — ONE SECTION PER SENTENCE POSITION
Each next-steps section = one sentence position in the next steps paragraph.
Focus areas within a section = DIFFERENT TOPICS available for that position.
Options within a focus area = different phrasings of the SAME topic.
Teacher picks ONE focus area per section — together they cover different improvement topics.
Preserve any opening phrase the teacher always uses (e.g. "Moving forward,").
Mirror the teacher's name/pronoun pattern across sections.
3-4 options per focus area.
→ type: "next-steps"
→ data.focusAreas: each key is a topic, value is array of 3-4 suggestions

NEW LINE: type "new-line", name: "", data: {}
OPTIONAL ADDITIONAL COMMENT: always one at end

PERSONALISED COMMENT — VERY RARELY USED
Only when teacher types something unique per student (sport, instrument, role).
→ type: "personalised-comment", data.instruction: string, data.categories: object where values are ARRAYS

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Read ALL reports before building any section
- Mirror the teacher's name/pronoun pattern sentence by sentence
- Use [Score] where assessment scores appear
- Keep teacher's actual language — do not paraphrase
- Add new-line between major sections
- End with optional-additional-comment
- Return ONLY valid JSON

═══════════════════════════════════════════════════════
JSON FORMAT REFERENCE
═══════════════════════════════════════════════════════
THE CONTENT BELOW IS FOR FORMAT ILLUSTRATION ONLY.
Generate content from the actual reports — do not copy this content.
The section names, headings, and comments below are examples of structure, not subject matter.

{"templateName":"[Subject] [Year Group] Report","sections":[
  {"id":"s1","type":"rated-comment","name":"Opening Statement","data":{"comments":{
    "excellent":["[Name] opening sentence blending character and strong progress, which is great to see.","[Name] second excellent option in teacher's voice.","[Name] third excellent option.","[Name] fourth excellent option."],
    "good":["[Name] opening sentence blending character and good progress.","[Name] second good option.","[Name] third good option.","[Name] fourth good option."],
    "satisfactory":["[Name] opening sentence blending character and some progress.","[Name] second satisfactory option.","[Name] third satisfactory option.","[Name] fourth satisfactory option."],
    "needsImprovement":["[Name] opening sentence blending character and limited progress.","[Name] second needs improvement option.","[Name] third option.","[Name] fourth option."]
  }}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Sentence Position 2 — Name-led","data":{"comments":{
    "Trait or Topic A":["[Name] sentence using name describing trait A, option 1.","[Name] sentence describing trait A, option 2.","[Name] sentence describing trait A, option 3."],
    "Trait or Topic B":["[Name] sentence describing trait B, option 1.","[Name] sentence describing trait B, option 2."],
    "Trait or Topic C":["[Name] sentence describing trait C, option 1.","[Name] sentence describing trait C, option 2."]
  }}},
  {"id":"s4","type":"qualities","name":"Sentence Position 3 — Pronoun-led","data":{"comments":{
    "Follow-on Topic A":["Pronoun sentence following on from position 2, topic A, option 1.","Pronoun sentence topic A option 2.","Pronoun sentence topic A option 3."],
    "Follow-on Topic B":["Pronoun sentence topic B option 1.","Pronoun sentence topic B option 2."],
    "Development Topic":["Pronoun developmental sentence option 1.","Pronoun developmental sentence option 2."]
  }}},
  {"id":"s5","type":"new-line","name":"","data":{}},
  {"id":"s6","type":"standard-comment","name":"Near-Identical Section Name","data":{"content":"Near-identical text that appears in every report with [Name] placeholder."}},
  {"id":"s7","type":"standard-comment","name":"Assessment 1 Name","data":{"content":"[Name] scored [Score] in the [Assessment Name] assessment"}},
  {"id":"s8","type":"standard-comment","name":"Assessment 2 Name","data":{"content":"and [Score] in the [Assessment 2 Name]."}},
  {"id":"s9","type":"qualities","name":"Assessment Reflection","data":{"comments":{
    "Strong in Both":["Pronoun sentence reflecting strong performance in both assessments.","Alternative option."],
    "Mixed Results":["Pronoun sentence reflecting mixed assessment performance.","Alternative option."],
    "Areas to Develop":["Pronoun sentence reflecting weaker performance needing development.","Alternative option."]
  }}},
  {"id":"s10","type":"new-line","name":"","data":{}},
  {"id":"s11","type":"next-steps","name":"Next Steps — Sentence 1","data":{"focusAreas":{
    "Topic A":["Opening phrase [Name] next steps sentence on topic A, option 1.","Opening phrase [Name] topic A option 2.","Opening phrase [Name] topic A option 3.","Opening phrase [Name] topic A option 4."],
    "Topic B":["Opening phrase [Name] next steps sentence on topic B, option 1.","Opening phrase [Name] topic B option 2.","Opening phrase [Name] topic B option 3.","Opening phrase [Name] topic B option 4."],
    "Topic C":["Opening phrase [Name] next steps on topic C, option 1.","Option 2.","Option 3.","Option 4."]
  }}},
  {"id":"s12","type":"next-steps","name":"Next Steps — Sentence 2","data":{"focusAreas":{
    "Topic A":["Pronoun next steps sentence on topic A, option 1.","Pronoun topic A option 2.","Pronoun topic A option 3."],
    "Topic B":["Pronoun next steps sentence on topic B, option 1.","Pronoun topic B option 2.","Pronoun topic B option 3."],
    "Topic C":["Pronoun next steps on topic C, option 1.","Option 2.","Option 3."]
  }}},
  {"id":"s13","type":"next-steps","name":"Next Steps — Sentence 3","data":{"focusAreas":{
    "Topic A":["[Name] next steps sentence on topic A, option 1.","[Name] topic A option 2.","[Name] topic A option 3.","Option 4."],
    "Topic B":["[Name] next steps on topic B, option 1.","Option 2.","Option 3.","Option 4."]
  }}},
  {"id":"s14","type":"new-line","name":"","data":{}},
  {"id":"s15","type":"qualities","name":"Closing Comment","data":{"comments":{
    "Positive Closing A":["Closing sentence option 1.","Closing sentence option 2."],
    "Positive Closing B":["Closing sentence option 1.","Closing sentence option 2."]
  }}},
  {"id":"s16","type":"new-line","name":"","data":{}},
  {"id":"s17","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to detect structure" }), {
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

  // ─── MODE: GENERATE ───────────────────────────────────────────────────────

  const pronounInstructions: Record<string, string> = {
    "he/his": "Selected pronoun: HE/HIM/HIS/HIMSELF.",
    "she/her": "Selected pronoun: SHE/HER/HERS/HERSELF.",
    "they/their": "Selected pronoun: THEY/THEM/THEIR/THEMSELVES.",
  };

  const pronounNote = pronounInstructions[pronounSet] || pronounInstructions["they/their"];
  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);

  const structureNote = useDetectedStructure && detectedStructure
    ? `\nFOLLOW THIS DETECTED STRUCTURE — generate sections in this order:\n${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}\n`
    : "";

  const placeholderNote = hasPlaceholders
    ? `\nThe report text contains placeholders where pre-defined sections were removed:
- {{STANDARD:Name}} → include as standard-comment marker with name "STANDARD:Name"
- {{CHOICE:Name}} → include as standard-comment marker with name "CHOICE:Name"
Pre-defined standard: ${standardCommentNames.join(", ")}
Pre-defined choice: ${choiceCommentNames.join(", ")}\n`
    : "";

  let userPrompt: string;

  if (isRefinement && existingTemplate) {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${reportText}

Read ALL the additional reports before making any changes.
Then improve the existing template:
- Add new sentence-position sections if the reports reveal positions not yet captured
- Add new topic headings within existing sections where new topics appear
- Add variety options to existing headings using the teacher's actual language
- Ensure near-identical paragraphs are standard-comments not qualities
- Ensure next-steps focus areas within a section cover different topics
- Mirror the teacher's name/pronoun pattern
- Keep [Name] and [Score] placeholders
- Maintain same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS TO ANALYSE:
${reportText}

READ ALL REPORTS FIRST — before building any section, read every report in full.
The first report is not the template. The pattern across ALL reports is the template.

Then work sentence by sentence:

STEP 1 — MAP THE PATTERNS:
For each sentence position across ALL reports, identify:
- Does this sentence appear in every report? If yes, does it vary by performance level, by trait/topic, or not at all?
- Does the teacher use [Name] or a pronoun at this position?
- What are the different versions of this sentence across the reports?

STEP 2 — BUILD ONE SECTION PER SENTENCE POSITION:

If a sentence varies by PERFORMANCE LEVEL across reports → rated-comment (4 options per level).
If a sentence varies by TRAIT or TOPIC across reports → qualities section (2-3 options per heading, all using [Name] OR all using ${pronounCapital} — mirror teacher's pattern at this position).
If a sentence is NEAR-IDENTICAL across reports (only name/pronoun differs) → standard-comment with [Name].
If a sentence mentions ASSESSMENT SCORES and is the same structure for all → standard-comment with [Score].
If sentences form a NEXT STEPS paragraph → one next-steps section per sentence position (3-4 options per focus area, each focus area a different topic, mirror name/pronoun pattern).
Preserve any fixed opening phrase (e.g. "Moving forward,") in the first next-steps section.

STEP 3 — USE THE TEACHER'S ACTUAL LANGUAGE:
Group similar sentences from the reports into the same heading.
Add 1-2 variety options in the same voice where needed.
Do not paraphrase — keep teacher's exact words where possible.

STEP 4 — ASSEMBLE IN ORDER:
Put sections in the order they appear in the reports.
Add new-line between major sections.
End with optional-additional-comment.`;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 16000,
        system: GENERATION_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", response.status, errorBody);
      return new Response(JSON.stringify({ error: "Failed to contact AI service" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawText = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Template was too large to generate in one go. Try using fewer reports or splitting into two generations." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Generated template has invalid structure");
    }

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

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate template" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});