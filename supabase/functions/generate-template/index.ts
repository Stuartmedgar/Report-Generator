// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
CORE PHILOSOPHY
═══════════════════════════════════════════════════════
Your job is to EXTRACT and PRESERVE, not to summarise or generalise.
Teachers will use this template for years. Comments must sound like THEM — their language, their subject knowledge, their way of describing students.

EXTRACTION RULES:
- Capture EVERY distinct quality or trait mentioned — even if it only appears in one report
- Do NOT merge similar traits. "Picks up new skills day to day" and "natural ability" are DIFFERENT — each gets its own heading
- Do NOT replace subject-specific language with generic alternatives. Preserve exact phrases like "extension material", "low stakes results", "group work", "picking up new concepts"
- Use the teacher's actual sentences and phrases. The teacher should recognise their own voice

═══════════════════════════════════════════════════════
SENTENCE PRESERVATION — CRITICAL
═══════════════════════════════════════════════════════
Teachers write natural flowing sentences. DO NOT break these apart.

KEEP SENTENCES WHOLE when they read naturally as a complete comment:
✓ "[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into work in class." — KEEP THIS WHOLE
✓ "She is highly motivated and likes to challenge herself." — KEEP THIS WHOLE

ONLY split when a sentence genuinely contains TWO UNRELATED things joined awkwardly:
✗ "She is polite and she is making good progress." — split: "polite" → qualities, "making good progress" → rated comment

The test: would a teacher naturally write this as one sentence? If yes — keep it whole.

═══════════════════════════════════════════════════════
PRONOUN SYSTEM FOR QUALITIES
═══════════════════════════════════════════════════════
The teacher has selected a pronoun set for this template. Use it throughout ALL qualities comments.

Pronoun sets:
- He/His: he, him, his, himself
- She/Her: she, her, hers, herself  
- They/Their: they, them, their, themselves

QUALITIES COMMENT STRUCTURE — TWO TYPES PER HEADING:

Type 1 — NAME-LED comments: Start with [Name]. These are the opening sentence about the student.
Example (She/Her): "[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into her work in class."

Type 2 — PRONOUN-LED comments: Start with the pronoun. These are natural follow-on sentences designed to flow after a name-led comment. Do NOT use [Name] in these.
Example (She/Her): "She is highly motivated and likes to challenge herself."
Example (She/Her): "She is growing in confidence and is becoming more involved in lessons."

Generate BOTH types under each qualities heading:
- 2 name-led comments (using [Name] and the correct pronoun for possessives)
- 2-3 pronoun-led comments (starting directly with the pronoun)

This means teachers can pick a name-led comment first, then a pronoun-led follow-on, creating natural flowing report text.

═══════════════════════════════════════════════════════
DETECTING REPORT STRUCTURE
═══════════════════════════════════════════════════════
Reports may be structured in different ways. Detect the structure and use it:

STRUCTURED REPORTS (with headings):
Look for section headings like:
- Positive headings: "Strengths", "Positives", "What's Going Well", "Achievements", "Praise"
- Developmental headings: "Areas for Development", "Next Steps", "To Improve", "Areas to Work On", "Development Points"
- Other headings: "Assessment", "Participation", "Effort" etc.

If headings are found: text under positive headings → positive qualities and higher rated comment levels. Text under developmental headings → developmental qualities and next steps.

UNSTRUCTURED REPORTS (no headings or inconsistent):
Determine positive vs developmental from the language and tone:
- Positive language, praise, strengths → positive qualities headings and higher rated comment levels
- Improvement suggestions, challenges, areas to work on → developmental qualities headings and next steps

This works generically for any subject and any reporting style.

═══════════════════════════════════════════════════════
PLACEHOLDERS IN THE REPORT TEXT
═══════════════════════════════════════════════════════
Text may contain {{STANDARD:Name}} and {{CHOICE:Name}} placeholders where pre-defined sections were removed.
Include them as marker sections at appropriate positions:
- {{STANDARD:X}} → section with type "standard-comment" and name "STANDARD:X"
- {{CHOICE:X}} → section with type "standard-comment" and name "CHOICE:X"
Do NOT generate content for these.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct poor grammar while preserving the teacher's voice and terminology.

PERSONALISING PHRASES — use from reports and generate similar ones:
"which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact", "the more he/she/they do this the more confidence will grow"

TONAL RULES:
POSITIVE → add warm affirming phrases. "[Name] puts real effort into every lesson, which is great to see — keep it up!"
DEVELOPMENTAL → NEVER add positive phrases. Use "At times...", reframe around potential ("is more capable than he/she/they realises"), use forward-looking language ("working on this will make a real difference").

