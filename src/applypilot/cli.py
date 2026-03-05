"""ApplyPilot CLI — the main entry point."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from applypilot import __version__

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S",
)

app = typer.Typer(
    name="applypilot",
    help="AI-powered end-to-end job application pipeline.",
    no_args_is_help=True,
)
console = Console()
log = logging.getLogger(__name__)

# Valid pipeline stages (in execution order)
VALID_STAGES = ("discover", "enrich", "score", "tailor", "cover", "pdf")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _bootstrap() -> None:
    """Common setup: load env, create dirs, init DB."""
    from applypilot.config import load_env, ensure_dirs
    from applypilot.database import init_db

    load_env()
    ensure_dirs()
    init_db()


def _version_callback(value: bool) -> None:
    if value:
        console.print(f"[bold]applypilot[/bold] {__version__}")
        raise typer.Exit()


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

@app.callback()
def main(
    version: bool = typer.Option(
        False, "--version", "-V",
        help="Show version and exit.",
        callback=_version_callback,
        is_eager=True,
    ),
) -> None:
    """ApplyPilot — AI-powered end-to-end job application pipeline."""


@app.command()
def init() -> None:
    """Run the first-time setup wizard (profile, resume, search config)."""
    from applypilot.wizard.init import run_wizard

    run_wizard()


@app.command()
def run(
    stages: Optional[list[str]] = typer.Argument(
        None,
        help=(
            "Pipeline stages to run. "
            f"Valid: {', '.join(VALID_STAGES)}, all. "
            "Defaults to 'all' if omitted."
        ),
    ),
    min_score: int = typer.Option(7, "--min-score", help="Minimum fit score for tailor/cover stages."),
    workers: int = typer.Option(1, "--workers", "-w", help="Parallel threads for discovery/enrichment stages."),
    stream: bool = typer.Option(False, "--stream", help="Run stages concurrently (streaming mode)."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview stages without executing."),
    validation: str = typer.Option(
        "normal",
        "--validation",
        help=(
            "Validation strictness for tailor/cover stages. "
            "strict: banned words = errors, judge must pass. "
            "normal: banned words = warnings only (default, recommended for Gemini free tier). "
            "lenient: banned words ignored, LLM judge skipped (fastest, fewest API calls)."
        ),
    ),
) -> None:
    """Run pipeline stages: discover, enrich, score, tailor, cover, pdf."""
    _bootstrap()

    from applypilot.pipeline import run_pipeline

    stage_list = stages if stages else ["all"]

    # Validate stage names
    for s in stage_list:
        if s != "all" and s not in VALID_STAGES:
            console.print(
                f"[red]Unknown stage:[/red] '{s}'. "
                f"Valid stages: {', '.join(VALID_STAGES)}, all"
            )
            raise typer.Exit(code=1)

    # Gate AI stages behind Tier 2
    llm_stages = {"score", "tailor", "cover"}
    if any(s in stage_list for s in llm_stages) or "all" in stage_list:
        from applypilot.config import check_tier
        check_tier(2, "AI scoring/tailoring")

    # Validate the --validation flag value
    valid_modes = ("strict", "normal", "lenient")
    if validation not in valid_modes:
        console.print(
            f"[red]Invalid --validation value:[/red] '{validation}'. "
            f"Choose from: {', '.join(valid_modes)}"
        )
        raise typer.Exit(code=1)

    result = run_pipeline(
        stages=stage_list,
        min_score=min_score,
        dry_run=dry_run,
        stream=stream,
        workers=workers,
        validation_mode=validation,
    )

    if result.get("errors"):
        raise typer.Exit(code=1)


@app.command()
def apply(
    limit: Optional[int] = typer.Option(None, "--limit", "-l", help="Max applications to submit."),
    workers: int = typer.Option(1, "--workers", "-w", help="Number of parallel browser workers."),
    min_score: int = typer.Option(7, "--min-score", help="Minimum fit score for job selection."),
    model: str = typer.Option("haiku", "--model", "-m", help="Claude model name."),
    continuous: bool = typer.Option(False, "--continuous", "-c", help="Run forever, polling for new jobs."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview actions without submitting."),
    headless: bool = typer.Option(False, "--headless", help="Run browsers in headless mode."),
    url: Optional[str] = typer.Option(None, "--url", help="Apply to a specific job URL."),
    gen: bool = typer.Option(False, "--gen", help="Generate prompt file for manual debugging instead of running."),
    mark_applied: Optional[str] = typer.Option(None, "--mark-applied", help="Manually mark a job URL as applied."),
    mark_failed: Optional[str] = typer.Option(None, "--mark-failed", help="Manually mark a job URL as failed (provide URL)."),
    fail_reason: Optional[str] = typer.Option(None, "--fail-reason", help="Reason for --mark-failed."),
    reset_failed: bool = typer.Option(False, "--reset-failed", help="Reset all failed jobs for retry."),
) -> None:
    """Launch auto-apply to submit job applications."""
    _bootstrap()

    from applypilot.config import check_tier, PROFILE_PATH as _profile_path
    from applypilot.database import get_connection

    # --- Utility modes (no Chrome/Claude needed) ---

    if mark_applied:
        from applypilot.apply.launcher import mark_job
        mark_job(mark_applied, "applied")
        console.print(f"[green]Marked as applied:[/green] {mark_applied}")
        return

    if mark_failed:
        from applypilot.apply.launcher import mark_job
        mark_job(mark_failed, "failed", reason=fail_reason)
        console.print(f"[yellow]Marked as failed:[/yellow] {mark_failed} ({fail_reason or 'manual'})")
        return

    if reset_failed:
        from applypilot.apply.launcher import reset_failed as do_reset
        count = do_reset()
        console.print(f"[green]Reset {count} failed job(s) for retry.[/green]")
        return

    # --- Full apply mode ---

    # Check 1: Tier 3 required (Claude Code CLI + Chrome)
    check_tier(3, "auto-apply")

    # Check 2: Profile exists
    if not _profile_path.exists():
        console.print(
            "[red]Profile not found.[/red]\n"
            "Run [bold]applypilot init[/bold] to create your profile first."
        )
        raise typer.Exit(code=1)

    # Check 3: Tailored resumes exist (skip for --gen with --url)
    if not (gen and url):
        conn = get_connection()
        ready = conn.execute(
            "SELECT COUNT(*) FROM jobs WHERE tailored_resume_path IS NOT NULL AND applied_at IS NULL"
        ).fetchone()[0]
        if ready == 0:
            console.print(
                "[red]No tailored resumes ready.[/red]\n"
                "Run [bold]applypilot run score tailor[/bold] first to prepare applications."
            )
            raise typer.Exit(code=1)

    if gen:
        from applypilot.apply.launcher import gen_prompt, BASE_CDP_PORT
        target = url or ""
        if not target:
            console.print("[red]--gen requires --url to specify which job.[/red]")
            raise typer.Exit(code=1)
        prompt_file = gen_prompt(target, min_score=min_score, model=model)
        if not prompt_file:
            console.print("[red]No matching job found for that URL.[/red]")
            raise typer.Exit(code=1)
        mcp_path = _profile_path.parent / ".mcp-apply-0.json"
        console.print(f"[green]Wrote prompt to:[/green] {prompt_file}")
        console.print(f"\n[bold]Run manually:[/bold]")
        console.print(
            f"  claude --model {model} -p "
            f"--mcp-config {mcp_path} "
            f"--permission-mode bypassPermissions < {prompt_file}"
        )
        return

    from applypilot.apply.launcher import main as apply_main

    effective_limit = limit if limit is not None else (0 if continuous else 1)

    console.print("\n[bold blue]Launching Auto-Apply[/bold blue]")
    console.print(f"  Limit:    {'unlimited' if continuous else effective_limit}")
    console.print(f"  Workers:  {workers}")
    console.print(f"  Model:    {model}")
    console.print(f"  Headless: {headless}")
    console.print(f"  Dry run:  {dry_run}")
    if url:
        console.print(f"  Target:   {url}")
    console.print()

    apply_main(
        limit=effective_limit,
        target_url=url,
        min_score=min_score,
        headless=headless,
        model=model,
        dry_run=dry_run,
        continuous=continuous,
        workers=workers,
    )


def _reset_job_in_db(url: str) -> None:
    """Wipe all pipeline state for a URL so it re-runs from scratch.

    Clears enrich, score, tailor, cover, and apply columns.
    Also deletes any stale tailored resume / cover letter files on disk.
    Leaves url/title/site/discovered_at intact so the job row stays.
    """
    import glob as _glob
    from applypilot.config import TAILORED_DIR, COVER_LETTER_DIR
    from applypilot.database import get_connection

    conn = get_connection()

    # Grab existing file paths before we null them
    row = conn.execute(
        "SELECT tailored_resume_path, cover_letter_path FROM jobs WHERE url = ?", (url,)
    ).fetchone()

    conn.execute(
        """
        UPDATE jobs SET
            full_description  = NULL,
            detail_scraped_at = NULL,
            detail_error      = NULL,
            fit_score         = NULL,
            score_reasoning   = NULL,
            scored_at         = NULL,
            tailored_resume_path = NULL,
            tailored_at       = NULL,
            tailor_attempts   = 0,
            cover_letter_path = NULL,
            cover_letter_at   = NULL,
            cover_attempts    = 0,
            applied_at        = NULL,
            apply_status      = NULL,
            apply_error       = NULL,
            apply_attempts    = 0,
            agent_id          = NULL,
            last_attempted_at = NULL,
            apply_duration_ms = NULL,
            apply_task_id     = NULL,
            verification_confidence = NULL
        WHERE url = ?
        """,
        (url,),
    )
    conn.commit()

    # Delete stale files on disk (txt, pdf, REPORT.json, JOB.txt, cover letter)
    if row:
        for fpath in (row[0], row[1]):  # tailored_resume_path, cover_letter_path
            if fpath:
                p = Path(fpath)
                stem = p.stem  # e.g. "Manual_Samsara_Role"
                parent = p.parent
                for f in parent.glob(f"{stem}*"):
                    try:
                        f.unlink()
                    except Exception:
                        pass


def _add_job_to_db(url: str, title: Optional[str], company: Optional[str],
                   location: Optional[str], description: Optional[str]) -> tuple[bool, str]:
    """Insert a job URL into the DB. Returns (was_inserted, company_name).

    Returns (True, company) on fresh insert, (False, company) if already exists.
    """
    import sqlite3
    from datetime import datetime, timezone
    from urllib.parse import urlparse
    from applypilot.database import get_connection

    conn = get_connection()
    discovered_at = datetime.now(timezone.utc).isoformat()

    if not company:
        try:
            host = urlparse(url).hostname or ""
            parts = host.replace("www.", "").split(".")
            company = parts[0].capitalize() if parts else "Unknown"
        except Exception:
            company = "Unknown"

    inferred_title = title or "Unknown Role"
    inferred_desc = description or f"Manually added job at {company}."

    try:
        conn.execute(
            """
            INSERT INTO jobs (url, title, location, description, site, strategy, discovered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (url, inferred_title, location or "", inferred_desc, "manual", "cli-add", discovered_at),
        )
        conn.commit()
        return True, company
    except sqlite3.IntegrityError:
        return False, company


