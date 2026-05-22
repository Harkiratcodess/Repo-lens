const fs = require('fs').promises;

async function analyzeFiles(filePaths) {
  const files = [];

  for (const filePath of filePaths) {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/).length;
    const functions = (content.match(/function\s+\w+|=>|const\s+\w+\s*=\s*\(/g) || []).length;

    files.push({
      path: filePath,
      metrics: {
        lines,
        functions,
      },
    });
  }

  return { files, totalFiles: files.length };
}

module.exports = {
  analyzeFiles,
};
