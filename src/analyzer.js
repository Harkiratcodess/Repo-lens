const { askGemini, sleep } = require('./aiProvider');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Cache file lives in the project root as .codemap-cache.json
// Stores: { folderHash -> aiSummary }
// This means we only re-analyze folders that actually changed — saves free API quota
let cacheFilePath = null;
let cache = {};

function loadCache(rootPath) {
  cacheFilePath = path.join(rootPath, '.codemap-cache.json');
  try {
    if (fs.existsSync(cacheFilePath)) {
      cache = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    }
  } catch {
    cache = {}; // corrupt cache — start fresh
  }
}

function saveCache() {
  if (!cacheFilePath) return;
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
  } catch {
    // non-critical — just skip saving cache
  }
}

/**
 * Creates a hash of a folder's file contents.
 * If files haven't changed, hash stays the same → skip AI call → use cache.
 */
function hashFolder(files) {
  const combined = files.map(f => f.relativePath + f.content).join('||');
  return crypto.createHash('md5').update(combined).digest('hex');
}

/**
 * Parses Gemini's output into a structured map:
 * { "filename.ext" -> "what this file does" }
 */
function parseAIResponse(responseText) {
  const result = {};
  const lines = responseText.split('\n');

  for (const line of lines) {
    // Try strict format first: FILE: name | PURPOSE: desc
    const strict = line.match(/FILE:\s*(.+?)\s*\|\s*PURPOSE:\s*(.+)/i);
    if (strict) {
      result[strict[1].trim()] = strict[2].trim();
      continue;
    }

    // Try loose format: **filename.ext** — description
    const loose = line.match(/\*\*(.+?\.\w+)\*\*\s*[—\-:]\s*(.+)/);
    if (loose) {
      result[loose[1].trim()] = loose[2].trim();
      continue;
    }

    // Try: `filename.ext` - description
    const backtick = line.match(/`(.+?\.\w+)`\s*[—\-:]\s*(.+)/);
    if (backtick) {
      result[backtick[1].trim()] = backtick[2].trim();
    }
  }
  return result;
}

/**
 * Main analysis function.
 * Iterates through each folder, checks cache, calls Gemini if needed.
 * onProgress(doneSoFar, total, currentFolderName) — used for progress bar
 */
async function analyzeWithAI(fileTree, apiKey, onProgress, rootPath) {
  loadCache(rootPath || process.cwd());

  const folders = Object.keys(fileTree);
  const results = {};
  let done = 0;

  // Process 4 folders per API call instead of 1
  const BATCH_SIZE = 2;

  for (let i = 0; i < folders.length; i += BATCH_SIZE) {
    const batch = folders.slice(i, i + BATCH_SIZE);
    done += batch.length;
    onProgress(done, folders.length, batch[0]);

    for (const folderPath of batch) {
      const files = fileTree[folderPath];
      const folderHash = hashFolder(files);

      if (cache[folderHash]) {
        results[folderPath] = cache[folderHash];
        continue;
      }

      try {
        const responseText = await askGemini(apiKey, folderPath, files);
        const parsed = parseAIResponse(responseText);
        results[folderPath] = parsed;
        cache[folderHash] = parsed; // ✅ only caches on success
      } catch (err) {
  console.error(`[CodeMap] Failed: "${folderPath}":`, err.message);
  results[folderPath] = {};
  for (const f of files) {
    results[folderPath][f.name] = '(re-run to retry)';
  }
  // DON'T cache failures — so next run retries them
  // cache[folderHash] = parsed; <- this was the bug
}
    }

    // One delay per batch instead of per folder
    if (i + BATCH_SIZE < folders.length) await sleep(3000);
  }

  saveCache();
  return results;
}

module.exports = { analyzeWithAI };