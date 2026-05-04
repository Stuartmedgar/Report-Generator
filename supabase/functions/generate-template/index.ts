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
YOUR APPROACH — READ THIS FIRST
═══════════════════════════════════════════════════════
Work through the reports SENTENCE BY SENTENCE, exactly as a skilled human editor would.

For each sentence position in the reports, ask:
- What is this sentence doing? (describing progress, describing a quality, giving assessment info, suggesting improvement)
- Does it start with the student's name or a pronoun?
- How does it vary between students — by performance level, by specific quality, or not at all?
- Can I group similar versions of this sentence together?

Then build ONE comment box per sentence position, using the right section type to represent it.

The section types are your OUTPUT FORMAT — not your decision framework. Read the reports first, understand the sentence patterns, then choose the right type to capture each one.

═══════════════════════════════════════════════════════
LANGUAGE — EXTRACT AND PRESERVE
═══════════════════════════════════════════════════════
Use the teacher's ACTUAL sentences and phrases from the reports. The teacher should recognise their own voice.
- Keep complete sentences whole — do not break them apart
- Preserve subject-specific language and terminology exactly
- Correct only genuine grammar errors, not style choices
- Generate additional variety options in the same voice and style as the teacher

NAME AND PRONOUN PATTERN:
Detect how the teacher uses names and pronouns across sentences. Typically:
- Opening sentences use [Name]
- Follow-on sentences in the same paragraph use the pronoun
- Later sentences may return to [Name]
Mirror this pattern. Do NOT use [Name] where the teacher used a pronoun and vice versa.
Use the selected pronoun set consistently throughout.

AVOID NAME OVERUSE — using [Name] repeatedly in consecutive sentences looks copy-pasted and unnatural.

═══════════════════════════════════════════════════════
NEAR-IDENTICAL PARAGRAPHS
═══════════════════════════════════════════════════════
If the same paragraph appears across most reports with only name/pronoun differences, it is a standard-comment.
Mentally strip names and pronouns — if 80%+ of content words match across reports, it is standard-comment not qualities.
Use [Name] where the student name appears in the standard-comment content.

═══════════════════════════════════════════════════════
SECTION TYPES
═══════════════════════════════════════════════════════

STANDARD COMMENT
Same text in every report regardless of performance. Name/pronoun variation is ignored.
→ type: "standard-comment", data.content: string using [Name] where name appears

RATED COMMENT
The same sentence position varies by student performance level. Use when the opening sentence or any sentence varies clearly by how well the student is doing.
Include [Name] or pronoun as the teacher uses it.
Generate 3-4 options per level that group similar sentences from the reports, plus 1-2 additional variety options in the teacher's voice.
→ type: "rated-comment"
→ data.comments: keys excellent, good, satisfactory, needsImprovement
→ Each level: array of 4 comments

QUALITIES — ONE BOX PER SENTENCE POSITION
Use for sentences describing character traits, attitudes, or personal qualities.
Each qualities SECTION represents ONE sentence position in the reports.
Within each section, the headings are the different TOPICS or TRAITS available for that sentence position.
Each heading has 2-3 comment options — similar sentences grouped together, with 1-2 additional variety options.
The teacher picks ONE heading from each qualities section. Together they form a natural flowing paragraph.

NAME/PRONOUN IN QUALITIES:
- If this sentence position uses [Name] in the reports → all comments in this section start with [Name]
- If this sentence position uses a pronoun → all comments start with the selected pronoun
- Never mix — all comments in one section must use the same opener

→ type: "qualities"
→ data.comments: object where each key is a trait/topic heading, value is array of 2-3 comments
→ All comments in the section use [Name] OR all use the pronoun — never mixed

ASSESSMENT COMMENT
Use when reports mention scores or percentages. Create a SEPARATE section for each distinct assessment.
Every comment at excellent/good/satisfactory/needsImprovement must include [Score].
notCompleted must NOT include [Score].