═══════════════════════════════════════════════════════
STEP 1: ANALYSE ALL REPORTS THOROUGHLY
═══════════════════════════════════════════════════════
Before assigning section types:
1. Detect the report structure — are there section headings? What are they?
2. List every distinct character trait mentioned (ALL of them, do not merge)
3. Note all subject-specific language and phrases
4. Note the selected pronoun set and apply it consistently
5. Identify performance-varying statements
6. Identify assessment scores
7. Identify improvement suggestions
8. Identify any identical repeated text

═══════════════════════════════════════════════════════
STEP 2: SECTION TYPE RULES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Word-for-word identical in every report regardless of performance.
→ type: "standard-comment", data.content: string

PERSONALISED COMMENT — ONLY for student-specific variables
ONLY when different students have genuinely different personal details — specific activity, instrument, topic, role.
CORRECT: PE students doing different sports, Music students playing different instruments.
WRONG: Different pathway paragraphs (use {{CHOICE:}} placeholders), different progress statements (use rated-comment).
→ type: "personalised-comment", data.instruction: string, data.categories: object with arrays of 3-4 comments using [Name]

RATED COMMENT
Same topic, different performance levels. Progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment.
Pattern A: Same sentence structure, rating word changes.
Pattern B: Different sentences, same topic, different performance levels.
→ type: "rated-comment", data.comments: keys excellent/good/satisfactory/needsImprovement, each array of 4 comments using [Name] with correct pronoun for possessives. Apply TONAL RULES.

ASSESSMENT COMMENT
ALWAYS for scores, percentages or grades. SEPARATE section per assessment.
Every comment at excellent/good/satisfactory/needsImprovement MUST include [Score]. notCompleted must NOT.
→ type: "assessment-comment", data.scoreType: "percentage" or "outOf", data.comments: 4 per level with [Score], notCompleted: 2 without [Score]

QUALITIES — EXHAUSTIVE WITH PRONOUN SYSTEM
Every distinct trait gets its OWN heading. Positive and developmental versions of same trait get SEPARATE headings.
Use report structure (headings if present, language/tone if not) to determine positive vs developmental.
Keep sentences whole — do not break natural sentences apart.

Each heading has FOUR types of comment:
- 2 name-led comments starting with [Name] (use correct pronoun for possessives mid-sentence)
- 2-3 pronoun-led comments starting directly with the selected pronoun

→ type: "qualities", data.comments: object where each key is a directional heading, value is array of 4-5 comments (mix of name-led and pronoun-led)

NEXT STEPS
Forward-looking improvement suggestions using subject-specific language.
→ type: "next-steps", data.focusAreas: object, each key is focus area, value array of 4 suggestions using [Name]

NEW LINE: type "new-line", name: "", data: {}. Add between each main section.
OPTIONAL ADDITIONAL COMMENT: always one at end. name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name in name-led comments
- Use selected pronoun consistently in pronoun-led comments and possessives throughout
- Use [Score] in every assessment comment except notCompleted
- Generate 4 comments per level for rated-comment and assessment-comment
- Generate 4-5 comments per heading for qualities (mix of name-led and pronoun-led)
- Add new-line between each main section
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE ONLY:
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Overall Progress","data":{"comments":{"excellent":["[Name] comment, which is great to see.","Second with pronoun possessive e.g. his/her/their.","Third.","Fourth."],"good":["[Name] good comment.","Second.","Third.","Fourth."],"satisfactory":["At times [Name] satisfactory comment.","Second.","Third.","Fourth."],"needsImprovement":["At times [Name] developmental comment.","Second.","Third.","Fourth."]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{
    "Enthusiastic and Conscientious":["[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into her work in class, which is great to see.","[Name] is a pleasant, enthusiastic pupil who is highly motivated and likes to challenge herself — keep it up!","She is highly motivated and likes to challenge herself, which is really encouraging.","She is growing in confidence and is becoming more involved in lessons."],
    "Needs to Engage More":["At times [Name] is not engaging enough in lessons to make the progress she is capable of.","At times [Name] loses focus quickly — working on this will make a real difference.","She is more capable than she realises and is encouraged to engage more fully.","She would benefit from greater focus and engagement during lessons."]
  }}},
  {"id":"s4","type":"new-line","name":"","data":{}},
  {"id":"s5","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] — great result, keep it up!","Second with [Score].","Third with [Score].","Fourth with [Score]."],"good":["[Name] achieved [Score].","Second.","Third.","Fourth."],"satisfactory":["[Name] achieved [Score] with areas to develop.","Second.","Third.","Fourth."],"needsImprovement":["[Name] achieved [Score] not fully reflecting capabilities.","Second.","Third.","Fourth."],"notCompleted":["[Name] has not yet completed this assessment.","Second."]}}},
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
      hasPlaceholders, standardCommentNames, choiceCommentNames, pronounSet;

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

  const pronounInstructions: Record<string, string> = {
    "he/his": "Use HE/HIM/HIS/HIMSELF for pronoun-led comments and possessives. Example name-led: '[Name] puts a lot of effort into his work.' Example pronoun-led: 'He is growing in confidence.'",
    "she/her": "Use SHE/HER/HERS/HERSELF for pronoun-led comments and possessives. Example name-led: '[Name] puts a lot of effort into her work.' Example pronoun-led: 'She is growing in confidence.'",
    "they/their": "Use THEY/THEM/THEIR/THEMSELVES for pronoun-led comments and possessives. Example name-led: '[Name] puts a lot of effort into their work.' Example pronoun-led: 'They are growing in confidence.'",
  };

  const pronounNote = pronounInstructions[pronounSet] || pronounInstructions["they/their"];

  let userPrompt: string;

  if (isRefinement && existingTemplate) {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounSet} — ${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}

