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
- Do NOT replace subject-specific language with generic alternatives. Preserve exact phrases like "extension material", "low stakes results", "picking up new concepts"
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
PRONOUN SYSTEM FOR QUALITIES — PAIRED HEADINGS
═══════════════════════════════════════════════════════
The teacher has selected a pronoun set. Use it consistently throughout ALL qualities comments.

Pronoun sets:
- He/His: he, him, his, himself
- She/Her: she, her, hers, herself
- They/Their: they, them, their, themselves

QUALITIES MUST USE PAIRED HEADINGS — THIS IS CRITICAL:
For EACH distinct trait, generate TWO separate qualities sections with related headings:

HEADING 1 — NAME-LED: Contains ONLY comments that start with [Name].
Use [Name] at the start. Use the selected pronoun for possessives mid-sentence.
Example heading: "Enthusiastic and Conscientious"
Example comments:
- "[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into her work in class, which is great to see."
- "[Name] is a pleasant, enthusiastic pupil who is highly motivated and likes to challenge herself — keep it up!"

HEADING 2 — FOLLOW-ON (pronoun-led): Contains ONLY comments that start with the selected pronoun. These are designed to flow naturally AFTER a name-led comment. Do NOT use [Name].
Name the heading as the original heading + " - Follow On"
Example heading: "Enthusiastic and Conscientious - Follow On"
Example comments (using She/Her):
- "She is growing in confidence all the time and is becoming more involved in lessons, which is really encouraging."
- "She is highly motivated and likes to challenge herself, which is great to see."
- "She puts a lot of effort into every task and is a pleasure to have in class."

SAME PATTERN FOR DEVELOPMENTAL HEADINGS:
HEADING 1 — NAME-LED developmental:
"[Name] is not engaging enough at times — working on this will make a real difference."
HEADING 2 — FOLLOW-ON developmental (heading name + " - Follow On"):
"She is encouraged to engage more fully in lessons to make the progress she is capable of."

NEVER mix name-led and pronoun-led comments in the same heading.
ALWAYS generate both paired headings for every trait — the name-led heading and its follow-on.

═══════════════════════════════════════════════════════
DETECTING REPORT STRUCTURE
═══════════════════════════════════════════════════════
Reports may be structured in different ways. Detect the structure and use it.

STRUCTURED REPORTS (with section headings):
Look for headings like:
- Positive: "Strengths", "Positives", "What's Going Well", "Achievements", "Praise"
- Developmental: "Areas for Development", "Next Steps", "To Improve", "Areas to Work On"
If found: text under positive headings → positive qualities and higher rated comment levels. Text under developmental headings → developmental qualities and next steps.

UNSTRUCTURED REPORTS (no headings):
Determine positive vs developmental from language and tone alone.
This works generically for any subject and any reporting style.

═══════════════════════════════════════════════════════
PLACEHOLDERS IN THE REPORT TEXT
═══════════════════════════════════════════════════════
Text may contain {{STANDARD:Name}} and {{CHOICE:Name}} placeholders.
Include them as marker sections at appropriate positions:
- {{STANDARD:X}} → section with type "standard-comment" and name "STANDARD:X"
- {{CHOICE:X}} → section with type "standard-comment" and name "CHOICE:X"
Do NOT generate content for these.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct poor grammar while preserving voice and terminology.

PERSONALISING PHRASES — use from reports and generate similar ones:
"which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact"

TONAL RULES:
POSITIVE → add warm affirming phrases naturally
DEVELOPMENTAL → NEVER add positive phrases. Use "At times...", reframe around potential, use forward-looking language.

═══════════════════════════════════════════════════════
STEP 1: ANALYSE ALL REPORTS THOROUGHLY
═══════════════════════════════════════════════════════
Before assigning section types:
1. Detect report structure — are there section headings?
2. List every distinct character trait (ALL of them, do not merge)
3. Note all subject-specific language
4. Note the selected pronoun set — apply consistently
5. Identify performance-varying statements
6. Identify assessment scores
7. Identify improvement suggestions
8. Identify identical repeated text

═══════════════════════════════════════════════════════
STEP 2: SECTION TYPE RULES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Word-for-word identical in every report regardless of performance.
→ type: "standard-comment", data.content: string

