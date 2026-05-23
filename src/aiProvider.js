const https = require('https');

async function askGemini(apiKey, folderPath, files) {
  const fileList = files.map(f =>
    `### ${f.name}\n\`\`\`\n${f.content}\n\`\`\``
  ).join('\n\n');

  const prompt = `Analyze these files in folder "${folderPath}". For each file write one sentence about what it does.
Output format strictly:
FILE: filename.ext | PURPOSE: one sentence

${fileList}`;

  const body = JSON.stringify({
    model: 'llama-3.1-8b-instant',
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
          if (json.error) { reject(new Error(json.error.message)); return; }
          resolve(json.choices?.[0]?.message?.content || '');
        } catch (e) { reject(new Error('Failed to parse response')); }
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