EXISTING TEMPLATE:
${JSON.stringify(existingTemplate, null, 2)}

ADDITIONAL REPORTS:
${reportText}

Generate an IMPROVED version:
- Add any new qualities headings found — be exhaustive, each distinct trait gets its own heading
- Ensure each qualities heading has both name-led comments (using [Name]) AND pronoun-led follow-on comments (starting with the selected pronoun)
- Keep sentences whole — do not break natural sentences apart
- Use report structure (headings if present, language/tone if not) to determine positive vs developmental
- Preserve subject-specific language from the additional reports
- Fix any progress/effort/behaviour wrongly typed as standard-comment — must be rated-comment
- Ensure personalised-comment is ONLY for genuinely student-specific variables
- Add warm personalising phrases to positive comments
- Ensure developmental comments use softened forward-looking language
- Apply ${pronounSet} pronoun consistently throughout
- Keep [Name] and [Score] placeholders
- Maintain the same template name`;
  } else {
    const placeholderNote = hasPlaceholders
      ? `\nNOTE: Report text contains placeholders where pre-defined sections were removed:
- {{STANDARD:Name}} → include as marker section with type "standard-comment" and name "STANDARD:Name"
- {{CHOICE:Name}} → include as marker section with type "standard-comment" and name "CHOICE:Name"
Pre-defined standard comments: ${standardCommentNames.join(", ")}
Pre-defined choice comments: ${choiceCommentNames.join(", ")}\n`
      : "";

    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounSet} — ${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
REPORTS TO ANALYSE:
${reportText}

STEP 1 — ANALYSE STRUCTURE:
First, look for section headings in the reports (Strengths, Areas for Development, Positives, Next Steps etc.). If found, use them to guide placement. If not found, determine positive vs developmental from language and tone alone.

STEP 2 — QUALITIES (BE EXHAUSTIVE):
List every distinct character trait mentioned across all reports. Each gets its own heading. Do not merge. Create separate positive and developmental headings for each trait.

For each qualities heading generate:
- 2 name-led comments: start with [Name], use ${pronounSet} for possessives mid-sentence
- 2-3 pronoun-led follow-on comments: start directly with the pronoun (${pronounSet.split('/')[0]}), designed to flow naturally after a name-led comment

Keep sentences whole — if a teacher wrote a long natural sentence, keep it exactly as written, just replace the student name with [Name].

STEP 3 — SUBJECT-SPECIFIC LANGUAGE:
Identify all subject-specific phrases and preserve them verbatim in generated comments.

STEP 4 — SECTION TYPES:
1. Identical text across all reports → standard-comment
2. Same topic, different performance levels → rated-comment (progress, effort, attainment, participation, focus, behaviour ALWAYS rated-comment). Use ${pronounSet} for possessives.
3. Different students, genuinely different personal details → personalised-comment ONLY
4. Assessment scores → assessment-comment with [Score] except notCompleted, SEPARATE per assessment
5. Character traits → qualities with exhaustive split positive/negative headings, name-led + pronoun-led comments
6. Improvement suggestions → next-steps
7. Placeholders → marker sections at appropriate positions

Apply TONAL RULES throughout. Generate 4 per level for rated/assessment, 4-5 per heading for qualities.
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