SPECIAL CASE — FIXED ASSESSMENT SENTENCE:
If the teacher writes the same sentence structure for every student with only the score changing (e.g. "scored X% in the Mary Queen of Scots assessment") — use a standard-comment with [Score] as the placeholder instead of a full assessment-comment. Only use a full assessment-comment when the teacher writes meaningfully different sentences based on how well the student scored.

→ type: "assessment-comment"
→ data.scoreType: "percentage" or "outOf"
→ data.comments: 4 per level with [Score], notCompleted: 2 without [Score]

NEXT STEPS — ONE BOX PER SENTENCE POSITION
Each next-steps section represents ONE sentence position in the next steps paragraph.
Within each section, the focus areas are DIFFERENT TOPICS the teacher might address at that sentence position.
Each focus area has 3-4 options — grouped similar sentences from the reports plus variety options in the teacher's voice.

CRITICAL: Options within a focus area cover the SAME topic with different phrasings.
Focus areas within a section cover DIFFERENT topics.
A teacher picks ONE focus area from each next-steps section. Together they read as a coherent improvement paragraph covering different topics.

OPENING PHRASE: If the teacher always starts next steps with a specific phrase (e.g. "Moving forward,") preserve this in every option in the first next-steps section.

NAME/PRONOUN IN NEXT STEPS:
Mirror the teacher's pattern — if sentence 1 uses [Name], sentence 2 uses pronoun, sentence 3 uses [Name], reflect this across sections.

→ type: "next-steps"
→ data.focusAreas: object where each key is a topic/focus area, value is array of 3-4 suggestions

NEW LINE: type "new-line", name: "", data: {}. Add between major sections.
OPTIONAL ADDITIONAL COMMENT: always one at end. name: "Additional Comments", data: {}

PERSONALISED COMMENT — VERY RARELY USED
Only when the teacher types something genuinely unique per student (a specific sport, instrument, role).
Never for pathway paragraphs, course content, or fixed text options.
→ type: "personalised-comment", data.instruction: string, data.categories: object where values are ARRAYS

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Mirror the teacher's name/pronoun pattern sentence by sentence
- Use [Score] in assessment comments where scores appear
- Keep the teacher's actual language — do not paraphrase
- Add new-line between major sections
- End with optional-additional-comment
- Return ONLY valid JSON