@app.command()
def add(
    url: str = typer.Argument(..., help="Job posting URL to add manually."),
    title: Optional[str] = typer.Option(None, "--title", "-t", help="Job title."),
    company: Optional[str] = typer.Option(None, "--company", "-c", help="Company name."),
    location: Optional[str] = typer.Option(None, "--location", "-l", help="Job location (e.g. 'New York, NY')."),
    description: Optional[str] = typer.Option(None, "--description", "-d", help="Short job description or notes."),
    run_pipeline: bool = typer.Option(
        False, "--run", "-r",
        help="Immediately run enrich → score → tailor after adding.",
    ),
) -> None:
    """Add a job URL manually to the database, then optionally run the pipeline on it."""
    _bootstrap()

    inserted, company_name = _add_job_to_db(url, title, company, location, description)

    if inserted:
        console.print(f"\n[green]✓ Added:[/green] [bold]{title or 'Unknown Role'}[/bold] @ {company_name}")
        console.print(f"  URL: {url}")
        if not run_pipeline:
            console.print(
                "\n[dim]Next steps:[/dim]\n"
                "  [bold]applypilot run enrich score tailor[/bold]  — prepare resume\n"
                f"  [bold]applypilot apply --url \"{url}\"[/bold]  — apply\n"
            )
    else:
        console.print(f"\n[yellow]⚠ Already in DB:[/yellow] {url}")
        console.print("[dim]Skipping insert — job exists. Running pipeline anyway if --run set.[/dim]\n")
        if not run_pipeline:
            return

    if run_pipeline:
        console.print("[bold blue]Running enrich → score → tailor pipeline...[/bold blue]\n")
        from applypilot.pipeline import run_pipeline as _run_pipeline
        _run_pipeline(stages=["enrich", "score", "tailor"], min_score=7, dry_run=False,
                      stream=False, workers=1, validation_mode="normal")


