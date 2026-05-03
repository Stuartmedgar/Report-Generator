// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct any poor grammar or awkward phrasing while preserving the teacher's voice, terminology and meaning. Do not change subject-specific language or educational terminology.

PERSONALISING PHRASES:
Teachers often include warm add-on phrases that make reports feel individual. Use these from the source reports and generate similar ones in the same voice where appropriate.
Examples of the kind of phrases to look for and use:
- Positive affirming endings: "which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact"
- Motivating forward phrases: "hopefully this will give him/her the motivation to...", "the more he/she does this the more confidence will grow"

TONAL RULES — ESSENTIAL:
Positive and developmental comments need completely different treatment:

POSITIVE comments → add warm affirming phrases naturally
Example: "[Name] shows real enthusiasm in class, which is great to see — keep it up!"

DEVELOPMENTAL comments → NEVER add positive phrases. Instead:
- Soften with "At times..." or "On occasion..." to avoid absolutes
- Reframe around potential: "is more capable than he/she realises", "does not fully reflect his/her capabilities"  
- Use forward-looking language: "working on this will make a real difference", "to make the progress he/she is capable of"
- End encouragingly: "making use of the support available will make a real difference"
Example: "At times [Name] can find it difficult to stay focused — working on this will help make the progress he/she is capable of."
NEVER: "[Name] struggles with focus, which is great to see." (nonsensical — never add positive phrases to negative statements)

═══════════════════════════════════════════════════════
STEP 1: READ ALL REPORTS BEFORE DECIDING ANYTHING
═══════════════════════════════════════════════════════
Read every single report completely before assigning any section types. Ask yourself:
- Which statements appear word-for-word identical in every report regardless of student performance?
- Are there 2 or more completely different fixed paragraphs used for different groups of students?
- Which statements cover the same topic but use different language for different students?
- Which statements describe character traits, attitudes or soft skills?
- Which statements mention scores, grades or assessment results?
- Which statements are forward-looking improvement suggestions?
- Are there compound sentences that contain both a character trait AND a performance statement?

═══════════════════════════════════════════════════════
STEP 2: SECTION TYPE DECISION RULES
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STANDARD COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Text that is word-for-word identical in every report regardless of how the student is performing.
KEY TEST: Would this sentence be exactly the same for the best and worst performing student? Yes → standard-comment.
→ type: "standard-comment"
→ data.content: single string, use [Name] only if genuinely needed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALISED COMMENT — FOR FIXED TEXT VARIANTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When there are 2 or more completely different fixed paragraphs used for different groups of students. These are not rated by performance — they are distinct fixed texts that apply to different student pathways, streams or situations.
KEY TEST: Are there 2+ completely different paragraphs used as fixed text for different student groups? Yes → personalised-comment.
→ type: "personalised-comment"
→ data.instruction: describes what to select (e.g. "Select the pathway that applies to this student")
→ data.categories: object where each key is a descriptive label for that group and value is an array containing the fixed text as a single string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATED COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The same type of statement appears across reports but describes different levels of student performance. Includes:
- Pattern A: Same sentence structure but a rating word changes ("making excellent/good/satisfactory/limited progress")
- Pattern B: Different sentences about the same performance topic at different levels

KEY TEST: Does this describe HOW WELL a student does something, and does it vary between students? Yes → rated-comment.
Progress, effort, attainment, participation, focus and behaviour are ALWAYS rated-comment — never standard-comment.

→ type: "rated-comment"
→ data.comments: object with keys excellent, good, satisfactory, needsImprovement
→ Each level: array of 4 comments using [Name]
→ Preserve the teacher's actual sentence structures from the reports
→ Apply TONAL RULES: excellent/good get warm affirming add-ons, satisfactory/needsImprovement get softened forward-looking language

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSESSMENT COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS use when reports mention test scores, percentages or grades. Create a SEPARATE assessment-comment for each distinct assessment mentioned.
Every comment at excellent, good, satisfactory, needsImprovement MUST include [Score]. notCompleted must NOT include [Score].

→ type: "assessment-comment"
→ data.scoreType: "percentage" or "outOf"
→ data.maxScore: number (only if outOf)
→ data.comments: object with keys excellent, good, satisfactory, needsImprovement, notCompleted
→ excellent/good/satisfactory/needsImprovement: array of 4 comments using [Name] and [Score]
→ notCompleted: array of 2 comments using [Name], no [Score]
→ Apply TONAL RULES: excellent/good get warm affirming language, needsImprovement gets softened reframing around potential

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Personal character traits, soft skills and attitudes — describing who the student IS rather than how well they perform academically. These typically cluster in the same part of each report.

