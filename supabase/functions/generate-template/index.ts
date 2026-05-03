// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
CORE PHILOSOPHY — READ THIS FIRST
═══════════════════════════════════════════════════════
Your job is to EXTRACT and PRESERVE, not to summarise or generalise.
Teachers will use this template for years. The comments must sound like THEM — their language, their subject knowledge, their way of describing students.

EXTRACTION RULES:
- Capture EVERY distinct quality, trait or characteristic mentioned across all reports — even if it only appears in one report
- Do NOT merge similar traits into one heading. "Picks up new skills day to day" and "natural mathematical ability" are DIFFERENT qualities — give each its own heading
- Do NOT replace subject-specific language with generic alternatives. If reports say "extension material", use "extension material". If they say "low stakes results", use that phrase. If they mention specific topics, techniques or activities, incorporate them naturally
- When generating comments, use the teacher's actual phrases and sentence structures from the reports. The teacher should recognise their own voice when reading the template back

SUBJECT-SPECIFIC LANGUAGE:
Actively look for and preserve any language that is specific to this subject — named techniques, skills, assessment types, activities, topics, resources. Weave this language naturally into the generated comments so the template feels subject-specific, not generic.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct poor grammar or awkward phrasing while preserving the teacher's voice and terminology.

PERSONALISING PHRASES — use these from the reports and generate similar ones:
"which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact", "the more he/she does this the more confidence will grow", "which is fantastic to see"

TONAL RULES:
POSITIVE comments → add warm affirming phrases naturally
"[Name] shows real enthusiasm in class, which is great to see — keep it up!"

DEVELOPMENTAL comments → NEVER add positive phrases. Soften with:
- "At times..." or "On occasion..."
- Reframe around potential: "is more capable than he/she realises"
- Forward-looking: "working on this will make a real difference"
NEVER: "[Name] struggles with focus, which is great to see." (nonsensical)

═══════════════════════════════════════════════════════
PLACEHOLDERS IN THE REPORT TEXT
═══════════════════════════════════════════════════════
The text may contain {{STANDARD:Name}} and {{CHOICE:Name}} placeholders.
These mark where pre-defined sections were removed. Include them as marker sections:
- {{STANDARD:X}} → include section with type "standard-comment" and name "STANDARD:X"
- {{CHOICE:X}} → include section with type "standard-comment" and name "CHOICE:X"
Do NOT generate content for these — they are markers only.

═══════════════════════════════════════════════════════
STEP 1: READ ALL REPORTS THOROUGHLY
═══════════════════════════════════════════════════════
Before assigning any section types, read every report completely and make a mental inventory of:
- Every distinct character trait or attitude mentioned (list ALL of them, do not merge)
- Every subject-specific phrase, skill, technique or activity mentioned
- Every performance-related statement and how it varies between students
- Every assessment result or score mentioned
- Every improvement suggestion
- Any text that appears identically across all reports
- Any text that appears in 2-3 different versions for different student groups

═══════════════════════════════════════════════════════
STEP 2: SECTION TYPE DECISION RULES
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STANDARD COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Word-for-word identical in every report regardless of student performance.
KEY TEST: Exactly the same for the best and worst student? Yes → standard-comment.
→ type: "standard-comment", data.content: single string

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALISED COMMENT — ONLY FOR STUDENT-SPECIFIC VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONLY use when different students are described in relation to a genuinely different personal detail — a specific activity, instrument, topic, role or variable unique to that individual student that the teacher enters.

CORRECT use: PE students doing different sports, Music students playing different instruments, Drama students in different roles.
WRONG use: Different pathway paragraphs for ability groups (these are handled by {{CHOICE:}} placeholders), different progress statements (use rated-comment).

→ type: "personalised-comment"
→ data.instruction: describes what personal detail to select
→ data.categories: object where each key is a category, value is array of 3-4 comments using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RATED COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Same type of statement, different levels of student performance.
Pattern A: Same sentence structure, rating word changes ("excellent/good/satisfactory/limited progress")
Pattern B: Different sentences about the same performance topic at different levels

Progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment.
KEY TEST: Does this describe HOW WELL a student does something, varying between students? Yes → rated-comment.

→ type: "rated-comment"
→ data.comments: keys excellent, good, satisfactory, needsImprovement
→ Each level: array of 4 comments using [Name], incorporating subject-specific language where relevant
→ Apply TONAL RULES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ASSESSMENT COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALWAYS use when reports mention scores, percentages or grades. SEPARATE section for each distinct assessment.
Every comment at excellent, good, satisfactory, needsImprovement MUST include [Score].
notCompleted must NOT include [Score].

→ type: "assessment-comment"
→ data.scoreType: "percentage" or "outOf"
→ data.comments: 4 comments per level with [Score], notCompleted: 2 comments without [Score]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITIES — EXHAUSTIVE EXTRACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Personal character traits, soft skills and attitudes — who the student IS rather than how well they PERFORM.

CRITICAL — BE EXHAUSTIVE:
Create a separate heading for EVERY distinct trait mentioned in the reports. Do not merge traits that are related but different. If reports mention both "picks up new skills day to day" AND "natural mathematical ability" — these are TWO separate headings, not one. If reports mention "resilience", "works well in a group", "seeks feedback", "building confidence with extension material" — each gets its own heading.

When in doubt, create MORE headings not fewer. The teacher can always remove ones they don't need.

HEADING STRUCTURE:
- Each distinct trait gets its OWN heading
- Positive and developmental versions of the same trait get SEPARATE headings — never mix
- Use subject-specific language in heading names where it appears in the reports