@app.command()
def url(
    job_url: str = typer.Argument(..., help="Job posting URL to add and apply to automatically."),
    title: Optional[str] = typer.Option(None, "--title", "-t", help="Job title (optional, auto-inferred if omitted)."),
    company: Optional[str] = typer.Option(None, "--company", "-c", help="Company name (optional, auto-inferred)."),
    location: Optional[str] = typer.Option(None, "--location", "-l", help="Job location."),
    model: str = typer.Option("haiku", "--model", "-m", help="Claude model for auto-apply."),
    headless: bool = typer.Option(False, "--headless", help="Run browser in headless mode."),
    dry_run: bool = typer.Option(False, "--dry-run", help="Preview without submitting."),
) -> None:
    """Full auto-pilot: add URL → enrich → score → tailor → apply. One command does it all."""
    _bootstrap()

    from applypilot.config import check_tier, PROFILE_PATH as _profile_path

    # Tier 3 required (Claude Code CLI + Chrome)
    check_tier(3, "auto-apply")

    if not _profile_path.exists():
        console.print(
            "[red]Profile not found.[/red]\n"
            "Run [bold]applypilot init[/bold] first."
        )
        raise typer.Exit(code=1)

    console.print(f"\n[bold blue]⚡ Auto-Pilot:[/bold blue] {job_url}\n")

    # ── Step 1: Reset + Add to DB ────────────────────────────────────────────
    console.print("[bold]Step 1/3:[/bold] Resetting job state and adding to database...")
    _reset_job_in_db(job_url)  # wipe any prior enrich/score/tailor/apply state
    inserted, company_name = _add_job_to_db(job_url, title, company, location, None)
    if inserted:
        console.print(f"  [green]✓ Added fresh[/green] @ {company_name}")
    else:
        console.print(f"  [green]✓ Reset[/green] @ {company_name} — starting from scratch")

    # ── Step 2: enrich → score → tailor ─────────────────────────────────────
    console.print("\n[bold]Step 2/3:[/bold] Running enrich → score → tailor...")
    from applypilot.pipeline import run_pipeline as _run_pipeline
    result = _run_pipeline(stages=["enrich", "score", "tailor"], min_score=7, dry_run=False,
                           stream=False, workers=1, validation_mode="normal")

    if result.get("errors"):
        console.print("[red]Pipeline had errors — aborting apply.[/red]")
        raise typer.Exit(code=1)

    # ── Step 3: Apply ────────────────────────────────────────────────────────
    console.print("\n[bold]Step 3/3:[/bold] Launching auto-apply...\n")
    from applypilot.apply.launcher import main as apply_main
    apply_main(
        limit=1,
        target_url=job_url,
        min_score=7,
        headless=headless,
        model=model,
        dry_run=dry_run,
        continuous=False,
        workers=1,
    )