DERIVE HEADINGS FROM THE REPORTS — do not use predefined headings. Read the reports, identify what character traits and attitudes are mentioned, and create headings that reflect the specific language of those reports.

HEADING STRUCTURE RULES:
- Each distinct trait gets its OWN heading as a separate button
- Positive and developmental versions of the same trait get SEPARATE headings — never mix them
- Name positive headings clearly: e.g. "Excellent Work Ethic", "Strong Participation", "Growing Confidence"
- Name developmental headings clearly: e.g. "Work Ethic to Develop", "Focus to Improve", "Confidence to Build"
- Create a heading pair (positive + developmental) for each trait where BOTH appear in the reports
- Create a standalone heading for traits that only appear in one direction in the reports

COMMENT RULES FOR QUALITIES:
- Each heading: array of 2-3 comments, ALL positive OR ALL developmental — never mixed
- Positive headings: warm, affirming language with personalising add-on phrases
- Developmental headings: softened, forward-looking language — never harsh, never absolute

→ type: "qualities"
→ data.comments: object where each key is a specific directional heading derived from the reports, value is array of 2-3 comments using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forward-looking improvement suggestions organised by focus area, derived from the development areas mentioned across reports.
→ type: "next-steps"
→ data.focusAreas: object where each key is a focus area name derived from the reports, value is array of 4 suggestions using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW LINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Formatting only. Add between each main section.
→ type: "new-line", name: "", data: {}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTIONAL ADDITIONAL COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always include exactly one at the very end.
→ type: "optional-additional-comment", name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
STEP 3: COMPOUND SENTENCES
═══════════════════════════════════════════════════════
Before finalising section types, identify any sentences that contain both a character trait AND a performance statement joined together. Split these and place each part in the correct section.
Example compound: "She is a polite, hardworking pupil who can find new concepts challenging."
→ "polite, hardworking" → QUALITIES (positive heading)
→ "can find new concepts challenging" → RATED COMMENT (with softened language)

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout all comments
- Use [Score] in every assessment comment except notCompleted — never use actual numbers
- Generate 4 comments per level for rated-comment and assessment-comment sections
- Generate 2-3 comments per heading for qualities sections
- Add new-line sections between each main section
- End with optional-additional-comment
- Return ONLY valid JSON — no explanation, no markdown

