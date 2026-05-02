// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

YOUR PRIMARY TASK is to read ALL the reports carefully and identify which PATTERN each type of statement follows. There are four distinct patterns:

═══════════════════════════════════════════════════════
PATTERN 1 — STANDARD COMMENT
═══════════════════════════════════════════════════════
The EXACT SAME text appears in every report with NO variation whatsoever, regardless of how the student is performing. Word for word identical across all reports.
Examples: study support session times, resource links, website names, class-wide information.
→ Use section type: "standard-comment"
→ data.content is a single string using [Name] if needed.
KEY TEST: Would this sentence be identical for the highest and lowest performing student? If yes → standard-comment.

═══════════════════════════════════════════════════════
PATTERN 2 — RATED COMMENT (explicit rating word swapped)
═══════════════════════════════════════════════════════
The SAME sentence structure appears across reports but a rating word changes to reflect performance level. e.g. "is making excellent/good/satisfactory/limited progress through the course."
→ Use section type: "rated-comment"
→ Preserve the teacher's EXACT sentence structure at each level, only changing the rating word and any naturally connected language.
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 3 comments using [Name].

═══════════════════════════════════════════════════════
PATTERN 3 — RATED COMMENT (same topic, different language)
═══════════════════════════════════════════════════════
Different sentences across reports all describing the SAME aspect of performance (effort, attainment, participation, behaviour, focus) but using genuinely different language reflecting different performance levels.
→ Use section type: "rated-comment"
→ Write comments at each level that reflect the range of language used across all reports.
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 3 comments using [Name].
KEY TEST: Does this statement describe how well the student does something? If yes → rated-comment.

═══════════════════════════════════════════════════════
PATTERN 4 — QUALITIES
═══════════════════════════════════════════════════════
Statements about personal CHARACTER TRAITS, SOFT SKILLS or ATTITUDES that describe what kind of person/learner the student is rather than how well they perform academically. These often cluster together in the same part of each report.
Examples: leadership, teamwork, confidence, social skills, resilience, attitude to learning, relationships with peers.
→ Use section type: "qualities"
→ Group by theme into headings (e.g. "Character", "Social Skills", "Work Ethic", "Leadership")
→ Under each heading provide 2-3 comments MAXIMUM — one clearly positive, one developmental (needs to work on it). Do NOT create a full rating scale.
→ data.comments is an object where each key is a heading and value is an array of 2-3 comments using [Name].
KEY TEST: Is this about who the student IS rather than how well they PERFORM? If yes → qualities.

CRITICAL DISTINCTIONS:
- "is making excellent progress" → RATED COMMENT (performance)
- "is a positive and enthusiastic member of the class" → QUALITIES (character trait)
- "puts a lot of effort into individual work" → RATED COMMENT if it varies between students
- "Pupils are encouraged to attend supported study on Tuesdays" → STANDARD COMMENT (identical for all)
- "achieved [Score] in the assessment" → ASSESSMENT COMMENT

═══════════════════════════════════════════════════════
OTHER SECTION TYPES
═══════════════════════════════════════════════════════
- "assessment-comment": ALWAYS use when reports mention test scores, percentages or assessment results. Create a SEPARATE assessment-comment section for each distinct assessment mentioned. Every single comment at every level MUST include [Score] — never use actual numbers. data.comments has keys: excellent, good, satisfactory, needsImprovement, notCompleted. notCompleted comments should NOT include [Score]. Also needs scoreType ("percentage" or "outOf").

- "personalised-comment": use when different students are described doing different activities, topics or instruments. data.instruction is a string. data.categories is object where each key is a category name and value is array of 3 comments using [Name].

- "next-steps": forward-looking improvement suggestions. data.focusAreas is object where each key is a focus area name and value is array of 3 suggestions using [Name].

- "new-line": formatting only. data is {}. Add one between each main section.

- "optional-additional-comment": always include exactly one at the very end. data is {}.

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout all comments
- Use [Score] in EVERY assessment comment at every level except notCompleted — never actual numbers
- Preserve the teacher's actual voice and sentence structures
- Add new-line sections between each main section
- End with optional-additional-comment
- Return ONLY valid JSON, nothing else

