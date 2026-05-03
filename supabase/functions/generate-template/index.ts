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
- Do NOT merge similar traits — each gets its own heading within a box
- Do NOT replace subject-specific language with generic alternatives
- Use the teacher's actual sentences and phrases

═══════════════════════════════════════════════════════
SENTENCE PRESERVATION — CRITICAL
═══════════════════════════════════════════════════════
Keep natural sentences whole. ONLY split when a sentence genuinely contains two unrelated things.
✓ "[Name] is an enthusiastic, conscientious pupil who makes positive contributions and puts a lot of effort into her work." — KEEP WHOLE
✗ "She is polite and she is making good progress." — split: trait → qualities, progress → rated comment

═══════════════════════════════════════════════════════
QUALITIES — FOUR GROUPED BOXES PER THEME
═══════════════════════════════════════════════════════
This is the most important section. Read carefully.

Qualities comments are organised into GROUPED BOXES, not individual paired headings.
Each group of related qualities produces FOUR qualities sections:

BOX 1 — "[Group Name]" (name-led, positive)
Contains ALL positive name-led comments across multiple trait headings.
Every comment starts with [Name]. Use selected pronoun for possessives.
Each heading key is a distinct trait name. 2-3 comments per heading.

BOX 2 — "[Group Name] - Follow On" (pronoun-led, positive)  
Contains ALL positive pronoun-led comments across multiple trait headings.
Every comment starts with the selected pronoun. Do NOT use [Name].
Each heading key is a distinct trait name. 2-3 comments per heading.

BOX 3 — "[Group Name] - Development" (name-led, developmental)
Contains ALL developmental name-led comments across multiple trait headings.
Every comment starts with [Name]. Softened, forward-looking language.
Each heading key is a distinct trait name. 2-3 comments per heading.

BOX 4 — "[Group Name] - Development Follow On" (pronoun-led, developmental)
Contains ALL developmental pronoun-led comments.
Every comment starts with the selected pronoun. Softened language. Do NOT use [Name].
Each heading key is a distinct trait name. 2-3 comments per heading.

HOW MANY GROUPS:
- Minimum 1 group (e.g. "Personal Qualities")
- Create additional groups if the reports clearly suggest distinct themes (e.g. "Personal Qualities" AND "Learning Skills", or in PE: "Personal Qualities" AND "Activity Qualities")
- Most reports will need just 1 group. Only create more if the reports clearly warrant it.

TEACHER WORKFLOW:
The teacher picks ONE heading from Box 1 (name-led positive) and ONE from Box 2 (follow-on positive) to create a natural two-sentence positive comment about the student. The name appears once in sentence 1, the pronoun flows naturally in sentence 2.

Example result in a report:
"[Name] is an enthusiastic, conscientious pupil who puts a lot of effort into her work in class." + "She is highly motivated and likes to challenge herself, which is great to see."

═══════════════════════════════════════════════════════
PRONOUN SYSTEM
═══════════════════════════════════════════════════════
Pronoun sets:
- He/His: he, him, his, himself
- She/Her: she, her, hers, herself
- They/Their: they, them, their, themselves

Apply the selected pronoun consistently:
- In name-led comments: use for possessives mid-sentence (e.g. "her work", "his effort")
- In follow-on comments: start every comment with the pronoun (e.g. "She is...", "He puts...")

═══════════════════════════════════════════════════════
DETECTING REPORT STRUCTURE
═══════════════════════════════════════════════════════
Look for section headings (Strengths, Areas for Development, Positives, Next Steps etc.).
If found: use them to determine positive vs developmental.
If not found: determine from language and tone alone.
Works generically for any subject and any reporting style.

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

PERSONALISING PHRASES: "which is great to see", "keep it up", "which is really encouraging", "this is something to be really proud of", "and this has had a real positive impact"

TONAL RULES:
POSITIVE → add warm affirming phrases naturally
DEVELOPMENTAL → NEVER add positive phrases. Use "At times...", reframe around potential, forward-looking language.

═══════════════════════════════════════════════════════
ALL SECTION TYPE RULES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Identical in every report regardless of performance.
→ type: "standard-comment", data.content: string

PERSONALISED COMMENT
ONLY for genuinely student-specific variables (activity, instrument, topic, role).
NOT for pathway paragraphs or ability groups.
→ type: "personalised-comment", data.instruction: string, data.categories: object

RATED COMMENT
Same topic, different performance levels. Progress, effort, attainment, participation, focus, behaviour ALWAYS rated-comment.
→ type: "rated-comment", data.comments: keys excellent/good/satisfactory/needsImprovement, 4 comments each using [Name] with correct pronoun possessives.