COMMENT RULES:
- 2-3 comments per heading, ALL positive OR ALL developmental — never mixed
- Use the teacher's actual phrases from the reports
- Positive: warm affirming language with personalising phrases
- Developmental: softened, forward-looking language

→ type: "qualities"
→ data.comments: object where each key is a specific directional heading, value is array of 2-3 comments using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forward-looking improvement suggestions. Use subject-specific language from the reports.
→ type: "next-steps"
→ data.focusAreas: each key is a focus area, value is array of 4 suggestions using [Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW LINE and OPTIONAL ADDITIONAL COMMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
new-line: type "new-line", name: "", data: {}. Add between each main section.
optional-additional-comment: always include one at the very end. name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
STEP 3: COMPOUND SENTENCES
═══════════════════════════════════════════════════════
Identify sentences containing both a character trait AND a performance statement. Split and place each part correctly.
"She is polite and conscientious and can find new concepts challenging."
→ "polite and conscientious" → QUALITIES (positive heading)
→ "can find new concepts challenging" → RATED COMMENT (softened)

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout
- Use [Score] in every assessment comment except notCompleted
- Generate 4 comments per level for rated-comment and assessment-comment
- Generate 2-3 comments per heading for qualities
- Add new-line between each main section
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE:
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Section Name","data":{"comments":{"excellent":["[Name] comment, which is great to see.","Second.","Third.","Fourth."],"good":["[Name] good comment.","Second.","Third.","Fourth."],"satisfactory":["At times [Name] satisfactory comment.","Second.","Third.","Fourth."],"needsImprovement":["At times [Name] developmental comment.","Second.","Third.","Fourth."]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{"Specific Positive Trait From Reports":["[Name] positive comment using teacher's actual language, which is great to see.","Second positive comment."],"Same Trait Developmental":["At times [Name] developmental comment with forward-looking language.","Second developmental comment."],"Another Distinct Trait From Reports":["[Name] positive comment.","Second."]}}},
  {"id":"s4","type":"new-line","name":"","data":{}},
  {"id":"s5","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] — great result!","Second with [Score].","Third with [Score].","Fourth with [Score]."],"good":["[Name] achieved [Score].","Second.","Third.","Fourth."],"satisfactory":["[Name] achieved [Score] with areas to develop.","Second.","Third.","Fourth."],"needsImprovement":["[Name] achieved [Score] not reflecting capabilities.","Second.","Third.","Fourth."],"notCompleted":["[Name] has not yet completed this assessment.","Second."]}}},
  {"id":"s6","type":"new-line","name":"","data":{}},
  {"id":"s7","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Focus Area":["[Name] suggestion.","Second.","Third.","Fourth."]}}},
  {"id":"s8","type":"new-line","name":"","data":{}},
  {"id":"s9","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${reportText}

Generate an IMPROVED version using both the existing template and additional reports:
- Add ANY new qualities headings found in the additional reports — be exhaustive, do not skip any distinct trait
- Add subject-specific language from the additional reports to existing comments where missing
- Fix any progress/effort/behaviour sections wrongly typed as standard-comment — must be rated-comment
- Ensure personalised-comment is ONLY used for genuinely student-specific variables
- Check qualities have split positive/negative headings
- Add warm personalising phrases to positive comments where missing
- Ensure developmental comments use softened forward-looking language
- Keep [Name] and [Score] placeholders
- Maintain the same template name`;
  } else {
    const placeholderNote = hasPlaceholders
      ? `\nNOTE: Report text contains placeholders where pre-defined sections were removed:
- {{STANDARD:Name}} placeholders → include as marker sections with type "standard-comment" and name "STANDARD:Name"
- {{CHOICE:Name}} placeholders → include as marker sections with type "standard-comment" and name "CHOICE:Name"
Pre-defined standard comments: ${standardCommentNames.join(", ")}
Pre-defined choice comments: ${choiceCommentNames.join(", ")}\n`
      : "";

    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
REPORTS TO ANALYSE:
${reportText}

Read ALL reports completely. Then:

QUALITIES — BE EXHAUSTIVE:
List every single distinct character trait, attitude and soft skill mentioned across all reports. Create a separate heading for each one — do not merge. Include subject-specific qualities using the teacher's actual language. When in doubt, create more headings not fewer.

SUBJECT-SPECIFIC LANGUAGE:
Identify all subject-specific phrases, skills, techniques, activities and assessment types mentioned. Preserve this language in the generated comments — do not replace with generic alternatives.

SECTION TYPES:
1. Identical text across all reports → standard-comment
2. Same topic, different performance levels → rated-comment (progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment — never standard-comment)
3. Different students doing genuinely different activities/instruments/topics → personalised-comment ONLY (NOT for pathway variants or ability groups — those are handled by placeholders)
4. Assessment scores → assessment-comment with [Score] in every level except notCompleted, SEPARATE section per assessment
5. Character traits/attitudes → qualities with exhaustive split positive/negative headings, using teacher's actual language
6. Improvement suggestions → next-steps using subject-specific language from reports
7. Placeholders → include as marker sections at appropriate positions

TONAL RULES:
- Warm affirming phrases on positive comments using teacher's actual phrases from reports
- Softened forward-looking language on developmental comments
- Never add positive phrases to negative statements

Generate 4 comments per level for rated/assessment, 2-3 per heading for qualities.
Add new-line between sections. End with optional-additional-comment.
Decompose compound sentences mixing traits with performance statements.`;
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
        JSON.stringify({ error: "Template was too large to generate in one go. Try adding more standard or choice comments to reduce the character count, then try again." }),
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