PERSONALISED COMMENT — ONLY for student-specific variables
ONLY when different students have genuinely different personal details — specific activity, instrument, topic, role unique to that individual student.
CORRECT: PE students doing different sports, Music students playing different instruments.
WRONG: Different pathway paragraphs (use {{CHOICE:}} placeholders), different progress statements (use rated-comment).
→ type: "personalised-comment", data.instruction: string, data.categories: object with arrays of 3-4 comments using [Name]

RATED COMMENT
Same topic, different performance levels. Progress, effort, attainment, participation, focus, behaviour are ALWAYS rated-comment.
→ type: "rated-comment", data.comments: keys excellent/good/satisfactory/needsImprovement, each array of 4 comments using [Name] with correct pronoun for possessives. Apply TONAL RULES.

ASSESSMENT COMMENT
ALWAYS for scores, percentages or grades. SEPARATE section per assessment.
Every comment at excellent/good/satisfactory/needsImprovement MUST include [Score]. notCompleted must NOT.
→ type: "assessment-comment", data.scoreType: "percentage" or "outOf", data.comments: 4 per level with [Score], notCompleted: 2 without [Score]

QUALITIES — EXHAUSTIVE WITH PAIRED HEADINGS
Every distinct trait gets its OWN pair of headings.
Positive and developmental versions of same trait get SEPARATE heading pairs.
Use report structure to determine positive vs developmental.
Keep sentences whole.

For each trait generate TWO sections in sequence:
1. Name-led section: heading name only, ONLY [Name]-starting comments (2-3 comments)
2. Follow-on section: heading name + " - Follow On", ONLY pronoun-starting comments (2-3 comments)

Place both sections together, separated by NO new-line between them (they are a pair).
Add a new-line AFTER the pair before the next section.

→ type: "qualities"
→ data.comments: object with a SINGLE key matching the section heading, value is array of 2-3 comments

NEXT STEPS
Forward-looking improvement suggestions using subject-specific language.
→ type: "next-steps", data.focusAreas: object, each key is focus area, value array of 4 suggestions using [Name]

