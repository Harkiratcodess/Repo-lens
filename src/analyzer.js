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
    // Matches: FILE: something.js | PURPOSE: description
    const match = line.match(/FILE:\s*(.+?)\s*\|\s*PURPOSE:\s*(.+)/i);
    if (match) {
      const filename = match[1].trim();
      const purpose = match[2].trim();
      result[filename] = purpose;
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
  const results = {}; // { folderPath -> { fileName -> summary } }
  let done = 0;

  for (const folderPath of folders) {
    const files = fileTree[folderPath];
    done++;
    onProgress(done, folders.length, folderPath);

    // Check cache first
    const folderHash = hashFolder(files);
    if (cache[folderHash]) {
      results[folderPath] = cache[folderHash];
      continue; // no API call needed
    }

    // Call Gemini
    try {
      const responseText = await askGemini(apiKey, folderPath, files);
      const parsed = parseAIResponse(responseText);
      results[folderPath] = parsed;
      cache[folderHash] = parsed; // store in cache for next time
    } catch (err) {
      // Don't crash the whole analysis if one folder fails
      console.error(`[CodeMap] Failed to analyze folder "${folderPath}":`, err.message);
      results[folderPath] = {};
      for (const f of files) {
        results[folderPath][f.name] = '(analysis failed for this file)';
      }
    }

    // Wait 4 seconds between Gemini calls to stay under free tier rate limit (15 rpm)
    // Skip delay on last folder
    if (done < folders.length) {
      await sleep(4000);
    }
  }

  saveCache();
  return results;
}

module.exports = { analyzeWithAI };