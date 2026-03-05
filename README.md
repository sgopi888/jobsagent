# 🚀 ApplyAgent

**Autonomous job application agent. Applied to 1,000+ jobs in days. Discover. Score. Tailor. Apply. All hands-free.**

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18%2B-green.svg)](https://nodejs.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-purple.svg)](LICENSE)
[![Gemini API](https://img.shields.io/badge/LLM-Gemini%2F%20OpenAI%2F%20Claude-orange.svg)](https://aistudio.google.com)

---

## What It Does

**ApplyAgent** is a 6-stage autonomous pipeline + **ApplySwift** web dashboard that:

1. **Discovers** 1,000+ jobs from 5 job boards + Workday portals + direct career sites
2. **Enriches** full job descriptions via JSON-LD, CSS, or AI extraction
3. **Scores** each job 1-10 using AI based on your resume + preferences
4. **Tailors** your resume per job (reorganizes, emphasizes skills, adds keywords)
5. **Generates** targeted cover letters per job
6. **Auto-Applies** using Claude Code: navigates forms, uploads documents, answers questions, submits

All powered by **Claude Code** (AI agent) + **Gemini/OpenAI** (scoring & tailoring) + **Chrome** (browser automation).

> **Result:** 100+ job applications submitted autonomously in a single `applypilot apply` command.

---

## Architecture

```
┌─ ApplyPilot (Backend - Python CLI) ─────────────────────┐
│  • Job discovery (5 boards + Workday + 30+ direct sites)│
│  • Description enrichment (JSON-LD, CSS, AI extraction)  │
│  • AI scoring (1-10 fit score against your resume)      │
│  • Resume tailoring (per-job AI reorganization)         │
│  • Cover letter generation (AI-powered, per job)        │
│  • Auto-apply orchestration (Chrome + Claude Code)      │
│  • SQLite database (jobs, pipeline state, metrics)      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─ ApplySwift (Frontend - Next.js + Glassmorphism) ───────┐
│  • Landing page (features, how it works, CTAs)         │
│  • Dashboard (4 stat orbs, applied jobs, pipeline flow) │
│  • Apply page (cockpit HUD console, Dry Run toggle)    │
│  • Jobs page (searchable table, score reasoning)       │
│  • Pipeline page (6-stage card grid, Run buttons)      │
│  • Settings (profile, search config, API keys)         │
│  • Live SSE terminal (agent output, cost tracking)     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Backend (ApplyPilot)

```bash
# Install Python 3.11+
cd ApplyPilot

# Set up virtual environment
python -m venv .venv
source .venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -e .
pip install --no-deps python-jobspy && pip install pydantic tls-client requests markdownify regex

# One-time setup
applypilot init          # Profile, resume, search preferences, API keys
applypilot doctor        # Verify setup

# Run the pipeline
applypilot run           # Discover → Enrich → Score → Tailor → Cover Letters
applypilot apply         # Auto-submit applications
```

### 2. Frontend (ApplySwift)

```bash
cd ../applyswift-ui

# Install dependencies
npm install

# Development server
npm run dev

# Visit http://localhost:3000
```

---

## The Pipeline (6 Stages)

| Stage | Command | What It Does |
|-------|---------|-------------|
| **1. Discover** | `applypilot run discover` | Scrapes Indeed, LinkedIn, Glassdoor, ZipRecruiter, Google Jobs + 48 Workday portals + 30 direct sites |
| **2. Enrich** | `applypilot run enrich` | Fetches full job descriptions (JSON-LD, CSS selectors, or AI extraction) |
| **3. Score** | `applypilot run score` | AI rates each job 1-10. Only high-fit jobs proceed (threshold configurable, default 7) |
| **4. Tailor** | `applypilot run tailor` | AI rewrites your resume per job. Reorganizes experience, adds keywords, emphasizes skills. Never fabricates. |
| **5. Cover** | `applypilot run cover` | AI generates targeted cover letters per job |
| **6. Apply** | `applypilot apply` | Claude Code autonomously navigates forms, uploads documents, answers questions, submits |

**Run all at once:**
```bash
applypilot run all       # All stages
applypilot apply         # Then submit
```

**Run in parallel:**
```bash
applypilot run -w 4      # 4 workers for discovery/enrichment
applypilot apply -w 3    # 3 Chrome instances for applying
```

---

## Requirements

### Core
- **Python 3.11+** — Backend CLI
- **Node.js 18+** — Frontend (Next.js) + MCP server for auto-apply
- **Chrome/Chromium** — Auto-detected. For headless: `CHROME_PATH=/path/to/chrome`

### APIs (Free Tiers Available)
- **Gemini API key** (free) — Scoring & tailoring ([aistudio.google.com](https://aistudio.google.com))
- **Claude Code CLI** — Auto-apply agent ([claude.ai/code](https://claude.ai/code))

### Optional
- **OpenAI API key** — Alternative to Gemini
- **Local LLM** (Ollama/llama.cpp) — For privacy
- **CapSolver API key** — CAPTCHA solving during form submission

---

## Configuration Files

All auto-generated by `applypilot init`:

### `profile.json`
Your personal data: contact, work authorization, compensation, experience, skills.
Powers scoring, resume tailoring, and form auto-fill.

### `searches.yaml`
Job search queries, target titles, locations, preferred boards.

```yaml
queries:
  - query: "AI Engineer"
    tier: 1
  - query: "ML Platform Engineer"
    tier: 1

sites: [indeed, linkedin, glassdoor, dice]  # Job boards
tiers: [1, 2]                                # Job tiers (1=priority, 2=stretch)
defaults:
  results_per_site: 25
  hours_old: 72

location_accept:
  - "Remote"
  - "San Francisco"
  - "New York"
```

### `.env`
```
GEMINI_API_KEY=your-key-here
LLM_MODEL=gemini-2.5-flash-lite    # or gpt-4, claude-opus
CAPSOLVER_API_KEY=optional
```

---

## CLI Reference

### Pipeline
```bash
applypilot init                    # First-time setup
applypilot doctor                  # Verify setup
applypilot run [discover|enrich|score|tailor|cover|all]
applypilot run --workers 4         # Parallel workers
applypilot run --min-score 8       # Override score threshold
applypilot run --dry-run           # Preview (no DB changes)
applypilot run --validation lenient
```

### Auto-Apply
```bash
applypilot apply                   # Start applying
applypilot apply --workers 3       # 3 Chrome instances in parallel
applypilot apply --dry-run         # Fill forms without submitting
applypilot apply --continuous      # Run forever, polling new jobs
applypilot apply --url <URL>       # Apply to one specific job
applypilot apply --limit 10        # Apply to 10 jobs then stop
applypilot verify <URL> <CODE>     # Enter email verification code
```

### Utilities
```bash
applypilot status                  # Show pipeline statistics
applypilot reset-url <URL>         # Reset a job (start pipeline over)
```

---

## Key Features

### ✨ Smart Scoring
- AI rates each job 1-10 against your resume + preferences
- Only high-fit jobs proceed to expensive tailoring stage
- Configurable threshold (default: score ≥ 7)

### 📄 Per-Job Resume Tailoring
- AI reorganizes your experience for each job
- Adds keywords from job description
- Preserves all facts and metrics (no fabrication)
- Results in 5-10 different resumes per application cycle

### 🤖 Fully Autonomous Submission
- Claude Code agent navigates forms
- Detects form types (custom, ATS, Workday, Lever, Greenhouse, etc.)
- Auto-fills personal info, work history, education
- Uploads tailored resume + cover letter
- Answers screening questions with AI
- Submits application
- Handles email verification codes (pause, prompt user, resume)

### 📊 Live Dashboard (ApplySwift)
- **Apply page:** Cockpit HUD console, dry-run mode, discovery config display
- **Dashboard:** 4 stat cards (applied, pending, ready, errors), pipeline flow, applied jobs
- **Jobs page:** Searchable table, score reasoning, filter by status
- **Pipeline page:** 6-stage cards with Run buttons, validation modes
- **Settings:** Editable search config, API keys, profile data
- **Live terminal:** Real-time agent output, cost tracking, logs

### 🎨 Glassmorphism Dark Theme
- Exotic 2026-style UI design
- Neon color accents (cyan, emerald, amber, violet)
- Responsive grid layouts
- Smooth transitions

---

## Verification Flow

When a site requests email verification:

1. **Agent detects** the verification code input page → outputs `RESULT:NEEDS_VERIFICATION`
2. **Chrome stays open** (not closed)
3. **Job marked** as `pending_verification` (not failed)
4. **UI shows banner** — user checks email, gets code
5. **User enters code** in VerifyModal
6. **API call** → `applypilot verify <url> <code>`
7. **Claude re-launches** on the still-open Chrome
8. **Enters code** + submits
9. **Marked applied** if successful

---

## Dry Run Mode

```bash
applypilot apply --dry-run
```

- Runs entire pipeline + all apply steps normally
- **Does NOT click the final "Submit" button**
- Safe way to test on new sites, validate forms
- Results show what would have been applied

---

## Example Output

```
[W0] ELAPSED: 23m 42s | ACTIONS: 156 | COST: $1.240 | LOG LINES: 2847
[W0] AUTO-PILOT URL: https://careers.company.com/job/123456

[00:15:32] → Launching Chrome at 127.0.0.1:9222
[00:15:45] → Navigating to job application form
[00:16:02] → Detected Workday form layout
[00:16:08] → Auto-filling: Full Name, Email, Phone
[00:16:15] → Auto-filling: Work Experience (3 entries)
[00:16:22] → Uploading: resume.pdf (245 KB)
[00:16:28] → Uploading: cover_letter.pdf (86 KB)
[00:16:35] → Answering screening questions (7 questions)
[00:16:42] → Question: "Why are you interested in this role?"
[00:16:45] → Answer: "Your company's vision aligns with my experience in..."
[00:17:15] → Submitting application...
✓ RESULT:APPLIED — Application submitted successfully!
```

---

## Database

ApplyPilot uses **SQLite** (no server setup). Location: `~/.applypilot/applypilot.db`

Tables:
- `jobs` — URL, title, site, score, tailored resume path, apply status
- `applied_at` — Timestamp when marked applied
- `apply_error` — Reason if application failed

---

## Troubleshooting

### No Chrome window appears
- Check `CHROME_PATH` in `.env` (or install Chrome)
- Try `applypilot apply --headless=false` (force visible browser)

### "Gemini API: 400 bad request"
- Verify API key in `.env`
- Check model name (use `gemini-2.5-flash-lite` for free tier)

### "Company missing from experience"
- Validator checks both `header` + `subtitle` fields
- Ensure resume PDF is detailed enough
- Try `--validation lenient`

### Form submission hangs
- Try `--dry-run` first to see if form detection works
- Check job URL is accessible (not behind login)
- Check browser compatibility

### Email verification code times out
- Check that the code is entered correctly (case-sensitive?)
- Code might have expired (check email timestamp)
- Some sites don't support auto-entry (rare)

---

## Development

### Backend
```bash
cd ApplyPilot
python -m pytest tests/           # Run tests
python -m applypilot run --dry-run  # Test without applying
```

### Frontend
```bash
cd applyswift-ui
npm run dev                # Dev server
npm run build              # Production build
npm run lint               # TypeScript check
```

---

## License

GNU Affero General Public License v3.0 ([LICENSE](LICENSE))

You are free to use, modify, and distribute this software. If you deploy a modified version as a service, you must release your source code under the same license.

---

## Acknowledgments

- **Claude Code** — AI agent for browser automation
- **Gemini API** — Free LLM for scoring & tailoring
- **Next.js** — Frontend framework
- **JobSpy** — Job board scraping
- **Chrome DevTools Protocol** — Browser control

---

## Questions?

- 📧 Open an issue on GitHub
- 🐛 Report bugs with detailed logs (`applypilot doctor` output)
- 💡 Feature requests welcome

**Happy job hunting! 🎯**
