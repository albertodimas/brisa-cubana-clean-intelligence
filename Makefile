.SHELLFLAGS := -eu -o pipefail -c
SHELL := /bin/bash
.PHONY: setup docs serve clean lint

setup:
	bash scripts/setup_env.sh

serve:
	bash scripts/mkdocs_serve.sh

build:
	source .venv/bin/activate && mkdocs build --strict

clean:
	rm -rf site

lint:
	npm run lint

