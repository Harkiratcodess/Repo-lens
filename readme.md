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
- Copy it — completely free, no card needed

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

| File | What it does | Size |
|------|-------------|------|
| `authMiddleware.js` | Authenticates incoming requests by verifying the JWT token | 1.3 KB |
| `CodeforcesPage.jsx` | Displays Codeforces user info, ratings, and submission history | 22.8 KB |
| `emailService.js` | Handles sending verification emails using nodemailer | 6.6 KB |

Every file in your project gets a clear one-line description — folder by folder.

---

## Project size guide

| Project size | Files | Works? |
|---|---|---|
| Small | < 50 files | ✅ Perfectly |
| Medium | 50-200 files | ✅ Works great |
| Large | 200+ files | ⚠️ Re-run a few times, cache handles the rest |

**Tip:** If you see "(re-run to retry)" on any file, just run `RepoLens: Analyze Codebase` again. Already analyzed files load from cache instantly — only failed ones get retried.

---

## How caching works

After the first run a `.codemap-cache.json` file is created. On the next run:
- **Unchanged folder** → loaded from cache instantly, no API call
- **Changed folder** → re-analyzed with AI

---

## Add to .gitignore