.SHELLFLAGS := -eu -o pipefail -c
SHELL := /bin/bash
.PHONY: setup docs serve clean lint dev build-app

setup:
	bash scripts/setup_env.sh

serve:
	bash scripts/mkdocs_serve.sh

build:
	source .venv/bin/activate && mkdocs build --strict

build-app:
	pnpm build

clean:
	rm -rf site

lint:
	pnpm lint

dev:
	pnpm dev