ASSESSMENT COMMENT
ALWAYS for scores/percentages/grades. SEPARATE section per assessment.
Every comment at excellent/good/satisfactory/needsImprovement MUST include [Score]. notCompleted must NOT.
→ type: "assessment-comment", data.scoreType: "percentage" or "outOf", 4 comments per level with [Score], notCompleted: 2 without [Score]

QUALITIES — FOUR GROUPED BOXES (see full description above)
→ type: "qualities"
→ data.comments: object where each key is a trait heading, value is array of 2-3 comments
→ Generate 4 sections per group: name-led positive, follow-on positive, name-led developmental, follow-on developmental

NEXT STEPS
→ type: "next-steps", data.focusAreas: object, 4 suggestions per focus area using [Name]

NEW LINE: type "new-line", name: "", data: {}. Add between major sections.
OPTIONAL ADDITIONAL COMMENT: one at end. name: "Additional Comments", data: {}

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- [Name] in name-led comments only
- Selected pronoun in follow-on comments and possessives throughout
- [Score] in every assessment comment except notCompleted
- 4 comments per level for rated/assessment
- 2-3 comments per heading within each qualities box
- New-line between major sections
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE (She/Her example, 1 group):
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Overall Progress","data":{"comments":{"excellent":["[Name] is making excellent progress, which is great to see.","[Name] is progressing exceptionally well — keep it up!","Her effort and commitment are really paying off.","She is achieving at a high level, which is something to be proud of."],"good":["[Name] is making good progress.","[Name] is doing well and working hard.","Her engagement in lessons is positive.","She is developing well across the course."],"satisfactory":["At times [Name] is making satisfactory progress.","At times [Name] could push herself more.","She would benefit from more consistent effort.","She has the ability to achieve more with focus."],"needsImprovement":["At times [Name] is finding aspects of the course challenging.","At times [Name] is more capable than she realises.","She is encouraged to make use of the support available.","She would benefit from greater engagement in lessons."]}}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{
    "Enthusiastic and Conscientious":["[Name] is an enthusiastic, conscientious pupil who makes positive contributions to class discussions and puts a lot of effort into her work in class, which is great to see.","[Name] is a pleasant, enthusiastic pupil who is highly motivated and likes to challenge herself — keep it up!"],
    "Polite and Hardworking":["[Name] is a polite, hardworking pupil who consistently gives her best effort, which is really encouraging.","[Name] is a very polite, conscientious pupil who puts a lot of effort into individual work and contributes well as part of a group."],
    "Growing in Confidence":["[Name] is growing in confidence all the time and is becoming more involved in lessons, which is great to see.","[Name] has shown a really positive shift in confidence over the course of the year — this is something to be really proud of."],
    "Natural Ability":["[Name] has a natural ability for the subject and picks up new concepts very quickly — keep it up!","[Name] picks up new skills day to day and demonstrates real capability, which is great to see."]
  }}},
  {"id":"s4","type":"qualities","name":"Personal Qualities - Follow On","data":{"comments":{
    "Highly Motivated":["She is highly motivated and likes to challenge herself, which is great to see.","She brings real enthusiasm to every lesson and is a pleasure to have in class.","She is keen to do well and always gives her best effort."],
    "Growing Confidence":["She is growing in confidence all the time and the more she takes part, the more her confidence will grow.","She is increasingly willing to share ideas and ask for help, which is really encouraging."],
    "Great Attitude":["She puts a lot of effort into practice and has a great positive attitude — keep it up!","She is getting better at asking for support and feedback, which is having a positive impact."]
  }}},
  {"id":"s5","type":"qualities","name":"Personal Qualities - Development","data":{"comments":{
    "Needs to Engage More":["At times [Name] is not engaging enough in lessons to make the progress she is capable of.","At times [Name] loses focus too easily — working on this will make a real difference."],
    "Very Quiet in Class":["At times [Name] is very quiet in class and should ask for help or seek feedback more often.","At times [Name] could ask for help more often — doing so will help make the progress she is capable of."],
    "Can Rush Work":["At times [Name] can make mistakes when rushing stages of working — taking more care will make a real difference.","At times [Name] rushes her work — slowing down and checking carefully will help show her true ability."]
  }}},
  {"id":"s6","type":"qualities","name":"Personal Qualities - Development Follow On","data":{"comments":{
    "More Capable Than She Realises":["She is more capable than she realises and will keep building her confidence through effort and a positive mindset.","She performs better day to day than in assessments — working on this will help her show her true potential."],
    "Encouraged to Ask for Help":["She should ask for help or seek feedback more often — doing so will make a real difference to her progress.","She is encouraged to speak up more in class as this will help her confidence grow."],
    "Focus to Develop":["She loses focus too easily — developing better concentration skills will help unlock her potential.","She would benefit from greater focus and engagement during lessons to make the progress she is capable of."]
  }}},
  {"id":"s7","type":"new-line","name":"","data":{}},
  {"id":"s8","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score] — great result, keep it up!","[Name] performed excellently achieving [Score].","She achieved [Score] demonstrating excellent understanding.","She performed very well achieving [Score], which is something to be proud of."],"good":["[Name] achieved [Score] showing good understanding.","[Name] performed well achieving [Score].","She achieved [Score] demonstrating solid understanding.","She performed well in the assessment achieving [Score]."],"satisfactory":["[Name] achieved [Score] with some areas to develop.","[Name] achieved [Score] showing understanding in several areas.","She achieved [Score] — there are areas of strength alongside areas to focus on.","She achieved [Score] and would benefit from focused revision going forward."],"needsImprovement":["[Name] achieved [Score] which does not fully reflect her capabilities.","[Name] achieved [Score] — making use of support will make a real difference.","She achieved [Score] and is more capable than this result suggests.","She achieved [Score] and is encouraged to prepare more thoroughly for future assessments."],"notCompleted":["[Name] has not yet completed this assessment.","[Name] was unable to sit the recent assessment."]}}},
  {"id":"s9","type":"new-line","name":"","data":{}},
  {"id":"s10","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Seeking Support":["[Name] should ask for help when required and make use of the feedback available.","[Name] would benefit from seeking feedback more often to build understanding.","[Name] should ensure to ask for help and not struggle in silence.","[Name] needs to make better use of the support available to improve."]}}},
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
    "he/his": "Use HE/HIM/HIS/HIMSELF. Possessives: 'his work', 'his effort'. Follow-on start: 'He is...' / 'He puts...'",
    "she/her": "Use SHE/HER/HERS/HERSELF. Possessives: 'her work', 'her effort'. Follow-on start: 'She is...' / 'She puts...'",
    "they/their": "Use THEY/THEM/THEIR/THEMSELVES. Possessives: 'their work', 'their effort'. Follow-on start: 'They are...' / 'They put...'",
  };

  const pronounNote = pronounInstructions[pronounSet] || pronounInstructions["they/their"];
  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);

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
- Ensure qualities are organised into grouped boxes of 4:
  1. "[Group Name]" — ALL positive name-led headings (only [Name]-starting comments)
  2. "[Group Name] - Follow On" — ALL positive pronoun-led headings (only ${pronounCapital}-starting comments)
  3. "[Group Name] - Development" — ALL developmental name-led headings (only [Name]-starting comments)
  4. "[Group Name] - Development Follow On" — ALL developmental pronoun-led headings (only ${pronounCapital}-starting)
