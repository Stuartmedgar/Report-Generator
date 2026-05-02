// netlify/functions/generate-template.js

const https = require('https');

const SECTION_TYPE_GUIDE = `
You are an expert at analysing teacher-written school reports and converting them into structured report templates.

You must return ONLY valid JSON, no explanation, no markdown, no backticks.

SECTION TYPES AVAILABLE:
1. "rated-comment" - For anything that varies by attainment/performance level. Use when reports describe students differently based on how well they are doing. Requires comments at 4 levels: excellent, good, satisfactory, needsImprovement. Each level needs at least 4 varied comments using [Name] as placeholder.

2. "standard-comment" - Fixed text that applies to ALL students with minor name substitution. Use for subject introductions, class context, standard phrases. Uses [Name] placeholder. Single string content field.

3. "assessment-comment" - Like rated-comment but tied to a formal score or grade. Use when reports reference test results, unit assessments, exam performance. Has 5 levels: excellent, good, satisfactory, needsImprovement, notCompleted. Also needs scoreType ("percentage" or "outOf") and if outOf, a maxScore number.

4. "personalised-comment" - For when students differ by category (not rating). E.g. position played in PE, instrument in Music, topic chosen, activity selected. Teacher picks which category applies to each student. Needs an instruction string and categories object where each key is a category name and value is array of comments.

5. "next-steps" - Forward-looking improvement suggestions. Use for "to improve..." or "next steps..." language. Organised by focusArea - each focus area has an array of specific suggestions using [Name].

6. "qualities" - Personal character traits, attitudes, soft skills. Use for language about effort, attitude, behaviour, teamwork, leadership, resilience. Organised by headings (e.g. "Work Ethic", "Character", "Social Skills") with arrays of comments under each.

7. "optional-additional-comment" - Always include exactly ONE of these at the end. It's a free text box for the teacher to add personalised notes. No data needed beyond type and name.

8. "new-line" - Formatting only, adds a line break. Use sparingly between major sections.

RULES:
- Use [Name] as placeholder for student first name throughout all comments
- Generate at least 4-6 varied comments per level/category/heading so teachers have genuine choice
- Comments should sound natural, warm, and professional - matching the voice of the sample reports
- For Scottish secondary schools, language should be appropriate for the year group specified
- Choose section types that best fit the CONTENT, not just copy structure
- Always end with an optional-additional-comment section
- The template name should reflect subject and year group

RETURN FORMAT (strict JSON, no other text):
{
  "templateName": "string",
  "sections": [
    {
      "id": "section_1",
      "type": "rated-comment",
      "name": "Section Name",
      "data": {
        "comments": {
          "excellent": ["comment1 with [Name]", "comment2 with [Name]", "comment3 with [Name]", "comment4 with [Name]"],
          "good": ["comment1", "comment2", "comment3", "comment4"],
          "satisfactory": ["comment1", "comment2", "comment3", "comment4"],
          "needsImprovement": ["comment1", "comment2", "comment3", "comment4"]
        }
      }
    },
    {
      "id": "section_2",
      "type": "standard-comment",
      "name": "Section Name",
      "data": {
        "content": "Fixed comment text with [Name] placeholder."
      }
    },
    {
      "id": "section_3",
      "type": "next-steps",
      "name": "Next Steps",
      "data": {
        "focusAreas": {
          "Focus Area One": ["suggestion1 with [Name]", "suggestion2", "suggestion3", "suggestion4"],
          "Focus Area Two": ["suggestion1 with [Name]", "suggestion2", "suggestion3", "suggestion4"]
        }
      }
    },
    {
      "id": "section_4",
      "type": "qualities",
      "name": "Personal Qualities",
      "data": {
        "comments": {
          "Work Ethic": ["comment1 with [Name]", "comment2", "comment3", "comment4"],
          "Character": ["comment1 with [Name]", "comment2", "comment3", "comment4"]
        }
      }
    },
    {
      "id": "section_5",
      "type": "optional-additional-comment",
      "name": "Additional Comments",
      "data": {}
    }
  ]
}
`;

function callAnthropicAPI(apiKey, userPrompt) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SECTION_TYPE_GUIDE,
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
    req.write(requestBody);
    req.end();
  });
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error - API key not set' }),
    };
  }

  let subject, yearGroup, reportText, additionalContext;

  try {
    const body = JSON.parse(event.body);
    subject = body.subject;
    yearGroup = body.yearGroup;
    reportText = body.reportText;
    additionalContext = body.additionalContext;
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  if (!reportText || !subject) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'reportText and subject are required' }),
    };
  }

  const userPrompt = `Subject: ${subject}
Year Group: ${yearGroup || 'Not specified'}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Here are sample reports to analyse:

${reportText}

Analyse these reports and generate a complete template following the rules and format in your instructions. Make the template name reflect the subject and year group.`;

  try {
    const result = await callAnthropicAPI(process.env.ANTHROPIC_API_KEY, userPrompt);

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