@app.command()
def verify(
    job_url: str = typer.Argument(..., help="Job URL that is pending verification."),
    code: str = typer.Argument(..., help="Verification code from email."),
    model: str = typer.Option("haiku", "--model", "-m", help="Claude model to use."),
) -> None:
    """Enter an email verification code to complete a pending application."""
    _bootstrap()

    from applypilot.config import check_tier
    check_tier(3, "verify")

    console.print(f"\n[bold blue]🔑 Entering verification code for:[/bold blue] {job_url}\n")

    from applypilot.apply import chrome as chrome_mod, prompt as prompt_mod
    from applypilot.apply.chrome import BASE_CDP_PORT
    from applypilot.apply.dashboard import init_worker, update_state, add_event
    import subprocess as _sp
    import json as _json

    worker_id = 0
    port = BASE_CDP_PORT + worker_id
    init_worker(worker_id)
    update_state(worker_id, status="applying", last_action="entering verification code")

    mcp_config_path = config.APP_DIR / f".mcp-apply-{worker_id}.json"
    from applypilot.apply.launcher import _make_mcp_config
    mcp_config_path.write_text(_json.dumps(_make_mcp_config(port)), encoding="utf-8")

    enter_code_prompt = (
        f"The browser is already open on a verification code page for a job application.\n"
        f"Find the verification code input field(s) — there may be multiple boxes for individual digits.\n"
        f"Enter this code: {code}\n"
        f"Then click Submit / Verify / Continue.\n"
        f"After submitting, look for a 'thank you' or 'application received' confirmation.\n"
        f"If successful, output RESULT:APPLIED.\n"
        f"If the code was rejected or expired, output RESULT:FAILED:verification_failed.\n"
    )

    env2 = __import__("os").environ.copy()
    env2.pop("CLAUDECODE", None)
    env2.pop("CLAUDE_CODE_ENTRYPOINT", None)
    worker_dir = config.APPLY_WORKER_DIR / f"worker-{worker_id}"
    worker_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        "claude", "--model", model, "-p",
        "--mcp-config", str(mcp_config_path),
        "--permission-mode", "bypassPermissions",
        "--no-session-persistence",
        "--output-format", "stream-json", "--verbose", "-",
    ]
    proc = _sp.Popen(
        cmd, stdin=_sp.PIPE, stdout=_sp.PIPE, stderr=_sp.STDOUT,
        text=True, encoding="utf-8", errors="replace", env=env2, cwd=str(worker_dir),
    )
    proc.stdin.write(enter_code_prompt)
    proc.stdin.close()

    out_parts = []
    for ln in proc.stdout:
        ln = ln.strip()
        if not ln:
            continue
        try:
            m = _json.loads(ln)
            if m.get("type") == "assistant":
                for blk in m.get("message", {}).get("content", []):
                    if blk.get("type") == "text":
                        txt = blk["text"]
                        out_parts.append(txt)
                        console.print(txt, end="")
            elif m.get("type") == "result":
                out_parts.append(m.get("result", ""))
        except _json.JSONDecodeError:
            out_parts.append(ln)
    proc.wait(timeout=120)

    output = "\n".join(out_parts)
    from applypilot.apply.launcher import mark_result
    if "RESULT:APPLIED" in output:
        console.print("\n[green bold]✓ Application verified and submitted![/green bold]")
        mark_result(job_url, "applied")
    else:
        console.print("\n[red]✗ Verification failed — job marked for retry.[/red]")
        mark_result(job_url, "failed", "verification_code_failed", permanent=False)


