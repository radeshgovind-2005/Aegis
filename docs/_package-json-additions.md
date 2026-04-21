# package.json — Additions Needed

`wrangler init` generated a minimal `package.json`. Task 0.1 of Phase 0 will extend it. This file documents exactly what to add so the human (or Claude Code) can apply the patch confidently.

## Scripts to add (merge with existing `scripts` block)

```jsonc
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "echo 'Refusing: use GitHub Actions workflow_dispatch for production deploys.' && exit 1",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "verify": "npm run lint && npm run typecheck && npm run test",
    "cf-typegen": "wrangler types",
    "seed": "tsx scripts/seed/index.ts"
  }
}
```

**Notes:**
- `deploy` is intentionally sabotaged. Deploys happen via GitHub Actions, not from a developer machine. Log this as a DECISIONS entry if you relax it.
- `verify` is the one Claude Code runs before every commit. If it's slow, that's a signal to split unit vs integration.
- `seed` won't work until Phase 3 adds the script. Keep the line — harmless until then.

## devDependencies to add

```bash
npm install --save-dev \
  eslint@^9 \
  @typescript-eslint/parser@^8 \
  @typescript-eslint/eslint-plugin@^8 \
  eslint-config-prettier@^9 \
  eslint-plugin-import@^2 \
  eslint-import-resolver-typescript@^3 \
  prettier@^3 \
  tsx@^4 \
  claude-mem
```

(Version floors — use whatever's current at install time.)

## Commit message

```
chore(ci): add lint, format, and verify scripts

Adds ESLint (with hexagonal-boundary rule), Prettier, typecheck,
and a combined `verify` script used pre-commit and in CI.

Phase: 00 | Task: 0.1-package-scripts
```
