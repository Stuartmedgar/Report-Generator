// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct any poor grammar or awkward phrasing while preserving the teacher's voice, terminology and meaning.

PERSONALISING PHRASES:
Use warm add-on phrases from the source reports and generate similar ones where appropriate.
Examples: "which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact", "the more he/she does this the more confidence will grow"

TONAL RULES — ESSENTIAL:
POSITIVE comments → add warm affirming phrases naturally
Example: "[Name] shows real enthusiasm in class, which is great to see — keep it up!"

DEVELOPMENTAL comments → NEVER add positive phrases. Instead soften with:
- "At times..." or "On occasion..." to avoid absolutes
- Reframe around potential: "is more capable than he/she realises", "does not fully reflect capabilities"
- Forward-looking: "working on this will make a real difference", "to make the progress he/she is capable of"
Example: "At times [Name] can find it difficult to stay focused — working on this will help make the progress he/she is capable of."
NEVER mix — never add positive phrases to negative statements.

═══════════════════════════════════════════════════════
PLACEHOLDERS IN THE REPORT TEXT
═══════════════════════════════════════════════════════
The report text may contain placeholders like {{STANDARD:Section Name}} and {{CHOICE:Section Name}}.
These mark where pre-defined sections have been removed to save space.
When you see these placeholders:
- Include a section in your output at the appropriate position with type "standard-comment" and name matching the placeholder (e.g. "STANDARD:Assessment Analysis" → name: "STANDARD:Assessment Analysis")
- This allows the system to reassemble the final template with the correct pre-defined content
- Do NOT try to generate content for these sections — just include them as markers

═══════════════════════════════════════════════════════
STEP 1: READ ALL REPORTS BEFORE DECIDING ANYTHING
═══════════════════════════════════════════════════════
Read every single report completely before assigning any section types. Note:
- Which statements are word-for-word identical in every report
- Which statements cover the same topic but vary between students
- Which statements describe character traits and attitudes
- Which statements mention scores or assessment results
- Which statements are forward-looking improvement suggestions
- Where placeholders appear (these are already handled)

═══════════════════════════════════════════════════════
STEP 2: SECTION TYPE DECISION RULES
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STANDARD COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Text that is word-for-word identical in every report regardless of student performance.
KEY TEST: Would this be exactly the same for the best and worst performing student? Yes → standard-comment.
→ type: "standard-comment"
→ data.content: single string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALISED COMMENT — ONLY FOR STUDENT-SPECIFIC VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONLY use this when different students are described in relation to a genuinely different personal detail — a specific activity, instrument, topic, role or other variable that is unique to that individual student and entered by the teacher.
Examples of CORRECT use:
- PE: students doing different sports/activities ("John showed great skill in volleyball" / "Sarah excelled in gymnastics")
- Music: students playing different instruments
- Drama: students playing different roles

Examples of WRONG use (do NOT use personalised-comment for these):
- Different pathway paragraphs for different ability groups → these are pre-defined and handled by {{CHOICE:}} placeholders
- Different progress statements → use rated-comment
- Any text that varies by performance level → use rated-comment

→ type: "personalised-comment"
→ data.instruction: describes what personal detail to select
→ data.categories: object where each key is a category name and value is array of 3-4 comments using [Name] AND [Personalised Information] or similar placeholder

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATED COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The same type of statement appears across reports but describes different levels of student performance.
Pattern A: Same sentence structure, rating word changes ("making excellent/good/satisfactory/limited progress")
Pattern B: Different sentences about the same performance topic at different levels

KEY TEST: Does this describe HOW WELL a student does something, and does it vary between students? Yes → rated-comment.
Progress, effort, attainment, participation, focus and behaviour are ALWAYS rated-comment — never standard-comment or personalised-comment.

→ type: "rated-comment"
→ data.comments: keys excellent, good, satisfactory, needsImprovement
→ Each level: array of 4 comments using [Name]
→ Apply TONAL RULES throughout

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSESSMENT COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS use when reports mention test scores, percentages or grades. Create SEPARATE sections for each distinct assessment.
Every comment at excellent, good, satisfactory, needsImprovement MUST include [Score]. notCompleted must NOT.

→ type: "assessment-comment"
→ data.scoreType: "percentage" or "outOf"
→ data.comments: keys excellent, good, satisfactory, needsImprovement (4 comments each with [Score]), notCompleted (2 comments, no [Score])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Personal character traits, soft skills and attitudes — describing who the student IS rather than how well they PERFORM.

DERIVE HEADINGS FROM THE REPORTS — read what character traits appear and create headings that reflect the specific language of those reports.

HEADING STRUCTURE:
- Each distinct trait gets its OWN heading as a separate button
- Positive and developmental versions of the SAME trait get SEPARATE headings — never mix
- Positive headings: warm affirming language with personalising phrases
- Developmental headings: softened, forward-looking language — never harsh

→ type: "qualities"
→ data.comments: object where each key is a directional heading, value is array of 2-3 comments using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forward-looking improvement suggestions organised by focus area.
→ type: "next-steps"
→ data.focusAreas: object, each key is a focus area, value is array of 4 suggestions using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW LINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ type: "new-line", name: "", data: {}. Add between each main section.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTIONAL ADDITIONAL COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ type: "optional-additional-comment", name: "Additional Comments", data: {}. Always include one at the end.

