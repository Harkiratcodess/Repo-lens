const fs = require('fs');
const path = require('path');

// File types we can actually read and make sense of
const READABLE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h', '.cs', '.rb', '.php',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm', '.xml', '.svg',
  '.json', '.yaml', '.yml', '.toml', '.env.example',
  '.md', '.txt', '.sh', '.bash', '.zsh',
  '.sql', '.prisma', '.graphql', '.gql',
]);

// Files to always skip regardless of extension
const IGNORE_FILES = new Set([
  'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
  '.DS_Store', 'Thumbs.db', '.gitignore', '.eslintignore',
]);

/**
 * Scans the workspace and returns a grouped file tree.
 * Returns: { "src/components": [ { name, relativePath, content, size } ] }
 */
async function scanWorkspace(rootPath, config) {
  const ignoreFolders = new Set(config.get('ignoreFolders') || []);
  const maxFileSizeBytes = (config.get('maxFileSizeKB') || 100) * 1024;

  const fileTree = {}; // key = folder relative path, value = array of file objects

  function walk(dirPath) {
    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return; // skip unreadable dirs (permissions etc.)
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.relative(rootPath, fullPath);

      if (entry.isDirectory()) {
        // Skip ignored folders
        if (ignoreFolders.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        // Skip ignored file names
        if (IGNORE_FILES.has(entry.name)) continue;

        const ext = path.extname(entry.name).toLowerCase();
        if (!READABLE_EXTENSIONS.has(ext)) continue;

        // Skip files that are too large
        let stat;
        try { stat = fs.statSync(fullPath); } catch { continue; }
        if (stat.size > maxFileSizeBytes) continue;

        // Read file content
        let content = '';
        try {
          content = fs.readFileSync(fullPath, 'utf8');
          // Trim to first 3000 chars — enough for AI to understand purpose
          if (content.length > 1500) {
            content = content.slice(0, 1500) + '\n... (truncated)';
          }
        } catch {
          continue; // skip binary or unreadable files
        }

        // Group by relative folder path (use '.' for root files)
        const folderKey = path.relative(rootPath, path.dirname(fullPath)) || '.';

        if (!fileTree[folderKey]) fileTree[folderKey] = [];
        fileTree[folderKey].push({
          name: entry.name,
          relativePath: relPath,
          content,
          sizeKB: (stat.size / 1024).toFixed(1),
        });
      }
    }
  }

  walk(rootPath);
  return fileTree;
}

module.exports = { scanWorkspace };