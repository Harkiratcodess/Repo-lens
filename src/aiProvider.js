const https = require('https');

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Sends a folder's files to Gemini and gets back a summary.
 * Uses the free Gemini 1.5 Flash model (1M tokens/day, no card needed).
 */
async function askGemini(apiKey, folderPath, files) {
  // Build a prompt with all files in this folder
  const fileList = files.map(f =>
    `### ${f.name} (${f.sizeKB} KB)\n\`\`\`\n${f.content}\n\`\`\``
  ).join('\n\n');

  const prompt = `You are analyzing source code for a developer who wants to understand this codebase quickly.

Folder: "${folderPath}"

Here are the files in this folder:

${fileList}

For each file, write ONE clear sentence explaining:
- What this file does
- What key things it holds (functions, components, routes, config, etc.)

Output format (strictly follow this, one line per file):
FILE: filename.ext | PURPOSE: one sentence description

Be specific. Mention actual function names, component names, or config keys if visible. No fluff.`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,     // low temp = consistent, factual output
      maxOutputTokens: 1024,
    },
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`${GEMINI_URL}?key=${apiKey}`);

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            // Handle API errors
            if (json.error) {
              reject(new Error(`Gemini API error: ${json.error.message}`));
              return;
            }

            const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            resolve(text);
          } catch (e) {
            reject(new Error('Failed to parse Gemini response'));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Small delay helper to respect Gemini free tier rate limits
 * Free tier: 15 requests per minute — so we wait ~4s between calls to be safe
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { askGemini, sleep };