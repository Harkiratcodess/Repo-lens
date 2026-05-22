const { workspace, window, commands } = require('vscode');
const { scanFiles } = require('./src/fileScanner');
const { analyzeFiles } = require('./src/analyzer');
const { generateMarkdown } = require('./src/markdownGenerator');
const { getAIResponse } = require('./src/aiProvider');

function activate(context) {
  const disposable = commands.registerCommand('repoLens.generateReport', async () => {
    const folders = workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      window.showErrorMessage('Repo Lens needs an open workspace folder to scan.');
      return;
    }

    const rootPath = folders[0].uri.fsPath;
    window.showInformationMessage(`Scanning repository at ${rootPath}`);

    try {
      const files = await scanFiles(rootPath);
      const analysis = await analyzeFiles(files);
      const aiSummary = await getAIResponse(analysis);
      const markdown = generateMarkdown(analysis, aiSummary);

      const doc = await workspace.openTextDocument({ content: markdown, language: 'markdown' });
      await window.showTextDocument(doc);
    } catch (error) {
      window.showErrorMessage(`Repo Lens failed: ${error.message}`);
    }
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
