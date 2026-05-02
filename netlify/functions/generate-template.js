// netlify/functions/generate-template.js

const https = require('https');

const SYSTEM_PROMPT = `You are an expert at converting teacher reports into structured templates. Return ONLY valid JSON, no markdown, no backticks.

SECTION TYPES:
- "rated-comment": varies by attainment level. data.comments has keys: excellent, good, satisfactory, needsImprovement. Each is array of 3 comments using [Name].
- "standard-comment": only use for genuinely fixed text like class context or study support info. Do NOT use for assessment results - use assessment-comment instead. data.content is a string using [Name].
- "assessment-comment": ALWAYS use this when reports mention test scores, assessment results or percentages. data.comments has keys: excellent, good, satisfactory, needsImprovement, notCompleted. Each is array of 3 comments using [Name]. Also needs scoreType ("percentage" or "outOf") and if outOf a maxScore number.
- "next-steps": improvement suggestions. data.focusAreas is object, each key is area name, value is array of 3 suggestions using [Name].
- "qualities": personal traits. data.comments is object, each key is heading, value is array of 3 comments using [Name].
- "new-line": adds a line break for formatting. data is {}. Add one between each main section.
- "optional-additional-comment": always include one at end. data is {}.

RULES:
- Use [Name] for student name throughout
- Match the teacher's voice and language from the sample reports
- ALWAYS use assessment-comment if assessment scores appear in the reports
- Add a new-line section between each main section for formatting
- End with optional-additional-comment

RETURN FORMAT (strict JSON only):
{"templateName":"string","sections":[{"id":"s1","type":"rated-comment","name":"Name","data":{"comments":{"excellent":["c1","c2","c3"],"good":["c1","c2","c3"],"satisfactory":["c1","c2","c3"],"needsImprovement":["c1","c2","c3"]}}},{"id":"s2","type":"new-line","name":"","data":{}},{"id":"s3","type":"assessment-comment","name":"Assessment","data":{"scoreType":"percentage","comments":{"excellent":["c1","c2","c3"],"good":["c1","c2","c3"],"satisfactory":["c1","c2","c3"],"needsImprovement":["c1","c2","c3"],"notCompleted":["c1","c2","c3"]}}},{"id":"s4","type":"new-line","name":"","data":{}},{"id":"s5","type":"optional-additional-comment","name":"Additional Comments","data":{}}]}`;

function callAnthropicAPI(apiKey, userPrompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
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

  let subject, yearGroup, reportText, additionalContext;
  try {
    const body = JSON.parse(event.body);
    subject = body.subject;
    yearGroup = body.yearGroup;
    reportText = body.reportText;
    additionalContext = body.additionalContext;
  } catch (err) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!reportText || !subject) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'reportText and subject are required' }) };
  }

  // Trim to 6000 characters to get a good sample while staying within timeout
  const trimmedReports = reportText.substring(0, 6000);

  const userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || 'Not specified'}
${additionalContext ? `Context: ${additionalContext}` : ''}

Sample reports:
${trimmedReports}

Generate a complete template JSON for this subject. Include sections that best fit the content, with new-line sections between each main section, plus optional-additional-comment at the end.`;

  try {
    console.log('Calling Anthropic API...');
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

    console.log('Template generated successfully:', parsed.templateName);
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