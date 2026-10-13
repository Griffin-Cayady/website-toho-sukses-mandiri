---
name: push-git
description: Commit and push the current changes to the git remote while excluding secrets, credentials, build output and junk files. Use when the user types /push-git or asks to push the project to git safely.
---

# Push to Git (security-filtered)

Commit all pending work and push it to the current branch's remote, **never** including the files and folders listed below. Invoking `/push-git` is the user's authorization to commit and push; extra text after the command (e.g. `/push-git update hero section`) is the commit message.

## Rules: what must NEVER be pushed

### 1. Secrets and credentials (block hard: stop if found)
| Pattern | Reason |
|---|---|
| `.env`, `.env.*` (except `.env.local.example`) | Real Supabase URL / anon key / bucket and any future secrets |
| `credentials.json`, `token.json` | Google OAuth secrets and tokens |
| `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*` | Private keys / certificates |
| `.tmp/` | Scraped data and intermediate exports, which may contain private info |

### 2. Generated output and bloat (exclude silently)
| Pattern | Reason |
|---|---|
| `node_modules/` | Reinstalled with `npm install` |
| `.next/` | Build cache; env values get compiled into it |
| `out/` | Built static site; env values are inlined into the JS bundle |
| `next-env.d.ts` | Auto-generated |

### 3. Logs, OS junk and local tooling (exclude silently)
| Pattern | Reason |
|---|---|
| `*.log`, `npm-debug.log*` | Can contain paths, env values, stack traces |
| `.DS_Store`, `Thumbs.db` | OS metadata |
| `.vercel/` | Local deploy linkage |
| `.claude/settings.local.json` | Personal local permissions |
| `=` and other empty or garbage files in the root | Created by mistyped shell redirects |

### Allowed (must stay committed)
- `.env.local.example`, but **only** while it contains placeholders (`your-...`, `https://your...`). If it holds a real-looking value, stop.
- Config files: `package.json`, `package-lock.json`, `next.config.mjs`, `tailwind.config.js`, `postcss.config.mjs`, `eslint.config.mjs`, `jsconfig.json`, `components.json`, `.nvmrc`, `AGENTS.md`, `.gitignore`
- `src/`, `public/` (including `public/.htaccess`, unless it contains passwords or basic-auth lines)

## Procedure

Run every step from the repo root. Use the Bash tool (POSIX syntax).

### Step 1: Make sure `.gitignore` covers the rules
Append any of these lines that are missing (do not duplicate existing ones, do not remove anything):

```gitignore
node_modules/
.next/
out/
next-env.d.ts
.env
.env*
!.env.local.example
.tmp/
token.json
credentials.json
*.pem
*.key
*.p12
*.pfx
*.log
npm-debug.log*
.DS_Store
Thumbs.db
.vercel/
.claude/settings.local.json
```

### Step 2: Untrack anything forbidden that is already tracked
```bash
git ls-files | grep -E '(^|/)(\.env($|\.)|credentials\.json$|token\.json$|node_modules/|\.next/|out/|\.tmp/|\.vercel/)|\.(pem|key|p12|pfx|log)$|next-env\.d\.ts$|\.DS_Store$|Thumbs\.db$' | grep -v '^\.env\.local\.example$'
```
For each hit run `git rm -r --cached -- <path>` (this keeps the local file). If a **secret** (category 1) was previously tracked, tell the user it is still in git history and the key must be **rotated** (in the Supabase / Google console); untracking alone does not make it safe.

### Step 3: Remove junk files
Delete empty or garbage files in the root such as `=` (check that each is empty or obviously garbage first with `ls -la` / `wc -c`). Ask before deleting anything that has content.

### Step 4: Stage
```bash
git add -A
git status --porcelain
```
Re-run the Step 2 grep against `git diff --cached --name-only`. If any forbidden path is staged, unstage it with `git reset -q -- <path>`.

### Step 5: Scan staged content for secrets (hard stop)
```bash
git diff --cached -U0 | grep -nE 'service_role|sk_live_|sk_test_|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.|(password|passwd|secret)\s*[:=]\s*["'\'']?[^"'\''\s]{6,}'
```
Also confirm `.env.local.example` contains only placeholders:
```bash
grep -E '^[A-Z_]+=' .env.local.example | grep -vE '=(https?://)?your' 
```
If either command prints anything, **STOP**. Do not commit. Show the user the file and line (mask the value, showing at most the first 4 characters) and ask how to proceed.

### Step 6: Commit
- Message: use the text the user passed after `/push-git`. Otherwise write a short imperative summary from `git diff --cached --stat`.
- End the message with the attribution trailer from the current system reminder.
- If nothing is staged, tell the user "nothing to push" and stop.
- Never use `--no-verify`. If a hook fails, fix the cause and create a new commit.

### Step 7: Push
```bash
git push -u origin "$(git branch --show-current)"
```
- **Never** force-push (`--force` / `--force-with-lease`) unless the user explicitly asks in this turn.
- If the push is rejected (remote ahead), run `git pull --rebase`, resolve or report conflicts, then push again.
- If there is no `origin` remote, stop and ask the user for the repository URL.

### Step 8: Report
Give a short summary:
- the commit hash and message, and the branch it was pushed to
- the files that were committed (count, plus notable ones)
- anything excluded, untracked or deleted, and why (based on the rule categories above)
- any warnings (e.g. a secret found in history that needs rotating)

## Notes
- `NEXT_PUBLIC_*` Supabase values are visible in the browser bundle by design. Real protection comes from Supabase Row Level Security, so remind the user if RLS status is unknown. Never commit a `service_role` key.
- If this skill's rules change (new secret file types, new build folders), update the tables above **and** the Step 1 list together.
