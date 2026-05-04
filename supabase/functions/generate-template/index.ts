// supabase/functions/generate-template/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRUCTURE_DETECTION_PROMPT = `You are an expert at analysing teacher-written school reports.
Detect the structure and format the teacher uses and return it as JSON.

Return ONLY this JSON, no markdown, no backticks:
{
  "detectedStructure": [
    {"position":1,"type":"rated-comment","description":"Brief description","example":"First few words..."}
  ],
  "formatNotes": "Any notable formatting observations"
}
Section types: rated-comment, standard-comment, qualities, assessment-comment, next-steps, new-line, optional-additional-comment`;

const GENERATION_PROMPT = `You are an expert at analysing teacher-written school reports and building report templates. Return ONLY valid JSON, no markdown, no backticks.

═══════════════════════════════════════════════════════
CORE PRINCIPLES
═══════════════════════════════════════════════════════
1. Read ALL reports before building anything. The pattern across all reports is the template — not one student's sentences.
2. Work sentence by sentence. Build ONE section per sentence position.
3. For each position ask: FIXED (same in every report) → standard-comment. VARIES BY TOPIC/TRAIT → qualities. VARIES BY PERFORMANCE LEVEL → qualities with performance headings.
4. standard-comment is RARE — only truly word-for-word identical text. Do not use it for text with meaningful variation.
5. qualities is the most versatile type. Headings can be traits, topics, pathway groups, performance descriptions — whatever reflects how the teacher groups their sentences.
6. Use the teacher's ACTUAL sentences. Group similar sentences from across all reports into the same heading. Add 1-2 variety options in the teacher's voice.
7. Mirror the teacher's name/pronoun pattern sentence by sentence.
8. Next steps: one section per sentence position. Focus areas = different topics. Options within a focus area = different phrasings of the same topic.
9. Keep [Name] where student name appears. Keep [Score] where a numeric score appears.
10. A good template has mostly qualities sections. standard-comment should be rare.

═══════════════════════════════════════════════════════
WORKED EXAMPLE 1 — HISTORY S1
═══════════════════════════════════════════════════════
Reports follow: opening sentence → 1-2 quality sentences → course content → assessment scores → next steps → closing.

KEY DECISIONS:
- Opening sentence blends character + progress. Varies by performance group but NOT a neat 4-level scale → qualities with performance-based headings ("Strong Progress", "Good Progress", "Some Progress", "Progress Limited by Attendance").
- Sentence 2 varies by working style/trait, uses [Name] → qualities, name-led.
- Sentence 3 varies by follow-on quality, uses pronoun → qualities, pronoun-led.
- Course content paragraph near-identical across all reports → standard-comment.
- Two assessment scores appear but NO numeric score given — teacher writes descriptive sentences → qualities, pronoun-led (NOT assessment-comment which requires [Score]).
- "Moving forward," opens EVERY next steps sentence → preserve this phrase in ALL options in next-steps section 1.
- Next steps has 3 sentence positions: [Name], pronoun, [Name].
- Closing sentence varies slightly → qualities.