@app.command()
def status() -> None:
    """Show pipeline statistics from the database."""
    _bootstrap()

    from applypilot.database import get_stats

    stats = get_stats()

    console.print("\n[bold]ApplyPilot Pipeline Status[/bold]\n")

    # Summary table
    summary = Table(title="Pipeline Overview", show_header=True, header_style="bold cyan")
    summary.add_column("Metric", style="bold")
    summary.add_column("Count", justify="right")

    summary.add_row("Total jobs discovered", str(stats["total"]))
    summary.add_row("With full description", str(stats["with_description"]))
    summary.add_row("Pending enrichment", str(stats["pending_detail"]))
    summary.add_row("Enrichment errors", str(stats["detail_errors"]))
    summary.add_row("Scored by LLM", str(stats["scored"]))
    summary.add_row("Pending scoring", str(stats["unscored"]))
    summary.add_row("Tailored resumes", str(stats["tailored"]))
    summary.add_row("Pending tailoring (7+)", str(stats["untailored_eligible"]))
    summary.add_row("Cover letters", str(stats["with_cover_letter"]))
    summary.add_row("Ready to apply", str(stats["ready_to_apply"]))
    summary.add_row("Applied", str(stats["applied"]))
    summary.add_row("Apply errors", str(stats["apply_errors"]))

    console.print(summary)

    # Score distribution
    if stats["score_distribution"]:
        dist_table = Table(title="\nScore Distribution", show_header=True, header_style="bold yellow")
        dist_table.add_column("Score", justify="center")
        dist_table.add_column("Count", justify="right")
        dist_table.add_column("Bar")

        max_count = max(count for _, count in stats["score_distribution"]) or 1
        for score, count in stats["score_distribution"]:
            bar_len = int(count / max_count * 30)
            if score >= 7:
                color = "green"
            elif score >= 5:
                color = "yellow"
            else:
                color = "red"
            bar = f"[{color}]{'=' * bar_len}[/{color}]"
            dist_table.add_row(str(score), str(count), bar)

        console.print(dist_table)

    # By site
    if stats["by_site"]:
        site_table = Table(title="\nJobs by Source", show_header=True, header_style="bold magenta")
        site_table.add_column("Site")
        site_table.add_column("Count", justify="right")

        for site, count in stats["by_site"]:
            site_table.add_row(site or "Unknown", str(count))

        console.print(site_table)

    console.print()