═══════════════════════════════════════════════════════
RETURN FORMAT — STRUCTURAL EXAMPLE ONLY
(Use this to understand the JSON structure. Generate content from the actual reports, not from this example.)
═══════════════════════════════════════════════════════
{
  "templateName": "Subject Year Group Report",
  "sections": [
    {
      "id": "s1",
      "type": "rated-comment",
      "name": "Section Name From Reports",
      "data": {
        "comments": {
          "excellent": ["[Name] comment at excellent level with warm add-on phrase.", "Second excellent comment.", "Third excellent comment.", "Fourth excellent comment."],
          "good": ["[Name] comment at good level.", "Second good comment.", "Third good comment.", "Fourth good comment."],
          "satisfactory": ["At times [Name] satisfactory comment with forward-looking language.", "Second satisfactory comment.", "Third satisfactory comment.", "Fourth satisfactory comment."],
          "needsImprovement": ["At times [Name] developmental comment softened and forward-looking.", "Second developmental comment.", "Third developmental comment.", "Fourth developmental comment."]
        }
      }
    },
    { "id": "s2", "type": "new-line", "name": "", "data": {} },
    {
      "id": "s3",
      "type": "personalised-comment",
      "name": "Section Name",
      "data": {
        "instruction": "Select the option that applies to this student",
        "categories": {
          "Descriptive Label For Group A": ["Full fixed text for group A students."],
          "Descriptive Label For Group B": ["Full fixed text for group B students."]
        }
      }
    },
    { "id": "s4", "type": "new-line", "name": "", "data": {} },
    {
      "id": "s5",
      "type": "qualities",
      "name": "Personal Qualities",
      "data": {
        "comments": {
          "Positive Trait Heading Derived From Reports": [
            "[Name] positive comment about this trait with warm add-on phrase.",
            "Second positive comment about this trait.",
            "Third positive comment about this trait."
          ],
          "Developmental Version of Same Trait": [
            "At times [Name] developmental comment softened with forward-looking language.",
            "Second developmental comment about this trait."
          ],
          "Another Positive Trait From Reports": [
            "[Name] positive comment, which is great to see.",
            "Second positive comment."
          ]
        }
      }
    },
    { "id": "s6", "type": "new-line", "name": "", "data": {} },
    {
      "id": "s7",
      "type": "assessment-comment",
      "name": "Assessment Name From Reports",
      "data": {
        "scoreType": "percentage",
        "comments": {
          "excellent": ["[Name] achieved [Score] demonstrating excellent understanding — this is a great result.", "Second excellent comment with [Score].", "Third excellent comment with [Score].", "Fourth excellent comment with [Score]."],
          "good": ["[Name] achieved [Score] showing good understanding.", "Second good comment with [Score].", "Third good comment with [Score].", "Fourth good comment with [Score]."],
          "satisfactory": ["[Name] achieved [Score] showing satisfactory understanding with areas to work on.", "Second satisfactory comment with [Score].", "Third satisfactory comment with [Score].", "Fourth satisfactory comment with [Score]."],
          "needsImprovement": ["[Name] achieved [Score] which does not fully reflect capabilities — making use of support available will make a real difference.", "Second developmental comment with [Score].", "Third developmental comment with [Score].", "Fourth developmental comment with [Score]."],
          "notCompleted": ["[Name] has not yet completed this assessment.", "Second not completed comment."]
        }
      }
    },
    { "id": "s8", "type": "new-line", "name": "", "data": {} },
    {
      "id": "s9",
      "type": "standard-comment",
      "name": "Section Name",
      "data": { "content": "Fixed text identical for all students." }
    },
    { "id": "s10", "type": "new-line", "name": "", "data": {} },
    {
      "id": "s11",
      "type": "next-steps",
      "name": "Next Steps",
      "data": {
        "focusAreas": {
          "Focus Area Derived From Reports": ["[Name] suggestion one.", "Suggestion two.", "Suggestion three.", "Suggestion four."],
          "Another Focus Area": ["[Name] suggestion one.", "Suggestion two.", "Suggestion three.", "Suggestion four."]
        }
      }
    },
    { "id": "s12", "type": "new-line", "name": "", "data": {} },
    { "id": "s13", "type": "optional-additional-comment", "name": "Additional Comments", "data": {} }
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

Using both the existing template AND these additional reports, generate an IMPROVED version:
- Check every section is using the correct type based on the decision rules
- Fix any sections where progress/effort/participation/behaviour are wrongly set as standard-comment — these must be rated-comment
- Check for 2+ distinct fixed text variants that should be personalised-comment rather than multiple standard-comments
- Check qualities sections have split positive/negative headings — fix any that mix them
- Add personalising warm phrases to positive comments where missing
- Ensure developmental comments are softened with forward-looking language — remove any positive add-ons from negative statements
- Decompose any compound sentences containing both character traits and performance statements
- Add more variety where the new reports suggest additional phrasings or new qualities headings
- Ensure all rated-comment and assessment-comment levels have 4 comments
- Keep [Name] and [Score] placeholders throughout
- Maintain the same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}

Here are the reports to analyse:
${trimmedReports}

Read ALL reports completely before making any decisions. Then apply the section type decision rules:

1. Word-for-word identical text across all reports → standard-comment
2. Two or more completely different fixed paragraphs for different student groups → personalised-comment with descriptive category labels
3. Same topic, different language for different performance levels → rated-comment (progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment)
4. Assessment scores or percentages → assessment-comment with [Score] in every level except notCompleted. Create SEPARATE sections for each distinct assessment.
5. Character traits and attitudes clustered together → qualities with headings DERIVED FROM THESE SPECIFIC REPORTS. Split into separate positive and developmental headings. Never mix.
6. Improvement suggestions → next-steps with focus areas derived from these reports

For ALL comments:
- Add warm personalising phrases to positive comments using the teacher's own phrases from the reports
- Soften developmental comments with "At times...", forward-looking language and reframing around potential
- Never add positive phrases to developmental comments
- Preserve the teacher's actual voice and terminology
- Generate 4 comments per level for rated-comment and assessment-comment
- Generate 2-3 comments per heading for qualities
- Decompose compound sentences that mix character traits with performance statements

Generate complete template JSON with new-line sections between each main section and optional-additional-comment at the end.`;
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
        max_tokens: 16000,
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