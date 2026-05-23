const vscode = require('vscode');
const { scanWorkspace } = require('./src/fileScanner');
const { analyzeWithAI } = require('./src/analyzer');
const { generateMarkdown } = require('./src/markdownGenerator');
const path = require('path');
const fs = require('fs');

function activate(context) {
  const command = vscode.commands.registerCommand('repo-lens.analyze', async () => {

    // 1. Make sure a workspace is open
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('CodeMap: Please open a project folder first.');
      return;
    }

    // 2. Check for API key
    const config = vscode.workspace.getConfiguration('repolens');
    const apiKey = config.get('geminiApiKey');
    if (!apiKey) {
      const action = await vscode.window.showErrorMessage(
        'CodeMap: No Gemini API key found. Get a free one at aistudio.google.com',
        'Open Settings'
      );
      if (action === 'Open Settings') {
        vscode.commands.executeCommand('workbench.action.openSettings', 'codemap.geminiApiKey');
      }
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const projectName = path.basename(rootPath);

    // 3. Run analysis with a progress bar
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `CodeMap: Analyzing "${projectName}"`,
        cancellable: false,
      },
      async (progress) => {
        try {
          // Step 1: Scan files
          progress.report({ message: 'Scanning files...', increment: 10 });
          const fileTree = await scanWorkspace(rootPath, config);

          const totalFolders = Object.keys(fileTree).length;
          if (totalFolders === 0) {
            vscode.window.showWarningMessage('RepoLens: No files found to analyze.');
            return;
          }

          // Step 2: Analyze with AI folder by folder
          progress.report({ message: `Analyzing ${totalFolders} folders with AI...`, increment: 10 });
          const analysisResults = await analyzeWithAI(fileTree, apiKey, (done, total, folderName) => {
            const pct = Math.round((done / total) * 70);
            progress.report({
              message: `Analyzing: ${folderName} (${done}/${total})`,
              increment: pct / total,
            });
          });

          // Step 3: Generate markdown
          progress.report({ message: 'Writing CODEBASE_MAP.md...', increment: 10 });
          const outputPath = path.join(rootPath, 'CODEBASE_MAP.md');
          const markdown = generateMarkdown(projectName, analysisResults, fileTree);
          fs.writeFileSync(outputPath, markdown, 'utf8');

          // Step 4: Open the file in editor
          progress.report({ message: 'Done!', increment: 10 });
          const doc = await vscode.workspace.openTextDocument(outputPath);
          await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });

          vscode.window.showInformationMessage(
            `CodeMap: CODEBASE_MAP.md created for "${projectName}"!`
          );

        } catch (err) {
          vscode.window.showErrorMessage(`CodeMap failed: ${err.message}`);
          console.error('[CodeMap Error]', err);
        }
      }
    );
  });

  context.subscriptions.push(command);
}

function deactivate() {}

module.exports = { activate, deactivate };