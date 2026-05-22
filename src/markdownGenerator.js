function generateMarkdown(analysis, aiSummary) {
  const fileRows = analysis.files
    .map((file) => `- **${file.path}**: ${file.metrics.lines} lines, ${file.metrics.functions} functions`)
    .join('\n');

  return `# Repo Lens Report\n\n## Summary\n\n${aiSummary}\n\n## File Metrics\n\n${fileRows}`;
}

module.exports = {
  generateMarkdown,
};