{"templateName":"History S1 Report","sections":[
{"id":"s1","type":"qualities","name":"Opening Statement","data":{"comments":{
  "Strong Progress":["[Name] is a hardworking and enthusiastic pupil who has made strong progress in History this year.","[Name] is a conscientious pupil with a clear passion for History who has made strong progress in History this year."],
  "Good Progress":["[Name] is a well-mannered and enthusiastic pupil who has made good progress in History this year.","[Name] is a well-mannered pupil with a clear passion for History who has made good progress in History this year."],
  "Some Progress":["[Name] is a well-mannered and inquisitive pupil who has made some progress in History this year.","[Name] has made some progress in History this year."],
  "Progress Limited by Attendance":["[Name] is a well-mannered pupil who has made some progress in History this year, although this has been limited by his sporadic attendance in class.","[Name] has made some progress in History this year, although attendance has limited progress at times."]
}}},
{"id":"s2","type":"new-line","name":"","data":{}},
{"id":"s3","type":"qualities","name":"Personal Qualities","data":{"comments":{
  "Works Well in a Team":["[Name] has demonstrated that he can work well as part of a team in History and enjoys opportunities to work with his peers.","[Name] enjoys working as part of a team and thrives in activities that require him to use his imagination and creativity."],
  "Hardworking and Dedicated":["[Name] works hard in class to complete all activities and assessments to the best possible standard.","[Name] consistently completes both classwork and assessments to a high standard."],
  "Passion for History":["[Name] has a clear passion for History and excellent background knowledge on the topics covered.","[Name] enjoys contributing to discussions and debates and has a clear passion for learning about History."],
  "Capable When Focused":["[Name] is capable of producing work of a good standard when he is fully focused.","[Name] enjoys taking part in group activities and when motivated can complete work to a good standard."]
}}},
{"id":"s4","type":"qualities","name":"Personal Qualities - Follow On","data":{"comments":{
  "Makes Valuable Contributions":["He regularly makes valuable contributions to classroom discussions and debates.","He enjoys taking part in discussions and debates about History and has shown that he can work as part of a team."],
  "High Standards":["Her behaviour and effort in class are excellent.","He works well both individually and as part of a team and consistently completes work to a high standard."],
  "Confidence Growing":["His confidence in History has improved over the course of this session.","She is growing in confidence and is becoming more involved in lessons."]
}}},
{"id":"s5","type":"new-line","name":"","data":{}},
{"id":"s6","type":"standard-comment","name":"Course Content","data":{"content":"[Name] has learned about a range of historical topics this year, including the Romans, the Black Death and Mary Queen of Scots. [Name] produced a poster detailing the impact the Romans had on Britain and created a pamphlet outlining the medieval causes of the Black Death. [Name] also completed a research task on Mary Queen of Scots' life and made a comic strip outlining key events in Mary's early life."}},
{"id":"s7","type":"standard-comment","name":"MQS Assessment","data":{"content":"[Name] scored [Score] in the Mary Queen of Scots end of unit assessment"}},
{"id":"s8","type":"standard-comment","name":"Black Death Assessment","data":{"content":"and [Score] in the end of unit test on the Black Death."}},
{"id":"s9","type":"qualities","name":"Assessment Reflection","data":{"comments":{
  "Strong in Both":["He performed well in both assessments, demonstrating good understanding of the topics covered."],
  "Strong MQS Weaker Black Death":["He performed well in the Mary Queen of Scots assessment but has areas to develop in the Black Death unit."],
  "Weaker MQS Strong Black Death":["He performed well in the Black Death assessment but has areas to develop from the Mary Queen of Scots unit."],
  "Areas to Develop in Both":["Both assessments suggest there are areas to develop across the topics covered this year."]
}}},
{"id":"s10","type":"new-line","name":"","data":{}},
{"id":"s11","type":"next-steps","name":"Moving Forward","data":{"focusAreas":{
  "Build Detail in Responses":["Moving forward, [Name] must build upon the progress made by producing more detailed descriptions and explanations in written and verbal responses.","Moving forward, [Name] must aim to add more detailed descriptions and explanations to written responses."],
  "Focus and Standards":["Moving forward, [Name] must ensure full focus on completing all classroom activities and assessments to the best possible standard.","Moving forward, [Name] should continue to work hard on all activities and assessments to complete them to the best possible standard."],
  "Classroom Participation":["Moving forward, [Name] should continue to contribute to classroom discussions and debates to further develop confidence and understanding.","Moving forward, [Name] should aim to contribute more regularly to classroom discussions and debates."]
}}},
{"id":"s12","type":"next-steps","name":"Moving Forward - Sentence 2","data":{"focusAreas":{
  "Maintain High Standards":["She must continue to work hard in class to complete all classroom activities and assessments to the high standards she is capable of.","He should continue to work hard to complete all activities and assessments to the best possible standard."],
  "Overcome Distractions":["He can be easily distracted by his peers in class — he must ensure he is fully focused on completing all activities to the high standards he is capable of.","She can sometimes be distracted in class by her phone or peers — she must ensure she is fully focused."],
  "Address Missed Content":["He must ensure that he asks for support with areas of the curriculum he finds challenging or has missed through absence.","She must make use of the support available to address any gaps in understanding."]
}}},
{"id":"s13","type":"next-steps","name":"Moving Forward - Sentence 3","data":{"focusAreas":{
  "Continue Participating":["[Name] should continue to contribute to classroom discussions and debates as this will further develop confidence and understanding.","[Name] should continue to participate in classroom discussions and debates."],
  "Increase Participation":["[Name] should aim to contribute more regularly to classroom discussions and debates.","[Name] would benefit from making more regular contributions to classroom discussions and debates."],
  "Seek Support":["[Name] should continue to ask for support and guidance if finding any elements of the course challenging.","[Name] must ensure that he asks for support with areas of the curriculum he finds challenging or has missed through absence."]
}}},
{"id":"s14","type":"new-line","name":"","data":{}},
{"id":"s15","type":"qualities","name":"Closing Comment","data":{"comments":{
  "Keep Up the Good Work":["Keep up the good work [Name]!","Keep it up [Name] — you are doing brilliantly!"],
  "Keep Working Hard":["Keep working hard [Name]!","Keep going [Name] — the hard work is paying off!"]
}}},
{"id":"s16","type":"new-line","name":"","data":{}},
{"id":"s17","type":"optional-additional-comment","name":"Additional Comments","data":{}}
]}

