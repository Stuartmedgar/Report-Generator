// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRUCTURE_DETECTION_PROMPT = `You are an expert at analysing teacher-written school reports.
Your task is to detect the structure and format the teacher uses, then return it as JSON.

Analyse the reports and identify:
1. The ORDER of sections as they appear in the reports
2. Where line breaks appear between sections
3. Where standard/repeated text appears
4. The overall pattern the teacher follows

Return ONLY this JSON structure, no markdown, no backticks:
{
  "detectedStructure": [
    {
      "position": 1,
      "type": "rated-comment",
      "description": "Brief description of what this section contains",
      "example": "First few words of a typical example from the reports..."
    }
  ],
  "formatNotes": "Any notable formatting observations"
}

Section types to use: rated-comment, standard-comment, qualities, assessment-comment, next-steps, new-line, optional-additional-comment
Be concise. Description should be 5-10 words. Example should be first 8-10 words only.`;

const GENERATION_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
CORE PHILOSOPHY
═══════════════════════════════════════════════════════
Your job is to EXTRACT and PRESERVE, not to summarise or generalise.
Teachers will use this template for years. Comments must sound like THEM — their language, their subject knowledge, their way of describing students.

EXTRACTION RULES:
- Capture EVERY distinct quality or trait mentioned
- Do NOT merge similar traits
- Do NOT replace subject-specific language with generic alternatives
- Use the teacher's actual sentences and phrases

═══════════════════════════════════════════════════════
NEAR-IDENTICAL PARAGRAPH DETECTION — CRITICAL
═══════════════════════════════════════════════════════
This is one of the most important rules. Read carefully.

Many teachers write using a template — the same paragraph appears in every report with ONLY the student name and pronouns (he/she/they, his/her/their, him/her/them) changed. These paragraphs look different because of name/pronoun variation but are structurally IDENTICAL.

RULE: If a paragraph appears across multiple reports with only name and pronoun differences, it is a STANDARD COMMENT — not a qualities section, not a rated comment.

HOW TO DETECT:
1. Look at paragraphs that appear in a similar position across multiple reports
2. Mentally strip out names and pronouns (he/she/they/his/her/their/him/her/them)
3. Compare the remaining content words — if 80%+ match, it is the same paragraph
4. Treat it as a standard-comment using [Name] for the student name

COMMON EXAMPLES:
- Course content paragraphs: "has learned about X, Y and Z this year. produced a poster on... completed a research task on..."
- Coursework summaries: "produced [specific work] and created [specific work]..."
- Closing sentences: "Keep working hard!" / "Keep up the good work!"

For the standard-comment content, use [Name] where the student name appears. Replace pronouns with the most natural version (he/she → he/she or use [Name] again if cleaner).

SEPARATE ASSESSMENTS: If reports mention multiple distinct assessments (e.g. "scored X% in the Romans assessment and Y% in the Black Death assessment"), create a SEPARATE assessment-comment section for each one.

CLOSING COMMENTS: If reports end with a short encouraging sentence that varies slightly ("Keep working hard!" vs "Keep up the good work!") treat these as a small qualities section with one box — not a standard comment.

═══════════════════════════════════════════════════════
SENTENCE PRESERVATION — CRITICAL
═══════════════════════════════════════════════════════
Keep natural sentences whole. ONLY split when a sentence genuinely contains two unrelated things.
✓ "[Name] is an enthusiastic, conscientious pupil who makes positive contributions and puts a lot of effort into her work." — KEEP WHOLE
✗ "She is polite and she is making good progress." — split: trait → qualities, progress → rated comment

═══════════════════════════════════════════════════════
QUALITIES — FOUR GROUPED BOXES PER THEME
═══════════════════════════════════════════════════════
Each group produces FOUR qualities sections:

BOX 1 — "[Group Name]" (name-led, positive)
ALL positive name-led comments. Every comment starts with [Name]. Use selected pronoun for possessives. 2-3 comments per heading.

BOX 2 — "[Group Name] - Follow On" (pronoun-led, positive)
ALL positive pronoun-led comments. Every comment starts with the selected pronoun. Do NOT use [Name]. 2-3 comments per heading.

BOX 3 — "[Group Name] - Development" (name-led, developmental)
ALL developmental name-led comments. Every comment starts with [Name]. Softened, forward-looking language. 2-3 comments per heading.

BOX 4 — "[Group Name] - Development Follow On" (pronoun-led, developmental)
ALL developmental pronoun-led comments. Every comment starts with the selected pronoun. Softened language. Do NOT use [Name]. 2-3 comments per heading.

Most reports need just 1 group. Create additional groups only if reports clearly suggest distinct themes.
Fixed text variant sections only need ONE qualities section — no follow-on boxes.

═══════════════════════════════════════════════════════
PRONOUN SYSTEM
═══════════════════════════════════════════════════════
- He/His: he, him, his, himself
- She/Her: she, her, hers, herself
- They/Their: they, them, their, themselves

Name-led comments: use pronoun for possessives mid-sentence.
Follow-on comments: start every comment with the pronoun.

═══════════════════════════════════════════════════════
DETECTING REPORT STRUCTURE
═══════════════════════════════════════════════════════
Look for section headings (Strengths, Areas for Development, Moving forward, Next Steps etc.).
If found: use them to determine section type and positive vs developmental.
If not found: determine from language and tone alone.

═══════════════════════════════════════════════════════
PLACEHOLDERS
═══════════════════════════════════════════════════════
Text may contain {{STANDARD:Name}} and {{CHOICE:Name}} placeholders.
Include as marker sections: type "standard-comment", name matching the placeholder.
Do NOT generate content for these.

═══════════════════════════════════════════════════════
LANGUAGE QUALITY AND TONE
═══════════════════════════════════════════════════════
Correct poor grammar while preserving voice and terminology.

PERSONALISING PHRASES: "which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of"

TONAL RULES:
POSITIVE → add warm affirming phrases naturally
DEVELOPMENTAL → NEVER add positive phrases. Use "At times...", reframe around potential, forward-looking language.

═══════════════════════════════════════════════════════
ALL SECTION TYPE RULES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Identical in every report regardless of performance — INCLUDING paragraphs that only differ by name/pronoun.
Use [Name] where student name appears. Keep pronouns as he/she or use [Name] again.
→ type: "standard-comment", data.content: string

PERSONALISED COMMENT — EXTREMELY LIMITED USE
ONLY when teacher TYPES something unique per student (sport, instrument, role).
NEVER for pathway paragraphs, course content, or fixed text options.
→ type: "personalised-comment", data.instruction: string, data.categories: object where each value is an ARRAY

RATED COMMENT
Same topic, different performance levels. Progress, effort, attainment, participation, focus, behaviour ALWAYS rated-comment.
→ type: "rated-comment", data.comments: keys excellent/good/satisfactory/needsImprovement, 4 comments each with [Name] and correct pronoun possessives.

ASSESSMENT COMMENT
ALWAYS for scores/percentages/grades. SEPARATE section for EACH distinct assessment mentioned.
Every comment at excellent/good/satisfactory/needsImprovement MUST include [Score]. notCompleted must NOT.
→ type: "assessment-comment", data.scoreType: "percentage" or "outOf", 4 per level with [Score], notCompleted: 2 without [Score]

QUALITIES — FOUR GROUPED BOXES (see above)
Also use for fixed pre-written options where teacher chooses which applies.
→ type: "qualities", data.comments: object where each key is a heading, value is array of 2-3 comments

NEXT STEPS
→ type: "next-steps", data.focusAreas: object, 4 suggestions per focus area using [Name]

NEW LINE: type "new-line", name: "", data: {}
OPTIONAL ADDITIONAL COMMENT: one at end. name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- [Name] in name-led comments and standard-comments
- Selected pronoun in follow-on comments and possessives
- [Score] in every assessment comment except notCompleted
- 4 comments per level for rated/assessment
- 2-3 comments per heading in qualities boxes
- New-line between major sections
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE (He/His example, History-style reports):
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Overall Progress","data":{"comments":{"excellent":["[Name] has made excellent progress this year, which is great to see.","[Name] has made strong progress — keep it up!","His effort and commitment are really paying off.","He is achieving at a high level, which is something to be proud of."],"good":["[Name] has made good progress this year.","[Name] is doing well and working hard.","His engagement in lessons is positive.","He is developing well."],"satisfactory":["At times [Name] has made some progress, though there is potential for more.","At times [Name] could push himself more.","He has the ability to make more progress with greater focus.","He is capable of making more consistent progress."],"needsImprovement":["At times [Name] is finding aspects of the course challenging.","At times [Name] is more capable than he realises.","He would benefit from greater engagement.","He needs to build confidence and focus."]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{"Well-Mannered and Hardworking":["[Name] is a well-mannered and hardworking pupil whose behaviour and effort in class are excellent.","[Name] is a well-mannered and conscientious pupil who consistently completes activities to a high standard."],"Passion for the Subject":["[Name] has a clear passion for the subject and excellent background knowledge on the topics covered — keep it up!","[Name] enjoys learning about the subject and engages enthusiastically with all topics."]}}},
  {"id":"s4","type":"qualities","name":"Personal Qualities - Follow On","data":{"comments":{"Works Well Individually and Collaboratively":["He works well both individually and collaboratively and consistently completes work to a high standard.","He has shown that he can work effectively both individually and as part of a team."],"Makes Valuable Contributions":["He regularly makes valuable contributions to classroom discussions, which has had a real positive impact.","He enjoys taking part in discussions and debates and is a pleasure to have in class."]}}},
  {"id":"s5","type":"qualities","name":"Personal Qualities - Development","data":{"comments":{"Can Be Distracted":["At times [Name] can be distracted in class and this can affect the quantity and standard of his work.","At times [Name] loses focus in class — working on this will make a real difference."],"Attendance Impact":["At times [Name] has made progress, although this has been limited by his attendance in class.","At times [Name] has gaps in understanding due to attendance — making use of support available will help."]}}},
  {"id":"s6","type":"qualities","name":"Personal Qualities - Development Follow On","data":{"comments":{"Needs More Focus":["He must ensure that he is fully focused on completing all activities and assessments to the best possible standard.","He would benefit from maintaining better focus to reach his full potential."]}}},
  {"id":"s7","type":"new-line","name":"","data":{}},
  {"id":"s8","type":"standard-comment","name":"Course Content","data":{"content":"[Name] has learned about a range of historical topics this year, including the Romans, the Black Death and Mary Queen of Scots. [Name] produced a poster detailing the impact the Romans had on Britain and created a pamphlet outlining the medieval causes of the Black Death. [Name] also completed a research task on Mary Queen of Scots' life and made a comic strip outlining key events in Mary's early life."}},
  {"id":"s9","type":"new-line","name":"","data":{}},
  {"id":"s10","type":"assessment-comment","name":"Mary Queen of Scots Assessment","data":{"scoreType":"percentage","comments":{"excellent":["[Name] scored [Score] in the Mary Queen of Scots assessment — excellent result!","[Name] achieved [Score] demonstrating excellent understanding.","He scored [Score] showing excellent grasp of the content.","He achieved [Score] — a fantastic result to be really proud of."],"good":["[Name] scored [Score] in the Mary Queen of Scots assessment showing good understanding.","[Name] achieved [Score] demonstrating solid understanding.","He scored [Score] showing good grasp of the content.","He performed well achieving [Score]."],"satisfactory":["[Name] scored [Score] in the Mary Queen of Scots assessment with some areas to develop.","[Name] achieved [Score] showing understanding in several areas.","He scored [Score] with areas of strength alongside areas to focus on.","He achieved [Score] and would benefit from focused revision."],"needsImprovement":["[Name] scored [Score] in the Mary Queen of Scots assessment — he is more capable than this suggests.","[Name] achieved [Score] not fully reflecting his capabilities.","He scored [Score] and would benefit from additional support.","He achieved [Score] and is encouraged to seek help with challenging areas."],"notCompleted":["[Name] has not yet completed this assessment.","[Name] was unable to sit this assessment."]}}},
  {"id":"s11","type":"new-line","name":"","data":{}},
  {"id":"s12","type":"assessment-comment","name":"Black Death Assessment","data":{"scoreType":"percentage","comments":{"excellent":["[Name] scored [Score] in the Black Death assessment — excellent result!","[Name] achieved [Score] demonstrating excellent understanding of the content.","He scored [Score] showing excellent grasp of the Black Death topics.","He achieved [Score] — a fantastic result."],"good":["[Name] scored [Score] in the Black Death assessment showing good understanding.","[Name] achieved [Score] demonstrating solid understanding.","He scored [Score] showing good grasp of the content.","He performed well achieving [Score]."],"satisfactory":["[Name] scored [Score] in the Black Death assessment with some areas to develop.","[Name] achieved [Score] showing understanding in several areas.","He scored [Score] with areas of strength alongside areas to focus on.","He achieved [Score] and would benefit from focused revision."],"needsImprovement":["[Name] scored [Score] in the Black Death assessment — he is more capable than this suggests.","[Name] achieved [Score] not fully reflecting his capabilities.","He scored [Score] and would benefit from additional support.","He achieved [Score] and is encouraged to seek help with challenging areas."],"notCompleted":["[Name] has not yet completed this assessment.","[Name] was unable to sit this assessment."]}}},
  {"id":"s13","type":"new-line","name":"","data":{}},
  {"id":"s14","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Written Responses":["[Name] must continue to include detailed descriptions and explanations in his written responses.","[Name] must aim to add more detailed descriptions and explanations to his written responses.","[Name] should build upon progress by producing more detailed written responses.","[Name] must take his time to ensure written responses are completed to the standard he is capable of."],"Focus and Standards":["[Name] must ensure he is fully focused on completing all activities and assessments to the best possible standard.","[Name] must ensure he continues to complete all activities to the high standards he is capable of.","[Name] should work hard to complete all activities and assessments to the best possible standard.","[Name] must take his time in class to ensure activities are completed to the standard he is capable of."]}}},
  {"id":"s15","type":"new-line","name":"","data":{}},
  {"id":"s16","type":"qualities","name":"Closing Comment","data":{"comments":{"Keep Up the Good Work":["Keep up the good work [Name]!","Keep it up [Name] — you are doing brilliantly!"],"Keep Working Hard":["Keep working hard [Name]!","Keep going [Name] — hard work pays off!"]}}},
  {"id":"s17","type":"new-line","name":"","data":{}},
  {"id":"s18","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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

  // ─── MODE: DETECT STRUCTURE ────────────────────────────────────────────────
  if (mode === "detect") {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
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

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        return new Response(JSON.stringify({ error: "Could not detect structure" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(parsed), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch {
      return new Response(JSON.stringify({ error: "Structure detection failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // ─── MODE: GENERATE ────────────────────────────────────────────────────────

  const pronounInstructions: Record<string, string> = {
    "he/his": "Use HE/HIM/HIS/HIMSELF. Possessives: 'his work'. Follow-on start: 'He is...' / 'He puts...'",
    "she/her": "Use SHE/HER/HERS/HERSELF. Possessives: 'her work'. Follow-on start: 'She is...' / 'She puts...'",
    "they/their": "Use THEY/THEM/THEIR/THEMSELVES. Possessives: 'their work'. Follow-on start: 'They are...' / 'They put...'",
  };

  const pronounNote = pronounInstructions[pronounSet] || pronounInstructions["they/their"];
  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);

  const structureNote = useDetectedStructure && detectedStructure
    ? `\nIMPORTANT — FOLLOW THIS DETECTED STRUCTURE:
