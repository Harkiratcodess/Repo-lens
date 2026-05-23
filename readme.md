# RepoLens - Codebase Navigator

> Instantly understand any codebase — RepoLens maps every file and folder so you can contribute with confidence.

Built for open source contributors who need to understand a codebase fast (GSSoC, GSoC, Hacktoberfest, etc.)

---

## What it does

Run one command and RepoLens will:
- Scan your entire project
- Analyze every file with AI
- Generate a `CODEBASE_MAP.md` with a folder index and file-by-file breakdown
- Open the map automatically in your editor

---

## Setup (5 minutes)

### 1. Get a free Groq API key
- Go to [console.groq.com](https://console.groq.com)
- Sign up with Google or email
- Click **API Keys** → **Create API key**
- Copy it — it's completely free, no card needed

### 2. Add the key to VS Code
- Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
- Search for `repolens`
- Paste your key into **Groq Api Key**

### 3. Run it
- Open any project folder in VS Code
- Press `Ctrl+Shift+P`
- Type `RepoLens: Analyze Codebase`
- Hit Enter and watch the progress bar

---

## What you get

```md
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
| AuthModal.jsx | Handles login/signup UI with email and Google OAuth buttons | 4.2 KB |
| Navbar.jsx | Top navigation bar with links, user avatar, and mobile hamburger menu | 2.1 KB |
```

---

## Settings

| Setting | Default | What it does |
|---------|---------|-------------|
| `repolens.groqApiKey` | (empty) | Your free Groq API key |
| `repolens.ignoreFolders` | node_modules, .git, dist... | Folders to skip |
| `repolens.maxFileSizeKB` | 100 | Skip files bigger than this |

---

## How caching works

After the first run a `.codemap-cache.json` file is created. On the next run:
- **Unchanged folder** → loaded from cache instantly, no API call
- **Changed folder** → re-analyzed with AI

Re-runs are fast and barely use any free quota.
## Project size guide

| Project size | Files | Works? |
|---|---|---|
| Small | < 50 files | ✅ Perfectly |
| Medium | 50-200 files | ✅ Most files analyzed |
| Large | 200+ files | ⚠️ Re-run a few times, cache handles the rest |

**Tip:** If you see "(re-run to retry)" on any file, just run `RepoLens: Analyze Codebase` again. Already analyzed files load from cache instantly — only failed ones get retried.

---

## Add to .gitignore