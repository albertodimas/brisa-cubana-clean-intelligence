#!/usr/bin/env bash
set -e

if [ ! -d ".venv" ]; then
	bash "$(dirname "$0")/setup_env.sh"
fi

source .venv/bin/activate
mkdocs serve
