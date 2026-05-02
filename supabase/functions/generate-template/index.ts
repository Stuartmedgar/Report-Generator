// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

LANGUAGE QUALITY:
As you generate comments, correct any poor English, grammatical errors or awkward phrasing from the source reports. Preserve the teacher's voice, terminology and meaning but ensure all generated comments are grammatically correct, professionally written and read naturally. Do not change subject-specific language or Scottish educational terminology.

YOUR PRIMARY TASK is to read ALL the reports carefully and identify which PATTERN each type of statement follows. There are four distinct patterns:

═══════════════════════════════════════════════════════
IMPORTANT: DECOMPOSING COMPOUND SENTENCES
═══════════════════════════════════════════════════════
Many teacher report sentences contain TWO distinct pieces of information joined together. You MUST decompose these before deciding on section types.
Example: "She is a polite, conscientious pupil who puts a lot of effort into her work. She can find picking up new concepts challenging but always makes a good attempt."
This contains:
- "polite, conscientious, puts a lot of effort" → QUALITIES (character trait)
- "can find picking up new concepts challenging but always makes a good attempt" → RATED COMMENT (performance varies by student)
Split compound sentences and place each part in the correct section type. Never keep a compound sentence whole if it contains both a character trait AND a performance statement.

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
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 4 comments using [Name].

═══════════════════════════════════════════════════════
PATTERN 3 — RATED COMMENT (same topic, different language)
═══════════════════════════════════════════════════════
Different sentences across reports all describing the SAME aspect of performance (effort, attainment, participation, behaviour, focus) but using genuinely different language reflecting different performance levels.
→ Use section type: "rated-comment"
→ Write comments at each level that reflect the range of language used across all reports.
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 4 comments using [Name].
KEY TEST: Does this statement describe how well the student does something? If yes → rated-comment.

═══════════════════════════════════════════════════════
PATTERN 4 — QUALITIES
═══════════════════════════════════════════════════════
Statements about personal CHARACTER TRAITS, SOFT SKILLS or ATTITUDES that describe what kind of person/learner the student is rather than how well they perform academically. These often cluster together in the same part of each report.
Examples: leadership, teamwork, confidence, social skills, resilience, politeness, attitude to learning, relationships with peers.

CRITICAL RULE FOR QUALITIES — SPLIT POSITIVE AND NEGATIVE:
NEVER mix positive and developmental comments under the same heading.
Instead create TWO SEPARATE headings for each trait — one for the positive version and one for the developmental version.

Examples of correct heading pairs:
- "Confidence" and "Lacks Confidence"
- "Strong Work Ethic" and "Work Ethic Needs Development"
- "Excellent Attitude" and "Attitude Needs Improvement"
- "Natural Leader" and "Leadership to Develop"
- "Works Well With Others" and "Collaborative Skills to Develop"
- "Highly Motivated" and "Motivation Needs Development"

Each heading should have 2-3 comments that are ALL positive OR ALL developmental — never mixed.
The teacher clicks whichever heading button applies to their student.

→ Use section type: "qualities"
→ data.comments is an object where each key is a directional heading name and value is an array of 2-3 comments using [Name].
KEY TEST: Is this about who the student IS rather than how well they PERFORM academically? If yes → qualities with split positive/negative headings.

═══════════════════════════════════════════════════════
OTHER SECTION TYPES
═══════════════════════════════════════════════════════
- "assessment-comment": ALWAYS use when reports mention test scores, percentages or assessment results. Create a SEPARATE assessment-comment section for each distinct assessment mentioned. Every single comment at excellent, good, satisfactory and needsImprovement levels MUST include [Score] — never use actual numbers. notCompleted comments should NOT include [Score]. data.comments has keys: excellent, good, satisfactory, needsImprovement, notCompleted. Each level is an array of 4 comments except notCompleted which needs 2. Also needs scoreType ("percentage" or "outOf").

- "personalised-comment": use when different students are described doing different activities, topics or instruments. data.instruction is a string. data.categories is object where each key is a category name and value is array of 4 comments using [Name].

- "next-steps": forward-looking improvement suggestions. data.focusAreas is object where each key is a focus area name and value is array of 4 suggestions using [Name].

- "new-line": formatting only. data is {}. Add one between each main section.

- "optional-additional-comment": always include exactly one at the very end. data is {}.

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout all comments
- Use [Score] in EVERY assessment comment at excellent, good, satisfactory, needsImprovement levels — never actual numbers
- Correct any poor grammar or awkward phrasing while preserving the teacher's voice
- Preserve the teacher's actual sentence structures and terminology
- Decompose compound sentences before assigning section types
- Generate 4 comments per level for rated-comment and assessment-comment sections
- Generate 2-3 comments per heading for qualities sections
- Add new-line sections between each main section
- End with optional-additional-comment
- Return ONLY valid JSON, nothing else

