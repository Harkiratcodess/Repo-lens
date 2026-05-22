# Codebase Mapper

Analyzes your project and generates a human-readable `CODEBASE_MAP.md` — every file, what it does, in one place.

Built for open source contributors who need to understand a codebase fast (GSSoC, GSoC, Hacktoberfest, etc.)

---

## Setup (5 minutes)

### 1. Get a free Gemini API key
- Go to [aistudio.google.com](https://aistudio.google.com)
- Sign in with Google → click **Get API Key** → **Create API key**
- Copy it (it's free, no card needed — 1M tokens/day)

### 2. Add the key to VS Code
- Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
- Search for `codemap`
- Paste your key into **Gemini Api Key**

### 3. Install the extension (local dev)
```bash
# Install vsce tool
npm install -g @vscode/vsce

# Inside this folder
npm install

# Open in VS Code
code .

# Press F5 to launch Extension Development Host
```

---

## Usage

1. Open any project folder in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
3. Type `CodeMap: Analyze Codebase` and hit Enter
4. Watch the progress bar — analysis runs folder by folder
5. `CODEBASE_MAP.md` opens automatically when done

**On large projects:** The first run takes a few minutes (rate-limited to be nice to the free API).
Re-runs are instant for unchanged folders thanks to caching.

---

## What you get

```
# 🗺️ Codebase Map — my-project

## 📁 Folder Index
- / (root)
- src/components
- src/api
- src/utils

## 📂 File Breakdown

### 📁 src/components

| File | What it does | Size |
|------|-------------|------|
| `AuthModal.jsx` | Handles login/signup UI with email and Google OAuth buttons | 4.2 KB |
| `Navbar.jsx` | Top navigation bar with links, user avatar, and mobile hamburger menu | 2.1 KB |
```

---

## Settings

| Setting | Default | What it does |
|---------|---------|-------------|
| `codemap.geminiApiKey` | (empty) | Your free Gemini API key |
| `codemap.ignoreFolders` | node_modules, .git, dist... | Folders to skip |
| `codemap.maxFileSizeKB` | 100 | Skip files bigger than this |

---

## Add to .gitignore

```
CODEBASE_MAP.md
.codemap-cache.json
```

---

## How caching works

Every time you run the analysis, a `.codemap-cache.json` file is created.
It stores a hash of each folder's contents. On the next run:
- **Unchanged folder** → loaded from cache instantly, no API call
- **Changed folder** → re-analyzed with Gemini

This means after the first run, re-analysis is fast and barely uses any free quota.