═══════════════════════════════════════════════════════
STEP 3: COMPOUND SENTENCES
═══════════════════════════════════════════════════════
Identify sentences containing both a character trait AND a performance statement. Split and place each part in the correct section.
Example: "She is polite and conscientious and can find new concepts challenging."
→ "polite and conscientious" → QUALITIES (positive heading)
→ "can find new concepts challenging" → RATED COMMENT (with softened language)

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout
- Use [Score] in every assessment comment except notCompleted — never actual numbers
- Generate 4 comments per level for rated-comment and assessment-comment
- Generate 2-3 comments per heading for qualities
- Add new-line between each main section
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE ONLY:
{
  "templateName": "Subject Year Group Report",
  "sections": [
    {"id":"s1","type":"rated-comment","name":"Overall Progress","data":{"comments":{"excellent":["[Name] comment with warm phrase.","Second.","Third.","Fourth."],"good":["[Name] good comment.","Second.","Third.","Fourth."],"satisfactory":["At times [Name] satisfactory comment with forward-looking language.","Second.","Third.","Fourth."],"needsImprovement":["At times [Name] developmental comment softened.","Second.","Third.","Fourth."]}}},
    {"id":"s2","type":"new-line","name":"","data":{}},
    {"id":"s3","type":"standard-comment","name":"STANDARD:Section Name","data":{"content":"{{STANDARD:Section Name}}"}},
    {"id":"s4","type":"new-line","name":"","data":{}},
    {"id":"s5","type":"qualities","name":"Personal Qualities","data":{"comments":{"Positive Trait":["[Name] positive comment, which is great to see.","Second positive comment."],"Trait to Develop":["At times [Name] developmental comment with forward-looking language.","Second developmental comment."]}}},
    {"id":"s6","type":"new-line","name":"","data":{}},
    {"id":"s7","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] — great result!","Second with [Score].","Third with [Score].","Fourth with [Score]."],"good":["[Name] achieved [Score] good result.","Second.","Third.","Fourth."],"satisfactory":["[Name] achieved [Score] satisfactory.","Second.","Third.","Fourth."],"needsImprovement":["[Name] achieved [Score] not reflecting capabilities.","Second.","Third.","Fourth."],"notCompleted":["[Name] has not yet completed this assessment.","Second."]}}},
    {"id":"s8","type":"new-line","name":"","data":{}},
    {"id":"s9","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Focus Area":["[Name] suggestion.","Second.","Third.","Fourth."]}}},
    {"id":"s10","type":"new-line","name":"","data":{}},
    {"id":"s11","type":"optional-additional-comment","name":"Additional Comments","data":{}}
  ]
}`;

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
      hasPlaceholders, standardCommentNames, choiceCommentNames;

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

  let userPrompt: string;

  if (isRefinement && existingTemplate) {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}

Here is the EXISTING template:
${JSON.stringify(existingTemplate, null, 2)}

Here are ADDITIONAL reports to improve the template:
${reportText}

Generate an IMPROVED version:
- Check every section uses the correct type
- Fix any progress/effort/behaviour wrongly set as standard-comment — these must be rated-comment
- Ensure personalised-comment is ONLY used for genuinely student-specific variables (activities, instruments, roles) — NOT for pathway paragraphs or ability group variants
- Check qualities sections have split positive/negative headings
- Add warm personalising phrases to positive comments
- Ensure developmental comments are softened with forward-looking language
- Add variety and new headings from the additional reports
- Keep [Name] and [Score] placeholders
- Maintain the same template name`;
  } else {
    const placeholderNote = hasPlaceholders
      ? `\nNOTE: The report text contains placeholders like {{STANDARD:Name}} and {{CHOICE:Name}} where pre-defined sections have been removed. Include these as marker sections in your output at the appropriate positions.
Pre-defined standard comment names: ${standardCommentNames.join(', ')}
Pre-defined choice comment names: ${choiceCommentNames.join(', ')}\n`
      : '';

    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
Here are the reports to analyse:
${reportText}

Read ALL reports completely before deciding. Apply the section type rules:
1. Identical text across all reports → standard-comment
2. Same topic, different performance levels → rated-comment (progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment)
3. Different students doing genuinely different activities/instruments/topics → personalised-comment (NOT for pathway variants or ability groups)
4. Assessment scores → assessment-comment with [Score] except notCompleted
5. Character traits → qualities with split positive/negative headings derived from these reports
6. Improvement suggestions → next-steps
7. Placeholders → include as marker sections

Apply TONAL RULES: warm phrases on positive comments, softened forward-looking language on developmental comments.
Decompose compound sentences mixing character traits with performance statements.
Generate 4 comments per level for rated/assessment, 2-3 per heading for qualities.
Add new-line between sections. End with optional-additional-comment.`;
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
        system: SYSTEM_PROMPT,
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
      console.error("Invalid JSON, length:", rawText.length);
      return new Response(
        JSON.stringify({ error: "Template was too large to generate in one go. Try adding more standard/choice comments to reduce the character count, then try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error("Generated template has invalid structure");
    }

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