- Add any new trait headings from additional reports into the appropriate box
- Keep sentences whole — do not break natural sentences apart
- Use report structure to determine positive vs developmental
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
REPORTS TO ANALYSE:
${reportText}

STEP 1 — DETECT STRUCTURE:
Look for section headings (Strengths, Areas for Development, etc.). If found use them. If not, determine positive vs developmental from language and tone.

STEP 2 — IDENTIFY QUALITY GROUPS:
Look at all the character traits and qualities mentioned. Decide if they naturally fall into 1 group (most reports) or 2+ distinct groups (e.g. general qualities AND subject-specific qualities). Most reports need just 1 group called "Personal Qualities".

STEP 3 — GENERATE FOUR BOXES PER GROUP:
For each group, generate exactly 4 qualities sections in this order:

BOX 1 "[Group Name]" — positive, name-led:
- data.comments contains ALL positive trait headings
- Every comment in every heading starts with [Name]
- Use ${pronounSet} for possessives (e.g. "${pronounSet.split('/')[1]} work")
- 2-3 comments per heading
- Warm affirming tone with personalising phrases

BOX 2 "[Group Name] - Follow On" — positive, pronoun-led:
- data.comments contains positive follow-on headings
- Every comment starts with "${pronounCapital}" — never [Name]
- Designed to flow naturally after a name-led comment
- 2-3 comments per heading
- Warm affirming tone

BOX 3 "[Group Name] - Development" — developmental, name-led:
- data.comments contains ALL developmental trait headings
- Every comment starts with [Name]
- Softened, forward-looking language ("At times [Name]...", "working on this will make a real difference")
- 2-3 comments per heading

BOX 4 "[Group Name] - Development Follow On" — developmental, pronoun-led:
- data.comments contains developmental follow-on headings
- Every comment starts with "${pronounCapital}" — never [Name]
- Softened, encouraging, forward-looking language
- 2-3 comments per heading

STEP 4 — ALL OTHER SECTIONS:
1. Identical text → standard-comment
2. Same topic different levels → rated-comment (progress, effort, attainment, participation, focus, behaviour ALWAYS rated-comment)
3. Genuinely different per-student variables → personalised-comment ONLY
4. Assessment scores → assessment-comment with [Score] except notCompleted, SEPARATE per assessment
5. Improvement suggestions → next-steps
6. Placeholders → marker sections

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