RETURN FORMAT:
{"templateName":"string","sections":[
  {"id":"s1","type":"standard-comment","name":"Section Name","data":{"content":"Fixed text using [Name] if needed."}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"rated-comment","name":"Section Name","data":{"comments":{"excellent":["c1 [Name]","c2","c3","c4"],"good":["c1","c2","c3","c4"],"satisfactory":["c1","c2","c3","c4"],"needsImprovement":["c1","c2","c3","c4"]}}},
  {"id":"s4","type":"new-line","name":"","data":{}},
  {"id":"s5","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] demonstrating excellent understanding.","[Name] performed excellently, achieving [Score].","[Name] showed an excellent grasp of the material, achieving [Score].","[Name] achieved [Score], reflecting a thorough understanding of the course content."],"good":["[Name] achieved [Score] showing good understanding.","[Name] performed well in the assessment, achieving [Score].","[Name] achieved [Score], demonstrating a good level of understanding.","[Name] achieved [Score], reflecting solid understanding across most areas."],"satisfactory":["[Name] achieved [Score] showing satisfactory understanding.","[Name] achieved [Score] with some areas still to consolidate.","[Name]'s result of [Score] reflects a satisfactory level of understanding.","[Name] achieved [Score], indicating that some topics require further revision."],"needsImprovement":["[Name] achieved [Score], indicating that further revision is needed.","[Name]'s result of [Score] suggests that key areas need more work.","[Name] achieved [Score] and would benefit from focused revision of core topics.","[Name] achieved [Score], which does not fully reflect their potential and further revision is recommended."],"notCompleted":["[Name] has not yet completed this assessment.","[Name] still has this assessment to complete."]}}},
  {"id":"s6","type":"new-line","name":"","data":{}},
  {"id":"s7","type":"qualities","name":"Personal Qualities","data":{"comments":{"Confident and Enthusiastic":["[Name] is a confident and enthusiastic member of the class who contributes positively to lessons.","[Name] approaches all tasks with enthusiasm and confidence, making a positive contribution to the class.","[Name] is a pleasure to teach and brings energy and positivity to every lesson."],"Confidence to Develop":["[Name] is developing confidence in class and is becoming more willing to share ideas and ask for help.","[Name] would benefit from backing themselves more and is encouraged to ask questions and share ideas aloud.","[Name] is more capable than they realise and is encouraged to have more confidence in their own ability."],"Strong Work Ethic":["[Name] is a hardworking and conscientious pupil who consistently puts a lot of effort into their work.","[Name] demonstrates a strong work ethic and always gives their best effort in class.","[Name] is a diligent pupil who takes great pride in the quality of their work."],"Work Ethic to Develop":["[Name] is encouraged to put more consistent effort into their work in class and at home.","[Name] would benefit from applying more focus and effort to their studies on a more consistent basis.","[Name] has the ability to do well and is encouraged to apply themselves more fully to their studies."]}}},
  {"id":"s8","type":"new-line","name":"","data":{}},
  {"id":"s9","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Area One":["suggestion [Name]","s2","s3","s4"],"Area Two":["suggestion [Name]","s2","s3","s4"]}}},
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

  const trimmedReports = reportText.substring(0, 24000);

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
- Check all qualities sections have SPLIT positive and negative headings — fix any that mix positive and developmental comments under the same heading
- Decompose any compound sentences that contain both a character trait AND a performance statement
- Correct any poor grammar or awkward phrasing in existing comments
- Add more variety and natural language to comments where the new reports suggest improvements
- Ensure all rated-comment and assessment-comment sections have 4 comments per level
- Add any new themes, focus areas or qualities suggested by the additional reports
- Keep [Name] and [Score] placeholders throughout
- Maintain the same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}

Here are the reports to analyse:
${trimmedReports}

Read ALL the reports carefully. Before assigning any section type, decompose compound sentences that contain more than one type of information. Then for each statement apply the pattern decision rules:
1. Text IDENTICAL across all reports → standard-comment
2. Same sentence structure, rating word changes → rated-comment preserving the sentence structure
3. Different sentences about the same performance topic → rated-comment
4. Character/trait descriptions → qualities with SPLIT positive and negative headings (never mix positive and developmental under the same heading)
5. Assessment scores or percentages → assessment-comment with [Score] in every comment except notCompleted

Generate a complete template JSON with new-line sections between each main section and optional-additional-comment at the end. Ensure all rated-comment and assessment-comment sections have 4 comments per level.`;
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
        max_tokens: 8000,
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

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Invalid JSON from Anthropic, raw text length:", rawText.length);
      return new Response(
        JSON.stringify({ error: "Template was too large to generate in one go. Try using fewer reports or splitting into two generations." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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