NEW LINE: type "new-line", name: "", data: {}. Add between major sections (not between paired quality headings).
OPTIONAL ADDITIONAL COMMENT: always one at end. name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name in name-led comments only
- Use selected pronoun consistently in follow-on comments and possessives throughout
- Use [Score] in every assessment comment except notCompleted
- Generate 4 comments per level for rated-comment and assessment-comment
- Generate 2-3 comments per qualities section (name-led OR pronoun-led, never mixed)
- Add new-line between major sections (not between paired qualities sections)
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE (She/Her example):
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Overall Progress","data":{"comments":{"excellent":["[Name] is making excellent progress, which is great to see.","[Name] is progressing exceptionally well — keep it up!","Her effort and commitment are really paying off.","She is achieving at a high level and this is something to be proud of."],"good":["[Name] is making good progress.","[Name] is doing well and working hard.","Her engagement in lessons is positive.","She is developing well across the course."],"satisfactory":["At times [Name] is making satisfactory progress.","At times [Name] could push herself more.","She would benefit from more consistent effort.","She has the ability to achieve more with focus."],"needsImprovement":["At times [Name] is finding aspects of the course challenging.","At times [Name] is more capable than she realises.","She is encouraged to make use of the support available.","She would benefit from greater engagement in lessons."]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Enthusiastic and Conscientious","data":{"comments":{"Enthusiastic and Conscientious":["[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into her work in class, which is great to see.","[Name] is a pleasant, enthusiastic pupil who is highly motivated and likes to challenge herself — keep it up!"]}}},
  {"id":"s4","type":"qualities","name":"Enthusiastic and Conscientious - Follow On","data":{"comments":{"Enthusiastic and Conscientious - Follow On":["She is growing in confidence all the time and is becoming more involved in lessons, which is really encouraging.","She is highly motivated and likes to challenge herself, which is great to see.","She puts a lot of effort into every task and is a pleasure to have in class."]}}},
  {"id":"s5","type":"qualities","name":"Needs to Engage More","data":{"comments":{"Needs to Engage More":["At times [Name] is not engaging enough in lessons to make the progress she is capable of.","At times [Name] loses focus quickly — working on this will make a real difference."]}}},
  {"id":"s6","type":"qualities","name":"Needs to Engage More - Follow On","data":{"comments":{"Needs to Engage More - Follow On":["She is more capable than she realises and is encouraged to engage more fully.","She would benefit from greater focus and engagement during lessons.","She is encouraged to ask for help more often and take part in lessons."]}}},
  {"id":"s7","type":"new-line","name":"","data":{}},
  {"id":"s8","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] — great result, keep it up!","[Name] performed excellently achieving [Score].","She achieved [Score] demonstrating excellent understanding.","She performed very well achieving [Score], which is something to be proud of."],"good":["[Name] achieved [Score] showing good understanding.","[Name] performed well achieving [Score].","She achieved [Score] demonstrating good understanding.","She performed well in the assessment achieving [Score]."],"satisfactory":["[Name] achieved [Score] with some areas to develop.","[Name] achieved [Score] showing understanding in several areas.","She achieved [Score] — there are areas of strength alongside areas to focus on.","She achieved [Score] and would benefit from focused revision."],"needsImprovement":["[Name] achieved [Score] which does not fully reflect her capabilities.","[Name] achieved [Score] — making use of support will make a real difference.","She achieved [Score] and is more capable than this result suggests.","She achieved [Score] and is encouraged to prepare more thoroughly for future assessments."],"notCompleted":["[Name] has not yet completed this assessment.","[Name] was unable to sit the recent assessment."]}}},
  {"id":"s9","type":"new-line","name":"","data":{}},
  {"id":"s10","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Focus Area":["[Name] suggestion.","Second suggestion.","Third suggestion.","Fourth suggestion."]}}},
  {"id":"s11","type":"new-line","name":"","data":{}},
  {"id":"s12","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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
    "he/his": "Use HE/HIM/HIS/HIMSELF. Name-led possessive: 'his work'. Follow-on opening: 'He is...'",
    "she/her": "Use SHE/HER/HERS/HERSELF. Name-led possessive: 'her work'. Follow-on opening: 'She is...'",
    "they/their": "Use THEY/THEM/THEIR/THEMSELVES. Name-led possessive: 'their work'. Follow-on opening: 'They are...'",
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
- For every qualities heading, ensure there is a paired "- Follow On" heading immediately after it
- Name-led headings contain ONLY [Name]-starting comments
- Follow-on headings contain ONLY pronoun-starting comments (${pronounSet.split('/')[0]})
- Add any new qualities heading pairs found in the additional reports — be exhaustive
- Keep sentences whole — do not break natural sentences apart
- Use report structure to determine positive vs developmental
- Preserve subject-specific language
- Fix any progress/effort/behaviour wrongly typed as standard-comment
- Ensure personalised-comment is ONLY for genuinely student-specific variables
- Apply ${pronounSet} consistently throughout
- Keep [Name] and [Score] placeholders
- Maintain the same template name`;
  } else {
    const placeholderNote = hasPlaceholders
      ? `\nNOTE: Report text contains placeholders:
- {{STANDARD:Name}} → marker section with type "standard-comment" and name "STANDARD:Name"
- {{CHOICE:Name}} → marker section with type "standard-comment" and name "CHOICE:Name"
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

STEP 1 — DETECT STRUCTURE:
Look for section headings (Strengths, Areas for Development, Positives, Next Steps etc.). If found use them. If not, determine positive vs developmental from language and tone.

STEP 2 — QUALITIES PAIRED HEADINGS (critical):
For EVERY distinct trait, generate TWO qualities sections in sequence:
1. "[Trait Name]" — ONLY comments starting with [Name]. Use ${pronounSet} for possessives.
2. "[Trait Name] - Follow On" — ONLY comments starting with "${pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1)}". No [Name] in these.

Place both sections together with NO new-line between them. Add new-line AFTER the pair.
Be exhaustive — every distinct trait gets its own pair. Do not merge traits.
Keep sentences whole — preserve teacher's natural sentences.

STEP 3 — ALL OTHER SECTION TYPES:
1. Identical text across all reports → standard-comment
2. Same topic, different performance levels → rated-comment (progress, effort, attainment, participation, focus, behaviour ALWAYS rated-comment)
3. Different students, genuinely different personal details → personalised-comment ONLY
4. Assessment scores → assessment-comment with [Score] except notCompleted, SEPARATE per assessment
5. Improvement suggestions → next-steps
6. Placeholders → marker sections at appropriate positions

Apply TONAL RULES. Generate 4 per level for rated/assessment, 2-3 per qualities section.
Major new-lines between sections (not between paired qualities). End with optional-additional-comment.
Decompose compound sentences ONLY when genuinely two unrelated things — keep natural sentences whole.`;
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