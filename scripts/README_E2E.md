# E2E Testing (VPS / Docker)

This repo supports running browser E2E tests **without a local Mac/Chrome**.

## Run on the VPS

```bash
./scripts/e2e.sh
```

What it does (inside a Playwright container):
- `npm ci --include=dev`
- `npm run typecheck`
- `npm run build:web` (Expo export)
- serves `dist/` on port 4173
- runs Playwright smoke tests (`npm run test:e2e`)

## Notes
- Uses `mcr.microsoft.com/playwright:v1.58.1-jammy` which includes required system libs.
- No ports are exposed publicly (everything runs inside the container).
