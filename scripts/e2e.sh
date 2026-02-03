#!/usr/bin/env bash
set -euo pipefail

# Run E2E tests in a Playwright container (no local Chrome needed).
# Requires: docker + docker compose

cd "$(dirname "$0")/.."

docker compose -f docker-compose.e2e.yml run --rm e2e
