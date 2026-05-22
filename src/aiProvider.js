async function getAIResponse(analysis) {
  const summary = analysis.files
    .slice(0, 5)
    .map((file) => `- ${file.path}: ${file.metrics.lines} lines, ${file.metrics.functions} functions`)
    .join('\n');

  return `Repository summary:\n${summary}\n\nTotal files scanned: ${analysis.files.length}`;
}

module.exports = {
  getAIResponse,
};
