const https = require('https');

async function askGemini(apiKey, folderPath, files) {
  const fileList = files.map(f =>
  `### ${f.name}\n\`\`\`\n${f.content.slice(0, 800)}\n\`\`\``
).join('\n\n');

  const prompt = `Analyze these source code files in folder "${folderPath}". 

For EACH file, respond with EXACTLY this format on a new line:
FILE: filename.ext | PURPOSE: one sentence description

Rules:
- One line per file
- Never skip a file
- No extra text, no headers, no numbering
- Just the FILE: ... | PURPOSE: ... lines

Files to analyze:
${fileList}`;
  const body = JSON.stringify({
   model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.2,
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
   res.on('end', () => {
  try {
    const json = JSON.parse(data);
    if (json.error) { 
      console.error('[RepoLens API Error]', JSON.stringify(json.error));
      
      // Extract wait time from error message if rate limited
      const waitMatch = json.error.message?.match(/try again in (\d+\.?\d*)s/);
      const waitSeconds = waitMatch ? parseFloat(waitMatch[1]) + 1 : 10;
      
      const err = new Error(json.error.message);
      err.waitSeconds = waitSeconds;
      reject(err); 
      return; 
    }
    resolve(json.choices?.[0]?.message?.content || '');
  } catch (e) { 
    console.error('[RepoLens Parse Error]', data);
    reject(new Error('Failed to parse response')); 
  }
});
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { askGemini, sleep };