RETURN FORMAT:
{"templateName":"string","sections":[
  {"id":"s1","type":"standard-comment","name":"Section Name","data":{"content":"Fixed text using [Name] if needed."}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"rated-comment","name":"Section Name","data":{"comments":{"excellent":["c1 [Name]","c2","c3"],"good":["c1","c2","c3"],"satisfactory":["c1","c2","c3"],"needsImprovement":["c1","c2","c3"]}}},
  {"id":"s4","type":"new-line","name":"","data":{}},
  {"id":"s5","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] demonstrating excellent understanding.","[Name] performed excellently achieving [Score].","c3 with [Score]"],"good":["[Name] achieved [Score] showing good understanding.","c2 with [Score]","c3 with [Score]"],"satisfactory":["[Name] achieved [Score] showing satisfactory understanding.","c2 with [Score]","c3 with [Score]"],"needsImprovement":["[Name] achieved [Score] indicating further revision is needed.","c2 with [Score]","c3 with [Score]"],"notCompleted":["[Name] has not yet completed this assessment.","c2","c3"]}}},
  {"id":"s6","type":"new-line","name":"","data":{}},
  {"id":"s7","type":"qualities","name":"Personal Qualities","data":{"comments":{"Character":["[Name] is a positive and enthusiastic member of the class.","[Name] is working on developing a more positive attitude towards learning."],"Social Skills":["[Name] works well with others and contributes positively to group activities.","[Name] is developing their collaborative skills and is encouraged to engage more with peers."]}}},
  {"id":"s8","type":"new-line","name":"","data":{}},
  {"id":"s9","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Area One":["suggestion [Name]","s2","s3"],"Area Two":["suggestion [Name]","s2","s3"]}}},
  {"id":"s10","type":"new-line","name":"","data":{}},
  {"id":"s11","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let subject, yearGroup, reportText, additionalContext, existingTemplate, isRefinement;
  try {
    const body = await req.json();
    subject = body.subject;
    yearGroup = body.yearGroup;
    reportText = body.reportText;
    additionalContext = body.additionalContext;
    existingTemplate = body.existingTemplate;
    isRefinement = body.isRefinement || false;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!reportText || !subject) {
    return new Response(JSON.stringify({ error: "reportText and subject are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const trimmedReports = reportText.substring(0, 6000);

  let userPrompt: string;

  if (isRefinement && existingTemplate) {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}

Here is the EXISTING template that was previously generated:
${JSON.stringify(existingTemplate, null, 2)}

Here are ADDITIONAL reports to use to improve and enrich the template:
${trimmedReports}

Using both the existing template AND these additional reports, generate an IMPROVED version.
- Carefully check each existing section is using the correct pattern (standard-comment vs rated-comment vs qualities vs assessment-comment)
- Fix any sections that are using the wrong type based on the pattern decision rules
- Add more variety and natural language to comments where the new reports suggest improvements
- Add any new themes, focus areas or qualities suggested by the additional reports
- Keep [Name] and [Score] placeholders throughout
- Maintain the same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}

Here are the reports to analyse:
${trimmedReports}

Read ALL the reports carefully. For each type of statement you find, apply the pattern decision rules to determine the correct section type:
1. Text IDENTICAL across all reports → standard-comment
2. Same sentence structure, rating word changes → rated-comment preserving the sentence structure
3. Different sentences about the same performance topic → rated-comment
4. Character/trait descriptions clustered together → qualities with 2-3 comments per heading max
5. Assessment scores or percentages → assessment-comment with [Score] in every comment except notCompleted

Generate a complete template JSON with new-line sections between each main section and optional-additional-comment at the end.`;
  }

  try {
    console.log(isRefinement ? "Refining existing template..." : "Generating new template...");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", response.status, errorBody);
      return new Response(JSON.stringify({ error: "Failed to contact AI service", details: errorBody }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawText = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");

    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Generated template has invalid structure");
    }

    console.log("Template processed successfully:", parsed.templateName);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Error generating template:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Failed to generate template" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});