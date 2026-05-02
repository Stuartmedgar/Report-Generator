// netlify/functions/generate-template.js

const https = require('https');

const SYSTEM_PROMPT = `You are an expert at analysing teacher-written school reports and converting them into structured report templates. Return ONLY valid JSON, no markdown, no backticks.

YOUR PRIMARY TASK is to read ALL the reports carefully and identify which PATTERN each type of statement follows. There are four distinct patterns:

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
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 3 comments using [Name].

═══════════════════════════════════════════════════════
PATTERN 3 — RATED COMMENT (same topic, different language)
═══════════════════════════════════════════════════════
Different sentences across reports all describing the SAME aspect of performance (effort, attainment, participation, behaviour, focus) but using genuinely different language reflecting different performance levels.
e.g. "consistently produces work of an exceptional standard" vs "works well and produces good quality work" vs "would benefit from taking more care with the quality of their work"
→ Use section type: "rated-comment"
→ Write comments at each level that reflect the range of language used across all reports.
→ data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is an array of 3 comments using [Name].
KEY TEST: Does this statement describe how well the student does something? If yes → rated-comment.

═══════════════════════════════════════════════════════
PATTERN 4 — QUALITIES
═══════════════════════════════════════════════════════
Statements about personal CHARACTER TRAITS, SOFT SKILLS or ATTITUDES that describe what kind of person/learner the student is rather than how well they perform academically. These often cluster together in the same part of each report.
Examples: leadership, teamwork, confidence, social skills, resilience, attitude to learning, relationships with peers.
→ Use section type: "qualities"
→ Group by theme into headings (e.g. "Character", "Social Skills", "Work Ethic", "Leadership")
→ Under each heading provide 2-3 comments MAXIMUM — one clearly positive, one developmental (needs to work on it). Do NOT create a full rating scale.
→ data.comments is an object where each key is a heading and value is an array of 2-3 comments using [Name].
KEY TEST: Is this about who the student IS rather than how well they PERFORM? If yes → qualities. Does the statement appear alongside other character/trait descriptions in the same position in each report? If yes → qualities.

CRITICAL DISTINCTIONS:
- "is making excellent progress" → RATED COMMENT (performance)
- "is a positive and enthusiastic member of the class" → QUALITIES (character trait)
- "puts a lot of effort into individual work" → could be RATED COMMENT if it varies, or QUALITIES if it's a consistent character description
- "Pupils are encouraged to attend supported study on Tuesdays" → STANDARD COMMENT (identical for all)
- "achieved [Score] in the assessment" → ASSESSMENT COMMENT

═══════════════════════════════════════════════════════
OTHER SECTION TYPES
═══════════════════════════════════════════════════════
- "assessment-comment": ALWAYS use when reports mention test scores, percentages or assessment results. Create a SEPARATE assessment-comment section for each distinct assessment mentioned. Every comment MUST include [Score] — never use actual numbers. data.comments has keys: excellent, good, satisfactory, needsImprovement, notCompleted. Also needs scoreType ("percentage" or "outOf").

- "personalised-comment": use when different students are described doing different activities, topics or instruments. data.instruction is a string. data.categories is object where each key is a category name and value is array of 3 comments using [Name].

- "next-steps": forward-looking improvement suggestions. data.focusAreas is object where each key is a focus area name and value is array of 3 suggestions using [Name].

- "new-line": formatting only. data is {}. Add one between each main section.

- "optional-additional-comment": always include exactly one at the very end. data is {}.

═══════════════════════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════════════════════
- Use [Name] for student name throughout all comments
- Use [Score] in EVERY assessment comment — never actual numbers
- Preserve the teacher's actual voice and sentence structures
- Add new-line sections between each main section
- End with optional-additional-comment
- Return ONLY valid JSON, nothing else

RETURN FORMAT:
{"templateName":"string","sections":[
  {"id":"s1","type":"standard-comment","name":"Section Name","data":{"content":"Fixed text using [Name] if needed."}},
  {"id":"s2","type":"new-line","name":"","data":{}},
  {"id":"s3","type":"rated-comment","name":"Section Name","data":{"comments":{"excellent":["c1 [Name]","c2","c3"],"good":["c1","c2","c3"],"satisfactory":["c1","c2","c3"],"needsImprovement":["c1","c2","c3"]}}},
  {"id":"s4","type":"new-line","name":"","data":{}},
  {"id":"s5","type":"assessment-comment","name":"Assessment Name","data":{"scoreType":"percentage","comments":{"excellent":["[Name] achieved [Score]...","c2","c3"],"good":["c1 [Score]","c2","c3"],"satisfactory":["c1 [Score]","c2","c3"],"needsImprovement":["c1 [Score]","c2","c3"],"notCompleted":["c1","c2","c3"]}}},
  {"id":"s6","type":"new-line","name":"","data":{}},
  {"id":"s7","type":"qualities","name":"Personal Qualities","data":{"comments":{"Character":["[Name] is a positive and enthusiastic member of the class.","[Name] is working on developing a more positive attitude towards learning."],"Social Skills":["[Name] works well with others and contributes positively to group activities.","[Name] is developing their collaborative skills and is encouraged to engage more with peers."]}}},
  {"id":"s8","type":"new-line","name":"","data":{}},
  {"id":"s9","type":"next-steps","name":"Next Steps","data":{"focusAreas":{"Area One":["suggestion [Name]","s2","s3"],"Area Two":["suggestion [Name]","s2","s3"]}}},
  {"id":"s10","type":"new-line","name":"","data":{}},
  {"id":"s11","type":"optional-additional-comment","name":"Additional Comments","data":{}}
]}`;