@app.command()
def dashboard() -> None:
    """Generate and open the HTML dashboard in your browser."""
    _bootstrap()

    from applypilot.view import open_dashboard

    open_dashboard()


@app.command()
def doctor() -> None:
    """Check your setup and diagnose missing requirements."""
    import shutil
    from applypilot.config import (
        load_env, PROFILE_PATH, RESUME_PATH, RESUME_PDF_PATH,
        SEARCH_CONFIG_PATH, ENV_PATH, get_chrome_path,
    )

    load_env()

    ok_mark = "[green]OK[/green]"
    fail_mark = "[red]MISSING[/red]"
    warn_mark = "[yellow]WARN[/yellow]"

    results: list[tuple[str, str, str]] = []  # (check, status, note)

    # --- Tier 1 checks ---
    # Profile
    if PROFILE_PATH.exists():
        results.append(("profile.json", ok_mark, str(PROFILE_PATH)))
    else:
        results.append(("profile.json", fail_mark, "Run 'applypilot init' to create"))

    # Resume
    if RESUME_PATH.exists():
        results.append(("resume.txt", ok_mark, str(RESUME_PATH)))
    elif RESUME_PDF_PATH.exists():
        results.append(("resume.txt", warn_mark, "Only PDF found — plain-text needed for AI stages"))
    else:
        results.append(("resume.txt", fail_mark, "Run 'applypilot init' to add your resume"))

    # Search config
    if SEARCH_CONFIG_PATH.exists():
        results.append(("searches.yaml", ok_mark, str(SEARCH_CONFIG_PATH)))
    else:
        results.append(("searches.yaml", warn_mark, "Will use example config — run 'applypilot init'"))

    # jobspy (discovery dep installed separately)
    try:
        import jobspy  # noqa: F401
        results.append(("python-jobspy", ok_mark, "Job board scraping available"))
    except ImportError:
        results.append(("python-jobspy", warn_mark,
                        "pip install --no-deps python-jobspy && pip install pydantic tls-client requests markdownify regex"))

    # --- Tier 2 checks ---
    import os
    from applypilot.llm import get_client
    has_gemini = bool(os.environ.get("GEMINI_API_KEY"))
    has_openai = bool(os.environ.get("OPENAI_API_KEY"))
    has_local = bool(os.environ.get("LLM_URL"))
    
    llm_status = fail_mark
    llm_note = "Set GEMINI_API_KEY in ~/.applypilot/.env (run 'applypilot init')"
    
    if has_gemini or has_openai or has_local:
        provider = "Gemini" if has_gemini else ("OpenAI" if has_openai else "Local")
        from applypilot.config import LLM_DEFAULTS
        model = os.environ.get("LLM_MODEL", LLM_DEFAULTS["gemini_model"] if has_gemini else LLM_DEFAULTS["openai_model"])
        
        # Test real connectivity
        try:
            client = get_client()
            # Simple test prompt
            client.ask("test", max_tokens=5)
            llm_status = ok_mark
            llm_note = f"{provider} ({model}) - Connectivity OK"
        except Exception as e:
            llm_status = fail_mark
            # Strip long tracebacks/messages for cleaner output
            err_msg = str(e).split('\n')[0][:50]
            llm_note = f"{provider} ({model}) - Error: {err_msg}"
            
    results.append(("LLM Connectivity", llm_status, llm_note))

    # --- Tier 3 checks ---
    # Claude Code CLI
    claude_bin = shutil.which("claude")
    if claude_bin:
        results.append(("Claude Code CLI", ok_mark, claude_bin))
    else:
        results.append(("Claude Code CLI", fail_mark,
                        "Install from https://claude.ai/code (needed for auto-apply)"))

    # Chrome
    try:
        chrome_path = get_chrome_path()
        results.append(("Chrome/Chromium", ok_mark, chrome_path))
    except FileNotFoundError:
        results.append(("Chrome/Chromium", fail_mark,
                        "Install Chrome or set CHROME_PATH env var (needed for auto-apply)"))

    # Node.js / npx (for Playwright MCP)
    npx_bin = shutil.which("npx")
    if npx_bin:
        results.append(("Node.js (npx)", ok_mark, npx_bin))
    else:
        results.append(("Node.js (npx)", fail_mark,
                        "Install Node.js 18+ from nodejs.org (needed for auto-apply)"))

    # CapSolver (optional)
    capsolver = os.environ.get("CAPSOLVER_API_KEY")
    if capsolver:
        results.append(("CapSolver API key", ok_mark, "CAPTCHA solving enabled"))
    else:
        results.append(("CapSolver API key", "[dim]optional[/dim]",
                        "Set CAPSOLVER_API_KEY in .env for CAPTCHA solving"))

    # --- Render results ---
    console.print()
    console.print("[bold]ApplyPilot Doctor[/bold]\n")

    col_w = max(len(r[0]) for r in results) + 2
    for check, status, note in results:
        pad = " " * (col_w - len(check))
        console.print(f"  {check}{pad}{status}  [dim]{note}[/dim]")

    console.print()

    # Tier summary
    from applypilot.config import get_tier, TIER_LABELS
    tier = get_tier()
    console.print(f"[bold]Current tier: Tier {tier} — {TIER_LABELS[tier]}[/bold]")

    if tier == 1:
        console.print("[dim]  → Tier 2 unlocks: scoring, tailoring, cover letters (needs LLM API key)[/dim]")
        console.print("[dim]  → Tier 3 unlocks: auto-apply (needs Claude Code CLI + Chrome + Node.js)[/dim]")
    elif tier == 2:
        console.print("[dim]  → Tier 3 unlocks: auto-apply (needs Claude Code CLI + Chrome + Node.js)[/dim]")

    console.print()


if __name__ == "__main__":
    app()
