const path = require('path');
const fs = require('fs').promises;

const IGNORED_DIRS = ['node_modules', '.git', '.vscode'];
const ACCEPTED_EXTENSIONS = ['.js', '.ts', '.json', '.md'];

async function scanFiles(rootPath) {
  const results = [];

  async function visit(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.includes(entry.name)) {
          continue;
        }
        await visit(path.join(directory, entry.name));
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (ACCEPTED_EXTENSIONS.includes(ext)) {
          results.push(path.join(directory, entry.name));
        }
      }
    }
  }

  await visit(rootPath);
  return results;
}

module.exports = {
  scanFiles,
};