function callAnthropicAPI(apiKey, userPrompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ ok: true, body: data });
        } else {
          resolve({ ok: false, status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.write(requestBody);
    req.end();
  });
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let subject, yearGroup, reportText, additionalContext, existingTemplate, isRefinement;
  try {
    const body = JSON.parse(event.body);
    subject = body.subject;
    yearGroup = body.yearGroup;
    reportText = body.reportText;
    additionalContext = body.additionalContext;
    existingTemplate = body.existingTemplate;
    isRefinement = body.isRefinement || false;
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!reportText || !subject) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'reportText and subject are required' }) };
  }

  const trimmedReports = reportText.substring(0, 6000);

  let userPrompt;

  if (isRefinement && existingTemplate) {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || 'Not specified'}
${additionalContext ? `Context: ${additionalContext}` : ''}

Here is the EXISTING template that was previously generated:
${JSON.stringify(existingTemplate, null, 2)}

Here are ADDITIONAL reports to use to improve and enrich the template:
${trimmedReports}

Using both the existing template AND these additional reports, generate an IMPROVED version. 
- Carefully check each existing section is using the correct pattern (standard-comment vs rated-comment vs qualities vs assessment-comment)
- Fix any sections that are using the wrong type based on the pattern decision rules
- Add more variety and natural language to comments where the new reports suggest improvements
- Add any new themes, focus areas or qualities suggested by the additional reports
- Keep [Name] and [Score] placeholders throughout
- Maintain the same template name`;
  } else {
    userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || 'Not specified'}
${additionalContext ? `Context: ${additionalContext}` : ''}

Here are the reports to analyse:
${trimmedReports}

Read ALL the reports carefully. For each type of statement you find, apply the pattern decision rules from your instructions to determine the correct section type. Pay particular attention to:
1. Text that is IDENTICAL across all reports → standard-comment
2. Sentences where only a rating word changes → rated-comment preserving the sentence structure  
3. Different sentences about the same performance topic → rated-comment
4. Character/trait descriptions clustered together → qualities with 2-3 comments per heading
5. Assessment scores or percentages → assessment-comment with [Score] placeholder

Generate a complete template JSON with new-line sections between each main section and optional-additional-comment at the end.`;
  }

  try {
    console.log(isRefinement ? 'Refining existing template...' : 'Generating new template...');
    const result = await callAnthropicAPI(process.env.ANTHROPIC_API_KEY, userPrompt);
    console.log('Anthropic API responded:', result.ok, result.status);

    if (!result.ok) {
      console.error('Anthropic API error:', result.status, result.body);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'Failed to contact AI service', details: result.body }),
      };
    }

    const data = JSON.parse(result.body);
    const rawText = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.templateName || !parsed.sections || !Array.isArray(parsed.sections)) {
      throw new Error('Generated template has invalid structure');
    }

    console.log('Template processed successfully:', parsed.templateName);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed),
    };

  } catch (err) {
    console.error('Error generating template:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to generate template' }),
    };
  }
};