Generate sections in EXACTLY this order:
${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}
Respect any new-line positions detected.\n`
    : "\nGenerate sections in the order that best fits the content.\n";

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
- Look for near-identical paragraphs (same content, different name/pronoun only) and ensure they are standard-comments not qualities sections
- Check if multiple assessments are mentioned — ensure there is a SEPARATE assessment-comment for each one
- Ensure qualities use 4 grouped boxes per theme
- Add new trait headings from additional reports
- Keep sentences whole
- Preserve subject-specific language
- Fix any progress/effort/behaviour wrongly as standard-comment
- Apply ${pronounSet} consistently
- Keep [Name] and [Score] placeholders
- Maintain same template name`;
  } else {
    const placeholderNote = hasPlaceholders
      ? `\nNOTE: Report text contains placeholders:
- {{STANDARD:Name}} → marker with type "standard-comment" and name "STANDARD:Name"
- {{CHOICE:Name}} → marker with type "standard-comment" and name "CHOICE:Name"
Pre-defined standard: ${standardCommentNames.join(", ")}
Pre-defined choice: ${choiceCommentNames.join(", ")}\n`
      : "";

    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
Pronoun set: ${pronounSet} — ${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}
REPORTS TO ANALYSE:
${reportText}

STEP 1 — DETECT NEAR-IDENTICAL PARAGRAPHS:
Before anything else, scan all reports for paragraphs that appear in every or most reports with only name and pronoun differences. These are standard-comments. Look especially at:
- Middle paragraphs describing course content, topics covered, or work completed
- Closing sentences or sign-offs
Strip pronouns mentally and compare the content words — if 80%+ match across reports, it is a standard-comment.

STEP 2 — DETECT MULTIPLE ASSESSMENTS:
Look for reports that mention more than one assessment score. If found, create a SEPARATE assessment-comment section for each distinct assessment with its own name.

STEP 3 — DETECT STRUCTURE:
${useDetectedStructure && detectedStructure ? "Use the detected structure above — follow the section order exactly." : "Look for section headings and determine the natural order of sections from the reports."}

STEP 4 — IDENTIFY QUALITY GROUPS:
Most reports need 1 group "Personal Qualities". Create additional groups only if reports clearly suggest distinct themes.

STEP 5 — GENERATE FOUR BOXES PER QUALITIES GROUP:
BOX 1 "[Group Name]" — positive name-led: every comment starts with [Name], 2-3 per heading
BOX 2 "[Group Name] - Follow On" — positive pronoun-led: every comment starts with "${pronounCapital}", never [Name], 2-3 per heading
BOX 3 "[Group Name] - Development" — developmental name-led: every comment starts with [Name], softened language, 2-3 per heading
BOX 4 "[Group Name] - Development Follow On" — developmental pronoun-led: every comment starts with "${pronounCapital}", never [Name], 2-3 per heading

STEP 6 — ALL OTHER SECTIONS:
1. Near-identical paragraphs (name/pronoun variation only) → standard-comment with [Name]
2. Same topic different levels → rated-comment (progress, effort, attainment, participation ALWAYS rated-comment)
3. Teacher TYPES something unique per student → personalised-comment ONLY
4. Each distinct assessment score → its own assessment-comment with [Score] except notCompleted
5. Improvement suggestions → next-steps
6. Short closing encouragements that vary slightly → small qualities section
7. Placeholders → marker sections

Keep sentences whole. Apply TONAL RULES. 4 per level for rated/assessment. New-line between major sections. End with optional-additional-comment.`;
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
        JSON.stringify({ error: "Template was too large to generate in one go. Try adding more standard or choice comments to reduce the character count, then try again." }),
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