═══════════════════════════════════════════════════════
WORKED EXAMPLE 2 — MATHS S3 LEVEL 4
═══════════════════════════════════════════════════════
Reports follow: opening sentence → pathway paragraph → Strengths (2-3 sentences) → Areas for Development (1-2 sentences) → feedback grid sentence → Next Steps paragraph.

KEY DECISIONS:
- Opening varies by pathway group — distinct fixed options, not a performance scale → qualities with pathway-based headings.
- Pathway paragraph varies to match the opening group → qualities (teacher picks matching option).
- Strengths sentence 1: character description, [Name]-led → qualities, name-led.
- Strengths sentence 2: specific quality, pronoun-led → qualities, pronoun-led.
- Development sentence 1: mostly fixed but with meaningful variants → qualities, name-led (NOT standard-comment — there is real variation across reports).
- Development sentence 2: specific development topic, pronoun-led → qualities, pronoun-led.
- Assessment performance: comes AFTER Areas for Development. No numeric score given → qualities, name-led.
- Feedback grid: truly word-for-word identical → standard-comment.
- Next Steps paragraph: truly word-for-word identical → standard-comment.
- No closing sentence in these reports.

{"templateName":"Maths S3 Report","sections":[
{"id":"s1","type":"qualities","name":"Opening Statement","data":{"comments":{
  "Making Good Progress":["[Name] is currently working through a Level 4 course in Mathematics and making good progress."],
  "Finding Elements Difficult":["[Name] is currently working through a Level 4 course in Mathematics and finding elements of the course difficult, despite their best efforts."],
  "Finding Course Difficult — Effort":["[Name] is currently working through a Level 4 course in Mathematics and finding elements of the course difficult. They would find progress much smoother if they utilised their time more effectively, both in and outside the classroom."],
  "Finding Course Difficult — Attendance":["[Name] is currently working through a Level 4 course in Mathematics and finding elements of the course difficult due to attendance."]
}}},
{"id":"s2","type":"qualities","name":"Pathway Information","data":{"comments":{
  "National 5 Pathway":["Pupils working at this level often go on to achieve National 5 Mathematics in S4. Any pupil who does progress to the National 5 course in S4 may follow N5 Maths, N5 Applications of Maths or both. Pupils sat an exam in November that gives an early indication of which route could be best to take."],
  "National 4 More Likely":["Pupils working at this level often find National 5 in S4 a challenge and go on to achieve National 4 Maths in S4 instead. Any pupil who does progress to the National 5 course in S4 may follow N5 Maths, N5 Applications of Maths or both. Pupils sat an exam in November that gives an early indication of which route could be best to take."],
  "Upturn in Effort Needed":["Unless there is an upturn in effort, pupils working at this level often find National 5 in S4 a challenge and go on to achieve National 4 Maths in S4 instead. Any pupil who does progress to the National 5 course in S4 may follow N5 Maths, N5 Applications of Maths or both. Pupils sat an exam in November that gives an early indication of which route could be best to take."]
}}},
{"id":"s3","type":"new-line","name":"","data":{}},
{"id":"s4","type":"qualities","name":"Strengths — Character","data":{"comments":{
  "Polite and Hardworking":["[Name] is polite and hardworking.","[Name] is polite and hardworking and wants to do well."],
  "Enthusiastic and Hardworking":["[Name] is enthusiastic and hardworking and is a pleasure to have in the class.","[Name] is polite, enthusiastic and hardworking."],
  "Pleasant and Hardworking":["[Name] is pleasant and hardworking and wants to do well.","[Name] is pleasant and hardworking and shows a willingness to improve."],
  "Picks Up Concepts Quickly":["[Name] picks up new concepts quickly and adapts well to new challenges.","[Name] picks up new concepts quickly and demonstrates strong problem-solving skills."],
  "Quiet but Determined":["[Name] is quiet, polite, and hardworking. They make a steady effort in class and show determination to succeed, even when tasks are challenging."]
}}},
{"id":"s5","type":"qualities","name":"Strengths — Specific Quality","data":{"comments":{
  "Contributes Well":["They contribute positively to class discussions and share ideas confidently.","They are good at sharing answers and ideas aloud when exploring new topics."],
  "Works Well When Focused":["They work well when feeling confident and contribute positively to group discussions.","They work well when focused and are capable of picking up new concepts with practice."],
  "Growing in Confidence":["They have started asking for help more often and contribute well in small group discussions. Confidence has improved this year.","They are getting better at volunteering answers and ideas in class, which is helping their progress."],
  "Strong Work Habits":["They have been a regular attendee to supported study after school and at lunchtimes. Their determination to improve is evident.","They present their work very neatly and aim to be thorough in everything they attempt."],
  "Making Good Effort Despite Difficulties":["They are quiet but have been making more progress in class this year and making some good efforts with homework and revision."]
}}},
{"id":"s6","type":"new-line","name":"","data":{}},
{"id":"s7","type":"qualities","name":"Areas for Development — Core","data":{"comments":{
  "Build Retention and Ask for Help":["[Name] needs to build up retention of the skills they learn in class and should keep asking for help when required.","[Name] needs to build up retention of the skills they learn in class and should be asking for help when required."],
  "Build Retention and Revisit Topics":["[Name] needs to build up retention of the skills they learn in class and revisit topics regularly to consolidate understanding.","[Name] needs to build up retention of the skills they learn in class and keep revisiting topics to consolidate understanding."],
  "Check Work and Avoid Rushing":["[Name] needs to take care when checking work and avoid rushing to finish tasks. Slowing down and reviewing answers will help improve accuracy."],
  "Attendance and Gaps":["[Name] needs to ensure consistent attendance, as gaps will widen when lessons are missed. They should also build up retention of skills and keep asking for help when required."],
  "Effort and Engagement":["[Name] could often make a lot more effort in class. They need to try to take in new material and practise regularly so that skills can embed."],
  "Volunteer More":["[Name] should continue to challenge themselves and aim to volunteer answers and ideas aloud more often in class to build confidence further."]
}}},
{"id":"s8","type":"qualities","name":"Areas for Development — Additional","data":{"comments":{
  "Use Revision Resources":["Regular practice and engagement with revision materials will help strengthen understanding and improve confidence.","Continued practice and engagement with revision resources will help consolidate learning."],
  "Focus and Concentration":["They should also focus on maintaining concentration throughout tasks.","Continued focus and regular practice will help consolidate learning."],
  "Attendance":["Attendance has been a challenge, and improving this will help fill gaps in learning and build confidence.","Increasing attendance and engaging with revision resources will help address these gaps."],
  "Confidence and Mindset":["They would benefit from not avoiding tasks for fear of mistakes, as errors are part of learning."]
}}},
{"id":"s9","type":"new-line","name":"","data":{}},
{"id":"s10","type":"qualities","name":"Assessment Performance","data":{"comments":{
  "Performed Very Well":["[Name] performed very well with the recent S3 exam, reflecting the hard work and progress being made.","[Name] performed very well in their recent S3 exam, showing the effort and progress being made."],
  "Performed Well":["[Name] performed well with many aspects of their recent S3 exam, indicating the hard work and progress being made.","[Name] performed well with many aspects of the recent S3 exam, reflecting the hard work and progress being made."],
  "Found It Challenging but Showed Progress":["[Name] found the S3 exam a challenge but performed well with many aspects, which shows the effort and progress being made.","[Name] found the recent S3 exam a challenge but performed well with several aspects, indicating the hard work and progress being made."],
  "Found It a Big Challenge":["[Name] found the recent S3 exam a big challenge but is more capable than the result shows.","[Name] found the recent S3 exam a big challenge but is more capable than the result shows and did not make enough use of revision material available to prepare."],
  "Missed Assessment":["[Name] unfortunately missed the S3 exam due to absence."]
}}},
{"id":"s11","type":"new-line","name":"","data":{}},
{"id":"s12","type":"standard-comment","name":"Feedback Grid","data":{"content":"Each pupil has completed a feedback grid, which breaks down the content of the recent S3 exam. Please discuss this, if you haven't done so already, and support them in working towards their identified targets."}},
{"id":"s13","type":"new-line","name":"","data":{}},
{"id":"s14","type":"standard-comment","name":"Next Steps","data":{"content":"We will continue to tackle identified areas of difficulty in class and through homework tasks. In order to support pupils in making appropriate progress, extensive revision resources have also been made available on GLOW. It is vital that pupils complete regular self-revision and seek support with areas of difficulty. The Maths department runs supported study every Tuesday and Thursday, after school."}},
{"id":"s15","type":"new-line","name":"","data":{}},
{"id":"s16","type":"optional-additional-comment","name":"Additional Comments","data":{}}
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
        return new Response(JSON.stringify(JSON.parse(cleaned)), {
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
    "he/his": "Selected pronoun: HE/HIM/HIS/HIMSELF.",
    "she/her": "Selected pronoun: SHE/HER/HERS/HERSELF.",
    "they/their": "Selected pronoun: THEY/THEM/THEIR/THEMSELVES.",
  };

  const pronounNote = pronounInstructions[pronounSet] || pronounInstructions["they/their"];
  const pronounCapital = pronounSet.split('/')[0].charAt(0).toUpperCase() + pronounSet.split('/')[0].slice(1);

  const structureNote = useDetectedStructure && detectedStructure
    ? `\nFOLLOW THIS DETECTED STRUCTURE:\n${detectedStructure.map((s: any, i: number) => `${i + 1}. ${s.type} — ${s.description}`).join('\n')}\n`
    : "";

  const placeholderNote = hasPlaceholders
    ? `\nReport text contains placeholders:
- {{STANDARD:Name}} → standard-comment marker, name "STANDARD:Name"
- {{CHOICE:Name}} → standard-comment marker, name "CHOICE:Name"
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

Read ALL additional reports. Then improve the template:
- Add new heading options to existing sections where new sentences appear
- Add new sections if reports reveal positions not yet captured
- Use teacher's actual sentences — group similar ones into headings
- Check any standard-comments for real variation — convert to qualities if needed
- Maintain teacher's name/pronoun pattern
- Keep [Name] and [Score] placeholders
- Maintain same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || "Not specified"}
${pronounNote}
${additionalContext ? `Context: ${additionalContext}` : ""}
${placeholderNote}
${structureNote}

REPORTS:
${reportText}

Study the two worked examples carefully — they show the quality and approach expected.

Analyse these reports using the same methodology:

STEP 1 — Read ALL reports. Get a feel for the overall shape.

STEP 2 — Identify the skeleton: what sections appear in every report and in what order?

STEP 3 — Go through each sentence position. For each ask:
- Truly identical across all reports? → standard-comment
- Varies by trait, topic, pathway, or performance description? → qualities
- Generate 3-4 options per heading by grouping similar sentences from across the reports, then adding 1-2 variety options in the teacher's voice

STEP 4 — Check name/pronoun at each position. All options in one section use [Name] OR all use ${pronounCapital}.

STEP 5 — Assemble in the order sections appear in the reports. Add new-line between major sections. End with optional-additional-comment.

Use the teacher's actual language. The teacher should recognise their own voice.`;
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