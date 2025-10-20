#!/usr/bin/env python3
"""
Compute the current streak of consecutive failed Lighthouse jobs on the nightly workflow.

Assumes the current run already failed and counts previous completed runs
on the same branch until a non-failing job is found.
Outputs the numeric streak (including the current run) to stdout.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from typing import Any, Dict, Optional


class GitHubClient:
    def __init__(self, token: str, api_url: str = "https://api.github.com"):
        self._token = token
        self._api_url = api_url.rstrip("/")

    def _request(self, method: str, url: str) -> Any:
        req = urllib.request.Request(url, method=method)
        req.add_header("Accept", "application/vnd.github+json")
        req.add_header("Authorization", f"Bearer {self._token}")
        with urllib.request.urlopen(req, timeout=30) as resp:
            charset = resp.headers.get_content_charset("utf-8")
            return json.loads(resp.read().decode(charset))

    def get(self, path: str, **params: Any) -> Any:
        if path.startswith("http://") or path.startswith("https://"):
            url = path
        else:
            url = f"{self._api_url.rstrip('/')}/{path.lstrip('/')}"
        if params:
            query = "&".join(f"{key}={value}" for key, value in params.items())
            sep = "&" if "?" in url else "?"
            url = f"{url}{sep}{query}"
        return self._request("GET", url)


def main() -> None:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        raise SystemExit("GITHUB_TOKEN (or GH_TOKEN) is required")

    repository = os.environ.get("GITHUB_REPOSITORY")
    if not repository:
        raise SystemExit("GITHUB_REPOSITORY env var is required")

    workflow_file = os.environ.get("LIGHTHOUSE_WORKFLOW_FILE", "nightly.yml")
    job_name = os.environ.get("LIGHTHOUSE_JOB_NAME", "Nightly Lighthouse budgets")
    branch = os.environ.get("GITHUB_REF_NAME", "main")
    current_run_id = os.environ.get("GITHUB_RUN_ID")

    client = GitHubClient(token, os.environ.get("GITHUB_API_URL", "https://api.github.com"))

    runs_path = f"repos/{repository}/actions/workflows/{workflow_file}/runs"
    runs_payload = client.get(runs_path, branch=branch, status="completed", per_page=20)
    runs = runs_payload.get("workflow_runs", [])
    runs_sorted = sorted(runs, key=lambda run: run.get("run_number", 0), reverse=True)

    streak = 1  # current run already failed

    for run in runs_sorted:
        run_id = str(run.get("id"))
        if current_run_id and run_id == current_run_id:
            continue

        jobs_url = run.get("jobs_url")
        if not jobs_url:
            continue

        jobs_payload = client.get(jobs_url)
        jobs = jobs_payload.get("jobs", [])
        job: Optional[Dict[str, Any]] = next((j for j in jobs if j.get("name") == job_name), None)
        if not job:
            continue

        conclusion = job.get("conclusion")
        if conclusion == "failure":
            streak += 1
        else:
            break

    print(streak)


if __name__ == "__main__":
    main()