RETURN FORMAT — STRUCTURAL REFERENCE:
{"templateName":"string","sections":[
  {"id":"s1","type":"rated-comment","name":"Opening Progress","data":{"comments":{
    "excellent":["[Name] is a hardworking and enthusiastic pupil who has made strong progress this year, which is great to see.","[Name] has made excellent progress this year and his effort and commitment are really paying off — keep it up!","[Name] is a conscientious pupil with a clear passion for the subject who has made strong progress this year.","[Name] has made outstanding progress this year and consistently produces work of the highest standard."],
    "good":["[Name] is a well-mannered and hardworking pupil who has made good progress this year.","[Name] is a polite and enthusiastic pupil who has made good progress this year.","[Name] has made good progress this year and is developing well as a learner.","[Name] is a hardworking pupil who has made good progress and engages positively with the subject."],
    "satisfactory":["[Name] is a well-mannered pupil who has made some progress this year, though there is potential for more.","[Name] has made some progress this year and with greater focus is capable of achieving more.","[Name] is a polite pupil who has made some progress this year, although consistency could be improved.","[Name] has made some progress this year and would benefit from greater engagement to reach his potential."],
    "needsImprovement":["[Name] is a well-mannered pupil who has made some progress this year, although this has been limited at times.","[Name] has the potential to make more progress this year with greater focus and effort.","[Name] is a polite pupil who has found aspects of the course challenging but has the potential to improve.","[Name] has made some progress this year though greater engagement would help him reach his true potential."]
  }}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{
    "Hardworking and Conscientious":["[Name] works hard in class to complete all activities to the best possible standard.","[Name] consistently completes both classwork and assessments to a high standard.","[Name] puts a lot of effort into all activities and her behaviour and effort in class are excellent."],
    "Passion and Enthusiasm":["[Name] has a clear passion for the subject and excellent background knowledge on the topics covered.","[Name] enjoys the subject and engages enthusiastically with all topics and activities.","[Name] has a clear passion for learning and regularly shows keen interest in the topics covered."],
    "Team Skills":["[Name] enjoys working as part of a team and thrives in activities that require creativity.","[Name] works well as part of a team and enjoys collaborative activities.","[Name] has shown real leadership qualities when taking part in group activities."]
  }}},
  {"id":"s4","type":"qualities","name":"Personal Qualities - Sentence 2","data":{"comments":{
    "Makes Valuable Contributions":["He regularly makes valuable contributions to classroom discussions and debates.","He enjoys taking part in discussions and debates and has shown a keen interest in the curriculum.","He is capable of producing work of a good standard when fully focused in class."],
    "Works to High Standards":["He works hard to complete all activities and assessments to a consistently high standard.","He has demonstrated that he can work effectively both individually and as part of a team.","He works well both individually and collaboratively and consistently completes work to a high standard."],
    "Development Needed":["He can sometimes be distracted in class and this can affect the quantity and standard of his work.","He must ensure that he is fully focused to complete activities to the standards he is capable of.","He has made some progress although this has been limited by his sporadic attendance in class."]
  }}},
  {"id":"s5","type":"new-line","name":"","data":{}},
  {"id":"s6","type":"standard-comment","name":"Course Content","data":{"content":"[Name] has learned about a range of historical topics this year, including the Romans, the Black Death and Mary Queen of Scots. [Name] produced a poster detailing the impact the Romans had on Britain and created a pamphlet outlining the medieval causes of the Black Death. [Name] also completed a research task on Mary Queen of Scots life and made a comic strip outlining key events in Mary's early life."}},
  {"id":"s7","type":"new-line","name":"","data":{}},
  {"id":"s8","type":"standard-comment","name":"Mary Queen of Scots Assessment","data":{"content":"[Name] scored [Score] in the Mary Queen of Scots end of unit assessment"}},
  {"id":"s9","type":"standard-comment","name":"Black Death Assessment","data":{"content":"and [Score] in the end of unit test on the Black Death."}},
  {"id":"s10","type":"qualities","name":"Assessment Reflection","data":{"comments":{
    "Strong in Both":["He performed well in both assessments, demonstrating good understanding across the topics covered.","He showed strong understanding across both units, which is really encouraging — keep it up!"],
    "Strong MQS, Weaker Black Death":["He performed well in the Mary Queen of Scots assessment but has areas to develop in the Black Death unit.","He showed good understanding of the Mary Queen of Scots unit but would benefit from revisiting the Black Death content."],
    "Weaker MQS, Strong Black Death":["He performed well in the Black Death assessment but has areas to develop from the Mary Queen of Scots unit.","He showed strong understanding of the Black Death but would benefit from revisiting the Mary Queen of Scots content."],
    "Areas to Develop in Both":["Both assessments suggest there are areas to develop across the topics covered this year.","His results suggest he would benefit from revisiting the content covered across both units."]
  }}},
  {"id":"s11","type":"new-line","name":"","data":{}},
  {"id":"s12","type":"next-steps","name":"Moving Forward","data":{"focusAreas":{
    "Improve Written Detail":["Moving forward, [Name] must build upon the progress made by producing more detailed descriptions and explanations in written and verbal responses.","Moving forward, [Name] must aim to add more detailed descriptions and explanations to written responses.","Moving forward, [Name] must continue to include detailed descriptions and explanations in written responses.","Moving forward, [Name] must take time to ensure written responses are completed to the standard capable of."],
    "Focus and Standards":["Moving forward, [Name] must ensure full focus on completing all classroom activities and assessments to the best possible standard.","Moving forward, [Name] must ensure all classroom activities and assessments are completed to the high standards capable of.","Moving forward, [Name] should continue to work hard on all activities and assessments to complete them to the best possible standard.","Moving forward, [Name] must take time to complete all activities and assessments to the standard capable of."],
    "Classroom Participation":["Moving forward, [Name] should continue to contribute to classroom discussions and debates to further develop confidence and understanding.","Moving forward, [Name] should aim to contribute more regularly to classroom discussions and debates.","Moving forward, [Name] should continue to participate in classroom discussions and debates.","Moving forward, [Name] should regularly make valuable contributions to classroom discussions and debates."]
  }}},
  {"id":"s13","type":"next-steps","name":"Next Steps - Sentence 2","data":{"focusAreas":{
    "Written Responses":["He should take time to complete all activities and assessments to the standard he is capable of. At the moment his answers can be rushed and lacking in detail.","He should focus on adding more depth and detail to his written and verbal responses going forward.","He must continue to produce detailed responses across all activities and assessments."],
    "Seeking Support":["He should continue to ask for support and guidance if finding any elements of the course challenging.","He must ensure he asks for support with areas of the curriculum he finds challenging or has missed through absence.","He should make use of available support to address any gaps in understanding."],
    "Focus":["He must ensure he is fully focused on completing all activities and assessments to the best possible standard.","He can sometimes be distracted in class and must ensure this does not affect the standard of his work.","He should ensure he maintains focus throughout lessons to reach his full potential."]
  }}},
  {"id":"s14","type":"new-line","name":"","data":{}},
  {"id":"s15","type":"qualities","name":"Closing Comment","data":{"comments":{
    "Keep Up the Good Work":["Keep up the good work [Name]!","Keep it up [Name] — you are doing brilliantly!"],
    "Keep Working Hard":["Keep working hard [Name]!","Keep going [Name] — the hard work is paying off!"]
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
    "he/his": "Selected pronoun: HE/HIM/HIS/HIMSELF. Use in follow-on sentences where teacher uses pronouns.",
    "she/her": "Selected pronoun: SHE/HER/HERS/HERSELF. Use in follow-on sentences where teacher uses pronouns.",
    "they/their": "Selected pronoun: THEY/THEM/THEIR/THEMSELVES. Use in follow-on sentences where teacher uses pronouns.",
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

Improve the existing template using the additional reports:
- Add new sentence-position boxes if the reports reveal sentence positions not yet captured
- Add new topic headings within existing boxes where new topics appear
- Add variety options to existing headings using the teacher's actual language from the new reports
- Ensure near-identical paragraphs (name/pronoun variation only) are standard-comments
- Ensure each next-steps section covers different topics — options within a box are same topic different phrasing
- Mirror the teacher's name/pronoun pattern across sentence positions
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

Work through these reports SENTENCE BY SENTENCE:

STEP 1 — MAP THE SENTENCE POSITIONS:
Read several reports and identify how many sentences appear in each section and what each sentence does.
Note whether each sentence uses the student's name or a pronoun.
Note how each sentence varies between students.

STEP 2 — BUILD ONE BOX PER SENTENCE POSITION:

For sentences that vary by PERFORMANCE LEVEL → rated-comment with excellent/good/satisfactory/needsImprovement levels, 4 options each.

For sentences describing CHARACTER TRAITS or QUALITIES → qualities section.
- One qualities section per sentence position
- Headings are the different TOPICS available for that position
- All comments use [Name] OR all use "${pronounCapital}" — mirror what the teacher uses at that position
- 2-3 options per heading

For sentences that are NEAR-IDENTICAL across all reports (only name/pronoun differs) → standard-comment with [Name].

For sentences mentioning ASSESSMENT SCORES:
- If the teacher writes the same sentence for everyone with only the score changing → standard-comment with [Score]
- If the teacher writes meaningfully different sentences based on performance → assessment-comment

For NEXT STEPS sentences → next-steps section.
- One next-steps section per sentence position in the next steps paragraph
- Each focus area covers a DIFFERENT topic
- Options within a focus area are different phrasings of the SAME topic
- Mirror the teacher's name/pronoun pattern across sections
- Preserve any opening phrase the teacher always uses (e.g. "Moving forward,")
- 3-4 options per focus area

STEP 3 — USE THE TEACHER'S ACTUAL LANGUAGE:
Group similar sentences from the reports into the same heading/focus area.
Add 1-2 variety options in the same voice for headings with fewer than 3 options.
Do not paraphrase — keep the teacher's exact words where possible.

STEP 4 — ASSEMBLE:
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